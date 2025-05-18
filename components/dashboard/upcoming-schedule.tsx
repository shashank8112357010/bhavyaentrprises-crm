"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Building, CalendarDays, Clock, MapPin, PenTool as Tool } from "lucide-react";

const scheduleItems = [
  {
    id: "SCH-001",
    client: "HDFC Bank",
    branch: "Mumbai Main",
    type: "AC Servicing",
    priority: "High",
    date: "Today",
    time: "14:00 - 16:00",
    location: "Server Room, 3rd Floor",
    technician: {
      name: "Rajesh Kumar",
      avatar: "/avatars/rajesh.jpg",
      initials: "RK"
    },
    relatedTicket: "HDFC-221"
  },
  {
    id: "SCH-002",
    client: "ICICI Bank",
    branch: "Delhi Central",
    type: "Plumbing Repair",
    priority: "High",
    date: "Today",
    time: "16:30 - 18:00",
    location: "ATM Area, Ground Floor",
    technician: {
      name: "Priya Sharma",
      avatar: "/avatars/priya.jpg",
      initials: "PS"
    },
    relatedTicket: "ICICI-103"
  },
  {
    id: "SCH-003",
    client: "SBI Bank",
    branch: "Bangalore East",
    type: "Electrical Work",
    priority: "Medium",
    date: "Tomorrow",
    time: "10:00 - 12:00",
    location: "Cabin Area, 2nd Floor",
    technician: {
      name: "Vikram Singh",
      avatar: "/avatars/vikram.jpg",
      initials: "VS"
    },
    relatedTicket: "SBI-089"
  },
  {
    id: "SCH-004",
    client: "Axis Bank",
    branch: "Pune West",
    type: "Security System Upgrade",
    priority: "Medium",
    date: "Tomorrow",
    time: "14:30 - 17:30",
    location: "Main Entrance and Vault Area",
    technician: {
      name: "Ankit Patel",
      avatar: "/avatars/ankit.jpg",
      initials: "AP"
    },
    relatedTicket: "AXIS-156"
  }
];

export default function UpcomingSchedule() {
  const groupedSchedule = scheduleItems.reduce((acc, item) => {
    if (!acc[item.date]) {
      acc[item.date] = [];
    }
    acc[item.date].push(item);
    return acc;
  }, {} as Record<string, typeof scheduleItems>);

  return (
    <div className="space-y-6">
      {Object.entries(groupedSchedule).map(([date, items]) => (
        <div key={date}>
          <h3 className="font-medium text-sm mb-2 flex items-center">
            <CalendarDays className="mr-2 h-4 w-4" />
            {date}
          </h3>
          <div className="space-y-3">
            {items.map((item) => (
              <Card key={item.id} className="relative overflow-hidden">
                <div 
                  className={`absolute left-0 top-0 bottom-0 w-1 ${
                    item.priority === "High" ? "bg-destructive" : 
                    item.priority === "Medium" ? "bg-yellow-500" : "bg-blue-500"
                  }`} 
                />
                <CardContent className="p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{item.type}</Badge>
                        <span className="text-xs text-muted-foreground">{item.id}</span>
                      </div>
                      <div className="flex items-center mt-1">
                        <Building className="mr-1 h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-sm">{item.client} - {item.branch}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Clock className="mr-1 h-3 w-3" />
                          <span>{item.time}</span>
                        </div>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <MapPin className="mr-1 h-3 w-3" />
                          <span>{item.location}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={item.technician.avatar} alt={item.technician.name} />
                        <AvatarFallback>{item.technician.initials}</AvatarFallback>
                      </Avatar>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Tool className="mr-1 h-3 w-3" />
                        <span>{item.technician.name}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
      <div className="text-center">
        <button className="text-sm text-primary font-medium hover:underline">
          View full calendar
        </button>
      </div>
    </div>
  );
}