// store/ticketStore.ts
import { create } from "zustand";
import {
  getAllTickets,
  updateTicketStatus,
  createTicket,
  updateTicket,
} from "../lib/services/ticket";

type Ticket = {
  id: string;
  ticketId : string;
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

interface CreateTicketInput {
  title: string;
  clientId: string;
  branch: string;
  comments?: number;
  priority: string;
  assigneeId: string;
  dueDate?: string;
  scheduledDate?: string;
  completedDate?: string;
  description: string;

  // comments: string;
  holdReason?: string;
  workStage?: {
    create: {
      stateName: string;
      adminName: string;
      clientName: string;
      siteName: string;
      quoteNo: string;
      dateReceived: Date;
      quoteTaxable: number;
      quoteAmount: number;
      workStatus: string;
      approval: string;
      poStatus: Boolean;
      poNumber: string;
      jcrStatus: Boolean;
      agentName: string;
    };
  };
}

interface TicketState {
  tickets: TicketsState;
  all_tickets: Ticket[];
  loading: boolean;
  error: string | null;
  fetchTickets: (filters?: { status?: Status; startDate?: string; endDate?: string }) => Promise<void>;
  updateTicketStatus: (id: string, status: Status) => Promise<void>;
  createTicket: (ticketData: CreateTicketInput) => Promise<void>;
  fetchTicketById: (id: string) => Ticket | undefined;
  updateTicket: (updatedTicket: any) => Promise<void>;  // <-- Add this here

  // New state and actions for dashboard counts
  openTicketsCount: number | null;
  scheduledTodayCount: number | null;
  clientUpdatesNeededCount: number | null;
  completedThisWeekCount: number | null;
  isLoadingDashboardCounts: boolean;
  fetchDashboardCounts: () => Promise<void>;
}

// Placeholder for the actual service call.
// In a real application, this would likely be in '../lib/services/ticket.ts'
const getDashboardTicketCountsService = async (): Promise<{
  openTicketsCount: number;
  scheduledTodayCount: number;
  clientUpdatesNeededCount: number;
  completedThisWeekCount: number;
}> => {
  const response = await fetch('/api/ticket/counts');
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to fetch dashboard ticket counts');
  }
  return response.json();
};

export const useTicketStore = create<TicketState>((set) => ({
  tickets: {
    new: [],
    inProgress: [],
    onHold: [],
    completed: [],
    billing_pending: [],
    billing_completed: [],
  },
  all_tickets : [],
  loading: false,
  error: null,

  // Initialize new dashboard count states
  openTicketsCount: null,
  scheduledTodayCount: null,
  clientUpdatesNeededCount: null,
  completedThisWeekCount: null,
  isLoadingDashboardCounts: false,

  fetchTickets: async (filters?: { status?: Status; startDate?: string; endDate?: string }) => {
    set({ loading: true, error: null });
    try {
      const response = await getAllTickets(filters); // pass filters
      const { tickets } = response;
  
      const statusGroups = {
        new: [] as Ticket[],
        inProgress: [] as Ticket[],
        onHold: [] as Ticket[],
        completed: [] as Ticket[],
        billing_pending: [] as Ticket[],
        billing_completed: [] as Ticket[],
      };
  
      for (const ticket of tickets) {
        const status = ticket.status as Status;
        if (status in statusGroups) {
          statusGroups[status].push(ticket);
        }
      }
  
      set({
        all_tickets: tickets,
        tickets: statusGroups,
        loading: false,
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  
  
  updateTicketStatus: async (id: string, status: Status) => {
    set({ loading: true, error: null });
    try {
      await updateTicketStatus(id, status);

      set((state) => {
        const { tickets } = state;
        const ticketIndex = Object.values(tickets)
          .flat()
          .findIndex((ticket) => ticket.id === id);

        if (ticketIndex === -1) {
          return state;
        }

        const ticket = Object.values(tickets).flat()[ticketIndex];
        const updatedTicket = { ...ticket, status };

        // Remove the ticket from its current status array
        const currentStatus = ticket.status;
        const currentStatusTickets = tickets[currentStatus].filter(
          (t) => t.id !== id
        );

        // Add the ticket to the new status array
        const newStatusTickets = [...tickets[status], updatedTicket];

        return {
          ...state,
          tickets: {
            ...tickets,
            [currentStatus]: currentStatusTickets,
            [status]: newStatusTickets,
          },
          loading: false,
        };
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  createTicket: async (ticketData: CreateTicketInput) => {
    set({ loading: true, error: null });
    try {
      const newTicket = await createTicket(ticketData);
      const { ticket } = newTicket;

      set((state) => ({
        tickets: {
          ...state.tickets,
          new: [...state.tickets.new, { ...ticket, status: "new" , expenses :[], client : {name  : "" , } }],
        },
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  fetchTicketById: (id: string): Ticket | undefined => {
    const ticket = useTicketStore.getState().tickets;
    const allTickets = Object.values(ticket).flat();
    const foundTicket = allTickets.find((t) => t.id === id);
    return foundTicket;
  },
  updateTicket: async ( updatedTicket: Ticket) => {
    set({ loading: true, error: null });
    try {
      const ticketFromServer = await updateTicket(updatedTicket);
      

      set((state) => {
        const { tickets, all_tickets } = state;

        // Update all_tickets list
        const updatedAllTickets = all_tickets.map((t) =>
          t.id === ticketFromServer.id ? ticketFromServer : t
        );

        // Find current ticket status group to update in that array
        let foundStatus: Status | null = null;
        for (const statusKey of Object.keys(tickets) as Status[]) {
          if (tickets[statusKey].some((t) => t.id === ticketFromServer.id)) {
            foundStatus = statusKey;
            break;
          }
        }

        if (!foundStatus) {
          // Ticket not found in any group, just return state without changes
          return { ...state, loading: false };
        }

        // Update the ticket in the appropriate status array
        const updatedStatusTickets = tickets[foundStatus].map((t) =>
          t.id === ticketFromServer.id ? ticketFromServer : t
        );

        return {
          ...state,
          all_tickets: updatedAllTickets,
          tickets: {
            ...tickets,
            [foundStatus]: updatedStatusTickets,
          },
          loading: false,
        };
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  fetchDashboardCounts: async () => {
    set({ isLoadingDashboardCounts: true, error: null });
    try {
      const counts = await getDashboardTicketCountsService();
      set({
        openTicketsCount: counts.openTicketsCount,
        scheduledTodayCount: counts.scheduledTodayCount,
        clientUpdatesNeededCount: counts.clientUpdatesNeededCount,
        completedThisWeekCount: counts.completedThisWeekCount,
        isLoadingDashboardCounts: false,
      });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to fetch dashboard counts',
        isLoadingDashboardCounts: false,
        openTicketsCount: null,
        scheduledTodayCount: null,
        clientUpdatesNeededCount: null,
        completedThisWeekCount: null,
      });
    }
  },
}));
