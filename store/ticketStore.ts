import { create } from "zustand";
import {
  getAllTickets,
  updateTicketStatus as updateTicketStatusService,
  createTicket,
  updateTicket as updateTicketService,
  getTicketById,
} from "../lib/services/ticket";

// Core types
export type Status =
  | "new"
  | "inProgress"
  | "onHold"
  | "completed"
  | "billing_pending"
  | "billing_completed";

export interface Assignee {
  id: string;
  name: string | null;
  email: string | null;
  avatar: string | null;
  initials: string | null;
  role?: string;
}

export interface WorkStage {
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
  poStatus: boolean;
  poNumber: string;
  jcrStatus: boolean;
  agentName: string;
  jcrFilePath?: string;
  poFilePath?: string;
}

export interface Expense {
  id: string;
  amount: string;
  category: string;
  createdAt: string;
  pdfUrl: string;
}

export interface Client {
  id: string;
  name: string;
  type: string;
  contactPerson: string;
}

export interface Comment {
  text: string;
  ticketId: string;
  userId: string;
}

export interface Ticket {
  id: string;
  ticketId: string;
  title: string;
  branch: string;
  approvedByAccountant : string ;
  priority: string;
  assignee: Assignee;
  workStage?: WorkStage;
  expenses: Expense[];
  due?: number;
  paid?: boolean;
  client: Client;
  dueDate: string | undefined;
  scheduledDate?: string;
  completedDate?: string;
  createdAt: string;
  description: string;
  comments: Comment[];
  holdReason?: string;
  status: Status;
  Quotation: QuotationTicketStore[]; // Add required property for compatibility
}

export interface QuotationTicketStore {
  id: string;
  name: string;
  quoteNo: string;
  pdfUrl: string;
  clientId: string;
  ticketId: string;
  createdAt: string;
  subtotal: number;
  gst: number;
  grandTotal: number;
}

export interface TicketsState {
  new: Ticket[];
  inProgress: Ticket[];
  onHold: Ticket[];
  completed: Ticket[];
  billing_pending: Ticket[];
  billing_completed: Ticket[];
}

export interface CreateTicketInput {
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
      poStatus: boolean;
      poNumber: string;
      jcrStatus: boolean;
      agentName: string;
    };
  };
}

export interface FetchTicketsFilters {
  status?: Status;
  startDate?: string;
  endDate?: string;
  role?: string;
  userId?: string;
  page?: number;
  limit?: number;
}

export interface DashboardCounts {
  openTicketsCount: number;
  scheduledTodayCount: number;
  clientUpdatesNeededCount: number;
  completedThisWeekCount: number;
}

