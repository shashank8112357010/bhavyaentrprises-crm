// store/ticketStore.ts
import { create } from "zustand";
import { getAllTickets, updateTicketStatus, createTicket } from "../lib/services/ticket";

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
  status: Status;
};

type TicketsState = {
  new: Ticket[];
  inProgress: Ticket[];
  scheduled: Ticket[];
  onHold: Ticket[];
  completed: Ticket[];
};

type Status = 'new' | 'inProgress' | 'scheduled' | 'onHold' | 'completed';

interface TicketState {
  tickets: TicketsState;
  loading: boolean;
  error: string | null;
  fetchTickets: () => Promise<void>;
  updateTicketStatus: (id: string, status: Status) => Promise<void>;
  createTicket: (ticketData: Omit<Ticket, 'id' | 'status'>) => Promise<void>;
}

export const useTicketStore = create<TicketState>((set) => ({
  tickets: {
    new: [],
    inProgress: [],
    scheduled: [],
    onHold: [],
    completed: [],
  },
  loading: false,
  error: null,
  fetchTickets: async () => {
    set({ loading: true, error: null });
    try {
      const response = await getAllTickets();
      const { tickets } = response;

      // Organize tickets by status
      const newTickets = tickets.filter((ticket: Ticket) => ticket.status === 'new');
      const inProgressTickets = tickets.filter((ticket: Ticket) => ticket.status === 'inProgress');
      const scheduledTickets = tickets.filter((ticket: Ticket) => ticket.status === 'scheduled');
      const onHoldTickets = tickets.filter((ticket: Ticket) => ticket.status === 'onHold');
      const completedTickets = tickets.filter((ticket: Ticket) => ticket.status === 'completed');

      set({
        tickets: {
          new: newTickets,
          inProgress: inProgressTickets,
          scheduled: scheduledTickets,
          onHold: onHoldTickets,
          completed: completedTickets,
        },
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
        const ticketIndex = Object.values(tickets).flat().findIndex((ticket) => ticket.id === id);

        if (ticketIndex === -1) {
          return state;
        }

        const ticket = Object.values(tickets).flat()[ticketIndex];
        const updatedTicket = { ...ticket, status };

        // Remove the ticket from its current status array
        const currentStatus = ticket.status;
        const currentStatusTickets = tickets[currentStatus].filter((t) => t.id !== id);

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
  createTicket: async (ticketData: Omit<Ticket, 'id' | 'status'>) => {
    set({ loading: true, error: null });
    try {
      const newTicket = await createTicket(ticketData);
      set((state) => ({
        tickets: {
          ...state.tickets,
          new: [...state.tickets.new, { ...newTicket, status: 'new' }],
        },
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
}));
