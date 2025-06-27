"use client";
// app/dashboard/finances/page.tsx
import React, { useEffect, useState } from "react";

function Spinner() {
  // Simple SVG spinner styled for both dark/light
  return (
    <svg className="animate-spin h-6 w-6 text-primary" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}


const RANGE_OPTIONS = [
  { label: "Today", value: "today" },
  { label: "Week", value: "week" },
  { label: "Month", value: "month" },
];

function formatCurrency(amount: number) {
  // Round to nearest integer, no decimals
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}

import dynamic from "next/dynamic";
const ProfitLossChart = dynamic(() => import("./ProfitLossChart"), { ssr: false });

export default function FinancesPage() {
  const [range, setRange] = useState("today");
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    fetch(`/api/finances/summary?range=${range}`)
      .then(res => res.json())
      .then(data => {
        setSummary(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to fetch data");
        setLoading(false);
      });
  }, [range]);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <h2 className="text-3xl font-bold tracking-tight mb-2">Financial Dashboard</h2>
      <div className="flex space-x-2 mb-6">
        {RANGE_OPTIONS.map(opt => (
          <button
            key={opt.value}
            className={`px-2 py-1.5 rounded text-[11px] border border-gray-300 transition-colors ${range === opt.value ? 'bg-gray-100 text-gray-900 font-semibold' : 'bg-transparent text-white hover:bg-gray-100'}`}
            onClick={() => setRange(opt.value)}
            disabled={loading}
          >
            {opt.label}
          </button>
        ))}




      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Quotation Card */}
        <div className="bg-background border border-border shadow-sm rounded-xl p-6 flex flex-col items-center justify-center min-h-[120px]">
          <span className="text-muted-foreground mb-2">Total Quotation</span>
          {loading ? (
            <Spinner />
          ) : error ? (
            <span className="text-red-500">--</span>
          ) : (
            <span className="text-2xl font-bold text-blue-500 dark:text-blue-400">{formatCurrency(summary?.totalQuotation ?? 0)}</span>
          )}
        </div>
        {/* Total Expenses Card */}
        <div className="bg-background border border-border shadow-sm rounded-xl p-6 flex flex-col items-center justify-center min-h-[120px]">
          <span className="text-muted-foreground mb-2">Total Expenses</span>
          {loading ? (
            <Spinner />
          ) : error ? (
            <span className="text-red-500">--</span>
          ) : (
            <span className="text-2xl font-bold text-red-500 dark:text-red-400">{formatCurrency(summary?.totalExpense ?? 0)}</span>
          )}
        </div>
        {/* Expected Expenses Card */}
        <div className="bg-background border border-border shadow-sm rounded-xl p-6 flex flex-col items-center justify-center min-h-[120px]">
          <span className="text-muted-foreground mb-2">Expected Expenses</span>
          {loading ? (
            <Spinner />
          ) : error ? (
            <span className="text-red-500">--</span>
          ) : (
            <span className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{formatCurrency(summary?.totalExpectedExpense ?? 0)}</span>
          )}
        </div>
        {/* Profit/Loss Card */}
        <div className={`bg-background border border-border shadow-sm rounded-xl p-6 flex flex-col items-center justify-center min-h-[120px]`}>
          <span className="text-muted-foreground mb-2">Profit / Loss</span>
          {loading ? (
            <Spinner />
          ) : error ? (
            <span className="text-red-500">--</span>
          ) : (
            <span className={`text-2xl font-bold ${summary?.profitLoss >= 0 ? "text-green-500 dark:text-green-400" : "text-red-500 dark:text-red-400"}`}>{formatCurrency(summary?.profitLoss ?? 0)}</span>
          )}
        </div>
      </div>
      <ProfitLossChart />
    </div>
  );
}
