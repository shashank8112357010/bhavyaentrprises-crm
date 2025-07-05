"use client";

import { useCallback, useEffect, useState } from "react";
import { Filter, Plus, Search, Settings, List, Grid3X3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/authStore";
import { useTicketStore } from "@/store/ticketStore";
import APIService from "@/lib/services/api-service";
import InfiniteScrollList from "@/components/ui/infinite-scroll";
import { useDebounce } from "@/hooks/useDebounce";
import { format } from "date-fns";

// Enhanced ticket interface for infinite scroll
interface EnhancedTicket {
  id: string;
  ticketId: string;
  title: string;
  status: string;
  priority: string;
  client: {
    id: string;
    name: string;
  };
  assignee: {
    id: string;
    name: string;
    avatar?: string;
    initials?: string;
  };
  createdAt: string;
  dueDate?: string;
  description: string;
}

// Status configuration
const TICKET_STATUSES = [
  { value: "all", label: "All Statuses", color: "default" },
  { value: "new", label: "New", color: "blue" },
  { value: "inProgress", label: "In Progress", color: "yellow" },
  { value: "onHold", label: "On Hold", color: "orange" },
  { value: "completed", label: "Completed", color: "green" },
  { value: "billing_pending", label: "Billing Pending", color: "purple" },
  { value: "billing_completed", label: "Billing Completed", color: "emerald" },
];

const PRIORITY_LEVELS = [
  { value: "all", label: "All Priorities" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

export default function EnhancedTicketsPage() {
  // Local state for filters and UI
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"infinite" | "paginated">("infinite");
  
  // Enhanced state for infinite scroll tickets
  const [allTickets, setAllTickets] = useState<EnhancedTicket[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);

  const { toast } = useToast();
  const { user } = useAuthStore();
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // Fetch tickets with enhanced pagination
  const fetchTickets = useCallback(async (options: {
    page?: number;
    append?: boolean;
    force?: boolean;
  } = {}) => {
    const { page = 1, append = false, force = false } = options;
    
    // Skip if not forcing and we already have data
    if (!force && !append && allTickets.length > 0 && !loading) {
      return;
    }

    // Set loading state
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      // Build filters
      const filters: Record<string, any> = {};
      if (statusFilter && statusFilter !== "all") {
        filters.status = statusFilter;
      }
      if (priorityFilter && priorityFilter !== "all") {
        filters.priority = priorityFilter;
      }
      if (user?.role !== "ADMIN") {
        filters.assigneeId = user?.userId;
      }

      const response = await APIService.getPaginatedList<EnhancedTicket>('/ticket', {
        page,
        limit: 20,
        search: debouncedSearchQuery,
        filters
      });

      if (append) {
        // Append new tickets for infinite scroll
        const existingIds = new Set(allTickets.map(t => t.id));
        const newTickets = response.data.filter(t => !existingIds.has(t.id));
        setAllTickets(prev => [...prev, ...newTickets]);
      } else {
        // Replace tickets for new search/filter
        setAllTickets(response.data);
      }

      setCurrentPage(response.page);
      setTotal(response.total);
      setHasNextPage(response.hasNextPage);
    } catch (err: any) {
      setError(err.message || "Failed to fetch tickets");
      toast({
        title: "Error",
        description: err.message || "Failed to fetch tickets",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [debouncedSearchQuery, statusFilter, priorityFilter, user, allTickets, loading, toast]);

  // Fetch next page for infinite scroll
  const fetchNextPage = useCallback(async () => {
    if (!hasNextPage || loadingMore) return;
    
    await fetchTickets({
      page: currentPage + 1,
      append: true
    });
  }, [hasNextPage, loadingMore, currentPage, fetchTickets]);

  // Reset and refresh
  const handleRefresh = useCallback(async () => {
    setAllTickets([]);
    setCurrentPage(1);
    setTotal(0);
    setHasNextPage(false);
    await fetchTickets({ force: true });
  }, [fetchTickets]);

  // Effect for initial load and filter changes
  useEffect(() => {
    handleRefresh();
  }, [debouncedSearchQuery, statusFilter, priorityFilter, handleRefresh]);

  // Render individual ticket card
  const renderTicketCard = useCallback((ticket: EnhancedTicket, index: number) => {
    const statusConfig = TICKET_STATUSES.find(s => s.value === ticket.status) || TICKET_STATUSES[0];
    
    return (
      <Card key={ticket.id} className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">{ticket.title}</CardTitle>
                <Badge variant="outline" className="text-xs">
                  {ticket.ticketId}
                </Badge>
              </div>
              <CardDescription className="line-clamp-2">
                {ticket.description}
              </CardDescription>
            </div>
            <Badge 
              variant="secondary"
              className={`text-xs bg-${statusConfig.color}-100 text-${statusConfig.color}-800 border-${statusConfig.color}-200`}
            >
              {statusConfig.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium text-muted-foreground">Client</p>
              <p className="truncate">{ticket.client?.name}</p>
            </div>
            <div>
              <p className="font-medium text-muted-foreground">Priority</p>
              <Badge 
                variant={
                  ticket.priority === "urgent" ? "destructive" :
                  ticket.priority === "high" ? "default" :
                  "secondary"
                }
                className="text-xs"
              >
                {ticket.priority}
              </Badge>
            </div>
            <div>
              <p className="font-medium text-muted-foreground">Assignee</p>
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={ticket.assignee?.avatar} />
                  <AvatarFallback className="text-xs">
                    {ticket.assignee?.initials || ticket.assignee?.name?.slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate">{ticket.assignee?.name}</span>
              </div>
            </div>
            <div>
              <p className="font-medium text-muted-foreground">Created</p>
              <p>{format(new Date(ticket.createdAt), "MMM dd, yyyy")}</p>
            </div>
            {ticket.dueDate && (
              <div className="col-span-2">
                <p className="font-medium text-muted-foreground">Due Date</p>
                <p className={
                  new Date(ticket.dueDate) < new Date() ? "text-destructive" : ""
                }>
                  {format(new Date(ticket.dueDate), "MMM dd, yyyy")}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }, []);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Enhanced Tickets</h1>
          <p className="text-muted-foreground">
            Manage tickets with infinite scroll and advanced pagination
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <Search className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Ticket
          </Button>
        </div>
      </div>

      {/* Filters and View Toggle */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tickets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-[250px] pl-8"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {TICKET_STATUSES.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              {PRIORITY_LEVELS.map((priority) => (
                <SelectItem key={priority.value} value={priority.value}>
                  {priority.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">View:</span>
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)} className="w-auto">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="infinite" className="text-xs">
                <List className="w-3 h-3 mr-1" />
                Infinite
              </TabsTrigger>
              <TabsTrigger value="paginated" className="text-xs">
                <Grid3X3 className="w-3 h-3 mr-1" />
                Pages
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Content */}
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
        <TabsContent value="infinite" className="mt-0">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {allTickets.length} of {total} tickets
              </p>
              {hasNextPage && (
                <p className="text-xs text-muted-foreground">
                  Scroll down to load more
                </p>
              )}
            </div>
            
            <InfiniteScrollList
              data={allTickets}
              hasMore={hasNextPage}
              loading={loading}
              loadingMore={loadingMore}
              error={error}
              fetchMore={fetchNextPage}
              onRefresh={handleRefresh}
              renderItem={renderTicketCard}
              searchQuery={searchQuery}
              activeFilters={{
                ...(statusFilter !== "all" && { status: statusFilter }),
                ...(priorityFilter !== "all" && { priority: priorityFilter })
              }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              height="calc(100vh - 350px)"
            />
          </div>
        </TabsContent>

        <TabsContent value="paginated" className="mt-0">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Traditional pagination view - Use existing numbered pagination component here
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allTickets.slice(0, 15).map((ticket, index) => renderTicketCard(ticket, index))}
            </div>
            
            {/* Placeholder for numbered pagination component */}
            <div className="flex items-center justify-center py-8 border-2 border-dashed border-muted-foreground/25 rounded-lg">
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  Numbered pagination component would go here
                </p>
                <p className="text-xs text-muted-foreground">
                  Use existing ReactPaginate component for numbered pages
                </p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
