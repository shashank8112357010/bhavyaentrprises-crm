"use client";

import { useEffect, useState } from "react";
import {
  Building,
  Download,
  Filter,
  MoreHorizontal,
  Plus,
  Search,
  Sliders,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

import { createClient, getAllClients } from "@/lib/services/client";

type Client = {
  id?: string;
  name: string;
  type: string;
  totalBranches: number;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  contractStatus: string;
  lastServiceDate: string;
  avatar: string;
  initials: string;
  activeTickets?: number;
};

export default function ClientsPage() {

  const [searchQuery, setSearchQuery] = useState("");
  const [clientType, setClientType] = useState("all");
  const [clients, setClients] = useState<Client[]>([]);
  const [newClient, setNewClient] = useState<Client>({
    name: "",
    type: "bank",
    totalBranches: 1,
    contactPerson: "",
    contactEmail: "",
    contactPhone: "",
    contractStatus: "Active",
    lastServiceDate: "",
    avatar: "",
    initials: "",
  });

  useEffect(() => {
    async function fetchClients() {
      try {
        const data = await getAllClients();
        console.log(data);

        setClients(data?.clients || []);
      } catch (err) {
        console.error("Failed to fetch clients:", err);
      }
    }

    fetchClients();
  }, []);

  const filteredClients = clients.filter((client: any) => {
    const matchesSearch =
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType =
      clientType === "all" ||
      client.type.toLowerCase() === clientType.toLowerCase();

    return matchesSearch && matchesType;
  });

  async function handleCreateClient(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      const createdClient = await createClient(newClient);
      setClients((prev) => [...prev, createdClient]); // Assuming API returns the new client with `id`
      // Optionally reset form here
    } catch (err) {
      console.error("Error creating client", err);
    }
  }
  return (
    <div className="flex flex-col gap-6">
       <Dialog>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground">
            Manage client information and service requests
          </p>
        </div>
       

       
        <div className="flex items-end gap-2">
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Client
            </Button>
          </DialogTrigger>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
        </div>
     

    
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Client</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={handleCreateClient}
            className="space-y-4"
          >
            <Input
              placeholder="Client Name"
              value={newClient.name}
              onChange={(e) =>
                setNewClient({ ...newClient, name: e.target.value })
              }
              required
            />
            <Select
              value={newClient.type}
              onValueChange={(value) =>
                setNewClient({ ...newClient, type: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bank">Bank</SelectItem>
                <SelectItem value="nbfc">NBFC</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="number"
              placeholder="Total Branches"
              value={newClient.totalBranches}
              onChange={(e) =>
                setNewClient({
                  ...newClient,
                  totalBranches: parseInt(e.target.value),
                })
              }
              required
            />
            <Input
              placeholder="Contact Person"
              value={newClient.contactPerson}
              onChange={(e) =>
                setNewClient({ ...newClient, contactPerson: e.target.value })
              }
              required
            />
            <Input
              type="email"
              placeholder="Contact Email"
              value={newClient.contactEmail}
              onChange={(e) =>
                setNewClient({ ...newClient, contactEmail: e.target.value })
              }
            />
            <Input
              placeholder="Contact Phone"
              value={newClient.contactPhone}
              onChange={(e) =>
                setNewClient({ ...newClient, contactPhone: e.target.value })
              }
              required
            />
            <Input
              placeholder="Last Service Date (YYYY-MM-DD)"
              value={newClient.lastServiceDate}
              onChange={(e) =>
                setNewClient({ ...newClient, lastServiceDate: e.target.value })
              }
              required
            />
            <Input
              placeholder="Initials"
              value={newClient.initials}
              onChange={(e) =>
                setNewClient({ ...newClient, initials: e.target.value })
              }
              required
            />
            <Input
              placeholder="Avatar URL"
              value={newClient.avatar}
              onChange={(e) =>
                setNewClient({ ...newClient, avatar: e.target.value })
              }
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button type="submit">Create Client</Button>
              </DialogClose>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
                <TableHead className="hidden md:table-cell">
                  Contact Info
                </TableHead>
                <TableHead className="hidden lg:table-cell">Branches</TableHead>
                <TableHead>Active Tickets</TableHead>
                <TableHead className="hidden lg:table-cell">
                  Last Service
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map((client: any) => (
                <TableRow key={client.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={client.avatar} alt={client.name} />
                        <AvatarFallback>{client.initials}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{client.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {client.id}
                        </div>
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
                      <div className="text-muted-foreground">
                        {client.contactPhone}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {client.totalBranches}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        client.activeTickets > 10
                          ? "destructive"
                          : client.activeTickets > 5
                          ? "default"
                          : "secondary"
                      }
                    >
                      {client.activeTickets}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {client.lastServiceDate}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
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
            {filteredClients.map((client: any) => (
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
                      <div className="text-sm text-muted-foreground">
                        {client.contactPhone}
                      </div>
                    </div>
                    <div className="flex justify-between pt-2">
                      <div>
                        <div className="text-sm font-medium">Branches</div>
                        <div className="text-sm">{client.totalBranches}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium">
                          Active Tickets
                        </div>
                        <div className="text-center">
                          <Badge
                            variant={
                              client.activeTickets > 10
                                ? "destructive"
                                : client.activeTickets > 5
                                ? "default"
                                : "secondary"
                            }
                          >
                            {client.activeTickets}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium">Last Service</div>
                        <div className="text-sm">
                          {client.lastServiceDate.split(",")[0]}
                        </div>
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
