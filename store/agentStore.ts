// stores/agentStore.ts
import { create } from "zustand";
import {deleteAgent, getAllAgents} from "../lib/services/agent"

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
interface AgentState {
  agents: Agent[];
  loading: boolean;
  error: string | null;
  fetchAgents: () => Promise<void>;
  deleteAgent: (id: string) => Promise<void>;
}

export const useAgentStore = create<AgentState>((set) => ({
  agents: [],
  loading: false,
  error: null,
  fetchAgents: async () => {
    set({ loading: true, error: null });
    try {
      const response = await getAllAgents(); // Use the API function
      set({ agents: response.agents, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  deleteAgent: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await deleteAgent(id); // Use the API function
      set((state) => ({
        agents: state.agents.filter((agent) => agent.id !== id),
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
}));
