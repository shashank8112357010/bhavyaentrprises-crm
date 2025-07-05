import axios from "@/lib/axios";

// Cache configuration
interface CacheEntry {
  data: any;
  timestamp: number;
  expiry: number;
}

class APICache {
  private cache = new Map<string, CacheEntry>();
  private readonly DEFAULT_CACHE_TIME = 5 * 60 * 1000; // 5 minutes

  // Generate cache key from URL and params - optimized for pagination
  private generateKey(url: string, params?: any): string {
    if (!params) return url;
    
    // Sort parameters for consistent caching and create structured key for pagination
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((acc, key) => {
        acc[key] = params[key];
        return acc;
      }, {} as any);
    
    const paramString = JSON.stringify(sortedParams);
    return `${url}_${paramString}`;
  }

  // Generate pagination-aware cache key
  private generatePaginationKey(endpoint: string, page: number, limit: number, filters: any = {}): string {
    const cacheKey = {
      endpoint,
      page,
      limit,
      ...filters
    };
    return this.generateKey('paginated', cacheKey);
  }

  // Check if cache entry is valid
  private isValid(entry: CacheEntry): boolean {
    return Date.now() < entry.timestamp + entry.expiry;
  }

  // Get cached data if valid
  get(url: string, params?: any): any | null {
    const key = this.generateKey(url, params);
    const entry = this.cache.get(key);
    
    if (entry && this.isValid(entry)) {
      console.log(`[CACHE HIT] ${url}`);
      return entry.data;
    }
    
    if (entry) {
      this.cache.delete(key); // Remove expired entry
    }
    
    return null;
  }

  // Set cache data
  set(url: string, data: any, params?: any, cacheTime?: number): void {
    const key = this.generateKey(url, params);
    const expiry = cacheTime || this.DEFAULT_CACHE_TIME;
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiry
    });
    
    console.log(`[CACHE SET] ${url} (expires in ${expiry}ms)`);
  }

  // Clear specific cache entry or pattern
  clear(url: string, params?: any): void {
    if (params) {
      // Clear specific entry
      const key = this.generateKey(url, params);
      this.cache.delete(key);
      console.log(`[CACHE CLEAR] ${url}`);
    } else {
      // Clear all entries matching URL pattern
      const keysToDelete: string[] = [];
      this.cache.forEach((entry, key) => {
        if (key.startsWith(`${url}_`)) {
          keysToDelete.push(key);
        }
      });
      keysToDelete.forEach(key => this.cache.delete(key));
      console.log(`[CACHE CLEAR PATTERN] ${url} (${keysToDelete.length} entries)`);
    }
  }

  // Clear all cache
  clearAll(): void {
    this.cache.clear();
    console.log('[CACHE CLEAR ALL]');
  }

  // Clear expired entries
  cleanup(): void {
    const keysToDelete: string[] = [];
    this.cache.forEach((entry, key) => {
      if (!this.isValid(entry)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  // Pagination-specific cache methods
  getPaginatedData(endpoint: string, page: number, limit: number, filters: any = {}): any | null {
    const key = this.generatePaginationKey(endpoint, page, limit, filters);
    const entry = this.cache.get(key);
    
    if (entry && this.isValid(entry)) {
      console.log(`[PAGINATED CACHE HIT] ${endpoint} page:${page} limit:${limit}`);
      return entry.data;
    }
    
    if (entry) {
      this.cache.delete(key);
    }
    
    return null;
  }

  setPaginatedData(endpoint: string, page: number, limit: number, filters: any = {}, data: any, cacheTime?: number): void {
    const key = this.generatePaginationKey(endpoint, page, limit, filters);
    const expiry = cacheTime || this.DEFAULT_CACHE_TIME;
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiry
    });
    
    console.log(`[PAGINATED CACHE SET] ${endpoint} page:${page} limit:${limit} (expires in ${expiry}ms)`);
  }

  // Clear pagination cache for specific endpoint
  clearPaginatedData(endpoint: string): void {
    const keysToDelete: string[] = [];
    const prefix = this.generateKey('paginated', { endpoint });
    
    this.cache.forEach((entry, key) => {
      if (key.includes(prefix)) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.cache.delete(key));
    console.log(`[PAGINATED CACHE CLEAR] ${endpoint} (${keysToDelete.length} pages)`);
  }
}

// Global cache instance
const apiCache = new APICache();

// Cleanup expired cache entries every 10 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    apiCache.cleanup();
  }, 10 * 60 * 1000);
}

// Enhanced axios wrapper with caching
export class CachedAPIService {
  // Generic GET with caching
  static async get<T>(
    url: string, 
    params?: any, 
    options: { 
      cache?: boolean; 
      cacheTime?: number;
      forceRefresh?: boolean;
    } = { cache: true }
  ): Promise<T> {
    const { cache = true, cacheTime, forceRefresh = false } = options;
    
    // Check cache first (unless force refresh)
    if (cache && !forceRefresh) {
      const cached = apiCache.get(url, params);
      if (cached) {
        return cached;
      }
    }

    console.log(`[API CALL] GET ${url}`);
    
    try {
      const response = await axios.get(url, { 
        params,
        withCredentials: true 
      });
      
      // Cache successful responses
      if (cache && response.data) {
        apiCache.set(url, response.data, params, cacheTime);
      }
      
      return response.data;
    } catch (error: any) {
      console.error(`[API ERROR] GET ${url}:`, error.message);
      throw error;
    }
  }

