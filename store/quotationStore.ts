// store/quotationStore.ts
import { create } from "zustand";
import {
  getAllQuotations,
  getQuotationById,
  updateQuotation,
  createQuotation,
} from "@/lib/services/quotations";
import APIService from "@/lib/services/api-service";

interface Quotation {
  id: string;
  name: string;
  quoteNo: string;
  createdAt: string;
  client: {
    id: string;
    name: string;
  } | null;
  ticket: {
    id: string;
    title: string;
    ticketId?: string; // Custom ticket ID like T-BE25Jun0001-CLIENT
  } | null;
  subtotal: number;
  gst: number;
  grandTotal: number;
  pdfUrl: string;
}

interface QuotationState {
  // Infinite scroll data
  allQuotations: Quotation[];
  paginatedPages: Map<string, Quotation[]>;
  
  // Legacy data
  quotations: Quotation[];
  currentQuotation: any | null;
  currentPage: number;
  itemsPerPage: number;
  totalQuotations: number;
  
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

  // Enhanced actions
  fetchQuotations: (options?: {
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
  
  fetchQuotationById: (id: string) => Promise<void>;
  addQuotation: (quotation: Quotation) => void;
  updateQuotationInStore: (
    id: string,
    updatedQuotation: Partial<Quotation>,
  ) => void;
  removeQuotation: (id: string) => void;
  setCurrentQuotation: (quotation: any) => void;
  clearCurrentQuotation: () => void;
  refreshQuotations: () => Promise<void>;
  forceRefresh: () => Promise<void>;

  // Selectors
  getAllQuotations: () => Quotation[];
  getQuotationsLoading: () => boolean;
  getTotalQuotationsCount: () => number;
  getCurrentQuotation: () => any;
  getQuotationById: (id: string) => Quotation | undefined;
}

export const useQuotationStore = create<QuotationState>((set, get) => ({
  // Infinite scroll data
  allQuotations: [],
  paginatedPages: new Map(),
  
  // Legacy data
  quotations: [],
  currentQuotation: null,
  currentPage: 1,
  itemsPerPage: 10,
  totalQuotations: 0,
  
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
  searchQuery: '',
  filters: {},

  fetchQuotations: async (options = {}) => {
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
    if (!force && !append && state.allQuotations.length > 0 && !state.loading) {
      return;
    }

    // Set loading state
    if (append) {
      set({ loadingMore: true, error: null });
    } else {
      set({ loading: true, error: null });
    }

    try {
      const response = await APIService.getPaginatedList<Quotation>('/quotations', {
        page,
        limit,
        search,
        filters
      });

      console.log(response);
      

      const pageKey = `${page}_${limit}_${JSON.stringify({ search, ...filters })}`;
      
      set((state) => {
        const newPaginatedPages = new Map(state.paginatedPages);
        newPaginatedPages.set(pageKey, response.data);
        
        let newAllQuotations: Quotation[];
        if (append) {
          // For infinite scroll, append new data
          const existingIds = new Set(state.allQuotations.map(q => q.id));
          const newQuotations = response.data.filter(q => !existingIds.has(q.id));
          newAllQuotations = [...state.allQuotations, ...newQuotations];
        } else {
          // For new search/filter, replace data
          newAllQuotations = response.data;
        }
        
        return {
          ...state,
          allQuotations: newAllQuotations,
          quotations: newAllQuotations, // Update legacy quotations array
          paginatedPages: newPaginatedPages,
          currentPage: response.page,
          limit: response.limit,
          total: response.total,
          totalPages: response.totalPages,
          totalQuotations: response.total, // Legacy support
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
    
    await state.fetchQuotations({
      page: state.currentPage + 1,
      limit: state.limit,
      search: state.searchQuery,
      filters: state.filters,
      append: true
    });
  },

  resetPagination: () => {
    set({
      allQuotations: [],
      quotations: [],
      paginatedPages: new Map(),
      currentPage: 1,
      total: 0,
      totalQuotations: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPrevPage: false
    });
  },

  setSearchQuery: (query: string) => {
    const state = get();
    if (state.searchQuery !== query) {
      state.resetPagination();
      state.fetchQuotations({
        page: 1,
        search: query,
        filters: state.filters
      });
    }
  },

  setFilters: (filters: Record<string, any>) => {
    const state = get();
    state.resetPagination();
    state.fetchQuotations({
      page: 1,
      search: state.searchQuery,
      filters
    });
  },

  fetchQuotationById: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const quotation = await getQuotationById(id);
      set({ currentQuotation: quotation, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  addQuotation: (quotation: Quotation) => {
    // Clear cache BEFORE updating state to ensure fresh data
    APIService.clearPaginatedCache('/quotations');
    APIService.clearCache('/quotations');
    APIService.clearCache('/dashboard/data');
    APIService.clearCache('/ticket'); // Clear ticket cache as quotations affect tickets
    
    // Optimistically update local state
    set((state) => ({
      allQuotations: [quotation, ...state.allQuotations],
      quotations: [quotation, ...state.quotations],
      total: state.total + 1,
      totalQuotations: state.totalQuotations + 1,
    }));
    
    // Use the centralized store sync service for consistency
    setTimeout(async () => {
      try {
        await get().forceRefresh();
        
        // Use centralized sync service
        const { syncAfterQuotationCreate } = await import('../lib/services/store-sync');
        await syncAfterQuotationCreate();
      } catch (error) {
        console.warn('Error during quotation store sync:', error);
      }
    }, 100);
  },

  updateQuotationInStore: (
    id: string,
    updatedQuotation: Partial<Quotation>,
  ) => {
    // Optimistically update local state
    set((state) => ({
      allQuotations: state.allQuotations.map((quotation) =>
        quotation.id === id ? { ...quotation, ...updatedQuotation } : quotation
      ),
      quotations: state.quotations.map((quotation) =>
        quotation.id === id ? { ...quotation, ...updatedQuotation } : quotation
      ),
      currentQuotation:
        state.currentQuotation?.id === id
          ? { ...state.currentQuotation, ...updatedQuotation }
          : state.currentQuotation,
    }));
    // Clear cache after optimistic update
    APIService.clearPaginatedCache('/quotations');
    APIService.clearCache('/quotations');
    APIService.clearCache('/dashboard/data');
  },

  removeQuotation: (id: string) => {
    // Optimistically update local state
    set((state) => ({
      allQuotations: state.allQuotations.filter((quotation) => quotation.id !== id),
      quotations: state.quotations.filter((quotation) => quotation.id !== id),
      total: Math.max(0, state.total - 1),
      totalQuotations: Math.max(0, state.totalQuotations - 1),
      currentQuotation:
        state.currentQuotation?.id === id ? null : state.currentQuotation,
    }));
    // Clear cache after optimistic update
    APIService.clearPaginatedCache('/quotations');
    APIService.clearCache('/quotations');
    APIService.clearCache('/dashboard/data');
  },

  setCurrentQuotation: (quotation: any) => {
    set({ currentQuotation: quotation });
  },

  clearCurrentQuotation: () => {
    set({ currentQuotation: null });
  },

  refreshQuotations: async () => {
    const state = get();
    await state.fetchQuotations({
      page: state.currentPage,
      limit: state.limit,
      search: state.searchQuery,
      filters: state.filters
    });
  },

  // Selectors
  getAllQuotations: () => get().allQuotations,
  getQuotationsLoading: () => get().loading,
  getTotalQuotationsCount: () => get().total,
  getCurrentQuotation: () => get().currentQuotation,
  getQuotationById: (id: string) => {
    const state = get();
    return state.allQuotations.find(quotation => quotation.id === id) || 
           state.quotations.find(quotation => quotation.id === id);
  },
  
  // Force refresh to bypass cache
  forceRefresh: async () => {
    APIService.clearPaginatedCache('/quotations');
    APIService.clearCache('/quotations');
    APIService.clearCache('/dashboard/data');
    const state = get();
    state.resetPagination();
    await state.fetchQuotations({ force: true });
  },
}));
