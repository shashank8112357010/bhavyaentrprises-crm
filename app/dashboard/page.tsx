"use client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle,
  BarChart3,
  Building2,
  CheckCircle,
  Clock,
  Phone,
  Plus,
  RotateCw,
  UserCheck,
} from "lucide-react";
import RecentActivityFeed from "@/components/dashboard/recent-activity";
import StatusSummary from "@/components/dashboard/status-summary";
import PriorityIssues from "@/components/dashboard/priority-issues";
import OverviewMetrics from "@/components/dashboard/overview-metrics";
import ExternalCallsList from "@/components/dashboard/external-calls-list";
import UpcomingSchedule from "@/components/dashboard/upcoming-schedule";
import { useTicketStore } from "@/store/ticketStore";
import { useClientStore } from "@/store/clientStore";
import { useAgentStore } from "@/store/agentStore";
import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import TotalAgentsCard from "@/components/dashboard/total-agents-card";
import TotalClientsCard from "@/components/dashboard/total-clients-card";

export default function Home() {
  const {
    fetchTickets,
    fetchDashboardCounts,
    openTicketsCount,
    scheduledTodayCount,
    clientUpdatesNeededCount,
    completedThisWeekCount,
    isLoadingDashboardCounts,
  } = useTicketStore();

  const { fetchClients } = useClientStore();
  const { fetchAgents } = useAgentStore();
  const { user } = useAuthStore();

  // Check if user has admin privileges
  const isAdminOrAccounts = user?.role === "ADMIN" || user?.role === "ACCOUNTS";

  useEffect(() => {
    // Fetch all dashboard data from Zustand stores instead of individual API calls
    const loadDashboardData = async () => {
      try {
        // Fetch tickets with role-based access
        await fetchTickets();
        await fetchDashboardCounts();

        // Only fetch clients and agents data if user is admin
        if (isAdminOrAccounts) {
          await fetchClients();
          await fetchAgents();
        }
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      }
    };

    loadDashboardData();
  }, [
    fetchTickets,
    fetchDashboardCounts,
    fetchClients,
    fetchAgents,
    isAdminOrAccounts,
  ]);

  return (
    <div className="flex flex-col gap-6 h-[100px]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {user && user.name ? `Welcome, ${user.name}` : "Dashboard"}
          </h1>
          <p className="text-muted-foreground">
            Monitor repairs, track progress, and manage client requests
          </p>
        </div>
        {/* <div className="flex items-center gap-2">
          {isAdminOrAccounts && (
            <Button variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              New Ticket
            </Button>
          )}
        </div> */}
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>
              {isAdminOrAccounts ? "Open Tickets" : "My Open Tickets"}
            </CardDescription>
            <CardTitle className="text-2xl">
              {isLoadingDashboardCounts ? (
                <span>
                  <Spinner size="5" />
                  </span>
              ) : (
                openTicketsCount !== undefined && openTicketsCount !== null ? openTicketsCount : <span className="text-muted-foreground">N/A</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-muted-foreground">
              <RotateCw className="mr-1 h-4 w-4 text-primary" />
              <span>
                {isAdminOrAccounts ? "Across all agents" : "Assigned to you"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>
              {isAdminOrAccounts ? "Scheduled Today" : "My Schedule Today"}
            </CardDescription>
            <CardTitle className="text-2xl">
              {isLoadingDashboardCounts ? (
  <Spinner size="5" />
) : (
  scheduledTodayCount !== undefined && scheduledTodayCount !== null ? scheduledTodayCount : <span className="text-muted-foreground">N/A</span>
)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="mr-1 h-4 w-4 text-yellow-500" />
              <span>
                {isAdminOrAccounts
                  ? "All scheduled visits"
                  : "Your scheduled visits"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>
              {isAdminOrAccounts
                ? "Client Updates Needed"
                : "My Updates Needed"}
            </CardDescription>
            <CardTitle className="text-2xl">
              {isLoadingDashboardCounts ? (
  <Spinner size="5" />
) : (
  clientUpdatesNeededCount !== undefined && clientUpdatesNeededCount !== null ? clientUpdatesNeededCount : <span className="text-muted-foreground">N/A</span>
)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-muted-foreground">
              <AlertTriangle className="mr-1 h-4 w-4 text-destructive" />
              <span>
                {isAdminOrAccounts
                  ? "Requiring attention"
                  : "Need your attention"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>
              {isAdminOrAccounts
                ? "Completed This Week"
                : "My Completed This Week"}
            </CardDescription>
            <CardTitle className="text-2xl">
              {isLoadingDashboardCounts ? (
  <Spinner size="5" />
) : (
  completedThisWeekCount !== undefined && completedThisWeekCount !== null ? completedThisWeekCount : <span className="text-muted-foreground">N/A</span>
)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-muted-foreground">
              <CheckCircle className="mr-1 h-4 w-4 text-green-500" />
              <span>
                {isAdminOrAccounts
                  ? "↑ 15% from last week"
                  : "Your completions"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Conditionally rendered cards for admins */}
        {isAdminOrAccounts && <TotalAgentsCard />}
        {isAdminOrAccounts && <TotalClientsCard />}
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Status Summary</CardTitle>
            <CardDescription>
              {isAdminOrAccounts
                ? "Current distribution of maintenance requests"
                : "Distribution of your assigned requests"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StatusSummary />
          </CardContent>
        </Card>
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Priority Issues</CardTitle>
            <CardDescription>
              {isAdminOrAccounts
                ? "Maintenance requests requiring immediate attention"
                : "Your high-priority assignments"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PriorityIssues />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="metrics" className="w-full">
        <TabsList>
          <TabsTrigger value="metrics">
            <BarChart3 className="h-4 w-4 mr-2" />
            Metrics
          </TabsTrigger>
          <TabsTrigger value="calls">
            <Phone className="h-4 w-4 mr-2" />
            Recent Calls
          </TabsTrigger>
          <TabsTrigger value="activity">
            <UserCheck className="h-4 w-4 mr-2" />
            Activity
          </TabsTrigger>
          <TabsTrigger value="schedule">
            <Clock className="h-4 w-4 mr-2" />
            Schedule
          </TabsTrigger>
          {isAdminOrAccounts && (
            <TabsTrigger value="clients">
              <Building2 className="h-4 w-4 mr-2" />
              Top Clients
            </TabsTrigger>
          )}
        </TabsList>
        <TabsContent value="metrics">
          <Card>
            <CardHeader>
              <CardTitle>Performance Overview</CardTitle>
              <CardDescription>
                {isAdminOrAccounts
                  ? "Key metrics for the current month"
                  : "Your performance metrics for the current month"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <OverviewMetrics />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="calls">
          <Card>
            <CardHeader>
              <CardTitle>Recent External Calls</CardTitle>
              <CardDescription>
                {isAdminOrAccounts
                  ? "Last 10 calls with clients"
                  : "Your last 10 calls with clients"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ExternalCallsList />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                {isAdminOrAccounts
                  ? "Latest actions taken on maintenance requests"
                  : "Your latest actions on maintenance requests"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RecentActivityFeed />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="schedule">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Schedule</CardTitle>
              <CardDescription>
                {isAdminOrAccounts
                  ? "Maintenance visits for the next 7 days"
                  : "Your maintenance visits for the next 7 days"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UpcomingSchedule />
            </CardContent>
          </Card>
        </TabsContent>
        {isAdminOrAccounts && (
          <TabsContent value="clients">
            <Card>
              <CardHeader>
                <CardTitle>Top Clients</CardTitle>
                <CardDescription>
                  Client performance and ticket statistics
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Add top clients component here if needed */}
                <p className="text-muted-foreground">
                  Top clients data coming soon.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
