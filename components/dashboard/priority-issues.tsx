"use client";

import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowUpRight,
  Building,
  Calendar,
  Clock,
  AlertTriangle, // For priority icon
} from "lucide-react";
import { useTicketStore } from "@/store/ticketStore";
import Link from "next/link"; // For the "View all" button
import { format } from "date-fns"; // For date formatting

// Helper to get initials from name
const getInitials = (name: string | null | undefined = "") => {
  if (!name) return "N/A";
  return (
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "N/A"
  );
};

export default function PriorityIssues() {
  const { all_tickets } = useTicketStore();

  // if (isLoadingTickets) {
  //   return <div className="space-y-4 p-3 rounded-lg border bg-card text-card-foreground">Loading priority issues...</div>;
  // }

  const priorityIssues = all_tickets
    ?.filter(
      (ticket: any) =>
        ticket.priority === "high" || ticket.priority === "CRITICAl",
    )
    .sort(
      (a: any, b: any) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 5); // Show top 5

  if (!priorityIssues || priorityIssues.length === 0) {
    return (
      <div className="p-3 rounded-lg border bg-card text-center text-muted-foreground">
        <AlertTriangle className="mx-auto h-8 w-8 mb-2 text-green-500" />
        No priority issues at the moment.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {priorityIssues.map((issue) => (
        <Link
          href={`/dashboard/ticket/${issue.id}`}
          key={issue.id}
          legacyBehavior
        >
          <a className="flex items-start justify-between p-3 rounded-lg border bg-card text-card-foreground hover:bg-accent/50 transition-colors cursor-pointer">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="destructive">{issue.priority}</Badge>
                <span className="text-sm font-medium text-muted-foreground">
                  #{issue.ticketId}
                </span>
              </div>
              <h4 className="font-medium leading-tight">
                {issue?.title || "No Title"}
              </h4>
              <div className="flex items-center text-sm text-muted-foreground">
                <Building className="mr-1 h-4 w-4 flex-shrink-0" />
                <span>
                  {issue?.client?.name || "N/A Client"} -{" "}
                  {issue?.branch || "N/A Branch"}
                </span>
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <div className="flex items-center">
                  <Clock className="mr-1 h-3 w-3" />
                  <span>
                    Reported:{" "}
                    {issue.createdAt
                      ? format(new Date(issue.createdAt), "MMM dd, yyyy")
                      : "N/A"}
                  </span>
                </div>
                {issue.scheduledDate && (
                  <div className="flex items-center">
                    <Calendar className="mr-1 h-3 w-3" />
                    <span>
                      Scheduled:{" "}
                      {format(new Date(issue.scheduledDate), "MMM dd, yyyy")}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0 ml-2">
              {issue.assignee && (
                <Avatar className="h-8 w-8">
                  {issue.assignee.avatar && (
                    <AvatarImage
                      src={issue.assignee.avatar}
                      alt={issue.assignee.name || "Assignee"}
                    />
                  )}
                  <AvatarFallback>
                    {getInitials(issue.assignee.name)}
                  </AvatarFallback>
                </Avatar>
              )}
              <div className="flex items-center text-xs font-medium text-primary">
                <span>View</span>
                <ArrowUpRight className="ml-1 h-3 w-3" />
              </div>
            </div>
          </a>
        </Link>
      ))}
      {all_tickets.filter(
        (ticket: any) =>
          ticket.priority === "High" || ticket.priority === "Critical",
      ).length > 5 && (
        <div className="text-center mt-4">
          <Link href="/tickets?priority=High,Critical" legacyBehavior>
            <a className="text-sm text-primary font-medium hover:underline">
              View all priority issues
            </a>
          </Link>
        </div>
      )}
    </div>
  );
}
