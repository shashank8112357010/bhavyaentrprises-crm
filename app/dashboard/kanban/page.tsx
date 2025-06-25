"use client";

import { useEffect, useState } from "react";
import {
  useTicketStore,
  type Ticket,
  type Status,
  type Comment,
} from "@/store/ticketStore";
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
import { useAuthStore } from "@/store/authStore";

// Types for filtered tickets
interface TicketsState {
  new: Ticket[];
  inProgress: Ticket[];
  onHold: Ticket[];
  completed: Ticket[];
  billing_pending: Ticket[];
  billing_completed: Ticket[];
}

interface DragEndResult {
  source: string;
  destination: string;
  ticketId: string;
}

interface ExportFilters {
  status?: Status;
  startDate: string;
  endDate: string;
}

export default function KanbanPage() {
  const {
    tickets,
    fetchTickets,
    updateTicketStatus,
    updateTicket,
    fetchTicketById,
  } = useTicketStore();
  const { agents, fetchAllAgents } = useAgentStore();
  const { clients, fetchClients } = useClientStore();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  // NEW STATE
const [approvalModalOpen, setApprovalModalOpen] = useState(false);
const [ticketToApprove, setTicketToApprove] = useState<Ticket | null>(null);
const [approverId, setApproverId] = useState("");
const [approvalNote, setApprovalNote] = useState("");


  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const [exportModalOpen, setExportModalOpen] = useState<boolean>(false);
  const today = new Date().toISOString().split("T")[0]; // 'YYYY-MM-DD'

  const [startDateTicket, setStartDateTicket] = useState<string>(today);
  const [endDateTicket, setEndDateTicket] = useState<string>(today);

  const [holdReasonModalOpen, setHoldReasonModalOpen] =
    useState<boolean>(false);
  const [holdReasonText, setHoldReasonText] = useState<string>("");
  const [ticketToHold, setTicketToHold] = useState<Ticket | null>(null);
  const [isLoadingHold, setLoadingHold] = useState<boolean>(false);
  const { user } = useAuthStore();


  useEffect(() => {
    const loadData = async () => {
      try {
        await fetchTickets({
          startDate: startDateTicket,
          endDate: endDateTicket,
        });
        if (user) {
          await fetchAllAgents();
        }

        await fetchClients();
      } catch (error) {
        console.error("Error loading kanban data:", error);
        toast({
          title: "Error",
          description: "Failed to load data. Please try again.",
          variant: "destructive",
        });
      }
    };

    loadData();
  }, [
    fetchTickets,
    fetchAllAgents,
    fetchClients,
    startDateTicket,
    endDateTicket,
    user?.role,
    toast,
  ]);




// APPROVAL MODAL CONFIRMATION
const handleApprovalConfirm = async () => {
  if (!approverId.trim()) {
    toast({
      title: "Missing Accountant",
      description: "Please enter the accountant guaranteeing this.",
      variant: "destructive",
    });
    return;
  }
  if (!ticketToApprove) return;

  try {
    await updateTicket({
      ...ticketToApprove,
      approvedByAccountant: approverId,
      status: "completed",
    });

    toast({ title: "Ticket Completed", description: "Ticket marked as completed." });
    setApprovalModalOpen(false);
    setTicketToApprove(null);
    setApproverId("");
  } catch (err: any) {
    toast({
      title: "Update Failed",
      description: err.message || "Could not complete the ticket.",
      variant: "destructive",
    });
  }
};


  const handleDragEnd = async (result: DragEndResult) => {
    const { source, destination, ticketId } = result;

    if (!source || !destination || source === destination) return;

    try {
      const ticket = await fetchTicketById(ticketId);
      if (!ticket) {
        toast({
          title: "Error",
          description: "Ticket not found.",
          variant: "destructive",
        });
        return;
      }

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
          setTicketToHold(ticket);
          setHoldReasonText(ticket.holdReason || "");
          setHoldReasonModalOpen(true);
          return;

          case "completed": {
            if (!workStage || workStage.quoteNo === "N/A") {
              toast({
                title: "Order Violation",
                description: "Attach a quotation before marking as completed.",
                variant: "destructive",
              });
              return;
            }
            if (!workStage.jcrStatus) {
              toast({
                title: "Missing JCR",
                description: "You cannot complete a ticket without JCR.",
                variant: "destructive",
              });
              return;
            }
            if (!workStage.poStatus) {
              // Show approval dialog
              setTicketToApprove(ticket);
              setApprovalModalOpen(true);
              return;
            }
            break;
          }
          
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

      await updateTicketStatus(ticketId, destination as Status);

      toast({
        title: "Status Updated",
        description: "Ticket status updated successfully.",
      });
    } catch (error: any) {
      console.error("Error updating ticket status:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update ticket status.",
        variant: "destructive",
      });
    }
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

    if (!ticketToHold) {
      setLoadingHold(false);
      return;
    }

    const originalStatus = ticketToHold.status;

    try {
      // First update the ticket status in the store for immediate UI update
      await updateTicketStatus(ticketToHold.id, "onHold");

      // Then update the ticket with hold reason on the backend
      await updateTicket({
        ...ticketToHold,
        holdReason: holdReasonText.trim(),
        status: "onHold",
      });

      toast({
        title: "Ticket Put On Hold",
        description: "Ticket status updated successfully.",
      });

      setHoldReasonModalOpen(false);
      setTicketToHold(null);
      setHoldReasonText("");
    } catch (err: any) {
      console.error("Error updating hold status:", err);

      // If there's an error, revert the status change
      try {
        await updateTicketStatus(ticketToHold.id, originalStatus);
      } catch (revertError) {
        console.error("Error reverting status:", revertError);
      }

      toast({
        title: "Failed to Update Ticket",
        description: err.message || "Unknown error occurred.",
        variant: "destructive",
      });
    } finally {
      setLoadingHold(false);
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
          .map((ticket: Ticket) => ({
            ...ticket,
            dueDate: ticket.dueDate || new Date().toISOString(),
          }))
          .filter((ticket: Ticket) => {
            const clientId = ticket.client?.id?.toString() ?? "";
            const assigneeId = ticket.assignee?.id?.toString() ?? "";
    console.log(clientId , "clientId" , clientFilter);

    
            const matchesSearch =
              ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              ticket.id.toLowerCase().includes(searchQuery.toLowerCase());
  
            const matchesClient =
              clientFilter === "all" || clientFilter === clientId;
  
            const matchesAssignee =
              assigneeFilter === "all" || assigneeFilter === assigneeId;
  
            const matchesRole =
              user?.role === "ADMIN" ||
              user?.role === "ACCOUNTS" ||
              assigneeId === user?.userId;
  
            return (
              matchesSearch && matchesClient && matchesAssignee && matchesRole
            );
          });
      }
  
      return acc;
    },
    {} as TicketsState
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

  const handleExportTickets = async (status: Status) => {
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
      toast({
        title: "Export Successful",
        description: `${status.replaceAll(
          "_",
          " "
        )} tickets exported successfully.`,
      });
    } catch (err: any) {
      toast({
        title: "Export Failed",
        description: err.message || "Failed to export tickets.",
        variant: "destructive",
      });
    }
  };

  const clearFilters = () => {
    setStartDateTicket(today);
    setEndDateTicket(today);
    setSearchQuery("");
    setClientFilter("all");
    setAssigneeFilter("all");
  };

  const accountants = agents.filter((agent) => agent.role === "ACCOUNTS");

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kanban Board</h1>
          <p className="text-muted-foreground">
            Manage and track maintenance requests
          </p>
        </div>
        <NewTicketDialog />
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
                      value={agent.originalId}
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

          <Button variant="secondary" onClick={clearFilters}>
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
                onClick={() => handleExportTickets(status)}
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
            <Button onClick={handleConfirmHold} disabled={isLoadingHold}>
              {isLoadingHold ? "Holding..." : "Confirm Hold"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={approvalModalOpen} onOpenChange={setApprovalModalOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>PO Missing - Approval Required</DialogTitle>
    </DialogHeader>
    <div className="grid gap-4 py-4">
      <Label htmlFor="approver">Who guarantees this ticket completion?</Label>
     <Select value={approverId} onValueChange={setApproverId}>
  <SelectTrigger className="w-full">
    <SelectValue placeholder="Select Accountant" />
  </SelectTrigger>
  <SelectContent>
    {accountants.map((acc) => (
      <SelectItem key={acc.id} value={acc.id}>
        {acc.name.toUpperCase()}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
<Label htmlFor="approvalNote">Message</Label>
<Textarea
  id="approvalNote"
  placeholder="Enter message"
  value={approvalNote}
  onChange={(e) => setApprovalNote(e.target.value)}
/>

    </div>
    <DialogFooter>
      <Button variant="outline" onClick={() => setApprovalModalOpen(false)}>
        Cancel
      </Button>
      <Button onClick={handleApprovalConfirm}>Confirm Completion</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

    </div>
  );
}
