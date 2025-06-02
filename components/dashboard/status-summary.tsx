"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { useTicketStore } from "@/store/ticketStore"; // Import the store

// Define a consistent color mapping for statuses
const STATUS_COLORS: { [key: string]: string } = {
  new: "#3b82f6", // blue-500
  "In Progress": "#eab308", // yellow-500
  inProgress: "#8b5cf6", // violet-500

  onHold: "#ef4444", // red-500
  completed: "#22c55e", // green-500
  billing_pending: "#d4e747", // emerald-500

  billing_completed: "#10b981", // emerald-500
  Closed: "#6b7280", // gray-500
  // Add more statuses and colors as needed
};

export default function StatusSummary() {
  const { tickets, loading } = useTicketStore();

  if (loading) {
    return <div className="w-full h-[300px] flex items-center justify-center">Loading status summary...</div>;
  }

  if (!tickets || Object.keys(tickets).length === 0) {
    return <div className="w-full h-[300px] flex items-center justify-center">No ticket data available.</div>;
  }

  const chartData = Object.entries(tickets)
    .map(([statusName, ticketsArray]) => ({
      name: statusName,
      value: ticketsArray.length,
      color: STATUS_COLORS[statusName], // Default color if status not in map
    }))
    .filter(item => item.value > 0); // Only include statuses with tickets

  if (chartData.length === 0) {
    return <div className="w-full h-[300px] flex items-center justify-center">No tickets with current statuses.</div>;
  }

  console.log(tickets);
  

  return (
    <div className="w-full h-[300px] capitalize">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value, name, props) => [`${value} Tickets (${(props.payload.percent * 100).toFixed(1)}%)`, props.payload.name]}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}