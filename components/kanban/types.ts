// components/agent/types.ts
export type Role = 'ADMIN' | 'BACKEND' | 'RM' | 'MST' | 'ACCOUNTS';
export type Status = 'ACTIVE' | 'INACTIVE' | 'PENDING';
export type PerformanceTrend = 'UP' | 'DOWN' | 'STABLE';

export type Agent = {
  id: string;
  name: string;
  email: string;
  password: string;
  mobile: string;
  role: Role;
  createdAt: Date;
  department?: string;
  specialization?: string;
  status: Status;
  leadsAssigned: number;
  leadsActive: number;
  leadsClosed: number;
  conversionRate: number;
  performanceTrend: PerformanceTrend;
  joinedDate: Date;
  avatar?: string;
  initials?: string;
  activeTickets: number;
  rating: number;
  completedTickets: number;
}

export type CreateAgentPayload = Omit<Agent, 'id' | 'createdAt' | 'joinedDate' | 'leadsAssigned' | 'leadsActive' | 'leadsClosed' | 'conversionRate' | 'performanceTrend' | 'activeTickets' | 'rating' | 'completedTickets'>;
// components/kanban/types.ts
export type TicketStatus = 'new' | 'inProgress' | 'scheduled' | 'onHold' | 'completed';

export interface Ticket {
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
  dueDate?: string;
  scheduledDate?: string;
  completedDate?: string;
  createdAt: string;
  description: string;
  comments: number;
  holdReason?: string;
  status: TicketStatus;
}
