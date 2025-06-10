"use client";

import { useState, useEffect } from "react";
import { Bell, X, Trash2, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useNotificationStore } from "@/store/notificationStore";
import { NotificationItem } from "./notification-item";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAllAsRead,
    deleteNotification,
    clearError,
  } = useNotificationStore();

  // Fetch notifications when component mounts and periodically
  useEffect(() => {
    // Initial fetch
    fetchNotifications({ limit: 20, offset: 0 }).catch((error) => {
      console.warn("Could not fetch notifications:", error);
    });

    // Set up periodic refresh every 30 seconds
    const interval = setInterval(() => {
      fetchNotifications({ limit: 20, offset: 0 }).catch((error) => {
        console.warn("Could not fetch notifications:", error);
      });
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      // Refresh notifications when dropdown opens
      fetchNotifications({ limit: 20, offset: 0 }).catch((error) => {
        console.warn("Could not fetch notifications:", error);
      });
    }
  };

  const handleClearAll = async () => {
    try {
      // Delete all notifications one by one
      for (const notification of notifications) {
        await deleteNotification(notification.id);
      }
    } catch (error) {
      console.error("Failed to clear all notifications:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const handleNotificationClick = (actionUrl?: string) => {
    if (actionUrl) {
      router.push(actionUrl);
      setIsOpen(false);
    }
  };

  const handleViewSettings = () => {
    router.push("/dashboard/settings?tab=notifications");
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 bg-destructive text-destructive-foreground text-xs font-medium rounded-full flex items-center justify-center">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
          <span className="sr-only">
            Notifications {unreadCount > 0 && `(${unreadCount} unread)`}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 p-0" sideOffset={8}>
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
              {notifications.length > 0 && (
                <>
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleMarkAllAsRead}
                      className="h-8 px-2"
                      title="Mark all as read"
                    >
                      <CheckCheck className="h-3 w-3" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearAll}
                    className="h-8 px-2 text-destructive hover:text-destructive"
                    title="Clear all notifications"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-8 px-2"
                title="Close"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="min-h-[200px] max-h-[500px]">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-muted-foreground">
                    Loading...
                  </span>
                </div>
              </div>
            ) : error ? (
              <div className="p-4 text-center">
                <p className="text-sm text-destructive mb-2">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    clearError();
                    fetchNotifications({ limit: 20, offset: 0 });
                  }}
                >
                  Retry
                </Button>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <Bell className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  No notifications
                </p>
                <p className="text-xs text-muted-foreground">
                  You're all caught up!
                </p>
              </div>
            ) : (
              <ScrollArea className="h-full">
                <div className="p-2 space-y-1">
                  {notifications.map((notification, index) => (
                    <div key={notification.id}>
                      <NotificationItem
                        notification={notification}
                        onClick={() =>
                          handleNotificationClick(notification.actionUrl)
                        }
                        showDelete={true}
                      />
                      {index < notifications.length - 1 && (
                        <Separator className="my-1" />
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <>
              <Separator />
              <div className="p-2">
                <Button
                  variant="ghost"
                  className="w-full text-sm"
                  onClick={handleViewSettings}
                >
                  View all notifications
                </Button>
              </div>
            </>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
