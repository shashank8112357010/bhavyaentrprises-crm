// components/kanban/types.ts
export type TicketStatus =
  | "new"
  | "inProgress"
  | "onHold"
  | "completed"
  | "billing_pending"
  | "billing_completed";

export interface Assignee {
  id: string;
  name: string;
  avatar: string;
  initials: string;
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

export interface Quotation {
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

export interface Ticket {
  id: string;
  title: string;
  ticketId: string;
  branch: string;
  priority: string;
  assignee: Assignee;
  workStage?: WorkStage;
  due?: number;
  paid?: boolean;
  client: Client;
  expenses: Expense[];
  dueDate: string | undefined;
  scheduledDate?: string;
  completedDate?: string;
  createdAt: string;
  description: string;
  comments: Comment[];
  holdReason?: string;
  status: TicketStatus;
  quotations?: Quotation[];
  Quotation: Quotation[]; // Required property for compatibility with ticket service
}

export interface TicketsState {
  new: Ticket[];
  inProgress: Ticket[];
  onHold: Ticket[];
  completed: Ticket[];
  billing_pending: Ticket[];
  billing_completed: Ticket[];
}

export interface DragEndResult {
  source: string;
  destination: string;
  ticketId: string;
}

export interface KanbanBoardProps {
  tickets: TicketsState;
  onDragEnd: (result: DragEndResult) => Promise<void>;
}

export interface KanbanColumnProps {
  title: string;
  status: TicketStatus;
  tickets: Ticket[];
  onDragEnd: (result: DragEndResult) => Promise<void>;
}

export interface SortableTicketProps {
  ticket: Ticket;
  index: number;
}

// Export alias for compatibility
export type Status = TicketStatus;
