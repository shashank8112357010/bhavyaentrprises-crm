// lib/services/ticket.ts
import axios from "../axios";

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

type Status = 'new' | 'inProgress' | 'scheduled' | 'onHold' | 'completed';

interface CreateTicketInput {
  title: string;
  clientId: string;
  branch: string;
  priority: string;
  assigneeId: string;
  dueDate?: string;
  comments? : number;
  scheduledDate?: string;
  completedDate?: string;
  description: string;
  // comments: number;
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

export async function createTicket(payload: CreateTicketInput) {
  try {
    const response = await axios.post("/ticket/create-ticket", payload, {
      withCredentials: true,
    });
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || "Failed to create ticket.";
    throw new Error(message);
  }
}

export async function getAllTickets() {
  try {
    const response = await axios.get("/ticket", {
      withCredentials: true,
      headers: {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.error || "Failed to fetch ticket.";
    throw new Error(message);
  }
}

export async function deleteTicket(id: string) {
  try {
    const response = await axios.delete(`/ticket/${id}`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || "Failed to delete ticket.";
    throw new Error(message);
  }
}

export async function getTicketById(id: string) {
  try {
    const response = await axios.get(`/ticket/${id}`, {
      withCredentials: true,
      headers: {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.error || "Failed to fetch ticket.";
    throw new Error(message);
  }
}

export async function updateTicketStatus(id: string, status: Status) {
  try {
    const response = await axios.patch(`/ticket/${id}`, { status }, {
      withCredentials: true,
      headers: {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.error || "Failed to update ticket status.";
    throw new Error(message);
  }
}

export async function updateTicket(id: string, updatedTicket: Ticket) {
  try {
    const response = await axios.patch(`/ticket/${id}`, updatedTicket, {
      withCredentials: true,
      headers: {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.error || "Failed to update ticket.";
    throw new Error(message);
  }
}
