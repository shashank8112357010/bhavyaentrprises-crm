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
import AgentPerformanceCard from "@/components/performance/AgentPerformanceCard"; // Import the new component
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // For admin dropdown


// Define PerformanceData interface (can be moved to a types file later)
interface PerformanceData {
  region: string;
  agent: string;
  score: string;
  rating: string;
  jobs: number;
  incentivePerJob: number;
  bonus: number;
  totalIncentive: number;
  jcrPending: Array<{ ticketId: string; title?: string; Quotation?: any[]; expenses?: any[] }>;
  poPending: Array<{ ticketId: string; title?: string; Quotation?: any[]; expenses?: any[] }>;
  billingReadyNotSubmitted: Array<{ ticketId: string; title?: string; Quotation?: any[]; expenses?: any[]; status?: string }>;
  pendingClientAction: Array<{ ticketId: string; title?: string; feedback?: string }>;
  expectedExpenses: number;
  adminNotifications: Array<any>; // Simplified for brevity, use specific type if needed
}


import dynamic from "next/dynamic";
const ProfitLossChart = dynamic(() => import('./finances/ProfitLossChart'), { ssr: false });

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
  const { agents: agentListFromStore, fetchAgents } = useAgentStore(); // Get agents list
  const { user, isLoading: isAuthLoading } = useAuthStore();

  // Performance Card State
  const [selectedAgentIdForPerformance, setSelectedAgentIdForPerformance] = useState<string | null>(null);
  const [agentPerformanceData, setAgentPerformanceData] = useState<PerformanceData | null>(null);
  const [isPerformanceLoading, setIsPerformanceLoading] = useState<boolean>(false);
  const [performanceError, setPerformanceError] = useState<string | null>(null);


  // Check user roles
  const isAdmin = user?.role === "ADMIN";
  const isAgent = user?.role === "RM" || user?.role === "MST"; // Define your agent roles
  const isAdminOrAccounts = isAdmin || user?.role === "ACCOUNTS";


  useEffect(() => {
    const loadInitialData = async () => {
      if (!isAuthLoading && user) {
        // Common data for all logged-in users
        await fetchTickets();
        await fetchDashboardCounts();

        if (isAdminOrAccounts) {
          await fetchClients();
          await fetchAgents(); // Fetches agents for the dropdown if admin
        }

        // Setup for performance card
        if (isAdmin && user.id) {
          // Admin: set self as initial selected, or first from list, or null
          // For simplicity, let's wait for user to select or set it to their own if they are also an agent.
          // setSelectedAgentIdForPerformance(user.id); // Or null to force selection
        } else if (isAgent && user.id) {
          setSelectedAgentIdForPerformance(user.id); // Agent sees their own performance
        }
      }
    };
    loadInitialData();
  }, [user, isAuthLoading, fetchTickets, fetchDashboardCounts, fetchClients, fetchAgents, isAdmin, isAgent, isAdminOrAccounts]);


  // Fetch performance data when selectedAgentIdForPerformance changes
  useEffect(() => {
    if (selectedAgentIdForPerformance) {
      const fetchPerformance = async () => {
        setIsPerformanceLoading(true);
        setPerformanceError(null);
        try {
          const response = await fetch(`/api/performance/agent/${selectedAgentIdForPerformance}`);
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Failed to fetch performance: ${response.statusText}`);
          }
          const data: PerformanceData = await response.json();
          setAgentPerformanceData(data);
        } catch (err: any) {
          setPerformanceError(err.message);
          console.error("Error fetching agent performance on dashboard:", err);
        } finally {
          setIsPerformanceLoading(false);
        }
      };
      fetchPerformance();
    } else {
      // Clear performance data if no agent is selected (e.g. admin hasn't selected one yet)
      setAgentPerformanceData(null);
    }
  }, [selectedAgentIdForPerformance]);


  const handleAgentSelectionChange = (agentId: string) => {
    setSelectedAgentIdForPerformance(agentId);
  };

  // Filtered list of agents for dropdown (e.g., only RM and MST roles)
  const displayableAgents = agentListFromStore.filter(agent => agent.role === 'RM' || agent.role === 'MST' || agent.role === 'ADMIN');


  return (
    <div className="flex flex-col gap-6 pb-10"> {/* Added pb-10 for spacing */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {user && user.name ? `Welcome, ${user.name}` : "Dashboard"}
          </h1>
          <p className="text-muted-foreground">
            Monitor repairs, track progress, and manage client requests.
          </p>
        </div>
      </div>

      {/* Performance Card Section */}
      {isAdmin && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Agent Performance Overview</CardTitle>
            <CardDescription>Select an agent to view their performance details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select onValueChange={handleAgentSelectionChange} defaultValue={selectedAgentIdForPerformance || undefined}>
              <SelectTrigger className="w-full md:w-1/2 lg:w-1/3">
                <SelectValue placeholder="Select an Agent" />
              </SelectTrigger>
              <SelectContent>
                {displayableAgents.length > 0 ? (
                  displayableAgents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.name} ({agent.role})
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-2 text-muted-foreground">No agents available to select.</div>
                )}
              </SelectContent>
            </Select>
            {selectedAgentIdForPerformance && (
              <AgentPerformanceCard
                performanceData={agentPerformanceData}
                isLoading={isPerformanceLoading}
                error={performanceError}
              />
            )}
            {!selectedAgentIdForPerformance && !isPerformanceLoading && (
                 <p className="text-muted-foreground p-4 text-center">Please select an agent to view their performance.</p>
            )}
          </CardContent>
        </Card>
      )}

      {isAgent && !isAdmin && selectedAgentIdForPerformance && ( // Non-admin agent sees their own card
        <div className="mb-6">
           <h2 className="text-2xl font-semibold mb-3">My Performance</h2>
          <AgentPerformanceCard
            performanceData={agentPerformanceData}
            isLoading={isPerformanceLoading}
            error={performanceError}
          />
        </div>
      )}


      {/* Existing Dashboard Cards */}
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


      <ProfitLossChart />

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
