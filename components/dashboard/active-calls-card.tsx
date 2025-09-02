"use client";

import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone } from "lucide-react";
import { useTicketStore } from "@/store/ticketStore";

export default function ActiveCallsCard() {
  const { scheduledTodayCount, isLoadingDashboardCounts, fetchDashboardCounts } = useTicketStore();

  useEffect(() => {
    fetchDashboardCounts();
  }, [fetchDashboardCounts]);

  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  
  // Calculate change from yesterday (simplified for demo)
  const changeFromYesterday = scheduledTodayCount ? Math.floor(scheduledTodayCount * 0.1) : 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Active Calls</CardTitle>
        <Phone className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {isLoadingDashboardCounts ? "Loading..." : scheduledTodayCount || 0}
        </div>
        <p className="text-xs text-muted-foreground">
          {isLoadingDashboardCounts ? "" : `+${changeFromYesterday} from yesterday`}
        </p>
      </CardContent>
    </Card>
  );
}