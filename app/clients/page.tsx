"use client";

import { useState } from "react";
import { 
  Building, 
  Download, 
  Filter, 
  MoreHorizontal, 
  Plus, 
  Search, 
  Sliders 
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

// Sample client data
const clients = [
  {
    id: "CL-001",
    name: "HDFC Bank",
    type: "Bank",
    totalBranches: 42,
    contactPerson: "Sanjay Mehta",
    contactEmail: "sanjay.mehta@hdfcbank.com",
    contactPhone: "+91-98765-43210",
    activeTickets: 12,
    contractStatus: "Active",
    lastServiceDate: "Sep 10, 2023",
    avatar: "/logos/hdfc.png",
    initials: "HB"
  },
  {
    id: "CL-002",
    name: "ICICI Bank",
    type: "Bank",
    totalBranches: 38,
    contactPerson: "Priya Malhotra",
    contactEmail: "priya.malhotra@icicibank.com",
    contactPhone: "+91-98765-43211",
    activeTickets: 7,
    contractStatus: "Active",
    lastServiceDate: "Sep 08, 2023",
    avatar: "/logos/icici.png",
    initials: "IB"
  },
  {
    id: "CL-003",
    name: "SBI Bank",
    type: "Bank",
    totalBranches: 56,
    contactPerson: "Ravi Kumar",
    contactEmail: "ravi.kumar@sbi.co.in",
    contactPhone: "+91-98765-43212",
    activeTickets: 15,
    contractStatus: "Active",
    lastServiceDate: "Sep 12, 2023",
    avatar: "/logos/sbi.png",
    initials: "SB"
  },
  {
    id: "CL-004",
    name: "Axis Bank",
    type: "Bank",
    totalBranches: 31,
    contactPerson: "Neha Gupta",
    contactEmail: "neha.gupta@axisbank.com",
    contactPhone: "+91-98765-43213",
    activeTickets: 5,
    contractStatus: "Active",
    lastServiceDate: "Sep 05, 2023",
    avatar: "/logos/axis.png",
    initials: "AB"
  },
  {
    id: "CL-005",
    name: "Punjab National Bank",
    type: "Bank",
    totalBranches: 28,
    contactPerson: "Vikram Singh",
    contactEmail: "vikram.singh@pnb.co.in",
    contactPhone: "+91-98765-43214",
    activeTickets: 9,
    contractStatus: "Active",
    lastServiceDate: "Sep 07, 2023",
    avatar: "/logos/pnb.png",
    initials: "PB"
  },
  {
    id: "CL-006",
    name: "Bajaj Finance",
    type: "NBFC",
    totalBranches: 18,
    contactPerson: "Amit Sharma",
    contactEmail: "amit.sharma@bajajfinance.in",
    contactPhone: "+91-98765-43215",
    activeTickets: 3,
    contractStatus: "Active",
    lastServiceDate: "Sep 09, 2023",
    avatar: "/logos/bajaj.png",
    initials: "BF"
  },
  {
    id: "CL-007",
    name: "HDFC Home Loans",
    type: "NBFC",
    totalBranches: 22,
    contactPerson: "Anjali Desai",
    contactEmail: "anjali.desai@hdfcloans.com",
    contactPhone: "+91-98765-43216",
    activeTickets: 6,
    contractStatus: "Active",
    lastServiceDate: "Sep 03, 2023",
    avatar: "/logos/hdfc-home.png",
    initials: "HL"
  },
  {
    id: "CL-008",
    name: "LIC Housing Finance",
    type: "NBFC",
    totalBranches: 15,
    contactPerson: "Rahul Khanna",
    contactEmail: "rahul.khanna@lichf.com",
    contactPhone: "+91-98765-43217",
    activeTickets: 2,
    contractStatus: "Active",
    lastServiceDate: "Sep 01, 2023",
    avatar: "/logos/lic.png",
    initials: "LH"
  },
];

export default function ClientsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [clientType, setClientType] = useState("all");

  const filteredClients = clients.filter(client => {
    const matchesSearch = 
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.id.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesType = clientType === "all" || client.type.toLowerCase() === clientType.toLowerCase();
    
    return matchesSearch && matchesType;
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground">Manage client information and service requests</p>
        </div>
        <div className="flex items-center gap-2">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Client
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-auto">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search clients..."
            className="w-full md:w-[300px] pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Select 
            defaultValue="all" 
            value={clientType}
            onValueChange={setClientType}
          >
            <SelectTrigger className="w-full md:w-[180px]">
              <div className="flex items-center">
                <Building className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Client type" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="bank">Banks</SelectItem>
              <SelectItem value="nbfc">NBFCs</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon">
            <Sliders className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="list" className="w-full">
        <TabsList>
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="grid">Grid View</TabsTrigger>
        </TabsList>
        <TabsContent value="list" className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Contact Person</TableHead>
                <TableHead className="hidden md:table-cell">Contact Info</TableHead>
                <TableHead className="hidden lg:table-cell">Branches</TableHead>
                <TableHead>Active Tickets</TableHead>
                <TableHead className="hidden lg:table-cell">Last Service</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={client.avatar} alt={client.name} />
                        <AvatarFallback>{client.initials}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{client.name}</div>
                        <div className="text-xs text-muted-foreground">{client.id}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{client.type}</Badge>
                  </TableCell>
                  <TableCell>
                    <div>{client.contactPerson}</div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="text-sm">
                      <div>{client.contactEmail}</div>
                      <div className="text-muted-foreground">{client.contactPhone}</div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {client.totalBranches}
                  </TableCell>
                  <TableCell>
                    <Badge variant={client.activeTickets > 10 ? "destructive" : client.activeTickets > 5 ? "default" : "secondary"}>
                      {client.activeTickets}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {client.lastServiceDate}
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
                        <DropdownMenuItem>View Client</DropdownMenuItem>
                        <DropdownMenuItem>View Tickets</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>Edit Client</DropdownMenuItem>
                        <DropdownMenuItem>Generate Report</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>
        <TabsContent value="grid">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredClients.map((client) => (
              <Card key={client.id} className="overflow-hidden">
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={client.avatar} alt={client.name} />
                        <AvatarFallback>{client.initials}</AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{client.name}</CardTitle>
                        <CardDescription>{client.id}</CardDescription>
                      </div>
                    </div>
                    <Badge variant="outline">{client.type}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  <div className="space-y-2">
                    <div>
                      <div className="text-sm font-medium">Contact Person</div>
                      <div className="text-sm">{client.contactPerson}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Contact Info</div>
                      <div className="text-sm">{client.contactEmail}</div>
                      <div className="text-sm text-muted-foreground">{client.contactPhone}</div>
                    </div>
                    <div className="flex justify-between pt-2">
                      <div>
                        <div className="text-sm font-medium">Branches</div>
                        <div className="text-sm">{client.totalBranches}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium">Active Tickets</div>
                        <div className="text-center">
                          <Badge variant={client.activeTickets > 10 ? "destructive" : client.activeTickets > 5 ? "default" : "secondary"}>
                            {client.activeTickets}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium">Last Service</div>
                        <div className="text-sm">{client.lastServiceDate.split(',')[0]}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}