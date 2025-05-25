import { create } from "zustand";
import { deleteAgent, getAllAgents, getAgentById, createAgent, updateAgent } from "../lib/services/agent";

import { Agent , CreateAgentPayload } from "@/components/agent/types";

interface AgentState {
  agents: Agent[];
  loading: boolean;
  error: string | null;
  fetchAgents: () => Promise<void>;
  fetchAgentById: (id: string) => Promise<Agent | undefined>;
  addAgent: (agent: CreateAgentPayload) => Promise<void>;
  editAgent: (id: string, updatedAgent: Agent) => Promise<void>;
  deleteAgent: (id: string) => Promise<void>;
}

export const useAgentStore = create<AgentState>((set) => ({
  agents: [],
  loading: false,
  error: null,
  fetchAgents: async () => {
    set({ loading: true, error: null });
    try {
      const response = await getAllAgents();
      set({ agents: response.agents, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  fetchAgentById: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const agent = await getAgentById(id);
      set({ loading: false });
      return agent;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      return undefined;
    }
  },
  addAgent: async (agent: CreateAgentPayload) => {
    // set({ loading: true, error: null });
    try {
      const newAgent = await createAgent(agent);
      
      set((state) => ({
        agents: [...state.agents, newAgent?.user],
        loading: false,
      }));

    } catch (error: any) {
      set({ error: error.message || 'Failed to create agent'});
      throw error;
    }
  },
  editAgent: async (id: string, updatedAgent: Agent) => {
    set({ loading: true, error: null });
    try {
      await updateAgent(id, updatedAgent);
      set((state) => ({
        agents: state.agents.map((agent) =>
          agent.id === id ? updatedAgent : agent
        ),
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  deleteAgent: async (id: string) => {
    // set({ loading: true, error: null });
    try {
      await deleteAgent(id);
      set((state) => ({
        agents: state.agents.filter((agent) => agent.id !== id),
        
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
}));
