"use client";

import { useState } from "react";

import {

  Building,

  Search,
  Sliders,
  User,
} from "lucide-react";
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
// import { TicketsState } from "@/components/kanban/types";
import { NewTicketDialog } from "@/components/tickets/new-ticket-dialog";
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
  workStage: {
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
  dueDate: string;
  scheduledDate?: string;
  completedDate?: string;
  createdAt: string;
  description: string;
  comments: number;
  holdReason?: string;
};

type TicketsState = {
  new: Ticket[];
  inProgress: Ticket[];
  scheduled: Ticket[];
  onHold: Ticket[];
  completed: Ticket[];
};
type Status = 'new' | 'inProgress' | 'scheduled' | 'onHold' | 'completed';
// Sample ticket data
const initialTickets: TicketsState = {
  new: [
    {
      id: "HDFC-223",
      title: "Faulty AC in Meeting Room",
      client: "HDFC Bank",
      branch: "Mumbai North",
      priority: "Medium",
      assignee: {
        name: "Unassigned",
        avatar: "",
        initials: "UN",
      },
      dueDate: "Sep 18",
      createdAt: "1 day ago",
      description:
        "The AC in the main meeting room is not cooling properly and making noise.",
      comments: 2,
      workStage: {
        stateName: "New",
        adminName: "Admin User",
        clientName: "HDFC Bank",
        siteName: "Mumbai North",
        quoteNo: "Q2024001",
        dateReceived: "2024-03-15",
        quoteTaxable: 25000,
        quoteAmount: 29500,
        workStatus: "Pending",
        approval: "Pending",
        poStatus: "Not Received",
        poNumber: "",
        jcrStatus: "Not Started",
        agentName: "Unassigned",
      },
    },
    {
      id: "SBI-092",
      title: "Water leakage in restroom",
      client: "SBI Bank",
      branch: "Delhi East",
      priority: "High",
      assignee: {
        name: "Unassigned",
        avatar: "",
        initials: "UN",
      },
      workStage: {
        stateName: "New",
        adminName: "Admin User",
        clientName: "HDFC Bank",
        siteName: "Mumbai North",
        quoteNo: "Q2024001",
        dateReceived: "2024-03-15",
        quoteTaxable: 25000,
        quoteAmount: 29500,
        workStatus: "Pending",
        approval: "Pending",
        poStatus: "Not Received",
        poNumber: "",
        jcrStatus: "Not Started",
        agentName: "Unassigned",
      },
      dueDate: "Sep 15",
      createdAt: "2 days ago",
      description:
        "There is water leakage from the ceiling in the staff restroom on the first floor.",
      comments: 0,
    },
    {
      id: "ICICI-107",
      title: "Broken window in customer area",
      client: "ICICI Bank",
      branch: "Pune Central",
      priority: "Low",
      assignee: {
        name: "Unassigned",
        avatar: "",
        initials: "UN",
      },
      workStage: {
        stateName: "New",
        adminName: "Admin User",
        clientName: "HDFC Bank",
        siteName: "Mumbai North",
        quoteNo: "Q2024001",
        dateReceived: "2024-03-15",
        quoteTaxable: 25000,
        quoteAmount: 29500,
        workStatus: "Pending",
        approval: "Pending",
        poStatus: "Not Received",
        poNumber: "",
        jcrStatus: "Not Started",
        agentName: "Unassigned",
      },
      dueDate: "Sep 20",
      createdAt: "5 hours ago",
      description:
        "A window in the customer waiting area has a crack and needs replacement.",
      comments: 1,
    },
  ],
  inProgress: [
    {
      id: "HDFC-221",
      title: "AC unit failure in server room",
      client: "HDFC Bank",
      branch: "Mumbai Main",
      priority: "Critical",
      assignee: {
        name: "Rajesh Kumar",
        avatar: "/avatars/rajesh.jpg",
        initials: "RK",
      },
      workStage: {
        stateName: "New",
        adminName: "Admin User",
        clientName: "HDFC Bank",
        siteName: "Mumbai North",
        quoteNo: "Q2024001",
        dateReceived: "2024-03-15",
        quoteTaxable: 25000,
        quoteAmount: 29500,
        workStatus: "Pending",
        approval: "Pending",
        poStatus: "Not Received",
        poNumber: "",
        jcrStatus: "Not Started",
        agentName: "Unassigned",
      },
      dueDate: "Sep 14",
      createdAt: "2 days ago",
      description:
        "The main server room AC has completely failed causing temperature rise. Critical for server operations.",
      comments: 5,
    },
    {
      id: "ICICI-103",
      title: "Water leakage in ATM area",
      client: "ICICI Bank",
      branch: "Delhi Central",
      priority: "High",
      assignee: {
        name: "Priya Sharma",
        avatar: "/avatars/priya.jpg",
        initials: "PS",
      },
      workStage: {
        stateName: "New",
        adminName: "Admin User",
        clientName: "HDFC Bank",
        siteName: "Mumbai North",
        quoteNo: "Q2024001",
        dateReceived: "2024-03-15",
        quoteTaxable: 25000,
        quoteAmount: 29500,
        workStatus: "Pending",
        approval: "Pending",
        poStatus: "Not Received",
        poNumber: "",
        jcrStatus: "Not Started",
        agentName: "Unassigned",
      },
      dueDate: "Sep 15",
      createdAt: "1 day ago",
      description:
        "Water leakage from ceiling above ATM machines. Risk of electrical short circuit.",
      comments: 3,
    },
  ],
  scheduled: [
    {
      id: "SBI-089",
      title: "Electrical short circuit in cabin area",
      client: "SBI Bank",
      branch: "Bangalore East",
      priority: "High",
      assignee: {
        name: "Vikram Singh",
        avatar: "/avatars/vikram.jpg",
        initials: "VS",
      },
      workStage: {
        stateName: "New",
        adminName: "Admin User",
        clientName: "HDFC Bank",
        siteName: "Mumbai North",
        quoteNo: "Q2024001",
        dateReceived: "2024-03-15",
        quoteTaxable: 25000,
        quoteAmount: 29500,
        workStatus: "Pending",
        approval: "Pending",
        poStatus: "Not Received",
        poNumber: "",
        jcrStatus: "Not Started",
        agentName: "Unassigned",
      },
      dueDate: "Sep 14",
      scheduledDate: "Sep 14, 10:00 AM",
      createdAt: "3 days ago",
      description:
        "Electrical short circuit detected in manager cabin area. Circuit breaker trips repeatedly.",
      comments: 4,
    },
    {
      id: "AXIS-156",
      title: "Security system upgrade",
      client: "Axis Bank",
      branch: "Pune West",
      priority: "Medium",
      assignee: {
        name: "Ankit Patel",
        avatar: "/avatars/ankit.jpg",
        initials: "AP",
      },
      workStage: {
        stateName: "New",
        adminName: "Admin User",
        clientName: "HDFC Bank",
        siteName: "Mumbai North",
        quoteNo: "Q2024001",
        dateReceived: "2024-03-15",
        quoteTaxable: 25000,
        quoteAmount: 29500,
        workStatus: "Pending",
        approval: "Pending",
        poStatus: "Not Received",
        poNumber: "",
        jcrStatus: "Not Started",
        agentName: "Unassigned",
      },
      dueDate: "Sep 15",
      scheduledDate: "Sep 15, 2:30 PM",
      createdAt: "2 days ago",
      description:
        "Scheduled security system upgrade for all entry points and surveillance cameras.",
      comments: 2,
    },
  ],
  onHold: [
    {
      id: "PNB-078",
      title: "Flooring repair in main hall",
      client: "Punjab National Bank",
      branch: "Chennai South",
      priority: "Medium",
      assignee: {
        name: "Deepak Verma",
        avatar: "/avatars/deepak.jpg",
        initials: "DV",
      },
      workStage: {
        stateName: "New",
        adminName: "Admin User",
        clientName: "HDFC Bank",
        siteName: "Mumbai North",
        quoteNo: "Q2024001",
        dateReceived: "2024-03-15",
        quoteTaxable: 25000,
        quoteAmount: 29500,
        workStatus: "Pending",
        approval: "Pending",
        poStatus: "Not Received",
        poNumber: "",
        jcrStatus: "Not Started",
        agentName: "Unassigned",
      },
      dueDate: "Sep 20",
      createdAt: "4 days ago",
      description:
        "Marble flooring in main customer area has cracks and needs repair. Waiting for material approval.",
      comments: 3,
      holdReason: "Awaiting approval from branch manager",
    },
  ],
  completed: [
    {
      id: "HDFC-220",
      title: "Light fixtures replacement",
      client: "HDFC Bank",
      branch: "Delhi South",
      priority: "Low",
      assignee: {
        name: "Amit Singh",
        avatar: "/avatars/amit.jpg",
        initials: "AS",
      },
      workStage: {
        stateName: "New",
        adminName: "Admin User",
        clientName: "HDFC Bank",
        siteName: "Mumbai North",
        quoteNo: "Q2024001",
        dateReceived: "2024-03-15",
        quoteTaxable: 25000,
        quoteAmount: 29500,
        workStatus: "Pending",
        approval: "Pending",
        poStatus: "Not Received",
        poNumber: "",
        jcrStatus: "Not Started",
        agentName: "Unassigned",
      },
      dueDate: "Sep 20",
      completedDate: "Sep 12",
      createdAt: "7 days ago",
      description:
        "Replaced all faulty light fixtures in the customer area with energy-efficient LED lights.",
      comments: 2,
    },
    {
      id: "ICICI-102",
      title: "Door lock repair",
      client: "ICICI Bank",
      branch: "Bangalore Central",
      priority: "Medium",
      assignee: {
        name: "Suresh Kumar",
        avatar: "/avatars/suresh.jpg",
        initials: "SK",
      },
      dueDate: "Sep 20",
      workStage: {
        stateName: "New",
        adminName: "Admin User",
        clientName: "HDFC Bank",
        siteName: "Mumbai North",
        quoteNo: "Q2024001",
        dateReceived: "2024-03-15",
        quoteTaxable: 25000,
        quoteAmount: 29500,
        workStatus: "Pending",
        approval: "Pending",
        poStatus: "Not Received",
        poNumber: "",
        jcrStatus: "Not Started",
        agentName: "Unassigned",
      },
      completedDate: "Sep 11",
      createdAt: "8 days ago",
      description:
        "Repaired malfunctioning biometric access control system at the main entrance.",
      comments: 1,
    },
  ],
};

