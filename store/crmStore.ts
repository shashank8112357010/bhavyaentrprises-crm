import { create } from "zustand";

export interface Agent {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  userId: string;
  department: string;
  status: "active" | "inactive" | "pending";
  leads: {
    assigned: number;
    active: number;
    closed: number;
  };
  conversionRate: number;
  performanceTrend: "up" | "down" | "stable";
  joinedDate: Date;
  profileImage?: string;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  product: string;
  status: "new" | "contacted" | "qualified" | "proposal" | "closed";
  source: string;
  createdAt: Date;
  assignedTo?: string;
  agentId : string,
  lastActivity?: Date;
  value?: number;
  tags?: string[];
}
export interface ReassignLead {
  assignedTo?: string;
  agentId?: string;
  leadId: string;
}

interface CrmState {
  agents: Agent[];
  leads: Lead[];

  loadingAgents: boolean;
  loadingLeads: boolean;

  setAgents: (agents: Agent[]) => void;
  addAgent: (agent: Agent) => void;
  updateAgent: (updatedAgent: Agent) => void;
  removeAgent: (id: string) => void;

  setLeads: (leads: Lead[]) => void;
  addLead: (lead: Lead) => void;
  updateLead: (updatedLead: Lead) => void;
  reassignLeadData: (updatedLead: ReassignLead) => void;

  removeLead: (id: string) => void;

  clearAll: () => void;
}

// Use proper typing for Zustand state creator function
export const useCrmStore = create<CrmState>((set, get) => ({
  agents: [],
  leads: [],
  loadingAgents: false,
  loadingLeads: false,

  setAgents: (agents) => set({ agents }),
  addAgent: (agent) => set((state) => ({ agents: [...state.agents, agent] })),

  updateAgent: (updatedAgent) =>
    set((state) => ({
      agents: state.agents.map((a) =>
        a.id === updatedAgent.id ? updatedAgent : a
      ),
    })),

  removeAgent: (id) =>
    set((state) => ({
      agents: state.agents.filter((a) => a.userId !== id),
    })),

  setLeads: (leads) => set({ leads }),
  addLead: (lead) => set((state) => ({ leads: [...state.leads, lead] })),

  updateLead: (updatedLead) =>
    set((state) => ({
      leads: state.leads.map((l) =>
        l.id === updatedLead.id ? updatedLead : l
      ),
    })),

    reassignLeadData: ({ leadId, agentId, assignedTo }) =>
      set((state : any) => {
        console.log("Current leads:", state.leads); // ADD THIS
        console.log("Reassigning lead", leadId, agentId, assignedTo);
        return {
          leads: state.leads.map((l : any) => {
            console.log("Checking lead:", l);
            
            if (l.id == leadId) {
              console.log("Matched lead:", l); // ✅ should hit here
              return { ...l, agentId, assignedTo };
            }
            return l;
          }),
        };
      }),
    

  removeLead: (id) =>
    set((state) => ({
      leads: state.leads.filter((l) => l.id !== id),
    })),

  clearAll: () => set({ agents: [], leads: [] }),
}));
