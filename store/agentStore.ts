import { create } from "zustand";
import {
  getAllAgents,
  createAgent as createAgentService,
  getAgentById,
  createAgent as createAgentService, // Renamed for clarity
  updateAgent as updateAgentService, // Renamed for clarity
  deleteAgent as deleteAgentService, // Renamed to avoid conflict with action name
  // Assume getTotalAgentCount will be added to services, similar to others.
  // For now, we define a placeholder directly in this file.
} from "../lib/services/agent";

import { Agent, CreateAgentPayload } from "@/components/agent/types";

// Placeholder for the actual service call.
// In a real application, this would likely be in '../lib/services/agent.ts'
// and imported.
const getTotalAgentCountService = async (): Promise<{ count: number }> => {
  const response = await fetch("/api/agent/count");
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to fetch total agent count");
  }
  return response.json();
};

interface AgentState {
  agents: Agent[];
  loading: boolean;
  error: string | null;
  currentPage: number;
  itemsPerPage: number;
  totalAgents: number;
  searchQuery: string;

  // New state for total agent count (for dashboard cards, etc.)
  totalAgentCount: number | null; // Total count of all agents with specific roles
  isLoadingTotalAgentCount: boolean; // Loading state specifically for totalAgentCount

  fetchAgents: (params?: {
    page?: number;
    limit?: number;
    query?: string;
  }) => Promise<void>;
  fetchAgentById: (id: string) => Promise<Agent | undefined>;
  addAgent: (agent: CreateAgentPayload) => Promise<void>;
  editAgent: (id: string, updatedAgent: Agent) => Promise<void>;
  deleteAgent: (id: string) => Promise<void>;
  setCurrentPage: (page: number) => void;
  setSearchQuery: (query: string) => void;
  setItemsPerPage: (limit: number) => void; // Added setItemsPerPage

  // New action for fetching total agent count
  fetchTotalAgentCount: () => Promise<void>;
}

export const useAgentStore = create<AgentState>((set, get) => ({
  agents: [],
  loading: false,
  error: null,
  currentPage: 1,
  itemsPerPage: 10,
  totalAgents: 0,
  searchQuery: "",
  totalAgentCount: null,
  isLoadingTotalAgentCount: false,

  fetchAgents: async (params = {}) => {
    set({ loading: true, error: null });
    const S = get();
    const pageToFetch = params.page ?? S.currentPage;
    const limitToFetch = params.limit ?? S.itemsPerPage;
    const queryToFetch =
      params.query !== undefined ? params.query : S.searchQuery;

    try {
      const response = await getAllAgents({
        page: pageToFetch,
        limit: limitToFetch,
        searchQuery: queryToFetch,
      });
      set({
        agents: response.data,
        totalAgents: response.total,
        currentPage: response.page,
        itemsPerPage: response.limit, // Update itemsPerPage from API response
        searchQuery: queryToFetch,
        loading: false,
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  fetchAgentById: async (id: string) => {
    try {
      const agent = await getAgentById(id);
      return agent;
    } catch (error: any) {
      set({ error: error.message });
      return undefined;
    }
  },
  addAgent: async (agent: CreateAgentPayload) => {
    try {
      await createAgentService(agent); // Use renamed service
      // After adding, refresh to the first page with current search query
      get().fetchAgents({ page: 1, query: get().searchQuery });
    } catch (error: any) {
      set({ error: error.message || "Failed to create agent" });
      throw error; // Rethrow to allow form to handle it
    }
  },
  editAgent: async (id: string, updatedAgent: Agent) => {
    try {
      // Use originalId if available (for agents fetched from the list), otherwise use the provided id
      const actualId = (updatedAgent as any).originalId || id;
      await updateAgentService(actualId, updatedAgent); // Use renamed service
      // After editing, refresh the current page
      get().fetchAgents({ page: get().currentPage, query: get().searchQuery });
    } catch (error: any) {
      set({ error: error.message || "Failed to update agent", loading: false });
      throw error; // Rethrow to allow form to handle it
    }
  },
  deleteAgent: async (id: string) => {
    try {
      // Find the agent to get the original ID
      const { agents } = get();
      const agent = agents.find((a) => a.id === id);
      const actualId = (agent as any)?.originalId || id;

      await deleteAgentService(actualId); // Use renamed service
      // After deleting, check if the current page becomes empty
      const { totalAgents, currentPage } = get();
      if (agents.length === 1 && totalAgents > 1 && currentPage > 1) {
        // If it was the last item on a page (and not the first page)
        get().fetchAgents({ page: currentPage - 1, query: get().searchQuery });
      } else {
        // Otherwise, refresh the current page
        get().fetchAgents({ page: currentPage, query: get().searchQuery });
      }
    } catch (error: any) {
      set({ error: error.message || "Failed to delete agent", loading: false });
      throw error; // Rethrow to allow UI to handle it
    }
  },
  setCurrentPage: (page: number) => {
    set({ currentPage: page });
    get().fetchAgents({ page });
  },
  setSearchQuery: (query: string) => {
    set({ searchQuery: query, currentPage: 1 }); // Reset to first page when searching
    get().fetchAgents({ page: 1, query });
  },
  setItemsPerPage: (limit: number) => {
    set({ itemsPerPage: limit, currentPage: 1 }); // Reset to first page when changing limit
    get().fetchAgents({ page: 1, limit });
  },

  // New action for fetching total agent count
  fetchTotalAgentCount: async () => {
    set({ isLoadingTotalAgentCount: true });
    try {
      const response = await getTotalAgentCountService();
      set({ totalAgentCount: response.count, isLoadingTotalAgentCount: false });
    } catch (error: any) {
      set({
        error: error.message || "Failed to fetch total agent count",
        isLoadingTotalAgentCount: false,
      });
    }
  },
}));