export default function KanbanPage() {
  const [tickets, setTickets] = useState<TicketsState>(initialTickets);
  const [searchQuery, setSearchQuery] = useState("");
  const [clientFilter, setClientFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");

  const handleDragEnd = (result: any) => {
    const { source, destination, ticketId } = result;
  
    if (!source || !destination) return;
    if (source !== destination) {
      setTickets((prev) => {
        const newTickets = { ...prev };
        const ticket = prev[source as keyof TicketsState].find((t) => t.id === ticketId) as Ticket | undefined;
  
        if (!ticket) return prev;
  
        // Remove from source
        newTickets[source as keyof TicketsState] = prev[source as keyof TicketsState].filter((t) => t.id !== ticketId);
  
        // Add to destination
        newTickets[destination as keyof TicketsState] = [...prev[destination as keyof TicketsState], ticket];
  
        return newTickets;
      });
    } else {
      setTickets((prev) => prev);
    }
  };
  

  const filteredTickets: TicketsState = Object.entries(tickets).reduce(
    (acc, [status, statusTickets]) => {
      if (['new', 'inProgress', 'scheduled', 'onHold', 'completed'].includes(status as Status)) {
        acc[status as Status] = statusTickets.filter((ticket) => {
          const matchesSearch =
            ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ticket.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ticket.id.toLowerCase().includes(searchQuery.toLowerCase());
  
          const matchesClient =
            clientFilter === 'all' ||
            ticket.client.toLowerCase().includes(clientFilter.toLowerCase());
  
          const matchesAssignee =
            assigneeFilter === 'all' ||
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
    <div className="flex flex-col gap-6">
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
