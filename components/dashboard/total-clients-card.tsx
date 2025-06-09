// components/dashboard/total-clients-card.tsx
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2 } from "lucide-react";
import { useClientStore } from "@/store/clientStore";

export default function TotalClientsCard() {
  const { clients, fetchClients } = useClientStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadClients = async () => {
      try {
        await fetchClients();
      } catch (error) {
        console.error("Failed to fetch clients:", error);
      } finally {
        setLoading(false);
      }
    };

    loadClients();
  }, [fetchClients]);

  const totalClients = clients.length;
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
