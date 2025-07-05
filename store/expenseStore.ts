// store/expenseStore.ts
import { create } from "zustand";
import {
  getAllExpenses,
  getExpenseById,
  createExpense,
} from "@/lib/services/expense";
import APIService from "@/lib/services/api-service";

interface Expense {
  id: string;
  customId: string;
  displayId: string;
  amount: number;
  description: string;
  category: "LABOR" | "TRANSPORT" | "MATERIAL" | "OTHER";
  requester: string;
  paymentType: "VCASH" | "REST" | "ONLINE";
  quotationId?: string;
  ticketId?: string;
  createdAt: string;
  pdfUrl: string | null;
  screenshotUrl?: string | null;
  approvalName?: string | null;
}

interface ExpenseState {
  // Infinite scroll data
  allExpenses: Expense[];
  paginatedPages: Map<string, Expense[]>;
  
  // Legacy data
  expenses: Expense[];
  currentExpense: any | null;
  currentPage: number;
  itemsPerPage: number;
  totalExpenses: number;
  
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
  fetchExpenses: (options?: {
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
  
  fetchExpenseById: (id: string) => Promise<void>;
  addExpense: (expense: Expense) => void;
  updateExpenseInStore: (
    id: string,
    updatedExpense: Partial<Expense>,
  ) => void;
  removeExpense: (id: string) => void;
  setCurrentExpense: (expense: any) => void;
  clearCurrentExpense: () => void;
  refreshExpenses: () => Promise<void>;
  forceRefresh: () => Promise<void>;

  // Selectors
  getAllExpenses: () => Expense[];
  getExpensesLoading: () => boolean;
  getTotalExpensesCount: () => number;
  getCurrentExpense: () => any;
  getExpenseById: (id: string) => Expense | undefined;
}

export const useExpenseStore = create<ExpenseState>((set, get) => ({
  // Infinite scroll data
  allExpenses: [],
  paginatedPages: new Map(),
  
  // Legacy data
  expenses: [],
  currentExpense: null,
  currentPage: 1,
  itemsPerPage: 10,
  totalExpenses: 0,
  
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

  fetchExpenses: async (options = {}) => {
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
    if (!force && !append && state.allExpenses.length > 0 && !state.loading) {
      return;
    }

    // Set loading state
    if (append) {
      set({ loadingMore: true, error: null });
    } else {
      set({ loading: true, error: null });
    }

    try {
      const response = await APIService.getPaginatedList<Expense>('/expense', {
        page,
        limit,
        search,
        filters
      });

      const pageKey = `${page}_${limit}_${JSON.stringify({ search, ...filters })}`;
      
      set((state) => {
        const newPaginatedPages = new Map(state.paginatedPages);
        newPaginatedPages.set(pageKey, response.data);
        
        let newAllExpenses: Expense[];
        if (append) {
          // For infinite scroll, append new data
          const existingIds = new Set(state.allExpenses.map(e => e.id));
          const newExpenses = response.data.filter(e => !existingIds.has(e.id));
          newAllExpenses = [...state.allExpenses, ...newExpenses];
        } else {
          // For new search/filter, replace data
          newAllExpenses = response.data;
        }
        
        return {
          ...state,
          allExpenses: newAllExpenses,
          expenses: newAllExpenses, // Update legacy expenses array
          paginatedPages: newPaginatedPages,
          currentPage: response.page,
          limit: response.limit,
          total: response.total,
          totalPages: response.totalPages,
          totalExpenses: response.total, // Legacy support
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
    
    await state.fetchExpenses({
      page: state.currentPage + 1,
      limit: state.limit,
      search: state.searchQuery,
      filters: state.filters,
      append: true
    });
  },

  resetPagination: () => {
    set({
      allExpenses: [],
      expenses: [],
      paginatedPages: new Map(),
      currentPage: 1,
      total: 0,
      totalExpenses: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPrevPage: false
    });
  },

  setSearchQuery: (query: string) => {
    const state = get();
    if (state.searchQuery !== query) {
      state.resetPagination();
      state.fetchExpenses({
        page: 1,
        search: query,
        filters: state.filters
      });
    }
  },

  setFilters: (filters: Record<string, any>) => {
    const state = get();
    state.resetPagination();
    state.fetchExpenses({
      page: 1,
      search: state.searchQuery,
      filters
    });
  },

  fetchExpenseById: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const expense = await getExpenseById(id);
      set({ currentExpense: expense, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  addExpense: (expense: Expense) => {
    // Optimistically update local state
    set((state) => ({
      allExpenses: [expense, ...state.allExpenses],
      expenses: [expense, ...state.expenses],
      total: state.total + 1,
      totalExpenses: state.totalExpenses + 1,
    }));
    // Clear cache after optimistic update
    APIService.clearPaginatedCache('/expense');
    APIService.clearCache('/expense');
    APIService.clearCache('/dashboard/data');
    APIService.clearCache('/ticket'); // Clear ticket cache as expenses affect tickets
  },

  updateExpenseInStore: (
    id: string,
    updatedExpense: Partial<Expense>,
  ) => {
    // Optimistically update local state
    set((state) => ({
      allExpenses: state.allExpenses.map((expense) =>
        expense.id === id ? { ...expense, ...updatedExpense } : expense
      ),
      expenses: state.expenses.map((expense) =>
        expense.id === id ? { ...expense, ...updatedExpense } : expense
      ),
      currentExpense:
        state.currentExpense?.id === id
          ? { ...state.currentExpense, ...updatedExpense }
          : state.currentExpense,
    }));
    // Clear cache after optimistic update
    APIService.clearPaginatedCache('/expense');
    APIService.clearCache('/expense');
    APIService.clearCache('/dashboard/data');
    APIService.clearCache('/ticket'); // Clear ticket cache as expenses affect tickets
  },

  removeExpense: (id: string) => {
    // Optimistically update local state
    set((state) => ({
      allExpenses: state.allExpenses.filter((expense) => expense.id !== id),
      expenses: state.expenses.filter((expense) => expense.id !== id),
      total: Math.max(0, state.total - 1),
      totalExpenses: Math.max(0, state.totalExpenses - 1),
      currentExpense:
        state.currentExpense?.id === id ? null : state.currentExpense,
    }));
    // Clear cache after optimistic update
    APIService.clearPaginatedCache('/expense');
    APIService.clearCache('/expense');
    APIService.clearCache('/dashboard/data');
    APIService.clearCache('/ticket'); // Clear ticket cache as expenses affect tickets
  },

  setCurrentExpense: (expense: any) => {
    set({ currentExpense: expense });
  },

  clearCurrentExpense: () => {
    set({ currentExpense: null });
  },

  refreshExpenses: async () => {
    const state = get();
    await state.fetchExpenses({
      page: state.currentPage,
      limit: state.limit,
      search: state.searchQuery,
      filters: state.filters
    });
  },

  // Selectors
  getAllExpenses: () => get().allExpenses,
  getExpensesLoading: () => get().loading,
  getTotalExpensesCount: () => get().total,
  getCurrentExpense: () => get().currentExpense,
  getExpenseById: (id: string) => {
    const state = get();
    return state.allExpenses.find(expense => expense.id === id) || 
           state.expenses.find(expense => expense.id === id);
  },
  
  // Force refresh to bypass cache
  forceRefresh: async () => {
    APIService.clearPaginatedCache('/expense');
    APIService.clearCache('/expense');
    APIService.clearCache('/dashboard/data');
    APIService.clearCache('/ticket'); // Clear ticket cache as expenses affect tickets
    const state = get();
    state.resetPagination();
    await state.fetchExpenses({ force: true });
  },
}));
