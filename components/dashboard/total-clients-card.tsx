// components/dashboard/total-clients-card.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2 } from "lucide-react";
import { useClientStore } from "@/store/clientStore";
import { useDashboardStore } from "@/store/dashboardStore";

export default function TotalClientsCard() {
  const { allClients: clients, loading } = useClientStore();
  const { data: dashboardData } = useDashboardStore();
  
  // Use counts from dashboard data API if available, otherwise fallback to client store count
  const totalClients = dashboardData?.counts?.totalClients ?? clients.length;
  const activeClients = clients.filter(
    (client) => client.contractStatus?.toLowerCase() === "active",
  ).length;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center">
          <Building2 className="mr-2 h-4 w-4" />
          Total Clients
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {loading ? "Loading..." : totalClients}
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {loading ? "" : `${activeClients} active clients`}
        </div>
      </CardContent>
    </Card>
  );
}
