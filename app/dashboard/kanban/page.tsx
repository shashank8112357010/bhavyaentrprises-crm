"use client";

import { useEffect, useState } from "react";
import { useTicketStore } from "@/store/ticketStore";
import { useAgentStore } from "@/store/agentStore";
import { useClientStore } from "@/store/clientStore";
import { Building, Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import KanbanBoard from "@/components/kanban/kanban-board";
import NewTicketDialog from "@/components/tickets/new-ticket-dialog";
import { useToast } from "@/hooks/use-toast";
import { exportTicketsToExcel } from "@/lib/services/ticket";
import { Label } from "@radix-ui/react-label";
import { Textarea } from "@/components/ui/textarea";
import { Role } from "@/constants/roleAccessConfig";
import { useAuthStore } from "@/store/authStore";
type Comment = {
  text: string;
  ticketId: string;
  userId: string; // Assuming GST types are 18 and 28
};
// Types
type Ticket = {
  id: string;
  title: string;
  ticketId: string;
  branch: string;
  priority: string;
  assignee: {
    id: string; // ADDED
    name: string;
    avatar: string;
    initials: string;
  };
  workStage?: {
    stateName: string;
    adminName: string;
    clientName: string;
    siteName: string;
    quoteNo: string;
    dateReceived: string;
    quoteTaxable: number;
    quoteAmount: number;
    workStatus: string;
    approval: string;
    poStatus: Boolean;
    poNumber: string;
    jcrStatus: Boolean;
    agentName: string;
    jcrFilePath: string;
    poFilePath: string;
  };
  expenses: {
    id: string;
    amount: string;
    category: string;
    createdAt: string;
    pdfUrl: string;
  }[];
  due?: number;
  paid?: Boolean;
  client: {
    id: string;
    name: string;
    type: string;
    contactPerson: string;
  };
  dueDate: string | undefined;
  scheduledDate?: string;
  completedDate?: string;
  createdAt: string;
  description: string;
  comments: Comment[];
  holdReason?: string;
  status: Status;
};

type TicketsState = {
  new: Ticket[];
  inProgress: Ticket[];
  onHold: Ticket[];
  completed: Ticket[];
  billing_pending: Ticket[];
  billing_completed: Ticket[];
};

type Status =
  | "new"
  | "inProgress"
  | "onHold"
  | "completed"
  | "billing_pending"
  | "billing_completed";

export default function KanbanPage() {
  const {
    tickets,
    fetchTickets,
    updateTicketStatus,
    updateTicket,
    fetchTicketById,
  } = useTicketStore();
  const { agents, fetchAgents } = useAgentStore();
  const { clients, fetchClients } = useClientStore();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [clientFilter, setClientFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");

  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const [exportModalOpen, setExportModalOpen] = useState(false);
  const today = new Date().toISOString().split("T")[0]; // 'YYYY-MM-DD'

  const [startDateTicket, setStartDateTicket] = useState<string>(today);
  const [endDateTicket, setEndDateTicket] = useState<string>(today);
  const [holdReasonModalOpen, setHoldReasonModalOpen] = useState(false);
  const [holdReasonText, setHoldReasonText] = useState("");
  const [ticketToHold, setTicketToHold] = useState<Ticket | null>(null);
  const [isLoadingHold, setLoadingHold] = useState(false);
  const { user } = useAuthStore();

  useEffect(() => {
    fetchTickets({ startDate: startDateTicket, endDate: endDateTicket });
    fetchAgents();
    fetchClients();
  }, [
    fetchTickets,
    fetchAgents,
    fetchClients,
    startDateTicket,
    startDate,
    endDate,
    endDateTicket,
  ]);

  const handleDragEnd = async (result: any) => {
    const { source, destination, ticketId } = result;

    if (!source || !destination || source === destination) return;

    const ticket = await fetchTicketById(ticketId);
    if (!ticket) return;

    const { workStage } = ticket;

    switch (destination) {
      case "inProgress":
        if (!workStage || workStage.quoteNo === "N/A") {
          toast({
            title: "Missing Quotation",
            description: "Please attach a quotation before proceeding.",
            variant: "destructive",
          });
          return;
        }
        break;

      case "onHold":
        setTicketToHold(ticket as any);
        setHoldReasonText(ticket.holdReason || "");
        setHoldReasonModalOpen(true);
        return;

      case "completed":
        if (!workStage || workStage.quoteNo === "N/A") {
          toast({
            title: "Order Violation",
            description:
              "Please attach a quotation and move to In Progress first.",
            variant: "destructive",
          });
          return;
        }
        if (!workStage.poStatus || !workStage.jcrStatus) {
          toast({
            title: "Pending Work",
            description:
              "PO and JCR must be completed before marking as completed.",
            variant: "destructive",
          });
          return;
        }
        break;

      case "billing_pending":
        if (ticket.status !== "completed") {
          toast({
            title: "Invalid Stage Transition",
            description: "You can only bill after completion.",
            variant: "destructive",
          });
          return;
        }
        break;

      case "billing_completed":
        if (ticket.status !== "billing_pending") {
          toast({
            title: "Invalid Billing Status",
            description: "Move to billing_pending before completing billing.",
            variant: "destructive",
          });
          return;
        }
        const dueAmount = ticket?.due ?? 0;
        const isPaid = ticket?.paid ?? false;
        if (!isPaid && dueAmount > 0) {
          toast({
            title: "Incomplete Payment",
            description: `Payment is pending. Due amount: ₹${dueAmount}. Please clear the full amount before completing billing.`,
            variant: "destructive",
          });
          return;
        }
        break;

      default:
        break;
    }

    updateTicketStatus(ticketId, destination as Status);
  };

  const handleConfirmHold = async () => {
    setLoadingHold(true);
    if (!holdReasonText.trim()) {
      setLoadingHold(false);
      toast({
        title: "Hold Reason Required",
        description: "Please enter a reason to put the ticket on hold.",
        variant: "destructive",
      });
      return;
    }
    if (!ticketToHold) return;

    try {
      await updateTicket({
        ...ticketToHold,
        holdReason: holdReasonText.trim(),
        status: "onHold",
      });
      updateTicketStatus(ticketToHold.id, "onHold");

      toast({
        title: "Ticket Put On Hold",
        description: "Ticket status updated successfully.",
      });
      setLoadingHold(false);
      setHoldReasonModalOpen(false);
      setTicketToHold(null);
      setHoldReasonText("");
    } catch (err: any) {
      setLoadingHold(false);
      toast({
        title: "Failed to Update Ticket",
        description: err.message || "Unknown error occurred.",
        variant: "destructive",
      });
    }
  };

  const handleCancelHold = () => {
    setHoldReasonModalOpen(false);
    setTicketToHold(null);
    setHoldReasonText("");
  };

  const filteredTickets: TicketsState = Object.entries(tickets).reduce(
    (acc, [status, statusTickets]) => {
      const allowedStatuses = ["new", "inProgress", "onHold", "completed"];
      if (user?.role === "ADMIN" || user?.role === "ACCOUNTS") {
        allowedStatuses.push("billing_pending", "billing_completed");
      }

      if (allowedStatuses.includes(status as Status)) {
        acc[status as Status] = statusTickets
          .map((ticket: any) => ({
            ...ticket,
            dueDate: ticket.dueDate || new Date().toISOString(),
          }))
          .filter((ticket) => {
            const matchesSearch =
              ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              ticket.id.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesClient =
              clientFilter === "all" || ticket.client?.id === clientFilter;

            const matchesAssignee =
              assigneeFilter === "all" ||
              ticket.assignee?.id === assigneeFilter;

            // Role-based filtering: Agents can only see their own tickets
            const matchesRole =
              user?.role === "ADMIN" ||
              user?.role === "ACCOUNTS" ||
              ticket.assignee?.id === user?.userId;

            return (
              matchesSearch && matchesClient && matchesAssignee && matchesRole
            );
          });
      }

      return acc;
    },
    {} as TicketsState,
  );

  const ticketStatuses: Status[] = [
    "new",
    "inProgress",
    "onHold",
    "completed",
    ...(user?.role === "ADMIN" || user?.role === "ACCOUNTS"
      ? (["billing_pending", "billing_completed"] as const)
      : []),
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kanban Board</h1>
          <p className="text-muted-foreground">
            Manage and track maintenance requests
          </p>
        </div>
        {user?.role === "ADMIN" && <NewTicketDialog />}
      </div>

      <div className="flex flex-col md:flex-row gap-2 items-center justify-between">
        <div className="relative w-full md:w-auto">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tickets..."
            className="w-full md:w-[300px] pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        {(user?.role === "ADMIN" || user?.role === "ACCOUNTS") && (
          <>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Select value={clientFilter} onValueChange={setClientFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <div className="flex items-center">
                    <Building className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Filter by client" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Clients</SelectItem>
                  {clients.map((client: any) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <div className="flex items-center capitalize">
                    <User className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Filter by assignee" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Assignees</SelectItem>
                  {agents.map((agent: any) => (
                    <SelectItem
                      className="capitalize"
                      key={agent.id}
                      value={agent.id}
                    >
                      {agent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-2 items-center justify-between">
        <div className="flex items-center gap-2">
          <Label className="text-muted-foreground">From:</Label>
          <Input
            type="date"
            className="cursor-pointer"
            value={startDateTicket}
            onChange={(e) => setStartDateTicket(e.target.value)}
          />
          <Label className="text-muted-foreground">To:</Label>
          <Input
            className="cursor-pointer"
            type="date"
            value={endDateTicket}
            onChange={(e) => setEndDateTicket(e.target.value)}
          />

          <Button
            variant="secondary"
            onClick={() => {
              setStartDateTicket(today);
              setEndDateTicket(today);
              setSearchQuery("");
              setClientFilter("all");
              setAssigneeFilter("all");
            }}
          >
            Clear Filters
          </Button>
          <Button variant="secondary" onClick={() => setExportModalOpen(true)}>
            Export Tickets
          </Button>
        </div>
      </div>

      <KanbanBoard tickets={filteredTickets} onDragEnd={handleDragEnd} />

      <Dialog open={exportModalOpen} onOpenChange={setExportModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Tickets</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            {ticketStatuses.map((status) => (
              <Button
                key={status}
                variant="outline"
                onClick={async () => {
                  if (!startDateTicket || !endDateTicket) {
                    toast({
                      title: "Select Date Range",
                      description: "Please select start and end dates.",
                      variant: "destructive",
                    });
                    return;
                  }
                  try {
                    await exportTicketsToExcel({
                      status,
                      startDate: startDateTicket,
                      endDate: endDateTicket,
                    });
                    setExportModalOpen(false);
                  } catch (err) {
                    toast({
                      title: "Export Failed",
                      description: (err as Error).message,
                      variant: "destructive",
                    });
                  }
                }}
              >
                Export {status.replaceAll("_", " ")}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={holdReasonModalOpen} onOpenChange={setHoldReasonModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Put Ticket On Hold</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="holdReason">Reason for Hold</Label>
              <Textarea
                id="holdReason"
                value={holdReasonText}
                onChange={(e) => setHoldReasonText(e.target.value)}
                placeholder="Enter the reason for putting this ticket on hold"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelHold}>
              Cancel
            </Button>
            <Button onClick={handleConfirmHold}>
              {isLoadingHold ? "Holding..." : "Confirm Hold"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
