import { create } from "zustand";
import {
  getAllAgents,
  getAgentById,
  createAgent as createAgentService, // Renamed for clarity
  updateAgent as updateAgentService, // Renamed for clarity
  deleteAgent as deleteAgentService // Renamed to avoid conflict with action name
} from "../lib/services/agent";

import { Agent , CreateAgentPayload } from "@/components/agent/types";

interface AgentState {
  agents: Agent[];
  loading: boolean;
  error: string | null;
  currentPage: number;
  itemsPerPage: number;
  totalAgents: number;
  searchQuery: string;
  fetchAgents: (params?: { page?: number; query?: string }) => Promise<void>;
  fetchAgentById: (id: string) => Promise<Agent | undefined>;
  addAgent: (agent: CreateAgentPayload) => Promise<void>;
  editAgent: (id: string, updatedAgent: Agent) => Promise<void>;
  deleteAgent: (id: string) => Promise<void>;
  setCurrentPage: (page: number) => void;
  setSearchQuery: (query: string) => void;
}

export const useAgentStore = create<AgentState>((set, get) => ({
  agents: [],
  loading: false,
  error: null,
  currentPage: 1,
  itemsPerPage: 10, // Default items per page
  totalAgents: 0,
  searchQuery: "",
  fetchAgents: async (params = {}) => {
    set({ loading: true, error: null });
    const { page = get().currentPage, query = get().searchQuery } = params;
    try {
      const response = await getAllAgents({
        page,
        limit: get().itemsPerPage,
        searchQuery: query
      });
      set({
        agents: response.data,
        totalAgents: response.total,
        currentPage: response.page, // Use page from response to be sure
        searchQuery: query, // Update search query in state
        loading: false
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  fetchAgentById: async (id: string) => {
    // This function fetches a single agent, pagination state is not directly affected
    // but loading and error state should be handled.
    set({ loading: true, error: null });
    try {
      const agent = await getAgentById(id);
      set({ loading: false }); // Reset loading after fetch
      return agent;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      return undefined;
    }
  },
  addAgent: async (agent: CreateAgentPayload) => {
    try {
      await createAgentService(agent); // Use renamed service
      // After adding, refresh to the first page with current search query
      get().fetchAgents({ page: 1, query: get().searchQuery });
    } catch (error: any) {
      set({ error: error.message || 'Failed to create agent'});
      throw error; // Rethrow to allow form to handle it
    }
  },
  editAgent: async (id: string, updatedAgent: Agent) => {
    try {
      await updateAgentService(id, updatedAgent); // Use renamed service
      // After editing, refresh the current page
      get().fetchAgents({ page: get().currentPage, query: get().searchQuery });
    } catch (error: any) {
      set({ error: error.message || 'Failed to update agent', loading: false });
      throw error; // Rethrow to allow form to handle it
    }
  },
  deleteAgent: async (id: string) => {
    try {
      await deleteAgentService(id); // Use renamed service
      // After deleting, check if the current page becomes empty
      const { agents, totalAgents, currentPage } = get();
      if (agents.length === 1 && totalAgents > 1 && currentPage > 1) {
        // If it was the last item on a page (and not the first page)
        get().fetchAgents({ page: currentPage - 1, query: get().searchQuery });
      } else {
        // Otherwise, refresh the current page (or first page if current page becomes invalid)
        get().fetchAgents({ page: currentPage, query: get().searchQuery });
      }
    } catch (error: any) {
      set({ error: error.message || 'Failed to delete agent', loading: false });
      throw error; // Rethrow to allow UI to handle it
    }
  },
  setCurrentPage: (page: number) => {
    set({ currentPage: page });
    get().fetchAgents({ page });
  },
  setSearchQuery: (query: string) => {
    set({ searchQuery: query, currentPage: 1 }); // Reset to page 1 on new search
    get().fetchAgents({ page: 1, query });
  },
}));