// Service to fetch dashboard ticket counts with authentication
const getDashboardTicketCountsService = async (): Promise<DashboardCounts> => {
  const response = await fetch("/api/ticket/counts", {
    credentials: "include", // Include cookies for authentication
    headers: {
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
      Expires: "0",
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      errorData.message || "Failed to fetch dashboard ticket counts",
    );
  }
  return response.json();
};

export interface TicketState {
  tickets: TicketsState;
  all_tickets: Ticket[];
  loading: boolean;
  error: string | null;
  currentPage: number;
  hasMoreTickets: boolean;

  // Dashboard counts
  openTicketsCount: number | null;
  scheduledTodayCount: number | null;
  clientUpdatesNeededCount: number | null;
  completedThisWeekCount: number | null;
  isLoadingDashboardCounts: boolean;

  // Actions
  fetchTickets: (filters?: FetchTicketsFilters & { page?: number, limit?: number }) => Promise<void>;
  updateTicketStatus: (id: string, status: Status) => Promise<void>;
  createTicket: (ticketData: CreateTicketInput) => Promise<void>;
  fetchTicketById: (id: string) => Promise<Ticket | undefined>;
  updateTicket: (
    updatedTicket: Partial<Ticket> & { id: string },
  ) => Promise<void>;
  fetchDashboardCounts: () => Promise<void>;

  // Helper functions
  getTicketFromState: (id: string) => Ticket | undefined;
  clearError: () => void;
}

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
  currentPage: 1,
  hasMoreTickets: true,

  // Initialize dashboard count states
  openTicketsCount: null,
  scheduledTodayCount: null,
  clientUpdatesNeededCount: null,
  completedThisWeekCount: null,
  isLoadingDashboardCounts: false,

  fetchTickets: async (filters?: FetchTicketsFilters & { page?: number, limit?: number }) => {
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    set({ loading: true, error: null });
    try {
      // Get user role and ID from auth store for RBA
      const { useAuthStore } = await import("./authStore");
      const { user } = useAuthStore.getState();

      const enhancedFilters: FetchTicketsFilters = {
        ...filters,
        role: user?.role,
        userId: user?.userId,
        page,
        limit,
      };

      // getAllTickets now returns an object: { tickets: Ticket[], totalCount: number }
      const { tickets: fetchedTickets, totalCount } = await getAllTickets(enhancedFilters);

      const statusGroups: TicketsState = get().tickets;
      let updatedAllTickets = get().all_tickets;

      if (page === 1) {
        // Replace tickets if it's the first page
        updatedAllTickets = fetchedTickets;
        // Reset status groups
        for (const key in statusGroups) {
          statusGroups[key as Status] = [];
        }
      } else {
        // Append tickets if it's not the first page
        updatedAllTickets = [...updatedAllTickets, ...fetchedTickets];
      }

      // Distribute tickets into status groups
      for (const ticket of fetchedTickets) {
        const status = ticket.status as Status;
        if (status in statusGroups) {
          // Avoid duplicates when appending
          if (!statusGroups[status].find(t => t.id === ticket.id)) {
            statusGroups[status].push(ticket);
          }
        } else {
          // Initialize if status group doesn't exist (should not happen with current setup)
          statusGroups[status] = [ticket];
        }
      }

      // If page is 1, we need to rebuild the statusGroups from scratch from the new updatedAllTickets
      if (page === 1) {
        for (const key in statusGroups) {
          statusGroups[key as Status] = [];
        }
        for (const ticket of updatedAllTickets) {
          const status = ticket.status as Status;
          if (status in statusGroups) {
            statusGroups[status].push(ticket);
          }
        }
      }


      set({
        all_tickets: updatedAllTickets,
        tickets: statusGroups,
        loading: false,
        error: null,
        currentPage: page,
        hasMoreTickets: updatedAllTickets.length < totalCount,
      });
    } catch (error: any) {
      set({
        error: error.message || "Failed to fetch tickets",
        loading: false,
      });
    }
  },

  updateTicketStatus: async (id: string, status: Status) => {
    const state = get();
    let previousState: TicketsState | null = null;

    try {
      // Store previous state for rollback
      previousState = JSON.parse(JSON.stringify(state.tickets));

      // First update the local state immediately for better UX (optimistic update)
      set((currentState) => {
        const { tickets, all_tickets } = currentState;

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
            return currentState; // Ticket not found anywhere
          }
        }

        const updatedTicket: Ticket = { ...foundTicket, status };

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
            ...currentState,
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
            ...currentState,
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
      await updateTicketStatusService(id, status);
    } catch (error: any) {
      // Rollback to previous state on error
      if (previousState) {
        set((currentState) => ({
          ...currentState,
          tickets: previousState!,
          error: error.message || "Failed to update ticket status",
        }));
      } else {
        set({ error: error.message || "Failed to update ticket status" });
      }
      throw error;
    }
  },

  createTicket: async (ticketData: CreateTicketInput) => {
    set({ loading: true, error: null });
    try {
      const newTicket = await createTicket(ticketData);
      const { ticket } = newTicket;

      // Add the complete ticket to the store
      set((state) => ({
        ...state,
        tickets: {
          ...state.tickets,
          new: [ticket, ...state.tickets.new],
        },
        all_tickets: [ticket, ...state.all_tickets],
        loading: false,
      }));

      // Refresh tickets to ensure data consistency
      await get().fetchTickets();
    } catch (error: any) {
      set({
        error: error.message || "Failed to create ticket",
        loading: false,
      });
      throw error;
    }
  },

  fetchTicketById: async (id: string): Promise<Ticket | undefined> => {
    try {
      // First try to get from local state
      const localTicket = get().getTicketFromState(id);
      if (localTicket) {
        return localTicket;
      }

      // If not found locally, fetch from API
      const response = await getTicketById(id);
      const ticket = response.ticket || response;

      // Update local state with fetched ticket
      set((state) => {
        const updatedAllTickets = state.all_tickets.some((t) => t.id === id)
          ? state.all_tickets.map((t) => (t.id === id ? ticket : t))
          : [...state.all_tickets, ticket];

        const ticketStatus = ticket.status as Status;
        const updatedStatusTickets = state.tickets[ticketStatus].some(
          (t) => t.id === id,
        )
          ? state.tickets[ticketStatus].map((t) => (t.id === id ? ticket : t))
          : [...state.tickets[ticketStatus], ticket];

        return {
          ...state,
          all_tickets: updatedAllTickets,
          tickets: {
            ...state.tickets,
            [ticketStatus]: updatedStatusTickets,
          },
        };
      });

      return ticket;
    } catch (error: any) {
      set({ error: error.message || "Failed to fetch ticket" });
      throw error;
    }
  },

  updateTicket: async (updatedTicket: Partial<Ticket> & { id: string }) => {
    const state = get();
    let previousState: TicketsState | null = null;

    try {
      // Store previous state for potential rollback
      // previousState = JSON.parse(JSON.stringify(state.tickets));

      const response = await updateTicketService(updatedTicket);
      // const ticketFromServer = response.ticket || response;

      // set((currentState) => {
      //   const { tickets, all_tickets } = currentState;

      //   // Update all_tickets list
      //   const updatedAllTickets = all_tickets.map((t) =>
      //     t.id === ticketFromServer.id ? ticketFromServer : t,
      //   );

      //   // Find current ticket in any status group
      //   let foundStatus: Status | null = null;
      //   for (const statusKey of Object.keys(tickets) as Status[]) {
      //     if (tickets[statusKey].some((t) => t.id === ticketFromServer.id)) {
      //       foundStatus = statusKey;
      //       break;
      //     }
      //   }

      //   // If ticket not found in any group, find it in all_tickets and use its current status
      //   if (!foundStatus) {
      //     const existingTicket = all_tickets.find(
      //       (t) => t.id === ticketFromServer.id,
      //     );
      //     if (existingTicket) {
      //       foundStatus = existingTicket.status as Status;
      //     }
      //   }

      //   if (!foundStatus) {
      //     // If still not found, just add to the new status array
      //     const ticketNewStatus = ticketFromServer.status as Status;
      //     return {
      //       ...currentState,
      //       all_tickets: updatedAllTickets,
      //       tickets: {
      //         ...tickets,
      //         [ticketNewStatus]: [
      //           ...tickets[ticketNewStatus],
      //           ticketFromServer,
      //         ],
      //       },
      //       loading: false,
      //     };
      //   }

      //   // Handle status change
      //   const ticketNewStatus = ticketFromServer.status as Status;

      //   if (foundStatus !== ticketNewStatus) {
      //     // Remove from current status array
      //     const updatedCurrentStatusTickets = tickets[foundStatus].filter(
      //       (t) => t.id !== ticketFromServer.id,
      //     );

      //     // Check if ticket already exists in new status array (avoid duplicates)
      //     const existsInNewStatus = tickets[ticketNewStatus].some(
      //       (t) => t.id === ticketFromServer.id,
      //     );

      //     const updatedNewStatusTickets = existsInNewStatus
      //       ? tickets[ticketNewStatus].map((t) =>
      //           t.id === ticketFromServer.id ? ticketFromServer : t,
      //         )
      //       : [...tickets[ticketNewStatus], ticketFromServer];

      //     return {
      //       ...currentState,
      //       all_tickets: updatedAllTickets,
      //       tickets: {
      //         ...tickets,
      //         [foundStatus]: updatedCurrentStatusTickets,
      //         [ticketNewStatus]: updatedNewStatusTickets,
      //       },
      //       loading: false,
      //     };
      //   } else {
      //     // Update the ticket in the same status array
      //     const updatedStatusTickets = tickets[foundStatus].map((t) =>
      //       t.id === ticketFromServer.id ? ticketFromServer : t,
      //     );

      //     return {
      //       ...currentState,
      //       all_tickets: updatedAllTickets,
      //       tickets: {
      //         ...tickets,
      //         [foundStatus]: updatedStatusTickets,
      //       },
      //       loading: false,
      //     };
      //   }
      // });
    } catch (error: any) {
      // Rollback to previous state on error
      if (previousState) {
        set((currentState) => ({
          ...currentState,
          tickets: previousState!,
          error: error.message || "Failed to update ticket",
          loading: false,
        }));
      } else {
        set({
          error: error.message || "Failed to update ticket",
          loading: false,
        });
      }
      throw error;
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

  // Helper functions
  getTicketFromState: (id: string): Ticket | undefined => {
    const state = get();
    return state.all_tickets.find((ticket) => ticket.id === id);
  },

  clearError: () => {
    set({ error: null });
  },
}));
