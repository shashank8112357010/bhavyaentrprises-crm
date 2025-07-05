// store/clientStore.ts
import { create } from "zustand";
import { getAllClients } from "@/lib/services/client";
import APIService from "@/lib/services/api-service";

interface Client {
  id: string;
  displayId?: string; // Add displayId field
  name: string;
  type: string;
  totalBranches: number;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  contractStatus: string;
  lastServiceDate: string;
  avatar: string;
  initials: string;
  activeTickets?: number;
  gstn?: string;
  tickets: any[];
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface ClientState {
  // Infinite scroll data
  allClients: Client[];
  paginatedPages: Map<string, Client[]>; // Key: "page_limit_filters"
  
  // Pagination state
  currentPage: number;
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
  
  // Actions
  fetchClients: (options?: {
    page?: number;
    limit?: number;
    search?: string;
    filters?: Record<string, any>;
    append?: boolean; // For infinite scroll
    force?: boolean;
  }) => Promise<void>;
  
  fetchNextPage: () => Promise<void>;
  resetPagination: () => void;
  setSearchQuery: (query: string) => void;
  setFilters: (filters: Record<string, any>) => void;
  
  addClient: (client: Client) => void;
  updateClient: (id: string, updatedClient: Partial<Client>) => void;
  removeClient: (id: string) => void;
  getClientById: (id: string) => Client | undefined;
  forceRefresh: () => Promise<void>;

  // Legacy methods for backwards compatibility
  getAllClients: () => Client[];
  getClientsLoading: () => boolean;
  getTotalClientsCount: () => number;
  getActiveClientsCount: () => number;
}

export const useClientStore = create<ClientState>((set, get) => ({
  // Infinite scroll data
  allClients: [],
  paginatedPages: new Map(),
  
  // Pagination state
  currentPage: 1,
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
  searchQuery: '',
  filters: {},

  fetchClients: async (options = {}) => {
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
    if (!force && !append && state.allClients.length > 0 && !state.loading) {
      return;
    }

    // Set loading state
    if (append) {
      set({ loadingMore: true, error: null });
    } else {
      set({ loading: true, error: null });
    }

    try {
      const response = await APIService.getPaginatedList<Client>('/client', {
        page,
        limit,
        search,
        filters
      });

      const pageKey = `${page}_${limit}_${JSON.stringify({ search, ...filters })}`;
      
      set((state) => {
        const newPaginatedPages = new Map(state.paginatedPages);
        newPaginatedPages.set(pageKey, response.data);
        
        let newAllClients: Client[];
        if (append) {
          // For infinite scroll, append new data
          const existingIds = new Set(state.allClients.map(c => c.id));
          const newClients = response.data.filter(c => !existingIds.has(c.id));
          newAllClients = [...state.allClients, ...newClients];
        } else {
          // For new search/filter, replace data
          newAllClients = response.data;
        }
        
        return {
          ...state,
          allClients: newAllClients,
          paginatedPages: newPaginatedPages,
          currentPage: response.page,
          limit: response.limit,
          total: response.total,
          totalPages: response.totalPages,
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
    
    await state.fetchClients({
      page: state.currentPage + 1,
      limit: state.limit,
      search: state.searchQuery,
      filters: state.filters,
      append: true
    });
  },

  resetPagination: () => {
    set({
      allClients: [],
      paginatedPages: new Map(),
      currentPage: 1,
      total: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPrevPage: false
    });
  },

  setSearchQuery: (query: string) => {
    const state = get();
    if (state.searchQuery !== query) {
      state.resetPagination();
      state.fetchClients({
        page: 1,
        search: query,
        filters: state.filters
      });
    }
  },

  setFilters: (filters: Record<string, any>) => {
    const state = get();
    state.resetPagination();
    state.fetchClients({
      page: 1,
      search: state.searchQuery,
      filters
    });
  },

  addClient: (client: Client) => {
    // Optimistically update local state
    set((state) => ({
      allClients: [client, ...state.allClients],
      total: state.total + 1
    }));
    // Clear cache after optimistic update
    APIService.clearPaginatedCache('/client');
    APIService.clearCache('/client');
    APIService.clearCache('/dashboard/data');
  },

  updateClient: (id: string, updatedClient: Partial<Client>) => {
    // Optimistically update local state
    set((state) => ({
      allClients: state.allClients.map((client) =>
        client.id === id ? { ...client, ...updatedClient } : client
      )
    }));
    // Clear cache after optimistic update
    APIService.clearPaginatedCache('/client');
    APIService.clearCache('/client');
    APIService.clearCache('/dashboard/data');
  },

  removeClient: (id: string) => {
    // Optimistically update local state
    set((state) => ({
      allClients: state.allClients.filter((client) => client.id !== id),
      total: Math.max(0, state.total - 1)
    }));
    // Clear cache after optimistic update
    APIService.clearPaginatedCache('/client');
    APIService.clearCache('/client');
    APIService.clearCache('/dashboard/data');
  },

  getClientById: (id: string) => {
    const state = get();
    return state.allClients.find((client) => client.id === id);
  },

  // Legacy methods for backwards compatibility
  getAllClients: () => get().allClients,
  getClientsLoading: () => get().loading,
  getTotalClientsCount: () => get().total,
  getActiveClientsCount: () => get().allClients.filter(client => client.contractStatus?.toLowerCase() === "active").length,
  
  // Force refresh to bypass cache
  forceRefresh: async () => {
    APIService.clearPaginatedCache('/client');
    APIService.clearCache('/client');
    APIService.clearCache('/dashboard/data');
    const state = get();
    state.resetPagination();
    await state.fetchClients({ force: true });
  },
}));
