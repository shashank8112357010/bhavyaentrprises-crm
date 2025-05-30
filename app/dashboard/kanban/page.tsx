"use client";

import { useEffect, useState } from "react";
import { useTicketStore } from "@/store/ticketStore";
import { useAgentStore } from "@/store/agentStore";
import { useClientStore } from "@/store/clientStore";
import { Building, Search, Sliders, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import KanbanBoard from "@/components/kanban/kanban-board";
import NewTicketDialog from "@/components/tickets/new-ticket-dialog";
import { useToast } from "@/hooks/use-toast";

// assignee: {
// id: string;
// name: string;
// type: string;
// contactPerson: string;
// };
type Ticket = {
  id: string;
  title: string;

  branch: string;
  priority: string;

  assignee: {
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
  };
  expenses: [
    {
      id: string;
      amount: string;
      category: string;
      createdAt: string;
      pdfUrl: string;
    }
  ];
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
  comments: number;
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
  const { tickets, fetchTickets, updateTicketStatus, fetchTicketById } =
    useTicketStore();
  const { agents, fetchAgents } = useAgentStore();
  const { clients, fetchClients } = useClientStore();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [clientFilter, setClientFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");

  useEffect(() => {
    fetchTickets();
    fetchAgents();
    fetchClients();
  }, [fetchTickets, fetchAgents, fetchClients]);

  const handleDragEnd = async (result: any) => {
    const { source, destination, ticketId } = result;

    if (!source || !destination || source === destination) return;

    const ticket: Ticket | undefined = await fetchTicketById(ticketId);
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
        toast({
          title: "Hold Reason Required",
          description:
            "Please specify a reason for putting this ticket on hold.",
          variant: "destructive",
        });
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
            description: "PO and JCR must be completed before marking as done.",
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

        const dueAmount = ticket?.due ?? 0; // number
        const isPaid = ticket?.paid ?? false; // boolean
        
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

  const filteredTickets: TicketsState = Object.entries(tickets).reduce(
    (acc, [status, statusTickets]) => {
      if (
        [
          "new",
          "inProgress",
          "onHold",
          "completed",
          "billing_pending",
          "billing_completed",
        ].includes(status as Status)
      ) {
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
              clientFilter === "all" || ticket.clientId === clientFilter;

            const matchesAssignee =
              assigneeFilter === "all" ||
              ticket.assignee?.id === assigneeFilter;

            return matchesSearch && matchesClient && matchesAssignee;
          });
      }

      return acc;
    },
    {} as TicketsState
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kanban Board</h1>
          <p className="text-muted-foreground">
            Manage and track maintenance requests
          </p>
        </div>
        <div className="flex items-center gap-2">
          <NewTicketDialog />
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-auto">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tickets..."
            className="w-full md:w-[300px] pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2  w-full md:w-auto">
          {/* Client Filter */}
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

          {/* Assignee Filter */}
          <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <div className="flex items-center">
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
      </div>

      <KanbanBoard tickets={filteredTickets} onDragEnd={handleDragEnd} />
    </div>
  );
}
