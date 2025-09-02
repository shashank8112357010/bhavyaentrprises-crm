// app/dashboard/performance/agent/[agentId]/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import AgentPerformanceCard from '@/components/performance/AgentPerformanceCard'; // Adjusted path

// Define a type for the performance data structure - consistent with AgentPerformanceCard
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
  adminNotifications: Array<{
    ticketId: string;
    region: string;
    agent: string;
    status: string;
    billingStage: string;
    quotationAmount: number;
    expenseAmount: number;
    jcrUploaded: boolean;
    poUploaded: boolean;
    feedback: string;
  }>;
}

export default function AgentPerformanceDetailsPage() {
  const params = useParams();
  const agentId = params.agentId as string;

  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (agentId) {
      const fetchPerformanceData = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const response = await fetch(`/api/performance/agent/${agentId}`);
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Failed to fetch performance data: ${response.statusText}`);
          }
          const data: PerformanceData = await response.json();
          setPerformanceData(data);
        } catch (err: any) {
          setError(err.message);
          console.error("Error fetching agent performance:", err);
        } finally {
          setIsLoading(false);
        }
      };
      fetchPerformanceData();
    } else {
      setError("Agent ID not found in URL.");
      setIsLoading(false);
    }
  }, [agentId]);

  // The AgentPerformanceCard component handles its own display for loading, error, and no data states.
  // However, we can add a wrapper or specific styling for this page if needed.
  return (
    <div className="container mx-auto p-4">
      {/* Optional: Add a page title or breadcrumbs here if this page is kept separate */}
      {/* <h1 className="text-xl font-semibold mb-4">Agent Performance Details</h1> */}
      {isLoading ? (
        <div className="p-6 text-center">Loading performance data...</div>
      ) : error ? (
        <div className="p-6 text-center text-red-500">Error: {error}</div>
      ) : (
        <AgentPerformanceCard data={performanceData} />
      )}
    </div>
  );
}
