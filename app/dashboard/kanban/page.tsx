"use client";

import { useEffect, useState } from "react";
import { useTicketStore } from "@/store/ticketStore";
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

type Ticket = {
  id: string;
  title: string;
  client: string;
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
    poStatus: string;
    poNumber: string;
    jcrStatus: string;
    agentName: string;
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
  billing_pending :Ticket[];
  billing_completed : Ticket[];
};

type Status = "new" | "inProgress" | "onHold" | "completed" | 'billing_pending' | 'billing_completed';

export default function KanbanPage() {
  const { tickets, fetchTickets, updateTicketStatus } = useTicketStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [clientFilter, setClientFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleDragEnd = (result: any) => {

    const { source, destination, ticketId } = result;

    if (!source || !destination) return;
    if (source !== destination) {
      updateTicketStatus(ticketId, destination as Status);
    }
  };

  const filteredTickets: TicketsState = Object.entries(tickets).reduce(
    (acc, [status, statusTickets]) => {
      if (
        ["new", "inProgress", "onHold" , "completed" , 'billing_pending' , 'billing_completed'].includes(status as Status)
      ) {
        acc[status as Status] = statusTickets
          .map((ticket: any) => ({
            ...ticket,
            dueDate: ticket.dueDate ? ticket.dueDate : new Date(), // Provide a default value if dueDate is undefined
          }))
          .filter((ticket) => {
            const matchesSearch =
              ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              ticket.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
              ticket.id.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesClient =
              clientFilter === "all" ||
              ticket.client.toLowerCase().includes(clientFilter.toLowerCase());

            const matchesAssignee =
              assigneeFilter === "all" ||
              ticket.assignee.name
                .toLowerCase()
                .includes(assigneeFilter.toLowerCase());

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
              <SelectItem value="hdfc">HDFC Bank</SelectItem>
              <SelectItem value="sbi">SBI Bank</SelectItem>
              <SelectItem value="icici">ICICI Bank</SelectItem>
              <SelectItem value="axis">Axis Bank</SelectItem>
              <SelectItem value="pnb">PNB Bank</SelectItem>
            </SelectContent>
          </Select>
          <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <div className="flex items-center">
                <User className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by assignee" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Assignees</SelectItem>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              <SelectItem value="rajesh">Rajesh Kumar</SelectItem>
              <SelectItem value="priya">Priya Sharma</SelectItem>
              <SelectItem value="vikram">Vikram Singh</SelectItem>
              <SelectItem value="ankit">Ankit Patel</SelectItem>
              <SelectItem value="deepak">Deepak Verma</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon">
            <Sliders className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <KanbanBoard tickets={filteredTickets} onDragEnd={handleDragEnd} />
    </div>
  );
}
