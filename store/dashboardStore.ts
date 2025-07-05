import { create } from "zustand";
import axios from "@/lib/axios";
import APIService from "@/lib/services/api-service";

interface DashboardData {
  tickets: any[];
  clients: any[];
  agents: any[];
  quotations: any[];
  counts: {
    openTicketsCount: number;
    scheduledTodayCount: number;
    clientUpdatesNeededCount: number;
    completedThisWeekCount: number;
    totalAgents: number;
    totalClients: number;
  };
}

interface DashboardState {
  data: DashboardData | null;
  loading: boolean;
  error: string | null;
  lastFetchTime: number | null;
  
  // Actions
  fetchDashboardData: () => Promise<void>;
  updateTicketInDashboard: (ticketId: string, updates: any) => void;
  addTicketToDashboard: (ticket: any) => void;
  removeTicketFromDashboard: (ticketId: string) => void;
  clearError: () => void;
  
  // Cache management
  shouldRefresh: () => boolean;
  forceFetch: () => Promise<void>;
  forceRefresh: () => Promise<void>;
}

const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes - Dashboard cache duration

export const useDashboardStore = create<DashboardState>((set, get) => ({
  data: null,
  loading: false,
  error: null,
  lastFetchTime: null,

  fetchDashboardData: async () => {
    const state = get();
    
    // Check if we need to refresh based on cache
    if (!state.shouldRefresh() && state.data) {
      return; // Use cached data
    }

    set({ loading: true, error: null });

    try {
      const response = await axios.get("/dashboard/data", {
        withCredentials: true,
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
          Expires: "0",
        },
      });

      const dashboardData: DashboardData = response.data;

      set({
        data: dashboardData,
        loading: false,
        error: null,
        lastFetchTime: Date.now(),
      });

      // Update individual stores with cached data for backwards compatibility
      const { useTicketStore } = await import("./ticketStore");
      const { useClientStore } = await import("./clientStore");
      const { useAgentStore } = await import("./agentStore");
      const { useQuotationStore } = await import("./quotationStore");

      // Update ticket store
      const ticketStore = useTicketStore.getState();
      if (dashboardData.tickets) {
        // Organize tickets by status
        const statusGroups: Record<string, any[]> = {
          new: [],
          inProgress: [],
          onHold: [],
          completed: [],
          billing_pending: [],
          billing_completed: [],
        };

        dashboardData.tickets.forEach((ticket) => {
          const status = ticket.status as keyof typeof statusGroups;
          if (status in statusGroups) {
            statusGroups[status].push(ticket);
          }
        });

        // Update ticket store state directly
        useTicketStore.setState({
          all_tickets: dashboardData.tickets,
          tickets: statusGroups as any,
          openTicketsCount: dashboardData.counts.openTicketsCount,
          scheduledTodayCount: dashboardData.counts.scheduledTodayCount,
          clientUpdatesNeededCount: dashboardData.counts.clientUpdatesNeededCount,
          completedThisWeekCount: dashboardData.counts.completedThisWeekCount,
          isLoadingDashboardCounts: false,
          loading: false,
          error: null,
        });
      }

      // Update client store
      if (dashboardData.clients && dashboardData.clients.length > 0) {
        useClientStore.setState({
          allClients: dashboardData.clients,
          loading: false,
          error: null,
        });
      }

      // Update agent store
      if (dashboardData.agents && dashboardData.agents.length > 0) {
        useAgentStore.setState({
          allAgents: dashboardData.agents,
          agents: dashboardData.agents,
          totalAgentCount: dashboardData.counts.totalAgents,
          loading: false,
          error: null,
        });
      }

      // Update quotation store
      if (dashboardData.quotations && dashboardData.quotations.length > 0) {
        useQuotationStore.setState({
          quotations: dashboardData.quotations.slice(0, 10), // Limit for list view
          totalQuotations: dashboardData.quotations.length,
          loading: false,
          error: null,
        });
      }

    } catch (error: any) {
      console.error("Dashboard data fetch error:", error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to fetch dashboard data";
      
      set({
        error: errorMessage,
        loading: false,
      });
    }
  },

  updateTicketInDashboard: (ticketId: string, updates: any) => {
    set((state) => {
      if (!state.data) return state;

      const updatedTickets = state.data.tickets.map((ticket) =>
        ticket.id === ticketId ? { ...ticket, ...updates } : ticket
      );

      return {
        ...state,
        data: {
          ...state.data,
          tickets: updatedTickets,
        },
      };
    });
  },

  addTicketToDashboard: (ticket: any) => {
    set((state) => {
      if (!state.data) return state;

      return {
        ...state,
        data: {
          ...state.data,
          tickets: [ticket, ...state.data.tickets],
        },
      };
    });
  },

  removeTicketFromDashboard: (ticketId: string) => {
    set((state) => {
      if (!state.data) return state;

      const updatedTickets = state.data.tickets.filter((ticket) => ticket.id !== ticketId);

      return {
        ...state,
        data: {
          ...state.data,
          tickets: updatedTickets,
        },
      };
    });
  },

  clearError: () => {
    set({ error: null });
  },

  shouldRefresh: () => {
    const state = get();
    if (!state.lastFetchTime) return true;
    return Date.now() - state.lastFetchTime > CACHE_DURATION;
  },

  forceFetch: async () => {
    set({ lastFetchTime: null }); // Force refresh by clearing cache
    await get().fetchDashboardData();
  },
  
  // Force refresh to bypass cache
  forceRefresh: async () => {
    APIService.clearCache('/dashboard/data');
    set({ lastFetchTime: null }); // Clear local cache timestamp
    await get().fetchDashboardData();
  },
}));
