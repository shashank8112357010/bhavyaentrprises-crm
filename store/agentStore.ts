import { create } from "zustand";
import {
  getAllAgents,
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
  loading: boolean; // For general agent list loading (fetchAgents)
  error: string | null;
  currentPage: number;
  itemsPerPage: number;
  totalAgents: number; // For paginated list from fetchAgents
  searchQuery: string;

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
  setItemsPerPage: (newLimit: number) => void;
  fetchTotalAgentCount: () => Promise<void>; // New action
}

export const useAgentStore = create<AgentState>((set, get) => ({
  agents: [],
  loading: false,
  error: null,
  currentPage: 1,
  itemsPerPage: 5, // Updated default items per page to 5
  totalAgents: 0, // This is for the paginated list
  searchQuery: "",

  totalAgentCount: null, // Initialize new state
  isLoadingTotalAgentCount: false, // Initialize new state

  fetchAgents: async (params = {}) => {
    set({ loading: true, error: null }); // This loading is for the main agent list
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
      set({ error: error.message || "Failed to delete agent", loading: false });
      throw error; // Rethrow to allow UI to handle it
    }
  },
  setCurrentPage: (page: number) => {
    set({ currentPage: page, loading: true }); // Set loading true before fetch
    get().fetchAgents({ page, query: get().searchQuery }); // Pass current query
  },
  setSearchQuery: (query: string) => {
    set({ searchQuery: query, currentPage: 1, loading: true }); // Reset to page 1 and set loading
    get().fetchAgents({ page: 1, query });
  },
  setItemsPerPage: (newLimit: number) => {
    set({ itemsPerPage: newLimit, currentPage: 1, loading: true }); // Update state and set loading
    get().fetchAgents({ page: 1, limit: newLimit, query: get().searchQuery });
  },
  fetchTotalAgentCount: async () => {
    set({ isLoadingTotalAgentCount: true, error: null });
    try {
      const response = await getTotalAgentCountService(); // Call the service function
      set({
        totalAgentCount: response.count,
        isLoadingTotalAgentCount: false,
      });
    } catch (error: any) {
      set({
        error: error.message || "Failed to fetch total agent count",
        isLoadingTotalAgentCount: false,
        totalAgentCount: null, // Optionally reset or keep previous value on error
      });
      // Optionally rethrow or handle the error further if needed by the caller
      // console.error("Error in fetchTotalAgentCount:", error);
    }
  },
}));
