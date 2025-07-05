import CachedAPIService from './api-cache';
import axios from '@/lib/axios';

// Enhanced API service with standardized patterns
export class APIService {
  // Cache durations in milliseconds
  private static readonly CACHE_DURATIONS = {
    DASHBOARD: 2 * 60 * 1000,      // 2 minutes
    LIST_DATA: 5 * 60 * 1000,      // 5 minutes  
    DETAIL_DATA: 10 * 60 * 1000,   // 10 minutes
    STATIC_DATA: 30 * 60 * 1000,   // 30 minutes
  };

  // Pagination defaults
  private static readonly DEFAULT_PAGE_SIZE = 15;
  private static readonly MAX_PAGE_SIZE = 100;

  /**
   * Generic paginated list fetcher with enhanced caching
   * Key cache by endpoint_page_limit_filters for reusable pages
   */
  static async getPaginatedList<T>(
    endpoint: string,
    options: {
      page?: number;
      limit?: number;
      search?: string;
      filters?: Record<string, any>;
      cache?: boolean;
      cacheTime?: number;
      forceRefresh?: boolean;
    } = {}
  ): Promise<{
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  }> {
    const {
      page = 1,
      limit = this.DEFAULT_PAGE_SIZE,
      search = '',
      filters = {},
      cache = true,
      cacheTime = this.CACHE_DURATIONS.LIST_DATA,
      forceRefresh = false
    } = options;

    // Ensure reasonable page size
    const safeLimit = Math.min(Math.max(limit, 1), this.MAX_PAGE_SIZE);

    // Prepare filters object with search
    const allFilters = {
      search: search || undefined, // Only include if not empty
      ...filters
    };
    
    // Remove undefined values to keep cache keys clean
    Object.keys(allFilters).forEach(key => {
      if ((allFilters as any)[key] === undefined || (allFilters as any)[key] === '') {
        delete (allFilters as any)[key];
      }
    });

    const response = await CachedAPIService.getPaginated<any>(
      endpoint,
      page,
      safeLimit,
      allFilters,
      { cache, cacheTime, forceRefresh }
    );

    const data = response.data || response.clients || response.agents || response.quotations || response;
    const total = response.total || response.totalCount || data.length;
    const totalPages = Math.ceil(total / safeLimit);

    return {
      data,
      total,
      page,
      limit: safeLimit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    };
  }

  /**
   * Dashboard data with optimized caching
   */
  static async getDashboardData(forceRefresh = false) {
    return CachedAPIService.get(
      '/dashboard/data',
      {},
      {
        cache: true,
        cacheTime: this.CACHE_DURATIONS.DASHBOARD,
        forceRefresh
      }
    );
  }

  /**
   * Clients API with pagination and caching
   */
  static async getClients(options: {
    page?: number;
    limit?: number;
    search?: string;
    type?: string;
    forceRefresh?: boolean;
  } = {}) {
    return this.getPaginatedList('/client', {
      ...options,
      filters: options.type && options.type !== 'all' ? { type: options.type } : {},
      cacheTime: this.CACHE_DURATIONS.LIST_DATA
    });
  }

