"use client";

import { useEffect, useState } from 'react';
import { useDashboardStore } from '@/store/dashboardStore';
import { useClientStore } from '@/store/clientStore';
import { useAgentStore } from '@/store/agentStore';
import { useQuotationStore } from '@/store/quotationStore';
import { useTicketStore } from '@/store/ticketStore';

interface StoreHydratorProps {
  children: React.ReactNode;
}

/**
 * Client-side store hydration component
 * Initializes Zustand stores with server-side prefetched data
 */
export function StoreHydrator({ children }: StoreHydratorProps) {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    try {
      // Check if preloaded data exists in the global scope
      const preloadedData = window.__PRELOADED_DATA__;
      
      if (!preloadedData) {
        setIsHydrated(true);
        return;
      }

      // Hydrate dashboard store
      if (preloadedData.dashboard) {
        const dashboardStore = useDashboardStore.getState();
        
        // Organize dashboard data similar to the fetchDashboardData method
        const dashboardData = preloadedData.dashboard;
        
        useDashboardStore.setState({
          data: {
            tickets: dashboardData.tickets || [],
            clients: dashboardData.clients || [],
            agents: dashboardData.agents || [],
            quotations: dashboardData.quotations || [],
            counts: dashboardData.counts || {
              openTicketsCount: 0,
              scheduledTodayCount: 0,
              clientUpdatesNeededCount: 0,
              completedThisWeekCount: 0,
              totalAgents: 0,
              totalClients: 0
            }
          },
          loading: false,
          error: null,
          lastFetchTime: Date.now()
        });

        // Hydrate related stores with dashboard data
        if (dashboardData.tickets) {
          // Organize tickets by status for ticket store
          const statusGroups: Record<string, any[]> = {
            new: [],
            inProgress: [],
            onHold: [],
            completed: [],
            billing_pending: [],
            billing_completed: [],
          };

          dashboardData.tickets.forEach((ticket: any) => {
            const status = ticket.status as keyof typeof statusGroups;
            if (status in statusGroups) {
              statusGroups[status].push(ticket);
            }
          });

          useTicketStore.setState({
            all_tickets: dashboardData.tickets,
            tickets: statusGroups as any,
            openTicketsCount: dashboardData.counts?.openTicketsCount || 0,
            scheduledTodayCount: dashboardData.counts?.scheduledTodayCount || 0,
            clientUpdatesNeededCount: dashboardData.counts?.clientUpdatesNeededCount || 0,
            completedThisWeekCount: dashboardData.counts?.completedThisWeekCount || 0,
            isLoadingDashboardCounts: false,
            loading: false,
            error: null,
          });
        }

        // Hydrate quotation store with dashboard quotations
        if (dashboardData.quotations) {
          useQuotationStore.setState({
            quotations: dashboardData.quotations.slice(0, 10), // Limit for list view
            totalQuotations: dashboardData.quotations.length,
            loading: false,
            error: null,
          });
        }
      }

      // Hydrate client store
      if (preloadedData.clients) {
        const clientData = preloadedData.clients;
        const clients = Array.isArray(clientData) ? clientData : (clientData as any).data || (clientData as any).clients || clientData;
        
        if (Array.isArray(clients) && clients.length > 0) {
          const total = Array.isArray(clientData) ? clients.length : (clientData as any).total || clients.length;
          const limit = Array.isArray(clientData) ? 20 : (clientData as any).limit || 20;
          
          useClientStore.setState({
            allClients: clients,
            total: total,
            currentPage: Array.isArray(clientData) ? 1 : (clientData as any).page || 1,
            limit: limit,
            totalPages: Array.isArray(clientData) ? Math.ceil(total / limit) : (clientData as any).totalPages || Math.ceil(total / limit),
            hasNextPage: Array.isArray(clientData) ? false : (clientData as any).hasNextPage || false,
            hasPrevPage: Array.isArray(clientData) ? false : (clientData as any).hasPrevPage || false,
            loading: false,
            error: null,
          });
        }
      }

      // Hydrate agent store
      if (preloadedData.agents) {
        const agentData = preloadedData.agents;
        const agents = Array.isArray(agentData) ? agentData : (agentData as any).data || (agentData as any).agents || agentData;
        
        if (Array.isArray(agents) && agents.length > 0) {
          const total = Array.isArray(agentData) ? agents.length : (agentData as any).total || agents.length;
          const limit = Array.isArray(agentData) ? 20 : (agentData as any).limit || 20;
          
          useAgentStore.setState({
            allAgents: agents,
            agents: agents, // Legacy support
            totalAgentCount: total,
            total: total,
            totalAgents: total, // Legacy support
            currentPage: Array.isArray(agentData) ? 1 : (agentData as any).page || 1,
            limit: limit,
            totalPages: Array.isArray(agentData) ? Math.ceil(total / limit) : (agentData as any).totalPages || Math.ceil(total / limit),
            hasNextPage: Array.isArray(agentData) ? false : (agentData as any).hasNextPage || false,
            hasPrevPage: Array.isArray(agentData) ? false : (agentData as any).hasPrevPage || false,
            loading: false,
            error: null,
          });
        }
      }

      // Clean up the global data to prevent memory leaks
      delete window.__PRELOADED_DATA__;
      
      console.log('Store hydration completed successfully');
    } catch (error) {
      console.error('Error during store hydration:', error);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // Optionally show a hydration indicator (very brief)
  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <>{children}</>;
}
