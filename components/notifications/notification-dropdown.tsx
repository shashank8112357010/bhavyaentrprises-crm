// components/notifications/notification-dropdown.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { CheckCheck, Settings, Bell, BellOff, Loader2 } from "lucide-react";
import { useNotificationStore } from "@/store/notificationStore";
import { NotificationItem } from "./notification-item";

interface NotificationDropdownProps {
  onClose: () => void;
}

export function NotificationDropdown({ onClose }: NotificationDropdownProps) {
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAllAsRead,
    clearError,
  } = useNotificationStore();

  useEffect(() => {
    // Fetch notifications when dropdown opens, but don't show error if table doesn't exist
    fetchNotifications({ limit: 10, offset: 0 }).catch((error) => {
      console.warn("Could not fetch notifications:", error);
      // Don't set error state for missing table - this is expected on first run
    });
  }, [fetchNotifications]);

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const handleViewAllNotifications = () => {
    router.push("/dashboard/settings?tab=notifications");
    onClose();
  };

  const handleNotificationClick = (actionUrl?: string) => {
    if (actionUrl) {
      router.push(actionUrl);
      onClose();
    }
  };

  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-sm text-destructive mb-2">{error}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            clearError();
            fetchNotifications({ limit: 10, offset: 0 });
          }}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4" />
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <span className="bg-destructive text-destructive-foreground text-xs font-medium px-2 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="h-8 px-2"
            >
              <CheckCheck className="h-3 w-3" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleViewAllNotifications}
            className="h-8 px-2"
          >
            <Settings className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : !notifications || notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <BellOff className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No notifications</p>
        </div>
      ) : (
        <>
          <ScrollArea className="h-96">
            <div className="p-1">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onClick={() =>
                    handleNotificationClick(notification.actionUrl)
                  }
                />
              ))}
            </div>
          </ScrollArea>

          {notifications.length >= 10 && (
            <>
              <Separator />
              <div className="p-2">
                <Button
                  variant="ghost"
                  className="w-full text-sm"
                  onClick={handleViewAllNotifications}
                >
                  View all notifications
                </Button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
