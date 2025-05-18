"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Building, 
  Calendar, 
  Clock, 
  PhoneCall, 
  PhoneForwarded, 
  PhoneIncoming, 
  PhoneMissed, 
  User 
} from "lucide-react";

const calls = [
  {
    id: "CALL-001",
    client: "HDFC Bank",
    branch: "Mumbai Main",
    contactPerson: "Anil Shah",
    status: "Completed",
    type: "Incoming",
    duration: "12 mins",
    time: "Today, 10:30 AM",
    relatedTicket: "HDFC-221",
    notes: "Discussed timeline for main hall AC repairs",
    avatar: {
      src: "/avatars/anil.jpg",
      initials: "AS"
    }
  },
  {
    id: "CALL-002",
    client: "SBI Bank",
    branch: "Chennai Central",
    contactPerson: "Meena Krishnan",
    status: "Scheduled",
    type: "Outgoing",
    duration: "",
    time: "Today, 14:00 PM",
    relatedTicket: "SBI-089",
    notes: "Follow up on electrical work approval",
    avatar: {
      src: "/avatars/meena.jpg",
      initials: "MK"
    }
  },
  {
    id: "CALL-003",
    client: "ICICI Bank",
    branch: "Delhi Central",
    contactPerson: "Vivek Mehta",
    status: "Missed",
    type: "Incoming",
    duration: "0 mins",
    time: "Yesterday, 16:45 PM",
    relatedTicket: "ICICI-103",
    notes: "Tried to call about urgent water leakage issue",
    avatar: {
      src: "/avatars/vivek.jpg",
      initials: "VM"
    }
  },
  {
    id: "CALL-004",
    client: "Axis Bank",
    branch: "Bangalore South",
    contactPerson: "Priti Nair",
    status: "Completed",
    type: "Outgoing",
    duration: "8 mins",
    time: "Yesterday, 11:15 AM",
    relatedTicket: "AXIS-156",
    notes: "Confirmed appointment for security system upgrade",
    avatar: {
      src: "/avatars/priti.jpg",
      initials: "PN"
    }
  },
];

export default function ExternalCallsList() {
  return (
    <div className="space-y-4">
      {calls.map((call) => (
        <div 
          key={call.id}
          className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border bg-card text-card-foreground hover:bg-accent/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <Avatar className="h-10 w-10 border-2">
                <AvatarImage src={call.avatar.src} alt={call.contactPerson} />
                <AvatarFallback>{call.avatar.initials}</AvatarFallback>
              </Avatar>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{call.contactPerson}</span>
                <Badge
                  variant={
                    call.status === "Completed" ? "default" : 
                    call.status === "Scheduled" ? "outline" : "destructive"
                  }
                >{call.status}</Badge>
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <Building className="mr-1 h-4 w-4" />
                <span>{call.client} - {call.branch}</span>
              </div>
              <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                <div className="flex items-center">
                  {call.type === "Incoming" ? (
                    <PhoneIncoming className="mr-1 h-3 w-3 text-green-500" />
                  ) : call.type === "Missed" ? (
                    <PhoneMissed className="mr-1 h-3 w-3 text-red-500" />
                  ) : (
                    <PhoneForwarded className="mr-1 h-3 w-3 text-blue-500" />
                  )}
                  <span>{call.type}</span>
                </div>
                {call.duration && (
                  <div className="flex items-center">
                    <Clock className="mr-1 h-3 w-3" />
                    <span>{call.duration}</span>
                  </div>
                )}
                <div className="flex items-center">
                  <Calendar className="mr-1 h-3 w-3" />
                  <span>{call.time}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3 sm:mt-0">
            {call.status === "Scheduled" && (
              <Button size="sm" variant="outline" className="h-8">
                <PhoneCall className="mr-1 h-4 w-4" />
                <span>Call</span>
              </Button>
            )}
            <Button size="sm" variant="ghost" className="h-8">
              View details
            </Button>
          </div>
        </div>
      ))}
      <div className="text-center pt-2">
        <button className="text-sm text-primary font-medium hover:underline">
          View all calls
        </button>
      </div>
    </div>
  );
}