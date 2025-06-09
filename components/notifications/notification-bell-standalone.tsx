// components/notifications/notification-bell-standalone.tsx
"use client";

import { useState } from "react";
import { Bell, BellOff, Settings, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRouter } from "next/navigation";

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
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
          <span className="sr-only">Notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0" sideOffset={8}>
        <div className="w-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <h3 className="font-semibold">Notifications</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleViewSettings}
              className="h-8 px-2"
            >
              <Settings className="h-3 w-3" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Notification system is being set up. Run the database migration
                to enable notifications.
              </AlertDescription>
            </Alert> */}

            <div className="flex flex-col items-center justify-center py-4 text-center">
              <BellOff className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-2">
                No notifications
              </p>
              <p className="text-xs text-muted-foreground">
                Run{" "}
                <code className="bg-muted px-1 rounded">
                  npx prisma migrate dev
                </code>{" "}
                to set up notifications
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t p-2">
            <Button
              variant="ghost"
              className="w-full text-sm"
              onClick={handleViewSettings}
            >
              Notification Settings
            </Button>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
