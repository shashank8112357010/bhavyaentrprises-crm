// Global store synchronization service
// Ensures data consistency across all Zustand stores

import APIService from './api-service';

interface StoreSyncOptions {
  clearCaches?: boolean;
  syncDashboard?: boolean;
  syncTickets?: boolean;
  syncQuotations?: boolean;
  syncClients?: boolean;
  syncAgents?: boolean;
  syncExpenses?: boolean;
  delay?: number;
}

export class StoreSyncService {
  private static instance: StoreSyncService;
  private syncing = false;

  private constructor() {}

  static getInstance(): StoreSyncService {
    if (!StoreSyncService.instance) {
      StoreSyncService.instance = new StoreSyncService();
    }
    return StoreSyncService.instance;
  }

  /**
   * Synchronize all stores after a data mutation
   * @param changedEntity - The entity that was changed (ticket, quotation, client, etc.)
   * @param options - Sync options
   */
  async syncStores(
    changedEntity: 'ticket' | 'quotation' | 'client' | 'agent' | 'expense',
    options: StoreSyncOptions = {}
  ): Promise<void> {
    if (this.syncing) {
      console.log('[STORE_SYNC] Already syncing, skipping...');
      return;
    }

    this.syncing = true;
    const {
      clearCaches = true,
      syncDashboard = true,
      syncTickets = true,
      syncQuotations = true,
      syncClients = true,
      syncAgents = true,
      syncExpenses = true,
      delay = 100
    } = options;

    try {
      console.log(`[STORE_SYNC] Starting sync for ${changedEntity}...`);

      // Step 1: Clear relevant caches
      if (clearCaches) {
        await this.clearRelatedCaches(changedEntity);
      }

      // Step 2: Sync stores with delay to avoid race conditions
      await new Promise(resolve => setTimeout(resolve, delay));

      const syncPromises: Promise<void>[] = [];

      // Always sync dashboard first for overview data
      if (syncDashboard) {
        syncPromises.push(this.syncDashboardStore());
      }

      // Sync specific stores based on the changed entity and relationships
      switch (changedEntity) {
        case 'ticket':
          if (syncTickets) syncPromises.push(this.syncTicketStore());
          if (syncQuotations) syncPromises.push(this.syncQuotationStore());
          if (syncExpenses) syncPromises.push(this.syncExpenseStore());
          break;

        case 'quotation':
          if (syncQuotations) syncPromises.push(this.syncQuotationStore());
          if (syncTickets) syncPromises.push(this.syncTicketStore());
          break;

        case 'client':
          if (syncClients) syncPromises.push(this.syncClientStore());
          if (syncTickets) syncPromises.push(this.syncTicketStore());
          if (syncQuotations) syncPromises.push(this.syncQuotationStore());
          break;

        case 'agent':
          if (syncAgents) syncPromises.push(this.syncAgentStore());
          if (syncTickets) syncPromises.push(this.syncTicketStore());
          break;

        case 'expense':
          if (syncExpenses) syncPromises.push(this.syncExpenseStore());
          if (syncTickets) syncPromises.push(this.syncTicketStore());
          break;
      }

      // Execute all sync operations
      await Promise.allSettled(syncPromises);

      console.log(`[STORE_SYNC] Completed sync for ${changedEntity}`);
    } catch (error) {
      console.error(`[STORE_SYNC] Error syncing stores for ${changedEntity}:`, error);
    } finally {
      this.syncing = false;
    }
  }

  /**
   * Clear caches related to the changed entity
   */
  private async clearRelatedCaches(changedEntity: string): Promise<void> {
    const cachePatterns = {
      ticket: ['/ticket', '/quotations', '/dashboard/data', '/ticket/counts'],
      quotation: ['/quotations', '/ticket', '/dashboard/data'],
      client: ['/client', '/ticket', '/quotations', '/dashboard/data'],
      agent: ['/agent', '/ticket', '/dashboard/data'],
      expense: ['/expense', '/ticket', '/dashboard/data']
    };

    const patterns = cachePatterns[changedEntity as keyof typeof cachePatterns] || [];
    
    patterns.forEach(pattern => {
      APIService.clearCache(pattern);
      APIService.clearPaginatedCache(pattern);
    });
  }

  /**
   * Sync individual stores
   */
  private async syncDashboardStore(): Promise<void> {
    try {
      const { useDashboardStore } = await import('@/store/dashboardStore');
      await useDashboardStore.getState().forceRefresh();
    } catch (error) {
      console.warn('[STORE_SYNC] Error syncing dashboard store:', error);
    }
  }

  private async syncTicketStore(): Promise<void> {
    try {
      const { useTicketStore } = await import('@/store/ticketStore');
      await useTicketStore.getState().forceRefresh();
    } catch (error) {
      console.warn('[STORE_SYNC] Error syncing ticket store:', error);
    }
  }

  private async syncQuotationStore(): Promise<void> {
    try {
      const { useQuotationStore } = await import('@/store/quotationStore');
      await useQuotationStore.getState().forceRefresh();
    } catch (error) {
      console.warn('[STORE_SYNC] Error syncing quotation store:', error);
    }
  }

  private async syncClientStore(): Promise<void> {
    try {
      const { useClientStore } = await import('@/store/clientStore');
      await useClientStore.getState().forceRefresh();
    } catch (error) {
      console.warn('[STORE_SYNC] Error syncing client store:', error);
    }
  }

  private async syncAgentStore(): Promise<void> {
    try {
      const { useAgentStore } = await import('@/store/agentStore');
      await useAgentStore.getState().forceRefresh();
    } catch (error) {
      console.warn('[STORE_SYNC] Error syncing agent store:', error);
    }
  }

  private async syncExpenseStore(): Promise<void> {
    try {
      const { useExpenseStore } = await import('@/store/expenseStore');
      await useExpenseStore.getState().forceRefresh();
    } catch (error) {
      console.warn('[STORE_SYNC] Error syncing expense store:', error);
    }
  }

  /**
   * Force sync all stores (use sparingly)
   */
  async syncAllStores(options: Omit<StoreSyncOptions, 'syncTickets' | 'syncQuotations' | 'syncClients' | 'syncAgents' | 'syncExpenses'> = {}): Promise<void> {
    await this.syncStores('ticket', {
      ...options,
      syncTickets: true,
      syncQuotations: true,
      syncClients: true,
      syncAgents: true,
      syncExpenses: true,
      syncDashboard: true
    });
  }

  /**
   * Quick sync for specific scenarios
   */
  async quickSync(entity: 'ticket' | 'quotation' | 'client' | 'agent' | 'expense'): Promise<void> {
    await this.syncStores(entity, {
      delay: 50,
      clearCaches: true,
      syncDashboard: true
    });
  }
}

// Export singleton instance
export const storeSync = StoreSyncService.getInstance();

// Export convenience functions
export const syncAfterTicketCreate = () => storeSync.quickSync('ticket');
export const syncAfterQuotationCreate = () => storeSync.quickSync('quotation');
export const syncAfterClientCreate = () => storeSync.quickSync('client');
export const syncAfterAgentCreate = () => storeSync.quickSync('agent');
export const syncAfterExpenseCreate = () => storeSync.quickSync('expense');

export default storeSync;
