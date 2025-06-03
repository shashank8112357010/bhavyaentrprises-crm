// lib/services/ticket.ts
import axios from "../axios";

export type Ticket = {
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
      poStatus: Boolean;
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

type Status = 'new' | 'inProgress'  | 'onHold' | 'completed' | 'billing_pending' | 'billing_completed';

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
      poStatus: Boolean;
      poNumber: string;
      jcrStatus: Boolean;
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

export async function getAllTickets(filters?: { status?: Status; startDate?: string; endDate?: string; searchQuery?: string }) {
  try {
    const params = new URLSearchParams();

    if (filters?.status) params.append("status", filters.status);
    if (filters?.startDate) params.append("startDate", filters.startDate);
    if (filters?.endDate) params.append("endDate", filters.endDate);
    if (filters?.searchQuery) params.append("search", filters.searchQuery); // Added search query param

    const response = await axios.get(`/ticket?${params.toString()}`, {
      withCredentials: true,
      headers: {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
        Expires: "0",
      },
    });

    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.error || "Failed to fetch tickets.";
    throw new Error(message);
  }
}


export async function exportTicketsToExcel(filters: { status?: Status; startDate: string; endDate: string }) {
  try {
    const params = new URLSearchParams();
    if (filters.status) params.append("status", filters.status);
    params.append("startDate", filters.startDate);
    params.append("endDate", filters.endDate);

    const response = await axios.get(`/ticket/export?${params.toString()}`, {
      withCredentials: true,
      responseType: "blob",
    });

    const blob = new Blob([response.data], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;

    const fileName = `tickets_${filters.status || "all"}_${filters.startDate}_${filters.endDate}.xlsx`;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error: any) {
    const message = error.response?.data?.message || "Failed to export tickets.";
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

export async function updateTicket( updatedTicket: any) {
  try {
    const response = await axios.patch(`/ticket/${updatedTicket.id}`, updatedTicket, {
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

/**
 * Fetches all comments for a specific ticket.
 * @param id The ID of the ticket.
 * @returns A promise that resolves to an array of comments.
 */
export async function getComments(id: string) {
  if (!id) {
    throw new Error("Ticket ID is required to fetch comments.");
  }
  try {
    const response = await axios.get(`/ticket/${id}/comment`);
    return response.data;
  } catch (error: any) {
    console.error("Error fetching comments:", error);
    const message = error.response?.data?.message || "Failed to fetch comments.";
    throw new Error(message);
  }
}

/**
 * Adds a new comment to a specific ticket.
 * @param id The ID of the ticket.
 * @param text The text content of the comment.
 * @param userId The ID of the user adding the comment.
 * @returns A promise that resolves to the newly created comment data.
 */
export async function addComment(id: string, text: string, userId: string) {
  if (!id || !text || !userId) {
    throw new Error("Ticket ID, comment text, and user ID are required.");
  }
  try {
    const response = await axios.post(`/ticket/${id}/comment`, { text, userId });
    return response.data;
  } catch (error: any) {
    console.error("Error adding comment:", error);
    const message = error.response?.data?.message || "Failed to add comment.";
    throw new Error(message);
  }
}
