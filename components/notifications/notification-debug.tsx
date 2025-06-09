// components/notifications/notification-debug.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useNotificationStore } from "@/store/notificationStore";
import axios from "@/lib/axios";

export function NotificationDebug() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { fetchNotifications, fetchUnreadCount } = useNotificationStore();

  const testNotificationSystem = async () => {
    setLoading(true);
    try {
      // First check if system is accessible
      const checkResponse = await axios.get("/notifications/test");
      console.log("System check:", checkResponse.data);

      // Create a test notification
      const createResponse = await axios.post("/notifications/test");
      console.log("Test notification:", createResponse.data);

      // Refresh notifications
      await fetchNotifications();
      await fetchUnreadCount();

      toast({
        title: "Success",
        description: "Test notification created successfully",
      });
    } catch (error: any) {
      console.error("Notification test failed:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to test notification system",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshNotifications = async () => {
    setLoading(true);
    try {
      await fetchNotifications();
      await fetchUnreadCount();
      toast({
        title: "Success",
        description: "Notifications refreshed",
      });
    } catch (error: any) {
      console.error("Failed to refresh notifications:", error);
      toast({
        title: "Error",
        description: "Failed to refresh notifications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Notification System Debug</CardTitle>
        <CardDescription>
          Test and debug the notification system
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            onClick={testNotificationSystem}
            disabled={loading}
            variant="outline"
          >
            {loading ? "Testing..." : "Create Test Notification"}
          </Button>
          <Button
            onClick={refreshNotifications}
            disabled={loading}
            variant="outline"
          >
            {loading ? "Refreshing..." : "Refresh Notifications"}
          </Button>
        </div>

        <div className="text-sm text-muted-foreground">
          <p>
            • Use "Create Test Notification" to verify the system is working
          </p>
          <p>• Use "Refresh Notifications" to update the notification list</p>
          <p>• Check browser console for detailed logs</p>
        </div>
      </CardContent>
    </Card>
  );
}
