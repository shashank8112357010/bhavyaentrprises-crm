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
export type TicketStatus = 'new' | 'inProgress'  | 'onHold' | 'completed' | 'billing_pending' | 'billing_completed';


export interface Ticket  {
  id: string;
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
  due?: number; 
  paid?: Boolean; 
  client:{
    id: string;
    name: string;
    type: string;
    contactPerson: string;
  }
  expenses :[ {
    id: string,
    amount: string,
    category: string,
    createdAt: string,
    pdfUrl: string,
  }]
  dueDate: string | undefined;
  scheduledDate?: string;
  completedDate?: string;
  createdAt: string;
  description: string;
  comments: number;
  holdReason?: string;
  status: TicketStatus;
};

// jcr status => red(N/A) , orange (hard copy) , green (soft copy)
// removed scheduled 
// after complete billing board 
// quote form fix 

