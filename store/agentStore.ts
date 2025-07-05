import { create } from "zustand";
import {
  getAllAgents,
  getAllAgentsUnpaginated,
  getAgentById,
  createAgent,
  updateAgent,
  deleteAgent,
} from "../lib/services/agent";
import APIService from "../lib/services/api-service";

import { Agent, CreateAgentPayload } from "@/components/agent/types";
import { Role } from "@/constants/roleAccessConfig";

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
  // Infinite scroll data
  allAgents: Agent[];
  paginatedPages: Map<string, Agent[]>;
  
  // Legacy pagination data (for backward compatibility)
  agents: Agent[];
  currentPage: number;
  itemsPerPage: number;
  totalAgents: number;
  
  // Pagination state
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  
  // UI state
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  
  // Search and filters
  searchQuery: string;
  filters: Record<string, any>;
  
  // Special counts
  totalAgentCount: number | null;
  isLoadingTotalAgentCount: boolean;

  // Enhanced actions
  fetchAgents: (options?: {
    page?: number;
    limit?: number;
    search?: string;
    filters?: Record<string, any>;
    append?: boolean;
    force?: boolean;
  }) => Promise<void>;
  
  fetchNextPage: () => Promise<void>;
  resetPagination: () => void;
  setSearchQuery: (query: string) => void;
  setFilters: (filters: Record<string, any>) => void;
  
  // Legacy methods (for backward compatibility)
  fetchAllAgents: () => Promise<void>;
  setCurrentPage: (page: number, userRole?: Role) => void;
  setItemsPerPage: (newLimit: number, userRole?: Role) => void;
  
  // CRUD operations
  fetchAgentById: (id: string) => Promise<Agent | undefined>;
  addAgent: (agent: CreateAgentPayload) => Promise<void>;
  editAgent: (id: string, updatedAgent: Agent) => Promise<void>;
  deleteAgent: (id: string) => Promise<void>;
  fetchTotalAgentCount: () => Promise<void>;
  forceRefresh: () => Promise<void>;

  // Selectors
  getAllAgents: () => Agent[];
  getAgentsLoading: () => boolean;
  getTotalAgentCount: () => number | null;
  getAgentById: (id: string) => Agent | undefined;
}

