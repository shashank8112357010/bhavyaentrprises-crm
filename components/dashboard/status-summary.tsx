"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const data = [
  { name: "New", value: 18, color: "#3b82f6" },
  { name: "In Progress", value: 11, color: "#eab308" },
  { name: "Scheduled", value: 8, color: "#8b5cf6" },
  { name: "On Hold", value: 5, color: "#ef4444" },
  { name: "Completed", value: 23, color: "#22c55e" },
  { name: "Billing", value: 23, color: "#22c55e" }

];

export default function StatusSummary() {
  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value) => [`${value} Tickets`, 'Count']}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}