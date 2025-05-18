"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  CheckCircle, 
  Clock, 
  MessageSquare, 
  Phone, 
  UserCheck, 
  UserPlus 
} from "lucide-react";

const activities = [
  {
    id: 1,
    type: "status_update",
    user: {
      name: "Priya Sharma",
      avatar: "/avatars/priya.jpg",
      initials: "PS",
    },
    content: "Updated ticket ICICI-103 status to 'In Progress'",
    ticket: "ICICI-103",
    time: "10 minutes ago",
    icon: <Clock className="h-4 w-4 text-blue-500" />,
  },
  {
    id: 2,
    type: "comment",
    user: {
      name: "Vikram Singh",
      avatar: "/avatars/vikram.jpg",
      initials: "VS",
    },
    content: "Added a comment on SBI-089: 'Parts ordered, expected delivery tomorrow'",
    ticket: "SBI-089",
    time: "32 minutes ago",
    icon: <MessageSquare className="h-4 w-4 text-indigo-500" />,
  },
  {
    id: 3,
    type: "call",
    user: {
      name: "Rajesh Kumar",
      avatar: "/avatars/rajesh.jpg",
      initials: "RK",
    },
    content: "Made a call to HDFC Bank regarding ticket HDFC-221",
    ticket: "HDFC-221",
    time: "1 hour ago",
    icon: <Phone className="h-4 w-4 text-green-500" />,
  },
  {
    id: 4,
    type: "assignment",
    user: {
      name: "Admin User",
      avatar: "/avatars/admin.jpg",
      initials: "AU",
    },
    content: "Assigned AXIS-156 to Ankit Patel",
    ticket: "AXIS-156",
    time: "2 hours ago",
    icon: <UserPlus className="h-4 w-4 text-purple-500" />,
  },
  {
    id: 5,
    type: "completion",
    user: {
      name: "Ankit Patel",
      avatar: "/avatars/ankit.jpg",
      initials: "AP",
    },
    content: "Marked PNB-078 as 'Completed'",
    ticket: "PNB-078",
    time: "3 hours ago",
    icon: <CheckCircle className="h-4 w-4 text-green-500" />,
  },
];

export default function RecentActivityFeed() {
  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <div key={activity.id} className="flex gap-4 items-start">
          <div className="mt-1 rounded-full p-2 bg-muted">
            {activity.icon}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={activity.user.avatar} alt={activity.user.name} />
                <AvatarFallback>{activity.user.initials}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">{activity.user.name}</span>
            </div>
            <p className="text-sm">{activity.content}</p>
            <p className="text-xs text-muted-foreground">{activity.time}</p>
          </div>
        </div>
      ))}
      <div className="pt-2 text-center">
        <button className="text-sm text-primary font-medium hover:underline">
          View all activity
        </button>
      </div>
    </div>
  );
}