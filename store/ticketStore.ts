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
  ticketId: string;
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
    },
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
  fetchTickets: (filters?: {
    status?: Status;
    startDate?: string;
    endDate?: string;
  }) => Promise<void>;
  updateTicketStatus: (id: string, status: Status) => Promise<void>;
  createTicket: (ticketData: CreateTicketInput) => Promise<void>;
  fetchTicketById: (id: string) => Ticket | undefined;
  updateTicket: (updatedTicket: any) => Promise<void>; // <-- Add this here

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
  const response = await fetch("/api/ticket/counts");
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      errorData.message || "Failed to fetch dashboard ticket counts",
    );
  }
  return response.json();
};

export const useTicketStore = create<TicketState>((set, get) => ({
  tickets: {
    new: [],
    inProgress: [],
    onHold: [],
    completed: [],
    billing_pending: [],
    billing_completed: [],
  },
  all_tickets: [],
  loading: false,
  error: null,

  // Initialize new dashboard count states
  openTicketsCount: null,
  scheduledTodayCount: null,
  clientUpdatesNeededCount: null,
  completedThisWeekCount: null,
  isLoadingDashboardCounts: false,

  fetchTickets: async (filters?: {
    status?: Status;
    startDate?: string;
    endDate?: string;
  }) => {
    set({ loading: true, error: null });
    try {
      // Get user role and ID from auth store for RBA
      const { useAuthStore } = await import("./authStore");
      const { user } = useAuthStore.getState();

      const enhancedFilters = {
        ...filters,
        role: user?.role,
        userId: user?.userId,
      };

      const response = await getAllTickets(enhancedFilters); // pass enhanced filters with RBA
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
    try {
      // First update the local state immediately for better UX
      set((state) => {
        const { tickets, all_tickets } = state;

        // Find the ticket in the current state
        let foundTicket: Ticket | null = null;
        let currentStatus: Status | null = null;

        // Look through all status arrays to find the ticket
        for (const statusKey of Object.keys(tickets) as Status[]) {
          const ticket = tickets[statusKey].find((t) => t.id === id);
          if (ticket) {
            foundTicket = ticket;
            currentStatus = statusKey;
            break;
          }
        }

        if (!foundTicket || !currentStatus) {
          // If not found in status arrays, try to find in all_tickets
          const ticketFromAll = all_tickets.find((t) => t.id === id);
          if (ticketFromAll) {
            foundTicket = ticketFromAll;
            currentStatus = ticketFromAll.status as Status;
          } else {
            return state; // Ticket not found anywhere
          }
        }

        const updatedTicket = { ...foundTicket, status };

        // Update all_tickets array
        const updatedAllTickets = all_tickets.map((t) =>
          t.id === id ? updatedTicket : t,
        );

        if (currentStatus === status) {
          // Same status, just update the ticket in place
          const updatedStatusTickets = tickets[status].map((t) =>
            t.id === id ? updatedTicket : t,
          );

          return {
            ...state,
            all_tickets: updatedAllTickets,
            tickets: {
              ...tickets,
              [status]: updatedStatusTickets,
            },
          };
        } else {
          // Different status, move the ticket
          const currentStatusTickets = tickets[currentStatus].filter(
            (t) => t.id !== id,
          );

          // Check if ticket already exists in new status (prevent duplicates)
          const existsInNewStatus = tickets[status].some((t) => t.id === id);
          const newStatusTickets = existsInNewStatus
            ? tickets[status].map((t) => (t.id === id ? updatedTicket : t))
            : [...tickets[status], updatedTicket];

          return {
            ...state,
            all_tickets: updatedAllTickets,
            tickets: {
              ...tickets,
              [currentStatus]: currentStatusTickets,
              [status]: newStatusTickets,
            },
          };
        }
      });

      // Then make the API call
      await updateTicketStatus(id, status);
    } catch (error: any) {
      set({ error: error.message });
      throw error; // Re-throw to allow calling code to handle the error
    }
  },
  createTicket: async (ticketData: CreateTicketInput) => {
    set({ loading: true, error: null });
    try {
      const newTicket = await createTicket(ticketData);
      const { ticket } = newTicket;

      // Add the complete ticket to the store
      set((state) => ({
        tickets: {
          ...state.tickets,
          new: [ticket, ...state.tickets.new],
        },
        loading: false,
      }));

      // Refresh tickets to ensure data consistency
      get().fetchTickets();
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
  updateTicket: async (updatedTicket: any) => {
    try {
      const response = await updateTicket(updatedTicket);
      const ticketFromServer = response.ticket || response;

      set((state) => {
        const { tickets, all_tickets } = state;

        // Update all_tickets list
        const updatedAllTickets = all_tickets.map((t) =>
          t.id === ticketFromServer.id ? ticketFromServer : t,
        );

        // Find current ticket in any status group
        let foundStatus: Status | null = null;
        for (const statusKey of Object.keys(tickets) as Status[]) {
          if (tickets[statusKey].some((t) => t.id === ticketFromServer.id)) {
            foundStatus = statusKey;
            break;
          }
        }

        // If ticket not found in any group, find it in all_tickets and use its current status
        if (!foundStatus) {
          const existingTicket = all_tickets.find(
            (t) => t.id === ticketFromServer.id,
          );
          if (existingTicket) {
            foundStatus = existingTicket.status as Status;
          }
        }

        if (!foundStatus) {
          // If still not found, just add to the new status array
          const ticketNewStatus = ticketFromServer.status as Status;
          return {
            ...state,
            all_tickets: updatedAllTickets,
            tickets: {
              ...tickets,
              [ticketNewStatus]: [
                ...tickets[ticketNewStatus],
                ticketFromServer,
              ],
            },
            loading: false,
          };
        }

        // Handle status change
        const ticketNewStatus = ticketFromServer.status as Status;

        if (foundStatus !== ticketNewStatus) {
          // Remove from current status array
          const updatedCurrentStatusTickets = tickets[foundStatus].filter(
            (t) => t.id !== ticketFromServer.id,
          );

          // Check if ticket already exists in new status array (avoid duplicates)
          const existsInNewStatus = tickets[ticketNewStatus].some(
            (t) => t.id === ticketFromServer.id,
          );

          const updatedNewStatusTickets = existsInNewStatus
            ? tickets[ticketNewStatus].map((t) =>
                t.id === ticketFromServer.id ? ticketFromServer : t,
              )
            : [...tickets[ticketNewStatus], ticketFromServer];

          return {
            ...state,
            all_tickets: updatedAllTickets,
            tickets: {
              ...tickets,
              [foundStatus]: updatedCurrentStatusTickets,
              [ticketNewStatus]: updatedNewStatusTickets,
            },
            loading: false,
          };
        } else {
          // Update the ticket in the same status array
          const updatedStatusTickets = tickets[foundStatus].map((t) =>
            t.id === ticketFromServer.id ? ticketFromServer : t,
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
        }
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error; // Re-throw to allow calling code to handle the error
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
        error: error.message || "Failed to fetch dashboard counts",
        isLoadingDashboardCounts: false,
        openTicketsCount: null,
        scheduledTodayCount: null,
        clientUpdatesNeededCount: null,
        completedThisWeekCount: null,
      });
    }
  },
}));
