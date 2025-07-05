"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react"; // Import a suitable icon
import { useAgentStore } from "@/store/agentStore";
import { useDashboardStore } from "@/store/dashboardStore";

export default function TotalAgentsCard() {
  const { totalAgentCount, isLoadingTotalAgentCount } = useAgentStore();
  const { data: dashboardData, loading: dashboardLoading } = useDashboardStore();
  
  // Use count from dashboard data API if available, otherwise fallback to agent store count
  const agentCount = dashboardData?.counts?.totalAgents ?? totalAgentCount;
  const isLoading = dashboardLoading || isLoadingTotalAgentCount;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>Total Active Agents</CardDescription>
        <CardTitle className="text-2xl">
          {isLoading ? (
            <span className="animate-pulse">Loading...</span>
          ) : (
            agentCount !== null ? agentCount : 'N/A'
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center text-sm text-muted-foreground">
          <Users className="mr-1 h-4 w-4 text-primary" />
          <span>(RM, MST, Backend, Accounts).</span>
        </div>
      </CardContent>
    </Card>
  );
}
