// lib/services/ticket.ts
import APIService from "@/lib/services/api-service";
import type { Comment, CommentUser } from "@/types/comment";


// Type for Client
interface Client {
  id: string;
  name: string;
  // Add other relevant client fields: e.g., type, contactPerson, contactEmail, gstn
  type?: string;
  contactPerson?: string;
  contactEmail?: string | null;
  gstn?: string | null;
  initials?: string; // from schema
}


// Type for Assignee (User)
interface Assignee {
  id: string;
  name: string | null;
  email: string | null; // Included based on API update
  avatar: string | null;
  originalId ?: string; // Original ID for the user, if applicable
  initials: string | null;
  role?: string; // Included based on API update
  // Add other relevant user fields if needed
}

// Type for WorkStage
interface WorkStage {
  id: string;
  stateName: string;
  adminName: string;
  clientName: string;
  siteName: string;
  quoteNo: string;
  dateReceived: string; // Assuming ISO string date
  quoteTaxable: number;
  quoteAmount: number;
  workStatus: string;
  approval: string;
  poStatus: boolean;
  poNumber: string;
  jcrStatus: boolean; // In schema it was string, but boolean makes more sense
  agentName: string;
  // ticketId is implicitly known
}

// Type for Quotation
interface Quotation {
  id: string;
  name: string;
  pdfUrl: string;
  // clientId is implicitly known via ticket
  createdAt: string; // Assuming ISO string date
  // rateCardDetails: any; // This was Json?, define more strictly if possible or needed for UI
  ticketId: string | null;
  subtotal: number;
  gst: number;
  grandTotal: number;
  expectedExpense?: number; // Add expected expense field
  // Add other relevant quotation fields
}

// Type for Expense
interface Expense {
  id: string;
  customId: string;
  amount: number;
  description: string;
  category: string; // Assuming enum converted to string (e.g., LABOR, TRANSPORT)
  requester: string;
  paymentType: string; // Assuming enum converted to string (e.g., VCASH, ONLINE)
  // quotationId: string | null; // Not directly needed if always accessed via ticket
  // ticketId: string | null; // Implicitly known
  createdAt: string; // Assuming ISO string date
  pdfUrl: string | null;
  // Add other relevant expense fields
}

export type Ticket = {
  id: string;
  title: string;

  branch: string;
  priority: string;
  client: Client | null;
  assignee: Assignee | null;
  workStage: WorkStage | null;
  Quotation: Quotation[]; // Array of Quotations
  expenses: Expense[]; // Array of Expenses
  comments: Comment[]; // Array of Comments
  dueDate: string | null;
  scheduledDate?: string | null ;
  completedDate?: string | null;
  createdAt: string | null; // Assuming ISO string date
  description: string ;

  holdReason?: string | null;
  status: Status | null; // Status can be null if not set
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
  priority: string;
  assigneeId: string;
  dueDate?: string;
  comments?: number;
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
    };
  };
}

export async function createTicket(payload: CreateTicketInput) {
  return APIService.createTicket(payload);
}

export interface TicketForSelection {
  id: string; // The UUID
  title: string;
  ticketId: string; // The human-readable/sequential ID
}

export async function getTicketsForSelection(): Promise<TicketForSelection[]> {
  const response = await APIService.getTicketsForSelection();
  return (response as any).tickets || response;
}

export async function getAllTickets(filters?: {
  status?: Status;
  startDate?: string;
  endDate?: string;
  role?: string;
  userId?: string;
}) {
  return APIService.getAllTickets(filters || {});
}

export async function exportTicketsToExcel(filters: {
  status?: Status;
  startDate: string;
  endDate: string;
}) {
  try {
    const response = await APIService.exportTicketsToExcel(filters);

    const blob = new Blob([response as BlobPart], {
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
  return APIService.deleteTicket(id);
}

export async function getTicketById(id: string) {
  return APIService.getTicketById(id);
}

export async function updateTicketStatus(id: string, status: Status) {
  return APIService.updateTicketStatus(id, status);
}

export async function updateTicket(updatedTicket: any) {
  return APIService.updateTicket(updatedTicket.id, updatedTicket);
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
  return APIService.getComments(id);
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
  return APIService.addComment(id, text, userId);
}

// Wrapper exports for consistency with APIService pattern
export const getTickets = (params: any) => APIService.getTickets(params);
export const createTicketViaAPI = (data: any) => APIService.createTicket(data);
export const updateTicketViaAPI = (id: string, data: any) => APIService.updateTicket(id, data);
export const deleteTicketViaAPI = (id: string) => APIService.deleteTicket(id);
export const getTicketByIdViaAPI = (id: string) => APIService.getTicketById(id);
