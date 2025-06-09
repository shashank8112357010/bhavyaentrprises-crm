// components/notifications/notification-settings.tsx
"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import {
  Bell,
  BellOff,
  Search,
  Filter,
  CheckCircle,
  Trash2,
  Settings as SettingsIcon,
  Mail,
  Smartphone,
  Monitor,
  RefreshCw,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/hooks/use-toast";
import { useNotificationStore } from "@/store/notificationStore";
import { NotificationItem } from "./notification-item";
import { NotificationDebug } from "./notification-debug";
import type { NotificationType } from "@/lib/services/notification";

interface NotificationPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  inAppNotifications: boolean;
  notificationTypes: {
    TICKET_ASSIGNED: boolean;
    TICKET_STATUS_CHANGED: boolean;
    TICKET_COMMENTED: boolean;
    TICKET_DUE_DATE_APPROACHING: boolean;
    WORK_STAGE_UPDATED: boolean;
  };
}

export function NotificationSettings() {
  const { toast } = useToast();
  const {
    notifications,
    loading,
    error,
    unreadCount,
    totalNotifications,
    currentPage,
    notificationsPerPage,
    fetchNotifications,
    markAllAsRead,
    fetchUnreadCount,
    setCurrentPage,
    setNotificationsPerPage,
  } = useNotificationStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<
    "all" | "unread" | NotificationType
  >("all");
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    emailNotifications: true,
    pushNotifications: false,
    inAppNotifications: true,
    notificationTypes: {
      TICKET_ASSIGNED: true,
      TICKET_STATUS_CHANGED: true,
      TICKET_COMMENTED: true,
      TICKET_DUE_DATE_APPROACHING: true,
      WORK_STAGE_UPDATED: true,
    },
  });

  useEffect(() => {
    // Temporarily disable automatic fetching until database is set up
    // TODO: Re-enable after running: npx prisma migrate dev
    // const filters: any = {
    //   limit: notificationsPerPage,
    //   offset: (currentPage - 1) * notificationsPerPage,
    // };
    // if (filterType === "unread") {
    //   filters.isRead = false;
    // } else if (filterType !== "all") {
    //   filters.type = filterType;
    // }
    // fetchNotifications(filters);
  }, [currentPage, notificationsPerPage, filterType, fetchNotifications]);

  useEffect(() => {
    // Temporarily disable automatic fetching until database is set up
    // TODO: Re-enable after running: npx prisma migrate dev
    // fetchUnreadCount();
  }, [fetchUnreadCount]);

  const handlePreferenceChange = (
    key: keyof NotificationPreferences,
    value: boolean,
  ) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: value,
    }));

    // Here you would typically save to backend
    toast({
      title: "Preferences Updated",
      description: "Your notification preferences have been saved.",
    });
  };

  const handleNotificationTypeChange = (
    type: keyof NotificationPreferences["notificationTypes"],
    value: boolean,
  ) => {
    setPreferences((prev) => ({
      ...prev,
      notificationTypes: {
        ...prev.notificationTypes,
        [type]: value,
      },
    }));

    toast({
      title: "Notification Type Updated",
      description: `${type.replace(/_/g, " ")} notifications have been ${value ? "enabled" : "disabled"}.`,
    });
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      toast({
        title: "Success",
        description: "All notifications marked as read.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark all notifications as read.",
        variant: "destructive",
      });
    }
  };

  const handleRefresh = () => {
    const filters: any = {
      limit: notificationsPerPage,
      offset: (currentPage - 1) * notificationsPerPage,
    };

    if (filterType === "unread") {
      filters.isRead = false;
    } else if (filterType !== "all") {
      filters.type = filterType;
    }

    fetchNotifications(filters);
    fetchUnreadCount();
  };

  const totalPages = Math.ceil(totalNotifications / notificationsPerPage);

  const notificationTypeLabels: Record<
    keyof NotificationPreferences["notificationTypes"],
    string
  > = {
    TICKET_ASSIGNED: "Ticket Assignments",
    TICKET_STATUS_CHANGED: "Status Changes",
    TICKET_COMMENTED: "New Comments",
    TICKET_DUE_DATE_APPROACHING: "Due Date Reminders",
    WORK_STAGE_UPDATED: "Work Stage Updates",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Notifications</h2>
          <p className="text-muted-foreground">
            Manage your notification preferences and view your notification
            history
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          {unreadCount > 0 && (
            <Button onClick={handleMarkAllAsRead}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Mark All Read ({unreadCount})
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="notifications" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger
            value="notifications"
            className="flex items-center gap-2"
          >
            <Bell className="h-4 w-4" />
            Notifications
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-1">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <SettingsIcon className="h-4 w-4" />
            Preferences
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Notification History</CardTitle>
              <CardDescription>
                View and manage your notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search notifications..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select
                  value={filterType}
                  onValueChange={(
                    value: "all" | "unread" | NotificationType,
                  ) => {
                    setFilterType(value);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-full md:w-48">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Notifications</SelectItem>
                    <SelectItem value="unread">Unread Only</SelectItem>
                    <Separator className="my-1" />
                    <SelectItem value="TICKET_ASSIGNED">
                      Ticket Assignments
                    </SelectItem>
                    <SelectItem value="TICKET_STATUS_CHANGED">
                      Status Changes
                    </SelectItem>
                    <SelectItem value="TICKET_COMMENTED">
                      New Comments
                    </SelectItem>
                    <SelectItem value="TICKET_DUE_DATE_APPROACHING">
                      Due Date Reminders
                    </SelectItem>
                    <SelectItem value="WORK_STAGE_UPDATED">
                      Work Stage Updates
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Notifications List */}
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Spinner size="6" />
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <p className="text-destructive mb-4">{error}</p>
                  <Button onClick={handleRefresh} variant="outline">
                    Try Again
                  </Button>
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-8">
                  <BellOff className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {filterType === "unread"
                      ? "No unread notifications"
                      : "No notifications found"}
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-96">
                  <div className="space-y-2">
                    {notifications.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                      />
                    ))}
                  </div>
                </ScrollArea>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-between items-center mt-6">
                  <p className="text-sm text-muted-foreground">
                    Showing {(currentPage - 1) * notificationsPerPage + 1} to{" "}
                    {Math.min(
                      currentPage * notificationsPerPage,
                      totalNotifications,
                    )}{" "}
                    of {totalNotifications} notifications
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Delivery Methods */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  Delivery Methods
                </CardTitle>
                <CardDescription>
                  Choose how you want to receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Bell className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <Label htmlFor="in-app">In-App Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Show notifications in the application
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="in-app"
                    checked={preferences.inAppNotifications}
                    onCheckedChange={(checked) =>
                      handlePreferenceChange("inAppNotifications", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <Label htmlFor="email">Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Send notifications to your email
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="email"
                    checked={preferences.emailNotifications}
                    onCheckedChange={(checked) =>
                      handlePreferenceChange("emailNotifications", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Smartphone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <Label htmlFor="push">Push Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Browser push notifications
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="push"
                    checked={preferences.pushNotifications}
                    onCheckedChange={(checked) =>
                      handlePreferenceChange("pushNotifications", checked)
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Notification Types */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Notification Types</CardTitle>
                <CardDescription>
                  Choose which types of notifications you want to receive
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(preferences.notificationTypes).map(
                  ([type, enabled]) => (
                    <div
                      key={type}
                      className="flex items-center justify-between"
                    >
                      <div>
                        <Label htmlFor={type}>
                          {
                            notificationTypeLabels[
                              type as keyof typeof notificationTypeLabels
                            ]
                          }
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Get notified when{" "}
                          {type.toLowerCase().replace(/_/g, " ")}
                        </p>
                      </div>
                      <Switch
                        id={type}
                        checked={enabled}
                        onCheckedChange={(checked) =>
                          handleNotificationTypeChange(
                            type as keyof NotificationPreferences["notificationTypes"],
                            checked,
                          )
                        }
                      />
                    </div>
                  ),
                )}
              </CardContent>
            </Card>
          </div>

          {/* Debug component - remove in production */}
          <NotificationDebug />
        </TabsContent>
      </Tabs>
    </div>
  );
}
