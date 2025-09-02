import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserCheck2, Users, UserX } from "lucide-react";
import { getInitialAgents, getAgentStats } from "@/lib/services/agent-server";
import AgentsClient from "./agents-client";
import { DashboardCardSkeleton, TableSkeleton } from "@/components/ui/instant-skeleton";
import { NewAgentDialog } from "@/components/agent/new-agent-dialog";

interface AgentsPageProps {
  searchParams: {
    page?: string;
    search?: string;
    limit?: string;
  };
}

async function AgentStats() {
  const stats = await getAgentStats();
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
          <UserCheck2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalAgents}</div>
          <p className="text-xs text-muted-foreground">
            Service agents registered
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Tickets</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.activeTickets}</div>
          <p className="text-xs text-muted-foreground">
            Currently being worked on
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
          <UserCheck2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.completedToday}</div>
          <p className="text-xs text-muted-foreground">
            Tickets resolved today
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg. Response</CardTitle>
          <UserX className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">2.4h</div>
          <p className="text-xs text-muted-foreground">
            Average response time
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

async function AgentsData({ page, search, limit }: { page: number; search?: string; limit: number }) {
  const agents = search 
    ? await import('@/lib/services/agent-server').then(m => m.searchAgents(search, page, limit))
    : await getInitialAgents(page, limit);
  
  return <AgentsClient initialAgents={agents} initialSearchQuery={search} />;
}

// Server Component - loads instantly with static content + data
export default async function AgentsPage({ searchParams }: AgentsPageProps) {
  const page = parseInt(searchParams.page || '1');
  const search = searchParams.search;
  const limit = parseInt(searchParams.limit || '5');

  return (
    <div className="flex flex-col gap-6">
      {/* Static Header - Server Rendered Instantly */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Service Agents</h1>
          <p className="text-muted-foreground">
            Manage and monitor service agents performance and assignments.
          </p>
        </div>
        <NewAgentDialog />
      </div>

      {/* Stats Cards - Server Rendered with real data */}
      <Suspense fallback={
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({length: 4}).map((_, i) => (
            <DashboardCardSkeleton key={i} />
          ))}
        </div>
      }>
        <AgentStats />
      </Suspense>

      {/* Agents Table - Server + Client Hybrid */}
      <Card>
        <CardHeader>
          <CardTitle>Agent Directory</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<TableSkeleton rows={5} />}>
            <AgentsData page={page} search={search} limit={limit} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}