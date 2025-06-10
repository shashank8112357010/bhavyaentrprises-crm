"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useNotificationStore } from "@/store/notificationStore";
import { NotificationItem } from "./notification-item";
import { formatDistanceToNow } from "date-fns";
import {
  Bell,
  Trash2,
  CheckCheck,
  Search,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function NotificationSettings() {
  const {
    notifications,
    unreadCount,
    loading,
    error,
    currentPage,
    totalNotifications,
    notificationsPerPage,
    fetchNotifications,
    markAllAsRead,
    deleteNotification,
    setCurrentPage,
    setNotificationsPerPage,
    clearError,
  } = useNotificationStore();

  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSystemAvailable, setIsSystemAvailable] = useState(true);

  const loadNotifications = useCallback(async () => {
    try {
      const offset = (currentPage - 1) * notificationsPerPage;
      const filters: any = {
        limit: notificationsPerPage,
        offset,
      };

      if (filter === "unread") {
        filters.isRead = false;
      } else if (filter === "read") {
        filters.isRead = true;
      }

      await fetchNotifications(filters);
      setIsSystemAvailable(true);
    } catch (error: any) {
      if (
        error.message.includes("doesn't exist") ||
        error.message.includes("relation") ||
        error.message.includes("P2021") ||
        error.message.includes("table")
      ) {
        setIsSystemAvailable(false);
      }
    }
  }, [currentPage, notificationsPerPage, filter, fetchNotifications]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      await loadNotifications(); // Refresh after marking all as read
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const handleDeleteAll = async () => {
    if (
      !confirm(
        "Are you sure you want to delete all notifications? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      // Delete all notifications one by one
      for (const notification of notifications) {
        await deleteNotification(notification.id);
      }
      await loadNotifications(); // Refresh after deletion
    } catch (error) {
      console.error("Failed to delete all notifications:", error);
    }
  };

  const handleRefresh = () => {
    clearError();
    loadNotifications();
  };

  const filteredNotifications = notifications.filter((notification) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      notification.title.toLowerCase().includes(query) ||
      notification.message.toLowerCase().includes(query) ||
      notification.ticket?.ticketId.toLowerCase().includes(query)
    );
  });

  const totalPages = Math.ceil(totalNotifications / notificationsPerPage);

  if (!isSystemAvailable) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Settings
          </CardTitle>
          <CardDescription>
            Manage your notification preferences and view notification history
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Notification system is being set up. Run the database migration to
              enable notifications:
              <br />
              <code className="bg-muted px-2 py-1 rounded mt-2 inline-block">
                npx prisma migrate dev
              </code>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Settings
          </CardTitle>
          <CardDescription>
            Manage your notification preferences and view notification history
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold">{totalNotifications}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-destructive">
                {unreadCount}
              </div>
              <div className="text-sm text-muted-foreground">Unread</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {totalNotifications - unreadCount}
              </div>
              <div className="text-sm text-muted-foreground">Read</div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Label htmlFor="search" className="text-sm font-medium">
                Search notifications
              </Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by title, message, or ticket ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <div>
                <Label htmlFor="filter" className="text-sm font-medium">
                  Filter
                </Label>
                <Select
                  value={filter}
                  onValueChange={(value: any) => setFilter(value)}
                >
                  <SelectTrigger className="w-32 mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="unread">Unread</SelectItem>
                    <SelectItem value="read">Read</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="perPage" className="text-sm font-medium">
                  Per page
                </Label>
                <Select
                  value={notificationsPerPage.toString()}
                  onValueChange={(value) => {
                    setNotificationsPerPage(Number(value));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-20 mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 mb-6">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllAsRead}
                disabled={loading}
              >
                <CheckCheck className="h-4 w-4 mr-2" />
                Mark all as read
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeleteAll}
                disabled={loading}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear all
              </Button>
            )}
          </div>

          {error && (
            <Alert className="mb-6" variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  className="ml-2"
                >
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Notifications</span>
            {filteredNotifications.length > 0 && (
              <Badge variant="secondary">
                {filteredNotifications.length} of {totalNotifications}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span className="text-muted-foreground">
                  Loading notifications...
                </span>
              </div>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-2">
                {searchQuery
                  ? "No notifications match your search."
                  : filter === "unread"
                    ? "No unread notifications."
                    : filter === "read"
                      ? "No read notifications."
                      : "No notifications yet."}
              </p>
              {searchQuery && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSearchQuery("")}
                >
                  Clear search
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredNotifications.map((notification, index) => (
                <div key={notification.id}>
                  <NotificationItem
                    notification={notification}
                    showDelete={true}
                    onClick={() => {
                      // Handle notification click if needed
                    }}
                  />
                  {index < filteredNotifications.length - 1 && (
                    <Separator className="my-2" />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * notificationsPerPage + 1} to{" "}
                {Math.min(
                  currentPage * notificationsPerPage,
                  totalNotifications,
                )}{" "}
                of {totalNotifications} notifications
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1 || loading}
                >
                  Previous
                </Button>
                <span className="text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages || loading}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