  // Enhanced paginated GET with specialized caching
  static async getPaginated<T>(
    endpoint: string,
    page: number,
    limit: number,
    filters: any = {},
    options: {
      cache?: boolean;
      cacheTime?: number;
      forceRefresh?: boolean;
    } = { cache: true }
  ): Promise<T> {
    const { cache = true, cacheTime, forceRefresh = false } = options;
    
    // Check paginated cache first (unless force refresh)
    if (cache && !forceRefresh) {
      const cached = apiCache.getPaginatedData(endpoint, page, limit, filters);
      if (cached) {
        return cached;
      }
    }

    const params = {
      page,
      limit,
      ...filters
    };

    console.log(`[PAGINATED API CALL] GET ${endpoint} page:${page} limit:${limit}`);
    
    try {
      const response = await axios.get(endpoint, { 
        params,
        withCredentials: true 
      });
      
      // Cache successful paginated responses
      if (cache && response.data) {
        apiCache.setPaginatedData(endpoint, page, limit, filters, response.data, cacheTime);
      }
      
      return response.data;
    } catch (error: any) {
      console.error(`[PAGINATED API ERROR] GET ${endpoint}:`, error.message);
      throw error;
    }
  }

  // POST without caching (mutations)
  static async post<T>(url: string, data: any, options?: any): Promise<T> {
    console.log(`[API CALL] POST ${url}`);
    
    try {
      const requestOptions = {
        withCredentials: true,
        ...options
      };
      
      // Special handling for auth endpoints
      if (url === '/login') {
        requestOptions.maxRedirects = 0;
        requestOptions.validateStatus = (status: number) => status < 400 || status === 302;
      }
      
      const response = await axios.post(url, data, requestOptions);
      
      // Clear related cache entries after mutations (except for auth)
      if (!url.includes('/login') && !url.includes('/logout')) {
        this.invalidateCache(url);
      }
      
      return response.data;
    } catch (error: any) {
      console.error(`[API ERROR] POST ${url}:`, error.message);
      throw error;
    }
  }

  // PUT without caching (mutations)
  static async put<T>(url: string, data: any, options?: any): Promise<T> {
    console.log(`[API CALL] PUT ${url}`);
    
    try {
      const response = await axios.put(url, data, {
        withCredentials: true,
        ...options
      });
      
      // Clear related cache entries after mutations
      this.invalidateCache(url);
      
      return response.data;
    } catch (error: any) {
      console.error(`[API ERROR] PUT ${url}:`, error.message);
      throw error;
    }
  }

  // PATCH without caching (mutations)
  static async patch<T>(url: string, data: any, options?: any): Promise<T> {
    console.log(`[API CALL] PATCH ${url}`);
    
    try {
      const response = await axios.patch(url, data, {
        withCredentials: true,
        ...options
      });
      
      // Clear related cache entries after mutations
      this.invalidateCache(url);
      
      return response.data;
    } catch (error: any) {
      console.error(`[API ERROR] PATCH ${url}:`, error.message);
      throw error;
    }
  }

  // DELETE without caching (mutations)
  static async delete<T>(url: string, options?: any): Promise<T> {
    console.log(`[API CALL] DELETE ${url}`);
    
    try {
      const response = await axios.delete(url, {
        withCredentials: true,
        ...options
      });
      
      // Clear related cache entries after mutations
      this.invalidateCache(url);
      
      return response.data;
    } catch (error: any) {
      console.error(`[API ERROR] DELETE ${url}:`, error.message);
      throw error;
    }
  }

  // Invalidate related cache entries
  private static invalidateCache(url: string): void {
    const baseResource = url.split('/')[1]; // Extract base resource (e.g., 'tickets', 'clients')
    
    // Clear all cache entries related to this resource
    const patterns = [
      `/${baseResource}`,
      `/dashboard/data`,
      `/ticket/counts`
    ];
    
    patterns.forEach(pattern => {
      apiCache.clear(pattern);
    });
    
    // Also clear paginated data for this resource
    apiCache.clearPaginatedData(`/${baseResource}`);
  }

  // Manual cache management
  static clearCache(url?: string, params?: any): void {
    if (url) {
      apiCache.clear(url, params);
    } else {
      apiCache.clearAll();
    }
  }

  // Clear paginated cache for specific endpoint
  static clearPaginatedCache(endpoint: string): void {
    apiCache.clearPaginatedData(endpoint);
  }

  // Force refresh a specific endpoint
  static async refresh<T>(url: string, params?: any): Promise<T> {
    return this.get<T>(url, params, { forceRefresh: true });
  }
}

export default CachedAPIService;
