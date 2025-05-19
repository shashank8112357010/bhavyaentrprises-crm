"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  AlertTriangle, 
  BarChart3, 
  Building2, 
  CheckCircle, 
  Clock, 
  Phone, 
  Plus, 
  RotateCw, 
  UserCheck
} from "lucide-react";
import RecentActivityFeed from "@/components/dashboard/recent-activity";
import StatusSummary from "@/components/dashboard/status-summary";
import PriorityIssues from "@/components/dashboard/priority-issues";
import OverviewMetrics from "@/components/dashboard/overview-metrics";
import ExternalCallsList from "@/components/dashboard/external-calls-list";
import UpcomingSchedule from "@/components/dashboard/upcoming-schedule";
import { useEffect } from "react";
import { getAllLeads } from "@/lib/services/lead";

export default function Home() {
  useEffect(()=>{
    const response = getAllLeads()
    console.log(response);
    
  })
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Monitor repairs, track progress, and manage client requests</p>
        </div>
        <div className="flex items-center gap-2">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Ticket
          </Button>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Open Tickets</CardDescription>
            <CardTitle className="text-2xl">42</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-muted-foreground">
              <RotateCw className="mr-1 h-4 w-4 text-primary" />
              <span>12 pending assignment</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Scheduled Today</CardDescription>
            <CardTitle className="text-2xl">8</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="mr-1 h-4 w-4 text-yellow-500" />
              <span>2 high priority</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Client Updates Needed</CardDescription>
            <CardTitle className="text-2xl">15</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-muted-foreground">
              <AlertTriangle className="mr-1 h-4 w-4 text-destructive" />
              <span>5 overdue responses</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Completed This Week</CardDescription>
            <CardTitle className="text-2xl">23</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-muted-foreground">
              <CheckCircle className="mr-1 h-4 w-4 text-green-500" />
              <span>↑ 15% from last week</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Status Summary</CardTitle>
            <CardDescription>Current distribution of maintenance requests</CardDescription>
          </CardHeader>
          <CardContent>
            <StatusSummary />
          </CardContent>
        </Card>
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Priority Issues</CardTitle>
            <CardDescription>Maintenance requests requiring immediate attention</CardDescription>
          </CardHeader>
          <CardContent>
            <PriorityIssues />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="metrics" className="w-full">
        <TabsList>
          <TabsTrigger value="metrics">
            <BarChart3 className="h-4 w-4 mr-2" />
            Metrics
          </TabsTrigger>
          <TabsTrigger value="calls">
            <Phone className="h-4 w-4 mr-2" />
            Recent Calls
          </TabsTrigger>
          <TabsTrigger value="activity">
            <UserCheck className="h-4 w-4 mr-2" />
            Activity
          </TabsTrigger>
          <TabsTrigger value="schedule">
            <Clock className="h-4 w-4 mr-2" />
            Schedule
          </TabsTrigger>
          <TabsTrigger value="clients">
            <Building2 className="h-4 w-4 mr-2" />
            Top Clients
          </TabsTrigger>
        </TabsList>
        <TabsContent value="metrics">
          <Card>
            <CardHeader>
              <CardTitle>Performance Overview</CardTitle>
              <CardDescription>Key metrics for the current month</CardDescription>
            </CardHeader>
            <CardContent>
              <OverviewMetrics />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="calls">
          <Card>
            <CardHeader>
              <CardTitle>Recent External Calls</CardTitle>
              <CardDescription>Last 10 calls with clients</CardDescription>
            </CardHeader>
            <CardContent>
              <ExternalCallsList />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest actions taken on maintenance requests</CardDescription>
            </CardHeader>
            <CardContent>
              <RecentActivityFeed />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="schedule">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Schedule</CardTitle>
              <CardDescription>Maintenance visits for the next 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              <UpcomingSchedule />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}