export interface Agent {
    id: string;
    name: string;
    email: string;
    mobile?: string; // Make optional
    role: string;
    userId: string;
    department: string;
    specialization?: string; // Make optional
    status: "active" | "inactive" | "pending";
    leads: {
      assigned: number;
      active: number;
      closed: number;
    };
    conversionRate: number;
    performanceTrend: "up" | "down" | "stable";
    joinedDate: Date;
    avatar?: string;
    initials?: string;
    activeTickets?: number;
    rating?: number; // Make optional
    completedTickets?: string; // Make optional
  }

  export interface CreateAgentPayload {
    name: string;
    email: string;
    mobile: string;
    role: string;
  }