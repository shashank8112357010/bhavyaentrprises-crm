"use client";
import React from "react";
import { useEffect, useState } from "react";
// If you use recharts, install it: npm install recharts
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function ProfitLossChart() {
  const [mode, setMode] = useState<'year' | 'month'>('year');
  const [data, setData] = useState<{ label: string; value: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    fetch(`/api/finances/profit-loss-graph?mode=${mode}`)
      .then(res => res.json())
      .then(res => {
        if (res.labels && res.data) {
          setData(res.labels.map((label: string, i: number) => ({ label, value: res.data[i] })));
        } else {
          setError("No data");
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load graph");
        setLoading(false);
      });
  }, [mode]);

  return (
    <div className="w-full h-50 bg-background rounded-lg border border-border p-3 shadow-sm max-w-full">
      <div className="flex justify-between items-center mb-1">
        <h3 className="text-sm font-medium text-foreground">Profit / Loss Trend</h3>
        <div className="flex gap-1">
          <button
            className={`px-2 py-1.5 rounded text-[11px] border border-gray-300 transition-colors ${mode === 'year' ? 'bg-gray-100 text-gray-900 font-semibold' : 'bg-transparent text-gray-500 hover:bg-gray-100'}`}
            onClick={() => setMode('year')}
            style={{ boxShadow: 'none' }}
          >
            Year
          </button>
          <button
            className={`px-2 py-1.5 rounded text-[11px] border border-gray-300 transition-colors ${mode === 'month' ? 'bg-gray-100 text-gray-900 font-semibold' : 'bg-transparent text-gray-500 hover:bg-gray-100'}`}
            onClick={() => setMode('month')}
            style={{ boxShadow: 'none' }}
          >
            Month
          </button>
        </div>
      </div>
      {loading ? (
        <div className="flex justify-center items-center h-[120px]"><svg className="animate-spin h-6 w-6 text-primary" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg></div>
      ) : error ? (
        <div className="text-red-500 text-center text-xs">{error}</div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="label" stroke="#888" fontSize={10} />
            <YAxis stroke="#888" fontSize={10} />
            <Tooltip formatter={v => `₹${v}`} />
            <Line type="monotone" dataKey="value" stroke="#22c55e" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
