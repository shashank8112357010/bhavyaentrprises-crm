// lib/services/notification.ts
import APIService from "@/lib/services/api-service";

export type NotificationType =
  | "TICKET_ASSIGNED"
  | "TICKET_STATUS_CHANGED"
  | "TICKET_COMMENTED"
  | "TICKET_DUE_DATE_APPROACHING"
  | "WORK_STAGE_UPDATED";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  ticketId?: string;
  ticket?: {
    id: string;
    title: string;
    ticketId: string;
  };
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
}

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  ticketId?: string;
  actionUrl?: string;
}

export interface NotificationFilters {
  isRead?: boolean;
  type?: NotificationType;
  limit?: number;
  offset?: number;
}

// Get all notifications for the current user
export async function getUserNotifications(
  filters?: NotificationFilters,
): Promise<{
  notifications: Notification[];
  total: number;
  unreadCount: number;
}> {
  try {
    return await APIService.getUserNotifications(filters || {}) as {
      notifications: Notification[];
      total: number;
      unreadCount: number;
    };
  } catch (error: any) {
    // Check if it's a database table missing error
    const errorMessage =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      "";

    if (
      error.response?.status === 500 &&
      (errorMessage.includes("doesn't exist") ||
        errorMessage.includes("relation") ||
        errorMessage.includes("P2021") ||
        errorMessage.includes("table") ||
        errorMessage.includes("Notification"))
    ) {
      // Return empty state for missing table instead of throwing error
      console.warn("Notification table not found - returning empty state");
      return {
        notifications: [],
        total: 0,
        unreadCount: 0,
      };
    }

    // For other errors, throw as usual
    const message =
      error.response?.data?.error || "Failed to fetch notifications.";
    throw new Error(message);
  }
}

// Get unread notification count
export async function getUnreadNotificationCount(): Promise<number> {
  try {
    const response = await APIService.getUnreadNotificationCount();
    return (response as any).unreadCount;
  } catch (error: any) {
    // Check if it's a database table missing error
    const errorMessage =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      "";

    if (
      error.response?.status === 500 &&
      (errorMessage.includes("doesn't exist") ||
        errorMessage.includes("relation") ||
        errorMessage.includes("P2021") ||
        errorMessage.includes("table") ||
        errorMessage.includes("Notification"))
    ) {
      // Return 0 for missing table instead of throwing error
      console.warn("Notification table not found - returning 0 count");
      return 0;
    }

    // For other errors, throw as usual
    const message =
      error.response?.data?.error || "Failed to fetch notification count.";
    throw new Error(message);
  }
}

// Mark a specific notification as read
export async function markNotificationAsRead(
  notificationId: string,
): Promise<void> {
  await APIService.markNotificationAsRead(notificationId);
}

// Mark all notifications as read
export async function markAllNotificationsAsRead(): Promise<void> {
  await APIService.markAllNotificationsAsRead();
}

// Delete a specific notification
export async function deleteNotification(
  notificationId: string,
): Promise<void> {
  await APIService.deleteNotification(notificationId);
}

// Create a new notification (typically called from server-side)
export async function createNotification(
  data: CreateNotificationInput,
): Promise<Notification> {
  return await APIService.createNotification(data) as Notification;
}

// Helper function to generate notification messages based on type
export function generateNotificationMessage(
  type: NotificationType,
  data: {
    ticketTitle?: string;
    ticketId?: string;
    oldStatus?: string;
    newStatus?: string;
    assigneeName?: string;
    commenterName?: string;
  },
): { title: string; message: string } {
  switch (type) {
    case "TICKET_ASSIGNED":
      return {
        title: "New Ticket Assigned",
        message: `You have been assigned to ticket "${data.ticketTitle}" (${data.ticketId})`,
      };

    case "TICKET_STATUS_CHANGED":
      return {
        title: "Ticket Status Updated",
        message: `Ticket "${data.ticketTitle}" (${data.ticketId}) status changed from ${data.oldStatus} to ${data.newStatus}`,
      };

    case "TICKET_COMMENTED":
      return {
        title: "New Comment on Ticket",
        message: `${data.commenterName} commented on ticket "${data.ticketTitle}" (${data.ticketId})`,
      };

    case "TICKET_DUE_DATE_APPROACHING":
      return {
        title: "Ticket Due Date Approaching",
        message: `Ticket "${data.ticketTitle}" (${data.ticketId}) is due soon`,
      };

    case "WORK_STAGE_UPDATED":
      return {
        title: "Work Stage Updated",
        message: `Work stage updated for ticket "${data.ticketTitle}" (${data.ticketId})`,
      };

    default:
      return {
        title: "Notification",
        message: "You have a new notification",
      };
  }
}

// Helper function to generate action URL for notifications
export function generateActionUrl(ticketId?: string): string | undefined {
  if (ticketId) {
    return `/dashboard/ticket/${ticketId}`;
  }
  return undefined;
}
