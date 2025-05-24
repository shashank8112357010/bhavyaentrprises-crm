"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Building2, MoreHorizontal, Phone, Plus, Search, UserCheck2 } from "lucide-react";

const agents = [
  {
    id: "AG001",
    name: "Rajesh Kumar",
    avatar: "/avatars/rajesh.jpg",
    initials: "RK",
    role: "Senior Technician",
    specialization: "HVAC Systems",
    status: "Available",
    activeTickets: 3,
    completedTickets: 145,
    rating: 4.8,
    phone: "+91 98765-43210",
    email: "rajesh.kumar@repairtrack.com",
    location: "Mumbai",
    joinDate: "2022-03-15"
  },
  {
    id: "AG002",
    name: "Priya Sharma",
    avatar: "/avatars/priya.jpg",
    initials: "PS",
    role: "Technician",
    specialization: "Electrical Systems",
    status: "On Service",
    activeTickets: 2,
    completedTickets: 98,
    rating: 4.7,
    phone: "+91 98765-43211",
    email: "priya.sharma@repairtrack.com",
    location: "Delhi",
    joinDate: "2022-06-20"
  },
  {
    id: "AG003",
    name: "Vikram Singh",
    avatar: "/avatars/vikram.jpg",
    initials: "VS",
    role: "Senior Technician",
    specialization: "Plumbing",
    status: "Available",
    activeTickets: 1,
    completedTickets: 167,
    rating: 4.9,
    phone: "+91 98765-43212",
    email: "vikram.singh@repairtrack.com",
    location: "Bangalore",
    joinDate: "2022-01-10"
  }
];

export default function AgentsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredAgents = agents.filter(agent =>
    agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.specialization.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Service Agents</h1>
          <p className="text-muted-foreground">Manage and monitor service agents</p>
        </div>
        <div className="flex items-center gap-2">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Agent
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-auto">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search agents..."
            className="w-full md:w-[300px] pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
            <UserCheck2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agents.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Now</CardTitle>
            <UserCheck2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {agents.filter(a => a.status === "Available").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On Service</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {agents.filter(a => a.status === "On Service").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Active Tickets</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {agents.reduce((sum, agent) => sum + agent.activeTickets, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Service Agents</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agent</TableHead>
                <TableHead>Specialization</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Active Tickets</TableHead>
                <TableHead className="hidden md:table-cell">Contact</TableHead>
                <TableHead className="hidden lg:table-cell">Performance</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAgents.map((agent) => (
                <TableRow key={agent.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={agent.avatar} alt={agent.name} />
                        <AvatarFallback>{agent.initials}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{agent.name}</div>
                        <div className="text-xs text-muted-foreground">{agent.id}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{agent.specialization}</div>
                    <div className="text-xs text-muted-foreground">{agent.role}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={agent.status === "Available" ? "default" : "secondary"}>
                      {agent.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={agent.activeTickets > 2 ? "destructive" : "secondary"}>
                      {agent.activeTickets}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="text-sm">
                      <div className="flex items-center">
                        <Phone className="h-3 w-3 mr-1" />
                        {agent.phone}
                      </div>
                      <div className="text-muted-foreground">{agent.email}</div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <div className="text-sm">
                      <div>Rating: {agent.rating}/5.0</div>
                      <div className="text-muted-foreground">
                        {agent.completedTickets} tickets completed
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem>View Profile</DropdownMenuItem>
                        <DropdownMenuItem>Assign Ticket</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>Edit Agent</DropdownMenuItem>
                        <DropdownMenuItem>View Schedule</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}