  /**
   * Agents API with pagination and caching
   */
  static async getAgents(options: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    forceRefresh?: boolean;
  } = {}) {
    return this.getPaginatedList('/agent', {
      ...options,
      filters: options.role ? { role: options.role } : {},
      cacheTime: this.CACHE_DURATIONS.LIST_DATA
    });
  }

  /**
   * Tickets API with pagination and caching
   */
  static async getTickets(options: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    assigneeId?: string;
    forceRefresh?: boolean;
  } = {}) {
    const filters: Record<string, any> = {};
    if (options.status && options.status !== 'all') filters.status = options.status;
    if (options.assigneeId) filters.assigneeId = options.assigneeId;

    return this.getPaginatedList('/ticket', {
      ...options,
      filters,
      cacheTime: this.CACHE_DURATIONS.LIST_DATA
    });
  }

  /**
   * Quotations API with pagination and caching
   */
  static async getQuotations(options: {
    page?: number;
    limit?: number;
    search?: string;
    clientId?: string;
    forceRefresh?: boolean;
  } = {}) {
    return this.getPaginatedList('/quotations', {
      ...options,
      filters: options.clientId ? { clientId: options.clientId } : {},
      cacheTime: this.CACHE_DURATIONS.LIST_DATA
    });
  }

  /**
   * Performance data with caching
   */
  static async getAgentPerformance(
    agentId: string,
    options: { forceRefresh?: boolean } = {}
  ) {
    return CachedAPIService.get(
      `/api/performance/agent/${agentId}`,
      {},
      {
        cache: true,
        cacheTime: this.CACHE_DURATIONS.DETAIL_DATA,
        forceRefresh: options.forceRefresh
      }
    );
  }

  /**
   * Create operations (invalidate cache)
   */
  static async createClient(data: any) {
    const result = await CachedAPIService.post('/client', data);
    // Invalidate related caches
    this.invalidateClientCaches();
    return result;
  }

  static async createAgent(data: any) {
    const result = await CachedAPIService.post('/agent', data);
    this.invalidateAgentCaches();
    return result;
  }

  static async createTicket(data: any) {
    const result = await CachedAPIService.post('/ticket/create-ticket', data);
    this.invalidateTicketCaches();
    return result;
  }

  /**
   * Update operations (invalidate cache)
   */
  static async updateClient(id: string, data: any) {
    const result = await CachedAPIService.put(`/client/${id}`, data);
    this.invalidateClientCaches();
    return result;
  }

  static async updateAgent(id: string, data: any) {
    const result = await CachedAPIService.put(`/agent/${id}`, data);
    this.invalidateAgentCaches();
    return result;
  }

  static async updateTicket(id: string, data: any) {
    const result = await CachedAPIService.patch(`/ticket/${id}`, data);
    this.invalidateTicketCaches();
    return result;
  }

  /**
   * Delete operations (invalidate cache)
   */
  static async deleteClient(id: string) {
    const result = await CachedAPIService.delete(`/client/${id}`);
    this.invalidateClientCaches();
    return result;
  }

  static async deleteAgent(id: string) {
    const result = await CachedAPIService.delete(`/agent/${id}`);
    this.invalidateAgentCaches();
    return result;
  }

  static async deleteTicket(id: string) {
    const result = await CachedAPIService.delete(`/ticket/${id}`);
    this.invalidateTicketCaches();
    return result;
  }

  /**
   * Additional CRUD operations for other entities
   */

  // Leads API
  static async createLead(data: any) {
    const result = await CachedAPIService.post('/lead/create-lead', data);
    this.invalidateLeadCaches();
    return result;
  }

  static async getLeads(options: { forceRefresh?: boolean } = {}) {
    return CachedAPIService.get('/lead', {}, {
      cache: true,
      cacheTime: this.CACHE_DURATIONS.LIST_DATA,
      forceRefresh: options.forceRefresh
    });
  }

  static async reassignLead(data: any) {
    const result = await CachedAPIService.patch('/lead/reassign', data);
    this.invalidateLeadCaches();
    return result;
  }

  // Quotations API
  static async createQuotation(data: any) {
    const result = await CachedAPIService.post('/quotations/create-quotations', data);
    this.invalidateQuotationCaches();
    return result;
  }

  static async updateQuotation(id: string, data: any) {
    const result = await CachedAPIService.put(`/quotations/${id}`, data);
    this.invalidateQuotationCaches();
    return result;
  }

  static async getQuotationById(id: string, options: { forceRefresh?: boolean } = {}) {
    return CachedAPIService.get(`/quotations/${id}`, {}, {
      cache: true,
      cacheTime: this.CACHE_DURATIONS.DETAIL_DATA,
      forceRefresh: options.forceRefresh
    });
  }

  // Expenses API
  static async createExpense(formData: FormData) {
    const result = await CachedAPIService.post('/expense/create-expense', formData);
    this.invalidateExpenseCaches();
    return result;
  }

  static async getExpenses(options: {
    page?: number;
    limit?: number;
    search?: string;
    forceRefresh?: boolean;
  } = {}) {
    return this.getPaginatedList('/expense', {
      ...options,
      cacheTime: this.CACHE_DURATIONS.LIST_DATA
    });
  }

  static async getExpenseById(id: string, options: { forceRefresh?: boolean } = {}) {
    return CachedAPIService.get(`/expense/${id}`, {}, {
      cache: true,
      cacheTime: this.CACHE_DURATIONS.DETAIL_DATA,
      forceRefresh: options.forceRefresh
    });
  }

  // Rate Cards API
  static async createRateCard(formData: FormData) {
    const result = await CachedAPIService.post('/rate-cards/create-rate-cards', formData);
    this.invalidateRateCardCaches();
    return result;
  }

  static async createSingleRateCard(data: any) {
    const result = await CachedAPIService.post('/api/rate-cards/create', data);
    this.invalidateRateCardCaches();
    return result;
  }

  static async getRateCards(options: {
    page?: number;
    limit?: number;
    search?: string;
    forceRefresh?: boolean;
  } = {}) {
    return this.getPaginatedList('/rate-cards', {
      ...options,
      cacheTime: this.CACHE_DURATIONS.LIST_DATA
    });
  }

  static async deleteRateCard(id: string) {
    const result = await CachedAPIService.delete(`/api/rate-cards/${id}`);
    this.invalidateRateCardCaches();
    return result;
  }

  // Tickets detailed operations
  static async getTicketById(id: string, options: { forceRefresh?: boolean } = {}) {
    return CachedAPIService.get(`/ticket/${id}`, {}, {
      cache: true,
      cacheTime: this.CACHE_DURATIONS.DETAIL_DATA,
      forceRefresh: options.forceRefresh
    });
  }

  static async getTicketsForSelection(options: { forceRefresh?: boolean } = {}) {
    return CachedAPIService.get('/tickets/selection', {}, {
      cache: true,
      cacheTime: this.CACHE_DURATIONS.LIST_DATA,
      forceRefresh: options.forceRefresh
    });
  }

  static async getAllTickets(filters: any = {}, options: { forceRefresh?: boolean } = {}) {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.role) params.append('role', filters.role);
    if (filters.userId) params.append('userId', filters.userId);

    return CachedAPIService.get(`/ticket?${params.toString()}`, {}, {
      cache: true,
      cacheTime: this.CACHE_DURATIONS.LIST_DATA,
      forceRefresh: options.forceRefresh
    });
  }

  static async updateTicketStatus(id: string, status: string) {
    const result = await CachedAPIService.patch(`/ticket/${id}`, { status });
    this.invalidateTicketCaches();
    return result;
  }

  static async exportTicketsToExcel(filters: any) {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    params.append('startDate', filters.startDate);
    params.append('endDate', filters.endDate);

    // Export operations bypass cache
    return CachedAPIService.get(`/ticket/export?${params.toString()}`, {}, { cache: false });
  }

  // Comments API
  static async getComments(ticketId: string, options: { forceRefresh?: boolean } = {}) {
    return CachedAPIService.get(`/ticket/${ticketId}/comment`, {}, {
      cache: true,
      cacheTime: this.CACHE_DURATIONS.DETAIL_DATA,
      forceRefresh: options.forceRefresh
    });
  }

  static async addComment(ticketId: string, text: string, userId: string) {
    const result = await CachedAPIService.post(`/ticket/${ticketId}/comment`, { text, userId });
    this.invalidateCommentCaches(ticketId);
    return result;
  }

  // Client detailed operations
  static async getClientById(id: string, options: { forceRefresh?: boolean } = {}) {
    return CachedAPIService.get(`/client/${id}`, {}, {
      cache: true,
      cacheTime: this.CACHE_DURATIONS.DETAIL_DATA,
      forceRefresh: options.forceRefresh
    });
  }

  static async importClientsFromExcel(formData: FormData) {
    const result = await CachedAPIService.post('/client/import', formData);
    this.invalidateClientCaches();
    return result;
  }

  // Agent detailed operations
  static async createAgentAccount(data: any) {
    const result = await CachedAPIService.post('/agent/create-agent', data);
    this.invalidateAgentCaches();
    return result;
  }

  static async getAgentById(id: string, options: { forceRefresh?: boolean } = {}) {
    return CachedAPIService.get(`/agent/${id}`, {}, {
      cache: true,
      cacheTime: this.CACHE_DURATIONS.DETAIL_DATA,
      forceRefresh: options.forceRefresh
    });
  }

  static async getAllAgentsUnpaginated(options: { forceRefresh?: boolean } = {}) {
    return CachedAPIService.get('/agent', { all: true }, {
      cache: true,
      cacheTime: this.CACHE_DURATIONS.LIST_DATA,
      forceRefresh: options.forceRefresh
    });
  }

  // Notifications API
  static async getUserNotifications(filters: any = {}, options: { forceRefresh?: boolean } = {}) {
    const params = new URLSearchParams();
    if (filters.isRead !== undefined) params.append('isRead', filters.isRead.toString());
    if (filters.type) params.append('type', filters.type);
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.offset) params.append('offset', filters.offset.toString());

    return CachedAPIService.get(`/notifications?${params.toString()}`, {}, {
      cache: true,
      cacheTime: this.CACHE_DURATIONS.DASHBOARD, // Short cache for notifications
      forceRefresh: options.forceRefresh
    });
  }

  static async getUnreadNotificationCount(options: { forceRefresh?: boolean } = {}) {
    return CachedAPIService.get('/notifications/count', {}, {
      cache: true,
      cacheTime: this.CACHE_DURATIONS.DASHBOARD,
      forceRefresh: options.forceRefresh
    });
  }

  static async markNotificationAsRead(notificationId: string) {
    const result = await CachedAPIService.patch(`/notifications/${notificationId}`, { isRead: true });
    this.invalidateNotificationCaches();
    return result;
  }

  static async markAllNotificationsAsRead() {
    const result = await CachedAPIService.post('/notifications/mark-all-read', {});
    this.invalidateNotificationCaches();
    return result;
  }

  static async deleteNotification(notificationId: string) {
    const result = await CachedAPIService.delete(`/notifications/${notificationId}`);
    this.invalidateNotificationCaches();
    return result;
  }

  static async createNotification(data: any) {
    const result = await CachedAPIService.post('/notifications', data);
    this.invalidateNotificationCaches();
    return result;
  }

  // Auth API (these don't use caching as they're auth operations)
  static async login(data: any) {
    // For login, we need the full axios response, not just the data
    try {
      const response = await axios.post('/login', data, {
        withCredentials: true,
        maxRedirects: 0,
        validateStatus: (status: number) => status < 400 || status === 302
      });
      return response;
    } catch (error: any) {
      throw error;
    }
  }

  static async logout() {
    const response = await CachedAPIService.get('/logout', {});
    return response;
  }

  /**
   * Cache invalidation helpers
   */
  private static invalidateClientCaches() {
    CachedAPIService.clearCache('/client');
    CachedAPIService.clearCache('/dashboard/data');
  }

  private static invalidateAgentCaches() {
    CachedAPIService.clearCache('/agent');
    CachedAPIService.clearCache('/dashboard/data');
  }

  private static invalidateTicketCaches() {
    CachedAPIService.clearCache('/ticket');
    CachedAPIService.clearCache('/dashboard/data');
    CachedAPIService.clearCache('/ticket/counts');
    CachedAPIService.clearCache('/tickets/selection');
  }

  private static invalidateLeadCaches() {
    CachedAPIService.clearCache('/lead');
    CachedAPIService.clearCache('/dashboard/data');
  }

  private static invalidateQuotationCaches() {
    CachedAPIService.clearCache('/quotations');
    CachedAPIService.clearCache('/dashboard/data');
  }

  private static invalidateExpenseCaches() {
    CachedAPIService.clearCache('/expense');
    CachedAPIService.clearCache('/dashboard/data');
  }

  private static invalidateRateCardCaches() {
    CachedAPIService.clearCache('/rate-cards');
    CachedAPIService.clearCache('/api/rate-cards');
  }

  private static invalidateNotificationCaches() {
    CachedAPIService.clearCache('/notifications');
    CachedAPIService.clearCache('/notifications/count');
  }

  private static invalidateCommentCaches(ticketId: string) {
    CachedAPIService.clearCache(`/ticket/${ticketId}/comment`);
    this.invalidateTicketCaches();
  }

  private static invalidatePerformanceCaches(agentId?: string) {
    if (agentId) {
      CachedAPIService.clearCache(`/api/performance/agent/${agentId}`);
    } else {
      CachedAPIService.clearCache('/api/performance/agent');
    }
  }

  /**
   * Batch operations for better performance
   */
  static async batchGetData(requests: Array<{
    key: string;
    endpoint: string;
    params?: any;
    cacheTime?: number;
  }>) {
    const promises = requests.map(({ endpoint, params, cacheTime }) =>
      CachedAPIService.get(endpoint, params, { 
        cache: true, 
        cacheTime: cacheTime || this.CACHE_DURATIONS.LIST_DATA 
      })
    );

    const results = await Promise.allSettled(promises);
    
    return requests.reduce((acc, { key }, index) => {
      const result = results[index];
      acc[key] = result.status === 'fulfilled' ? result.value : null;
      return acc;
    }, {} as Record<string, any>);
  }

  /**
   * Preload commonly used data
   */
  static async preloadCommonData() {
    const commonRequests = [
      { key: 'dashboard', endpoint: '/dashboard/data' },
      { key: 'agents', endpoint: '/agent', params: { limit: 20 } },
      { key: 'clients', endpoint: '/client', params: { limit: 20 } },
    ];

    return this.batchGetData(commonRequests);
  }

  /**
   * Manual cache management
   */
  static clearAllCaches() {
    CachedAPIService.clearCache();
  }

  static clearCache(pattern?: string) {
    if (pattern) {
      CachedAPIService.clearCache(pattern);
    } else {
      this.clearAllCaches();
    }
  }

  static clearPaginatedCache(endpoint: string) {
    CachedAPIService.clearPaginatedCache(endpoint);
  }

  /**
   * Force refresh a specific store or endpoint by clearing cache
   */
  static forceRefresh(pattern: string) {
    CachedAPIService.clearCache(pattern);
  }

  /**
   * Health check and performance monitoring
   */
  static async healthCheck() {
    const start = Date.now();
    try {
      await CachedAPIService.get('/dashboard/data', {}, { cache: false });
      return {
        status: 'healthy',
        responseTime: Date.now() - start
      };
    } catch (error: any) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - start,
        error: error?.message || 'Unknown error'
      };
    }
  }
}

export default APIService;

