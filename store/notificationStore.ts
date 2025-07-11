import { create } from "zustand";
import {
  getUserNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  createNotification,
  type Notification,
  type NotificationFilters,
  type CreateNotificationInput,
} from "@/lib/services/notification";
import APIService from "@/lib/services/api-service";

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  isSystemAvailable: boolean;

  // Pagination
  currentPage: number;
  totalNotifications: number;
  notificationsPerPage: number;

  // Actions
  fetchNotifications: (filters?: NotificationFilters) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  addNotification: (data: CreateNotificationInput) => Promise<Notification>;
  forceRefresh: () => Promise<void>;

  // UI State management
  setCurrentPage: (page: number) => void;
  setNotificationsPerPage: (count: number) => void;
  clearError: () => void;

  // Real-time updates
  incrementUnreadCount: () => void;
  decrementUnreadCount: () => void;
  addNotificationToList: (notification: Notification) => void;

  // System health
  checkSystemHealth: () => Promise<boolean>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
  isSystemAvailable: true,
  currentPage: 1,
  totalNotifications: 0,
  notificationsPerPage: 10,

  fetchNotifications: async (filters?: NotificationFilters) => {
    set({ loading: true, error: null });
    try {
      const { currentPage, notificationsPerPage } = get();
      const offset =
        filters?.offset ?? (currentPage - 1) * notificationsPerPage;

      const response = await getUserNotifications({
        ...filters,
        limit: filters?.limit ?? notificationsPerPage,
        offset,
      });

      set({
        notifications: response.notifications,
        unreadCount: response.unreadCount,
        totalNotifications: response.total,
        loading: false,
        isSystemAvailable: true,
      });
    } catch (error: any) {
      console.warn("Notification fetch error:", error);

      // Check if it's a database table missing error
      if (
        error.message.includes("doesn't exist") ||
        error.message.includes("relation") ||
        error.message.includes("P2021") ||
        error.response?.status === 500
      ) {
        // Table doesn't exist yet - show empty state instead of error
        set({
          notifications: [],
          unreadCount: 0,
          totalNotifications: 0,
          loading: false,
          error: null,
          isSystemAvailable: false,
        });
      } else {
        // Show actual errors (like network issues)
        set({
          error: error.message || "Failed to fetch notifications",
          loading: false,
          isSystemAvailable: true,
        });
      }
    }
  },

  fetchUnreadCount: async () => {
    try {
      const count = await getUnreadNotificationCount();
      set({ unreadCount: count, isSystemAvailable: true });
    } catch (error: any) {
      console.warn("Failed to fetch unread count:", error);
      // For missing table, set count to 0 instead of showing error
      if (
        error.message.includes("doesn't exist") ||
        error.message.includes("relation") ||
        error.message.includes("P2021") ||
        error.message.includes("table")
      ) {
        set({ unreadCount: 0, isSystemAvailable: false });
      }
      // Don't set error state for count fetching to avoid UI disruption
    }
  },

  markAsRead: async (notificationId: string) => {
    // Optimistically update local state first
    set((state) => ({
      notifications: state.notifications.map((notification) =>
        notification.id === notificationId
          ? { ...notification, isRead: true }
          : notification,
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
    
    try {
      // Then make the API call
      await markNotificationAsRead(notificationId);
      
      // Clear cache after successful API call
      APIService.clearCache('/notifications');
      APIService.clearCache('/notifications/count');
    } catch (error: any) {
      // Rollback optimistic update on error
      set((state) => ({
        notifications: state.notifications.map((notification) =>
          notification.id === notificationId
            ? { ...notification, isRead: false }
            : notification,
        ),
        unreadCount: state.unreadCount + 1,
        error: error.message || "Failed to mark notification as read",
      }));
      throw error;
    }
  },

  markAllAsRead: async () => {
    // Store previous state for rollback
    const previousState = get();
    const previousNotifications = [...previousState.notifications];
    const previousUnreadCount = previousState.unreadCount;
    
    // Optimistically update local state first
    set((state) => ({
      notifications: state.notifications.map((notification) => ({
        ...notification,
        isRead: true,
      })),
      unreadCount: 0,
    }));
    
    try {
      // Then make the API call
      await markAllNotificationsAsRead();
      
      // Clear cache after successful API call
      APIService.clearCache('/notifications');
      APIService.clearCache('/notifications/count');
    } catch (error: any) {
      // Rollback optimistic update on error
      set({
        notifications: previousNotifications,
        unreadCount: previousUnreadCount,
        error: error.message || "Failed to mark all notifications as read",
      });
      throw error;
    }
  },

  deleteNotification: async (notificationId: string) => {
    // Store notification for rollback
    const state = get();
    const notificationToDelete = state.notifications.find(
      (n) => n.id === notificationId,
    );
    const wasUnread = notificationToDelete && !notificationToDelete.isRead;
    
    // Optimistically update local state first
    set((state) => ({
      notifications: state.notifications.filter(
        (n) => n.id !== notificationId,
      ),
      unreadCount: wasUnread
        ? Math.max(0, state.unreadCount - 1)
        : state.unreadCount,
      totalNotifications: Math.max(0, state.totalNotifications - 1),
    }));
    
    try {
      // Then make the API call
      await deleteNotification(notificationId);
      
      // Clear cache after successful API call
      APIService.clearCache('/notifications');
      APIService.clearCache('/notifications/count');
    } catch (error: any) {
      // Rollback optimistic update on error
      if (notificationToDelete) {
        set((state) => ({
          notifications: [...state.notifications, notificationToDelete],
          unreadCount: wasUnread ? state.unreadCount + 1 : state.unreadCount,
          totalNotifications: state.totalNotifications + 1,
          error: error.message || "Failed to delete notification",
        }));
      }
      throw error;
    }
  },

  addNotification: async (data: CreateNotificationInput) => {
    try {
      // Make API call first for creation
      const newNotification = await createNotification(data);
      
      // Update local state after successful API call
      set((state) => ({
        notifications: [newNotification, ...state.notifications].slice(
          0,
          state.notificationsPerPage,
        ),
        unreadCount: state.unreadCount + 1,
        totalNotifications: state.totalNotifications + 1,
        isSystemAvailable: true,
      }));
      
      // Clear cache after successful API call
      APIService.clearCache('/notifications');
      APIService.clearCache('/notifications/count');

      return newNotification;
    } catch (error: any) {
      set({ error: error.message || "Failed to create notification" });
      throw error;
    }
  },

  setCurrentPage: (page: number) => {
    set({ currentPage: page });
  },

  setNotificationsPerPage: (count: number) => {
    set({ notificationsPerPage: count, currentPage: 1 });
  },

  clearError: () => {
    set({ error: null });
  },

  incrementUnreadCount: () => {
    set((state) => ({ unreadCount: state.unreadCount + 1 }));
  },

  decrementUnreadCount: () => {
    set((state) => ({ unreadCount: Math.max(0, state.unreadCount - 1) }));
  },

  addNotificationToList: (notification: Notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications].slice(
        0,
        state.notificationsPerPage,
      ),
      unreadCount: notification.isRead
        ? state.unreadCount
        : state.unreadCount + 1,
      totalNotifications: state.totalNotifications + 1,
    }));
  },

  checkSystemHealth: async () => {
    try {
      await getUnreadNotificationCount();
      set({ isSystemAvailable: true });
      return true;
    } catch (error: any) {
      const isTableMissing =
        error.message.includes("doesn't exist") ||
        error.message.includes("relation") ||
        error.message.includes("P2021") ||
        error.message.includes("table");

      set({ isSystemAvailable: !isTableMissing });
      return !isTableMissing;
    }
  },
  
  // Force refresh to bypass cache
  forceRefresh: async () => {
    APIService.clearCache('/notifications');
    APIService.clearCache('/notifications/count');
    const state = get();
    await state.fetchNotifications();
    await state.fetchUnreadCount();
  },
}));
