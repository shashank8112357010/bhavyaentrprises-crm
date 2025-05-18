"use client";

import { Card, CardContent } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { name: "Week 1", completed: 18, scheduled: 22, new: 15 },
  { name: "Week 2", completed: 21, scheduled: 25, new: 12 },
  { name: "Week 3", completed: 25, scheduled: 29, new: 10 },
  { name: "Week 4", completed: 23, scheduled: 28, new: 14 },
];

export default function OverviewMetrics() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold">92%</div>
              <p className="text-xs text-muted-foreground">Resolution Rate</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold">5.2hrs</div>
              <p className="text-xs text-muted-foreground">Avg. Response Time</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold">78%</div>
              <p className="text-xs text-muted-foreground">Client Satisfaction</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip 
              contentStyle={{ 
                borderRadius: '8px', 
                border: '1px solid hsl(var(--border))' 
              }}
            />
            <Bar dataKey="new" fill="hsl(var(--chart-1))" name="New Requests" />
            <Bar dataKey="scheduled" fill="hsl(var(--chart-2))" name="Scheduled" />
            <Bar dataKey="completed" fill="hsl(var(--chart-3))" name="Completed" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}