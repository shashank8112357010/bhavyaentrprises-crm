export interface Assignee {
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
  poStatus: string;
  poNumber: string;
  jcrStatus: string;
  agentName: string;
}

export interface Ticket {
  id: string;
  title: string;
  client: string;
  branch: string;
  priority: string;
  assignee: Assignee;
  dueDate?: string;
  scheduledDate?: string;
  completedDate?: string;
  createdAt: string;
  description: string;
  comments: number;
  holdReason?: string;
  workStage: WorkStage;
}

export interface TicketsState {
  new: Ticket[];
  inProgress: Ticket[];
  scheduled: Ticket[];
  onHold: Ticket[];
  completed: Ticket[];
}