import { create } from "zustand";
import APIService from "@/lib/services/api-service";

// Define PerformanceData interface
interface PerformanceData {
  region: string;
  agent: string;
  score: string;
  rating: string;
  jobs: number;
  incentivePerJob: number;
  bonus: number;
  totalIncentive: number;
  jcrPending: Array<{ ticketId: string; title?: string; Quotation?: any[]; expenses?: any[] }>;
  poPending: Array<{ ticketId: string; title?: string; Quotation?: any[]; expenses?: any[] }>;
  billingReadyNotSubmitted: Array<{ ticketId: string; title?: string; Quotation?: any[]; expenses?: any[]; status?: string }>;
  pendingClientAction: Array<{ ticketId: string; title?: string; feedback?: string }>;
  expectedExpenses: number;
  adminNotifications: Array<any>; // Simplified for brevity, use specific type if needed
}

interface AgentPerformanceCache {
  data: PerformanceData;
  timestamp: number;
}

interface PerformanceState {
  // Cache storage for different agents
  performanceCache: Record<string, AgentPerformanceCache>;
  
  // Current loading states
  loadingStates: Record<string, boolean>;
  
  // Current errors
  errors: Record<string, string | null>;
  
  // Actions
  getAgentPerformance: (agentId: string, options?: { forceRefresh?: boolean }) => Promise<PerformanceData>;
  clearPerformanceCache: (agentId?: string) => void;
  clearError: (agentId: string) => void;
  
  // Cache management
  shouldRefresh: (agentId: string) => boolean;
  forceRefresh: (agentId: string) => Promise<PerformanceData>;
}

const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes - Performance cache duration

export const usePerformanceStore = create<PerformanceState>((set, get) => ({
  performanceCache: {},
  loadingStates: {},
  errors: {},

  getAgentPerformance: async (agentId: string, options: { forceRefresh?: boolean } = {}) => {
    const state = get();
    const { forceRefresh = false } = options;
    
    // Check if we need to refresh based on cache
    if (!forceRefresh && !state.shouldRefresh(agentId) && state.performanceCache[agentId]) {
      return state.performanceCache[agentId].data; // Use cached data
    }

    // Set loading state
    set((state) => ({
      loadingStates: { ...state.loadingStates, [agentId]: true },
      errors: { ...state.errors, [agentId]: null }
    }));

    try {
      const data = await APIService.getAgentPerformance(agentId, { forceRefresh }) as PerformanceData;

      // Update cache and clear loading/error states
      set((state) => ({
        performanceCache: {
          ...state.performanceCache,
          [agentId]: {
            data,
            timestamp: Date.now()
          }
        },
        loadingStates: { ...state.loadingStates, [agentId]: false },
        errors: { ...state.errors, [agentId]: null }
      }));

      return data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || "Failed to fetch agent performance";
      
      // Set error state and clear loading
      set((state) => ({
        loadingStates: { ...state.loadingStates, [agentId]: false },
        errors: { ...state.errors, [agentId]: errorMessage }
      }));

      throw error;
    }
  },

  clearPerformanceCache: (agentId?: string) => {
    set((state) => {
      if (agentId) {
        // Clear specific agent's cache
        const newCache = { ...state.performanceCache };
        delete newCache[agentId];
        return { performanceCache: newCache };
      } else {
        // Clear all cache
        return { performanceCache: {} };
      }
    });
  },

  clearError: (agentId: string) => {
    set((state) => ({
      errors: { ...state.errors, [agentId]: null }
    }));
  },

  shouldRefresh: (agentId: string) => {
    const state = get();
    const cachedData = state.performanceCache[agentId];
    
    if (!cachedData) return true;
    return Date.now() - cachedData.timestamp > CACHE_DURATION;
  },

  forceRefresh: async (agentId: string) => {
    // Clear cache for this agent to force refresh
    get().clearPerformanceCache(agentId);
    return await get().getAgentPerformance(agentId, { forceRefresh: true });
  },
}));

// Convenience hooks for accessing specific agent data
export const useAgentPerformance = (agentId: string | null) => {
  const store = usePerformanceStore();
  
  if (!agentId) {
    return {
      data: null,
      isLoading: false,
      error: null,
      refresh: () => Promise.resolve(null),
      clearError: () => {}
    };
  }

  return {
    data: store.performanceCache[agentId]?.data || null,
    isLoading: store.loadingStates[agentId] || false,
    error: store.errors[agentId] || null,
    refresh: () => store.getAgentPerformance(agentId, { forceRefresh: true }),
    clearError: () => store.clearError(agentId)
  };
};
