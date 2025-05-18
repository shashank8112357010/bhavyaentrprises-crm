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
    id: "1",
  title: "Site visit with client",
  client: "ABC Corp",
  branch: "Delhi",
  priority: "Critical",
  assignee: {
    name: "John Doe",
    avatar: "/avatars/john.jpg",
    initials: "JD"
  },
  issue : "hard",
  timeReported : "",
  dueDate: "2025-05-20",
  createdAt: "2025-05-10",
  scheduledFor : "",
  description: "Follow-up for quote discussion",
  comments: 3,
  workStage: {
    stateName: "Delhi",
    adminName: "Admin1",
    clientName: "ABC Corp",
    siteName: "Site 12",
    quoteNo: "Q1234",
    dateReceived: "2025-05-08",
    quoteTaxable: 180000,
    quoteAmount: 212400,
    workStatus: "Pending",
    approval: "Approved",
    poStatus: "Generated",
    poNumber: "PO4567",
    jcrStatus: "Initiated",
    agentName: "John Doe"
  }
}
]

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
              <Badge variant={issue.priority === "Critical" ? "destructive" : "secondary"}>
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