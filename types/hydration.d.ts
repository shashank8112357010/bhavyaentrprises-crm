// Global type declarations for server-side hydration

interface PreloadedStoreData {
  dashboard?: {
    tickets?: any[];
    clients?: any[];
    agents?: any[];
    quotations?: any[];
    counts?: {
      openTicketsCount: number;
      scheduledTodayCount: number;
      clientUpdatesNeededCount: number;
      completedThisWeekCount: number;
      totalAgents: number;
      totalClients: number;
    };
  };
  agents?: {
    data?: any[];
    agents?: any[];
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
    hasNextPage?: boolean;
    hasPrevPage?: boolean;
  } | any[];
  clients?: {
    data?: any[];
    clients?: any[];
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
    hasNextPage?: boolean;
    hasPrevPage?: boolean;
  } | any[];
}

declare global {
  interface Window {
    __PRELOADED_DATA__?: PreloadedStoreData;
  }
}

export {};
