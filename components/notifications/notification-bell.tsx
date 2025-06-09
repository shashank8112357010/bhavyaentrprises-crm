// components/notifications/notification-bell.tsx
"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNotificationStore } from "@/store/notificationStore";
import { NotificationDropdown } from "./notification-dropdown";
import { cn } from "@/lib/utils";

export function NotificationBell() {
  const { unreadCount, fetchUnreadCount, fetchNotifications } =
    useNotificationStore();
  const [isOpen, setIsOpen] = useState(false);

  // Fetch initial unread count on component mount
  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  // Poll for new notifications every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      // Fetch latest notifications when dropdown opens
      fetchNotifications({ limit: 10, offset: 0 });
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <>
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive"></span>
              <span className="sr-only">
                {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
              </span>
              {unreadCount > 0 && (
                <span
                  className={cn(
                    "absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs font-medium flex items-center justify-center",
                    unreadCount > 99 ? "text-[10px]" : "text-xs",
                  )}
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0" sideOffset={8}>
        <NotificationDropdown onClose={() => setIsOpen(false)} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
