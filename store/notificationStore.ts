// store/notificationStore.ts
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
  addNotification: (data: CreateNotificationInput) => Promise<void>;

  // UI State management
  setCurrentPage: (page: number) => void;
  setNotificationsPerPage: (count: number) => void;
  clearError: () => void;

  // Real-time updates
  incrementUnreadCount: () => void;
  decrementUnreadCount: () => void;
  addNotificationToList: (notification: Notification) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
  currentPage: 1,
  totalNotifications: 0,
  notificationsPerPage: 10,

  fetchNotifications: async (filters?: NotificationFilters) => {
    set({ loading: true, error: null });
    try {
      const { currentPage, notificationsPerPage } = get();
      const offset = (currentPage - 1) * notificationsPerPage;

      const response = await getUserNotifications({
        ...filters,
        limit: notificationsPerPage,
        offset,
      });

      set({
        notifications: response.notifications,
        unreadCount: response.unreadCount,
        totalNotifications: response.total,
        loading: false,
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
          error: null, // Don't show error for missing table
        });
      } else {
        // Show actual errors (like network issues)
        set({
          error: error.message || "Failed to fetch notifications",
          loading: false,
        });
      }
    }
  },

  fetchUnreadCount: async () => {
    try {
      const count = await getUnreadNotificationCount();
      set({ unreadCount: count });
    } catch (error: any) {
      console.warn("Failed to fetch unread count:", error);
      // For missing table, set count to 0 instead of showing error
      if (
        error.message.includes("doesn't exist") ||
        error.message.includes("relation") ||
        error.message.includes("P2021") ||
        error.message.includes("table")
      ) {
        set({ unreadCount: 0 });
      }
      // Don't set error state for count fetching to avoid UI disruption
    }
  },

  markAsRead: async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);

      set((state) => ({
        notifications: state.notifications.map((notification) =>
          notification.id === notificationId
            ? { ...notification, isRead: true }
            : notification,
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (error: any) {
      set({ error: error.message || "Failed to mark notification as read" });
    }
  },

  markAllAsRead: async () => {
    try {
      await markAllNotificationsAsRead();

      set((state) => ({
        notifications: state.notifications.map((notification) => ({
          ...notification,
          isRead: true,
        })),
        unreadCount: 0,
      }));
    } catch (error: any) {
      set({
        error: error.message || "Failed to mark all notifications as read",
      });
    }
  },

  deleteNotification: async (notificationId: string) => {
    try {
      await deleteNotification(notificationId);

      set((state) => {
        const notificationToDelete = state.notifications.find(
          (n) => n.id === notificationId,
        );
        const wasUnread = notificationToDelete && !notificationToDelete.isRead;

        return {
          notifications: state.notifications.filter(
            (n) => n.id !== notificationId,
          ),
          unreadCount: wasUnread
            ? Math.max(0, state.unreadCount - 1)
            : state.unreadCount,
          totalNotifications: Math.max(0, state.totalNotifications - 1),
        };
      });
    } catch (error: any) {
      set({ error: error.message || "Failed to delete notification" });
    }
  },

  addNotification: async (data: CreateNotificationInput) => {
    try {
      const newNotification = await createNotification(data);

      set((state) => ({
        notifications: [newNotification, ...state.notifications].slice(
          0,
          state.notificationsPerPage,
        ),
        unreadCount: state.unreadCount + 1,
        totalNotifications: state.totalNotifications + 1,
      }));
    } catch (error: any) {
      set({ error: error.message || "Failed to create notification" });
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
}));
