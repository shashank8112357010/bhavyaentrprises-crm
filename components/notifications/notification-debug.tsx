"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useNotificationStore } from "@/store/notificationStore";
import { useToast } from "@/hooks/use-toast";
import { Bell, Send } from "lucide-react";
import type {
  NotificationType,
  CreateNotificationInput,
} from "@/lib/services/notification";

export function NotificationDebug() {
  const { addNotification } = useNotificationStore();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);

  const [formData, setFormData] = useState({
    type: "TICKET_ASSIGNED" as NotificationType,
    title: "",
    message: "",
    ticketId: "",
    actionUrl: "",
  });

  const notificationTypes: { value: NotificationType; label: string }[] = [
    { value: "TICKET_ASSIGNED", label: "Ticket Assigned" },
    { value: "TICKET_STATUS_CHANGED", label: "Status Changed" },
    { value: "TICKET_COMMENTED", label: "New Comment" },
    { value: "TICKET_DUE_DATE_APPROACHING", label: "Due Date Approaching" },
    { value: "WORK_STAGE_UPDATED", label: "Work Stage Updated" },
  ];

  const presets = {
    TICKET_ASSIGNED: {
      title: "New Ticket Assigned",
      message:
        "You have been assigned to ticket 'Fix Air Conditioning Unit' (TICK-001)",
      ticketId: "sample-ticket-id",
      actionUrl: "/dashboard/ticket/sample-ticket-id",
    },
    TICKET_STATUS_CHANGED: {
      title: "Ticket Status Updated",
      message:
        "Ticket 'Fix Air Conditioning Unit' (TICK-001) status changed from 'New' to 'In Progress'",
      ticketId: "sample-ticket-id",
      actionUrl: "/dashboard/ticket/sample-ticket-id",
    },
    TICKET_COMMENTED: {
      title: "New Comment on Ticket",
      message:
        "John Doe commented on ticket 'Fix Air Conditioning Unit' (TICK-001)",
      ticketId: "sample-ticket-id",
      actionUrl: "/dashboard/ticket/sample-ticket-id",
    },
    TICKET_DUE_DATE_APPROACHING: {
      title: "Ticket Due Date Approaching",
      message:
        "Ticket 'Fix Air Conditioning Unit' (TICK-001) is due in 2 hours",
      ticketId: "sample-ticket-id",
      actionUrl: "/dashboard/ticket/sample-ticket-id",
    },
    WORK_STAGE_UPDATED: {
      title: "Work Stage Updated",
      message:
        "Work stage updated for ticket 'Fix Air Conditioning Unit' (TICK-001)",
      ticketId: "sample-ticket-id",
      actionUrl: "/dashboard/ticket/sample-ticket-id",
    },
  };

  const handleTypeChange = (type: NotificationType) => {
    setFormData({
      type,
      ...presets[type],
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.message.trim()) {
      toast({
        title: "Validation Error",
        description: "Title and message are required.",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      const notificationData: CreateNotificationInput = {
        userId: "current-user", // This would normally come from auth context
        type: formData.type,
        title: formData.title,
        message: formData.message,
        ticketId: formData.ticketId || undefined,
        actionUrl: formData.actionUrl || undefined,
      };

      await addNotification(notificationData);

      toast({
        title: "Notification Created",
        description: "Test notification has been created successfully.",
      });

      // Reset form
      setFormData({
        type: "TICKET_ASSIGNED",
        title: "",
        message: "",
        ticketId: "",
        actionUrl: "",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create notification.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Debug Tool
        </CardTitle>
        <CardDescription>
          Create test notifications to debug the notification system
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="type">Notification Type</Label>
            <Select value={formData.type} onValueChange={handleTypeChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {notificationTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="Notification title"
              required
            />
          </div>

          <div>
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) =>
                setFormData({ ...formData, message: e.target.value })
              }
              placeholder="Notification message"
              rows={3}
              required
            />
          </div>

          <div>
            <Label htmlFor="ticketId">Ticket ID (Optional)</Label>
            <Input
              id="ticketId"
              value={formData.ticketId}
              onChange={(e) =>
                setFormData({ ...formData, ticketId: e.target.value })
              }
              placeholder="Related ticket ID"
            />
          </div>

          <div>
            <Label htmlFor="actionUrl">Action URL (Optional)</Label>
            <Input
              id="actionUrl"
              value={formData.actionUrl}
              onChange={(e) =>
                setFormData({ ...formData, actionUrl: e.target.value })
              }
              placeholder="/dashboard/ticket/123"
            />
          </div>

          <Button type="submit" disabled={isCreating} className="w-full">
            {isCreating ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Creating...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Send className="h-4 w-4" />
                Create Test Notification
              </div>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
