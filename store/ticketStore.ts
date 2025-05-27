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
    dateReceived: Date;
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
  onHold: Ticket[];
  completed: Ticket[];
  billing_pending :Ticket[];
  billing_completed :Ticket[];

};

type Status = 'new' | 'inProgress'  | 'onHold' | 'completed' | 'billing_pending' | 'billing_completed';
interface CreateTicketInput {
  title: string;
  clientId: string;
  branch: string;
  comments? : number;
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
      poStatus: string;
      poNumber: string;
      jcrStatus: string;
      agentName: string;
    }
  }
}

interface TicketState {
  tickets: TicketsState;
  loading: boolean;
  error: string | null;
  fetchTickets: () => Promise<void>;
  updateTicketStatus: (id: string, status: Status) => Promise<void>;
  createTicket: (ticketData: CreateTicketInput) => Promise<void>;
}

export const useTicketStore = create<TicketState>((set) => ({
  tickets: {
    new: [],
    inProgress: [],
   
    onHold: [],
    completed: [],
    billing_pending:[],
    billing_completed:[]

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
      const onHoldTickets = tickets.filter((ticket: Ticket) => ticket.status === 'onHold');
      const completedTickets = tickets.filter((ticket: Ticket) => ticket.status === 'completed');
      const billing_pending_Tickets = tickets.filter((ticket: Ticket) => ticket.status === 'billing_pending');
      const billing_completed_Tickets = tickets.filter((ticket: Ticket) => ticket.status === 'billing_pending');



      set({
        tickets: {
          new: newTickets,
          inProgress: inProgressTickets,
          onHold: onHoldTickets,
          completed: completedTickets,
          billing_pending :billing_pending_Tickets,
          billing_completed :billing_completed_Tickets

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
  createTicket: async (ticketData: CreateTicketInput) => {
    set({ loading: true, error: null });
    try {
      const newTicket = await createTicket(ticketData);
      console.log(newTicket , "newTicket from store");
      const {ticket} = newTicket
      
      set((state) => ({
        tickets: {
          ...state.tickets,
          new: [...state.tickets.new, { ...ticket, status: 'new' }],
        },
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  }
}));
