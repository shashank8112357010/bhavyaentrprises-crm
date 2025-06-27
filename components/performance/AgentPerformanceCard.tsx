// components/performance/AgentPerformanceCard.tsx
"use client";

import React from 'react';

// Define a type for the performance data structure
// This should align with the return type of `calculateAgentPerformance`
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

interface AgentPerformanceCardProps {
  performanceData: PerformanceData | null;
  isLoading: boolean;
  error: string | null;
}

const AgentPerformanceCard: React.FC<AgentPerformanceCardProps> = ({ performanceData, isLoading, error }) => {
  if (isLoading) {
    return <div className="p-6 text-center">Loading performance data...</div>;
  }

  if (error) {
    return <div className="p-6 text-center text-red-500">Error: {error}</div>;
  }

  if (!performanceData) {
    return <div className="p-6 text-center">No performance data available.</div>;
  }

  const performance = performanceData; // Use a shorter alias

  // Helper to get quotation and expense details for pending lists
  const getTicketFinancials = (ticket: { Quotation?: any[], expenses?: any[] }) => {
    const quotation = ticket.Quotation?.[0]; // Assuming first quotation is primary
    const grandTotal = quotation?.grandTotal ?? 0;
    const expenseAmount = ticket.expenses?.reduce((sum, exp) => sum + (exp.amount ?? 0), 0) ?? 0;
    return { grandTotal, expenseAmount };
  };

  return (
    <div className="p-6 max-w-5xl mx-auto bg-white shadow-lg rounded-lg border border-gray-200">
      <h1 className="text-3xl font-bold mb-6 text-center text-blue-600">
        🎯 Agent Performance Summary ({performance.region})
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 p-6 bg-gray-50 rounded-md border border-gray-200">
        <div><p><strong>Agent:</strong> {performance.agent}</p></div>
        <div><p><strong>Tickets Handled:</strong> {performance.jobs}</p></div>
        <div><p><strong>Overall Score:</strong> {performance.score}/100</p></div>
        <div><p><strong>Rating:</strong> ⭐ {performance.rating} / 5.0</p></div>
        <div><p><strong>Incentive/Job:</strong> ₹{performance.incentivePerJob.toLocaleString()}</p></div>
        <div><p><strong>Bonus:</strong> ₹{performance.bonus.toLocaleString()}</p></div>
        <div><p><strong>Total Incentive:</strong> ₹{performance.totalIncentive.toLocaleString()}</p></div>
        <div><p><strong>Expected Expenses (Upcoming):</strong> ₹{performance.expectedExpenses.toLocaleString()}</p></div>
      </div>

      {/* Daily Agent Notification Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">📩 Agent Action Items</h2>
        <div className="bg-blue-50 p-6 rounded-md border border-blue-200 shadow-sm">
          <p className="text-lg mb-1"><strong>Agent:</strong> {performance.agent}</p>

          {performance.jcrPending.length > 0 && (
            <div className="mt-4">
              <p className="font-medium text-blue-700">📌 JCR Pending ({performance.jcrPending.length}):</p>
              <ul className="list-disc list-inside ml-4 text-sm text-gray-600">
                {performance.jcrPending.map(t => {
                  const { grandTotal, expenseAmount } = getTicketFinancials(t);
                  return (
                    <li key={t.ticketId} className="py-1">
                      {t.ticketId} (Quotation: ₹{grandTotal.toLocaleString()} | Expense: ₹{expenseAmount.toLocaleString()})
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {performance.poPending.length > 0 && (
            <div className="mt-4">
              <p className="font-medium text-blue-700">📌 PO Pending ({performance.poPending.length}):</p>
              <ul className="list-disc list-inside ml-4 text-sm text-gray-600">
                {performance.poPending.map(t => {
                   const { grandTotal, expenseAmount } = getTicketFinancials(t);
                  return (
                  <li key={t.ticketId} className="py-1">
                    {t.ticketId} (Quotation: ₹{grandTotal.toLocaleString()} | Expense: ₹{expenseAmount.toLocaleString()})
                  </li>
                  );
                })}
              </ul>
            </div>
          )}

          {performance.billingReadyNotSubmitted.length > 0 && (
            <div className="mt-4">
              <p className="font-medium text-orange-700">📌 Ready But Not Billed ({performance.billingReadyNotSubmitted.length}):</p>
              <ul className="list-disc list-inside ml-4 text-sm text-gray-600">
                {performance.billingReadyNotSubmitted.map(t => {
                  const { grandTotal, expenseAmount } = getTicketFinancials(t);
                  return (
                    <li key={t.ticketId} className="py-1">
                      {t.ticketId} (Quotation: ₹{grandTotal.toLocaleString()} | Expense: ₹{expenseAmount.toLocaleString()} | Status: {t.status})
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {performance.pendingClientAction.length > 0 && (
            <div className="mt-4">
              <p className="font-medium text-yellow-700">📌 Pending Client Follow-up ({performance.pendingClientAction.length}):</p>
              <ul className="list-disc list-inside ml-4 text-sm text-gray-600">
                {performance.pendingClientAction.map(t => (
                  <li key={t.ticketId} className="py-1">
                    {t.ticketId} (Feedback: {t.feedback})
                  </li>
                ))}
              </ul>
            </div>
          )}
           {(performance.jcrPending.length === 0 && performance.poPending.length === 0 && performance.billingReadyNotSubmitted.length === 0 && performance.pendingClientAction.length === 0) && (
            <p className="mt-4 text-gray-600">No immediate action items for the agent.</p>
           )}
        </div>
      </div>

      {/* Admin Notifications Section */}
      {performance.adminNotifications.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-4 text-gray-700">🛠️ Admin Watchlist & Planning</h2>
          <div className="bg-red-50 p-6 rounded-md border border-red-300 shadow-sm">
            <ul className="space-y-3 text-sm">
              {performance.adminNotifications.map(note => (
                <li key={note.ticketId} className="p-3 bg-white border border-red-200 rounded shadow-sm">
                  <span className="font-semibold text-red-700">🔔 Ticket: {note.ticketId}</span> (Agent: {note.agent}, Region: {note.region})<br/>
                  Status: {note.status} | Billing: {note.billingStage} | JCR: {note.jcrUploaded ? '✅ Done' : '❌ Pending'} | PO: {note.poUploaded ? '✅ Done' : '❌ Pending'}<br/>
                  Feedback: {note.feedback} | Quotation: ₹{note.quotationAmount.toLocaleString()} | Expense: ₹{note.expenseAmount.toLocaleString()}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
       {performance.adminNotifications.length === 0 && (
         <div>
          <h2 className="text-2xl font-semibold mb-4 text-gray-700">🛠️ Admin Watchlist & Planning</h2>
            <div className="bg-green-50 p-6 rounded-md border border-green-300 shadow-sm">
                <p className="text-green-700">No items currently on the admin watchlist from this agent's tickets.</p>
            </div>
        </div>
       )}
    </div>
  );
};

export default AgentPerformanceCard;
