"use client";

import React, { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react"; // Import a suitable icon
import { useAgentStore } from "@/store/agentStore";

export default function TotalAgentsCard() {
  const {
    totalAgentCount,
    isLoadingTotalAgentCount,
    fetchTotalAgentCount
  } = useAgentStore();

  useEffect(() => {
    // Fetch the count when the component mounts
    fetchTotalAgentCount();
  }, [fetchTotalAgentCount]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>Total Active Agents</CardDescription>
        <CardTitle className="text-2xl">
          {isLoadingTotalAgentCount ? (
            <span className="animate-pulse">Loading...</span>
          ) : (
            totalAgentCount !== null ? totalAgentCount : 'N/A'
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
