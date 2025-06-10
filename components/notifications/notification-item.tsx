"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  UserPlus,
  MessageSquare,
  ArrowUpDown,
  Clock,
  Settings as SettingsIcon,
  X,
  CheckCircle,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNotificationStore } from "@/store/notificationStore";
import type {
  Notification,
  NotificationType,
} from "@/lib/services/notification";

interface NotificationItemProps {
  notification: Notification;
  onClick?: () => void;
  showDelete?: boolean;
}

const notificationIcons: Record<
  NotificationType,
  React.ComponentType<{ className?: string }>
> = {
  TICKET_ASSIGNED: UserPlus,
  TICKET_STATUS_CHANGED: ArrowUpDown,
  TICKET_COMMENTED: MessageSquare,
  TICKET_DUE_DATE_APPROACHING: Clock,
  WORK_STAGE_UPDATED: SettingsIcon,
};

const notificationColors: Record<NotificationType, string> = {
  TICKET_ASSIGNED: "text-blue-500",
  TICKET_STATUS_CHANGED: "text-orange-500",
  TICKET_COMMENTED: "text-green-500",
  TICKET_DUE_DATE_APPROACHING: "text-red-500",
  WORK_STAGE_UPDATED: "text-purple-500",
};

export function NotificationItem({
  notification,
  onClick,
  showDelete = false,
}: NotificationItemProps) {
  const { markAsRead, deleteNotification: deleteNotificationFromStore } =
    useNotificationStore();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMarkingRead, setIsMarkingRead] = useState(false);

  const IconComponent = notificationIcons[notification.type] || MessageSquare;
  const iconColor = notificationColors[notification.type] || "text-gray-500";

  const handleClick = async () => {
    if (!notification.isRead) {
      try {
        setIsMarkingRead(true);
        await markAsRead(notification.id);
      } catch (error) {
        console.error("Failed to mark notification as read:", error);
      } finally {
        setIsMarkingRead(false);
      }
    }
    onClick?.();
  };

  const handleMarkAsRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setIsMarkingRead(true);
      await markAsRead(notification.id);
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    } finally {
      setIsMarkingRead(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleting(true);
    try {
      await deleteNotificationFromStore(notification.id);
    } catch (error) {
      console.error("Failed to delete notification:", error);
      setIsDeleting(false);
    }
  };

  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: true,
  });

  return (
    <div
      className={cn(
        "group relative flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-200 hover:bg-muted/50",
        !notification.isRead &&
          "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800",
        isDeleting && "opacity-50 pointer-events-none",
      )}
      onClick={handleClick}
    >
      {/* Icon */}
      <div className={cn("flex-shrink-0 mt-0.5", iconColor)}>
        <IconComponent className="h-4 w-4" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p
              className={cn(
                "text-sm font-medium line-clamp-1",
                !notification.isRead && "font-semibold",
              )}
            >
              {notification.title}
            </p>
            <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
              {notification.message}
            </p>
            {notification.ticket && (
              <p className="text-xs text-muted-foreground mt-1">
                Ticket: {notification.ticket.ticketId}
              </p>
            )}
            {/* Timestamp */}
            <p className="text-xs text-muted-foreground mt-1">{timeAgo}</p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {/* Unread indicator */}
            {!notification.isRead && (
              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
            )}

            {/* Action buttons */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {!notification.isRead && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={handleMarkAsRead}
                  disabled={isMarkingRead}
                  title="Mark as read"
                >
                  <CheckCircle className="h-3 w-3" />
                </Button>
              )}

              {showDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  title="Delete notification"
                >
                  {isDeleting ? (
                    <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <X className="h-3 w-3" />
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