export const useAgentStore = create<AgentState>((set, get) => ({
  // Infinite scroll data
  allAgents: [],
  paginatedPages: new Map(),
  
  // Legacy pagination data (for backward compatibility)
  agents: [],
  currentPage: 1,
  itemsPerPage: 5,
  totalAgents: 0,
  
  // Pagination state
  limit: 15,
  total: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPrevPage: false,
  
  // UI state
  loading: false,
  loadingMore: false,
  error: null,
  
  // Search and filters
  searchQuery: "",
  filters: {},
  
  // Special counts
  totalAgentCount: null,
  isLoadingTotalAgentCount: false,

  // Enhanced fetchAgents with infinite scroll support
  fetchAgents: async (options = {}) => {
    const {
      page = 1,
      limit = 15,
      search = '',
      filters = {},
      append = false,
      force = false
    } = options;
    
    const state = get();
    
    // Check if we should skip this request
    if (!force && !append && state.allAgents.length > 0 && !state.loading) {
      return;
    }

    // Set loading state
    if (append) {
      set({ loadingMore: true, error: null });
    } else {
      set({ loading: true, error: null });
    }

    try {
      const response = await APIService.getPaginatedList<Agent>('/agent', {
        page,
        limit,
        search,
        filters
      });

      const pageKey = `${page}_${limit}_${JSON.stringify({ search, ...filters })}`;
      
      set((state) => {
        const newPaginatedPages = new Map(state.paginatedPages);
        newPaginatedPages.set(pageKey, response.data);
        
        let newAllAgents: Agent[];
        if (append) {
          // For infinite scroll, append new data
          const existingIds = new Set(state.allAgents.map(a => a.id));
          const newAgents = response.data.filter(a => !existingIds.has(a.id));
          newAllAgents = [...state.allAgents, ...newAgents];
        } else {
          // For new search/filter, replace data
          newAllAgents = response.data;
        }
        
        return {
          ...state,
          allAgents: newAllAgents,
          agents: newAllAgents, // Update legacy agents array
          paginatedPages: newPaginatedPages,
          currentPage: response.page,
          limit: response.limit,
          total: response.total,
          totalPages: response.totalPages,
          totalAgents: response.total, // Legacy support
          hasNextPage: response.hasNextPage,
          hasPrevPage: response.hasPrevPage,
          searchQuery: search,
          filters,
          loading: false,
          loadingMore: false
        };
      });
    } catch (error: any) {
      set({ 
        error: error.message, 
        loading: false, 
        loadingMore: false 
      });
    }
  },

  // Infinite scroll methods
  fetchNextPage: async () => {
    const state = get();
    if (!state.hasNextPage || state.loadingMore) {
      return;
    }
    
    await state.fetchAgents({
      page: state.currentPage + 1,
      limit: state.limit,
      search: state.searchQuery,
      filters: state.filters,
      append: true
    });
  },

  resetPagination: () => {
    set({
      allAgents: [],
      agents: [],
      paginatedPages: new Map(),
      currentPage: 1,
      total: 0,
      totalAgents: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPrevPage: false
    });
  },

  setSearchQuery: (query: string) => {
    const state = get();
    if (state.searchQuery !== query) {
      state.resetPagination();
      state.fetchAgents({
        page: 1,
        search: query,
        filters: state.filters
      });
    }
  },

  setFilters: (filters: Record<string, any>) => {
    const state = get();
    state.resetPagination();
    state.fetchAgents({
      page: 1,
      search: state.searchQuery,
      filters
    });
  },

  // Legacy fetch all agents for dropdowns/forms (no pagination)
  fetchAllAgents: async () => {
    set({ loading: true, error: null });
    try {
      const allAgents = await getAllAgentsUnpaginated();
      set({ 
        agents: allAgents, 
        allAgents: allAgents,
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
      // Make API call first
      await createAgent(agent);
      
      // Clear cache after successful API call
      APIService.clearPaginatedCache('/agent');
      APIService.clearCache('/agent');
      APIService.clearCache('/dashboard/data');
      
      // Refresh the list
      const state = get();
      state.resetPagination();
      await state.fetchAgents({ force: true });
    } catch (error: any) {
      set({ error: error.message || "Failed to create agent" });
      throw error; // Rethrow to allow form to handle it
    }
  },
  
  editAgent: async (id: string, updatedAgent: Agent) => {
    try {
      // Use originalId if available (for agents fetched from the list), otherwise use the provided id
      const actualId = (updatedAgent as any).originalId || id;
      await updateAgent(actualId, updatedAgent);
      
      // Update local state optimistically
      set((state) => ({
        allAgents: state.allAgents.map((agent) =>
          agent.id === id ? { ...agent, ...updatedAgent } : agent
        ),
        agents: state.agents.map((agent) =>
          agent.id === id ? { ...agent, ...updatedAgent } : agent
        )
      }));
      
      // Clear cache after successful API call
      APIService.clearPaginatedCache('/agent');
      APIService.clearCache('/agent');
      APIService.clearCache('/dashboard/data');
    } catch (error: any) {
      set({ error: error.message || "Failed to update agent", loading: false });
      throw error; // Rethrow to allow form to handle it
    }
  },
  
  deleteAgent: async (id: string) => {
    try {
      // Find the agent to get the original ID
      const { agents, allAgents } = get();
      const agent = allAgents.find((a) => a.id === id) || agents.find((a) => a.id === id);
      const actualId = (agent as any)?.originalId || id;

      await deleteAgent(actualId);
      
      // Update local state optimistically
      set((state) => ({
        allAgents: state.allAgents.filter((agent) => agent.id !== id),
        agents: state.agents.filter((agent) => agent.id !== id),
        total: Math.max(0, state.total - 1),
        totalAgents: Math.max(0, state.totalAgents - 1)
      }));
      
      // Clear cache after successful API call
      APIService.clearPaginatedCache('/agent');
      APIService.clearCache('/agent');
      APIService.clearCache('/dashboard/data');
    } catch (error: any) {
      set({ error: error.message || "Failed to delete agent", loading: false });
      throw error; // Rethrow to allow UI to handle it
    }
  },
  // Legacy methods for backward compatibility
  setCurrentPage: (page: number, userRole?: Role) => {
    const state = get();
    set({ currentPage: page, loading: true });
    // Use new fetchAgents method but maintain legacy interface
    state.fetchAgents({ page, search: state.searchQuery });
  },
  
  setItemsPerPage: (newLimit: number, userRole?: Role) => {
    const state = get();
    set({ itemsPerPage: newLimit, currentPage: 1, loading: true });
    state.resetPagination();
    state.fetchAgents({ page: 1, limit: newLimit, search: state.searchQuery });
  },
  
  fetchTotalAgentCount: async () => {
    set({ isLoadingTotalAgentCount: true, error: null });
    try {
      const response = await getTotalAgentCountService();
      set({
        totalAgentCount: response.count,
        isLoadingTotalAgentCount: false,
      });
    } catch (error: any) {
      set({
        error: error.message || "Failed to fetch total agent count",
        isLoadingTotalAgentCount: false,
        totalAgentCount: null,
      });
    }
  },

  // Selectors
  getAllAgents: () => get().allAgents,
  getAgentsLoading: () => get().loading,
  getTotalAgentCount: () => get().totalAgentCount,
  getAgentById: (id: string) => {
    const state = get();
    return state.allAgents.find(agent => agent.id === id) || state.agents.find(agent => agent.id === id);
  },
  
  // Force refresh to bypass cache
  forceRefresh: async () => {
    APIService.clearPaginatedCache('/agent');
    APIService.clearCache('/agent');
    APIService.clearCache('/dashboard/data');
    const state = get();
    state.resetPagination();
    await state.fetchAgents({ force: true });
    await state.fetchTotalAgentCount();
  },
}));
