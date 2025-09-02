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
  BarChart3,
  Plus,
} from "lucide-react";
import { useTicketStore } from "@/store/ticketStore";
import { useClientStore } from "@/store/clientStore";
import { useAgentStore } from "@/store/agentStore";
import { useEffect, useState, lazy, Suspense } from "react";
import { useAuthStore } from "@/store/authStore";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DashboardCardSkeleton, ChartSkeleton } from "@/components/ui/instant-skeleton";

// Lazy load heavy components
const RecentActivityFeed = lazy(() => import("@/components/dashboard/recent-activity"));
const StatusSummary = lazy(() => import("@/components/dashboard/status-summary"));
const PriorityIssues = lazy(() => import("@/components/dashboard/priority-issues"));
const OverviewMetrics = lazy(() => import("@/components/dashboard/overview-metrics"));
const ExternalCallsList = lazy(() => import("@/components/dashboard/external-calls-list"));
const UpcomingSchedule = lazy(() => import("@/components/dashboard/upcoming-schedule"));
const TotalAgentsCard = lazy(() => import("@/components/dashboard/total-agents-card"));
const TotalClientsCard = lazy(() => import("@/components/dashboard/total-clients-card"));
const ActiveCallsCard = lazy(() => import("@/components/dashboard/active-calls-card"));
const ResolvedTodayCard = lazy(() => import("@/components/dashboard/resolved-today-card"));
const AgentPerformanceCard = lazy(() => import("@/components/performance/AgentPerformanceCard"));

// Define PerformanceData interface
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
  adminNotifications: Array<any>;
}

// Client component for interactive dashboard functionality
export default function DashboardClient() {
  const { user } = useAuthStore();
  const { fetchTickets, fetchDashboardCounts } = useTicketStore();
  const { fetchClients } = useClientStore();
  const { agents, fetchAllAgents } = useAgentStore();
  
  const [selectedAgent, setSelectedAgent] = useState<string>(""); 
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [performanceLoading, setPerformanceLoading] = useState<boolean>(false);

  useEffect(() => {
    const initializeData = async () => {
      await Promise.all([
        fetchTickets(),
        fetchDashboardCounts(),
        fetchClients(),
        fetchAllAgents()
      ]);
    };
    initializeData();
  }, [fetchTickets, fetchDashboardCounts, fetchClients, fetchAllAgents]);

  const fetchAgentPerformance = async (agentId: string) => {
    setPerformanceLoading(true);
    try {
      const response = await fetch(`/api/performance/agent/${agentId}`);
      if (response.ok) {
        const data = await response.json();
        setPerformanceData(data);
      } else {
        console.error("Failed to fetch performance data");
      }
    } catch (error) {
      console.error("Error fetching performance data:", error);
    } finally {
      setPerformanceLoading(false);
    }
  };

  const handleAgentChange = (agentId: string) => {
    setSelectedAgent(agentId);
    if (agentId) {
      fetchAgentPerformance(agentId);
    } else {
      setPerformanceData(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Here&apos;s what&apos;s happening with your business today.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add New
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="reports" disabled>
            Reports
          </TabsTrigger>
          <TabsTrigger value="notifications" disabled>
            Notifications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Suspense fallback={<DashboardCardSkeleton />}>
              <TotalClientsCard />
            </Suspense>
            <Suspense fallback={<DashboardCardSkeleton />}>
              <TotalAgentsCard />
            </Suspense>
            <Suspense fallback={<DashboardCardSkeleton />}>
              <ActiveCallsCard />
            </Suspense>
            <Suspense fallback={<DashboardCardSkeleton />}>
              <ResolvedTodayCard />
            </Suspense>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <div className="col-span-4">
              <Suspense fallback={<ChartSkeleton />}>
                <OverviewMetrics />
              </Suspense>
            </div>
            <div className="col-span-3">
              <Suspense fallback={<DashboardCardSkeleton />}>
                <RecentActivityFeed />
              </Suspense>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <div className="col-span-4">
              <Suspense fallback={<ChartSkeleton />}>
                <StatusSummary />
              </Suspense>
            </div>
            <div className="col-span-3 space-y-4">
              <Suspense fallback={<DashboardCardSkeleton />}>
                <PriorityIssues />
              </Suspense>
              <Suspense fallback={<DashboardCardSkeleton />}>
                <UpcomingSchedule />
              </Suspense>
            </div>
          </div>

          <Suspense fallback={<DashboardCardSkeleton />}>
            <ExternalCallsList />
          </Suspense>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Agent Performance Analysis</CardTitle>
              <CardDescription>
                Select an agent to view detailed performance metrics and insights.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(user?.role === "ADMIN" || user?.role === "RM") && (
                <div className="space-y-2">
                  <label htmlFor="agent-select" className="text-sm font-medium">
                    Select Agent:
                  </label>
                  <Select value={selectedAgent} onValueChange={handleAgentChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose an agent to analyze" />
                    </SelectTrigger>
                    <SelectContent>
                      {agents.map((agent) => (
                        <SelectItem key={agent.id} value={agent.id}>
                          {agent.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {performanceLoading && (
                <div className="flex justify-center items-center py-8">
                  <Spinner className="h-6 w-6" />
                  <span className="ml-2">Loading performance data...</span>
                </div>
              )}

              {performanceData && !performanceLoading && (
                <Suspense fallback={<ChartSkeleton />}>
                  <AgentPerformanceCard data={performanceData} />
                </Suspense>
              )}

              {!selectedAgent && !performanceLoading && (
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4" />
                  <p>Select an agent above to view their performance metrics</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}