"use client";

import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  AlertCircle, 
  ArrowUpRight, 
  Building, 
  Calendar,
  Clock
} from "lucide-react";

const priorityIssues = [
  {
    id: "PRI-001",
    client: "HDFC Bank",
    branch: "Mumbai Main",
    issue: "AC unit failure in server room",
    priority: "Critical",
    timeReported: "2 hours ago",
    scheduledFor: "Today, 14:00",
    assignee: {
      name: "Rajesh Kumar",
      avatar: "/avatars/rajesh.jpg",
      initials: "RK"
    }
  },
  {
    id: "PRI-002",
    client: "ICICI Bank",
    branch: "Delhi Central",
    issue: "Water leakage in ATM area",
    priority: "High",
    timeReported: "6 hours ago",
    scheduledFor: "Today, 16:30",
    assignee: {
      name: "Priya Sharma",
      avatar: "/avatars/priya.jpg",
      initials: "PS"
    }
  },
  {
    id: "PRI-003",
    client: "SBI Bank",
    branch: "Bangalore East",
    issue: "Electrical short circuit in cabin area",
    priority: "High",
    timeReported: "Yesterday",
    scheduledFor: "Tomorrow, 10:00",
    assignee: {
      name: "Vikram Singh",
      avatar: "/avatars/vikram.jpg",
      initials: "VS"
    }
  }
];

export default function PriorityIssues() {
  return (
    <div className="space-y-4">
      {priorityIssues.map((issue) => (
        <div 
          key={issue.id}
          className="flex items-start justify-between p-3 rounded-lg border bg-card text-card-foreground hover:bg-accent/50 transition-colors"
        >
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant={issue.priority === "Critical" ? "destructive" : "warning"}>
                {issue.priority}
              </Badge>
              <span className="text-sm font-medium">{issue.id}</span>
            </div>
            <h4 className="font-medium">{issue.issue}</h4>
            <div className="flex items-center text-sm text-muted-foreground">
              <Building className="mr-1 h-4 w-4" />
              <span>{issue.client} - {issue.branch}</span>
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              <div className="flex items-center">
                <Clock className="mr-1 h-3 w-3" />
                <span>Reported: {issue.timeReported}</span>
              </div>
              <div className="flex items-center">
                <Calendar className="mr-1 h-3 w-3" />
                <span>Scheduled: {issue.scheduledFor}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={issue.assignee.avatar} alt={issue.assignee.name} />
              <AvatarFallback>{issue.assignee.initials}</AvatarFallback>
            </Avatar>
            <button className="flex items-center text-xs font-medium text-primary">
              <span>View details</span>
              <ArrowUpRight className="ml-1 h-3 w-3" />
            </button>
          </div>
        </div>
      ))}
      <div className="text-center">
        <button className="text-sm text-primary font-medium hover:underline">
          View all priority issues
        </button>
      </div>
    </div>
  );
}