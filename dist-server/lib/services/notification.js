"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserNotifications = getUserNotifications;
exports.getUnreadNotificationCount = getUnreadNotificationCount;
exports.markNotificationAsRead = markNotificationAsRead;
exports.markAllNotificationsAsRead = markAllNotificationsAsRead;
exports.deleteNotification = deleteNotification;
exports.createNotification = createNotification;
exports.generateNotificationMessage = generateNotificationMessage;
exports.generateActionUrl = generateActionUrl;
// lib/services/notification.ts
const axios_1 = __importDefault(require("../axios"));
// Get all notifications for the current user
async function getUserNotifications(filters) {
    try {
        const params = new URLSearchParams();
        if (filters?.isRead !== undefined) {
            params.append("isRead", filters.isRead.toString());
        }
        if (filters?.type) {
            params.append("type", filters.type);
        }
        if (filters?.limit) {
            params.append("limit", filters.limit.toString());
        }
        if (filters?.offset) {
            params.append("offset", filters.offset.toString());
        }
        const response = await axios_1.default.get(`/notifications?${params.toString()}`, {
            withCredentials: true,
            headers: {
                "Cache-Control": "no-cache",
                Pragma: "no-cache",
                Expires: "0",
            },
        });
        return response.data;
    }
    catch (error) {
        // Check if it's a database table missing error
        const errorMessage = error.response?.data?.error ||
            error.response?.data?.message ||
            error.message ||
            "";
        if (error.response?.status === 500 &&
            (errorMessage.includes("doesn't exist") ||
                errorMessage.includes("relation") ||
                errorMessage.includes("P2021") ||
                errorMessage.includes("table") ||
                errorMessage.includes("Notification"))) {
            // Return empty state for missing table instead of throwing error
            console.warn("Notification table not found - returning empty state");
            return {
                notifications: [],
                total: 0,
                unreadCount: 0,
            };
        }
        // For other errors, throw as usual
        const message = error.response?.data?.error || "Failed to fetch notifications.";
        throw new Error(message);
    }
}
// Get unread notification count
async function getUnreadNotificationCount() {
    try {
        const response = await axios_1.default.get("/notifications/count", {
            withCredentials: true,
            headers: {
                "Cache-Control": "no-cache",
                Pragma: "no-cache",
                Expires: "0",
            },
        });
        return response.data.unreadCount;
    }
    catch (error) {
        // Check if it's a database table missing error
        const errorMessage = error.response?.data?.error ||
            error.response?.data?.message ||
            error.message ||
            "";
        if (error.response?.status === 500 &&
            (errorMessage.includes("doesn't exist") ||
                errorMessage.includes("relation") ||
                errorMessage.includes("P2021") ||
                errorMessage.includes("table") ||
                errorMessage.includes("Notification"))) {
            // Return 0 for missing table instead of throwing error
            console.warn("Notification table not found - returning 0 count");
            return 0;
        }
        // For other errors, throw as usual
        const message = error.response?.data?.error || "Failed to fetch notification count.";
        throw new Error(message);
    }
}
// Mark a specific notification as read
async function markNotificationAsRead(notificationId) {
    try {
        await axios_1.default.patch(`/notifications/${notificationId}`, { isRead: true }, {
            withCredentials: true,
        });
    }
    catch (error) {
        const message = error.response?.data?.error || "Failed to mark notification as read.";
        throw new Error(message);
    }
}
// Mark all notifications as read
async function markAllNotificationsAsRead() {
    try {
        await axios_1.default.post("/notifications/mark-all-read", {}, {
            withCredentials: true,
        });
    }
    catch (error) {
        const message = error.response?.data?.error ||
            "Failed to mark all notifications as read.";
        throw new Error(message);
    }
}
// Delete a specific notification
async function deleteNotification(notificationId) {
    try {
        await axios_1.default.delete(`/notifications/${notificationId}`, {
            withCredentials: true,
        });
    }
    catch (error) {
        const message = error.response?.data?.error || "Failed to delete notification.";
        throw new Error(message);
    }
}
// Create a new notification (typically called from server-side)
async function createNotification(data) {
    try {
        const response = await axios_1.default.post("/notifications", data, {
            withCredentials: true,
        });
        return response.data;
    }
    catch (error) {
        const message = error.response?.data?.error || "Failed to create notification.";
        throw new Error(message);
    }
}
// Helper function to generate notification messages based on type
function generateNotificationMessage(type, data) {
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
function generateActionUrl(ticketId) {
    if (ticketId) {
        return `/dashboard/ticket/${ticketId}`;
    }
    return undefined;
}
