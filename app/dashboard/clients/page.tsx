"use client";

import { useEffect, useState } from "react";
import ReactPaginate from "react-paginate";
import { Building, Download, MoreHorizontal, Plus, Search } from "lucide-react";
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
} from "@/components/ui/dialog";
import { format } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import {
  createClient,
  exportClientsToExcel,
  getAllClients,
} from "@/lib/services/client";
import { Spinner } from "@/components/ui/spinner";
import { Label } from "@radix-ui/react-select";

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
  gstn?: string;
};

type GetClient = {
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
  gstn?: string;
  tickets : [];
};

const ITEMS_PER_PAGE = 5;

export default function ClientsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [clientType, setClientType] = useState("all");
  const [clients, setClients] = useState<GetClient[]>([]);
  const { toast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  const [newClient, setNewClient] = useState<Client>({
    name: "",
    type: "Choose Bank",
    totalBranches: 1,
    contactPerson: "",
    contactEmail: "",
    contactPhone: "",
    contractStatus: "Active",
    lastServiceDate: "",
    avatar: "",
    initials: "",
    gstn: "",
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    async function fetchClients() {
      try {
        setLoading(true);
        const data = await getAllClients();
        setLoading(false);
        setClients(data?.clients || []);
      } catch (err) {
        setLoading(false);
        console.error("Failed to fetch clients:", err);
      }
    }
    fetchClients();
  }, []);

  // Filtered clients by search and type
  const filteredClients = clients.filter((client: Client) => {
    const matchesSearch =
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (client.id?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

    const matchesType =
      clientType === "all" ||
      client.type.toLowerCase() === clientType.toLowerCase();

    return matchesSearch && matchesType;
  });

  // Pagination calculation: slice filteredClients for current page
  const pageCount = Math.ceil(filteredClients.length / ITEMS_PER_PAGE);
  const paginatedClients = filteredClients.slice(
    currentPage * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE + ITEMS_PER_PAGE
  );

  // Reset to first page when filters/search change
  useEffect(() => {
    setCurrentPage(0);
  }, [searchQuery, clientType, clients]);

  async function handleCreateClient(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);

    const {
      name,
      type,
      totalBranches,
      contactPerson,
      contactPhone,
      lastServiceDate,
      initials,
    } = newClient;

    if (!name) {
      toast({
        title: "Missing Name",
        description: "Client name is required.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    if (!type || type === "Choose Bank") {
      toast({
        title: "Missing Type",
        description: "Please select a valid client type.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    if (!totalBranches || totalBranches <= 0) {
      toast({
        title: "Invalid Branch Count",
        description: "Total branches must be a positive number.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    if (!contactPerson) {
      toast({
        title: "Missing Contact Person",
        description: "Contact person name is required.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    if (!contactPhone) {
      toast({
        title: "Missing Contact Phone",
        description: "Contact phone number is required.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    if (!lastServiceDate) {
      toast({
        title: "Missing Last Service Date",
        description: "Please select the last service date.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    if (!initials) {
      toast({
        title: "Missing Initials",
        description: "Client initials are required.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      const createdClient = await createClient(newClient);
      setClients((prev) => [...prev, createdClient]);

      toast({
        title: "Success",
        description: "Client created successfully.",
      });

      // Reset form
      setNewClient({
        name: "",
        type: "Choose Bank",
        totalBranches: 1,
        contactPerson: "",
        contactEmail: "",
        contactPhone: "",
        contractStatus: "Active",
        lastServiceDate: "",
        avatar: "",
        initials: "",
        gstn: "",
      });
    } catch (err: any) {
      console.error("Error creating client", err);
      toast({
        title: "Error",
        description: err.message || "Failed to create client.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  // Handle page change from ReactPaginate
  function handlePageClick(selectedItem: { selected: number }) {
    setCurrentPage(selectedItem.selected);
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
            <Button variant="outline" onClick={exportClientsToExcel}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Client</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateClient} className="space-y-4">
            <Input
              placeholder="Client Name"
              value={newClient.name}
              onChange={(e) =>
                setNewClient({ ...newClient, name: e.target.value })
              }
            />
            <Select
              value={newClient.type}
              onValueChange={(value) =>
                setNewClient({ ...newClient, type: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Type" className="text-white" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Choose Bank">Choose Bank</SelectItem>
                <SelectItem value="NBFC">NBFC</SelectItem>
                <SelectItem value="bank">Bank</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="number"
              placeholder="Total Branches"
              value={newClient.totalBranches}
              onChange={(e) =>
                setNewClient({
                  ...newClient,
                  totalBranches: Number(e.target.value),
                })
              }
              min={1}
            />
            <Input
              placeholder="Contact Person"
              value={newClient.contactPerson}
              onChange={(e) =>
                setNewClient({ ...newClient, contactPerson: e.target.value })
              }
            />
            <Input
              placeholder="Contact Email"
              value={newClient.contactEmail}
              onChange={(e) =>
                setNewClient({ ...newClient, contactEmail: e.target.value })
              }
              type="email"
            />
            <Input
              placeholder="Contact Phone"
              value={newClient.contactPhone}
              onChange={(e) =>
                setNewClient({ ...newClient, contactPhone: e.target.value })
              }
              type="tel"
            />
            <Input
              placeholder="GSTN"
              value={newClient.gstn}
              onChange={(e) =>
                setNewClient({ ...newClient, gstn: e.target.value })
              }
            />
            <Select
              value={newClient.contractStatus}
              onValueChange={(value) =>
                setNewClient({ ...newClient, contractStatus: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Contract Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left"
                >
                  {newClient.lastServiceDate
                    ? format(new Date(newClient.lastServiceDate), "PPP")
                    : "Last Service Date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={
                    newClient.lastServiceDate
                      ? new Date(newClient.lastServiceDate)
                      : undefined
                  }
                  onSelect={(date) => {
                    if (date) {
                      setNewClient({
                        ...newClient,
                        lastServiceDate: date.toISOString(),
                      });
                    }
                  }}
                  disabled={(date) => date > new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Input
              placeholder="Initials"
              value={newClient.initials}
              onChange={(e) =>
                setNewClient({ ...newClient, initials: e.target.value })
              }
              maxLength={3}
            />

            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Client"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <Input
          placeholder="Search by ID, Name or Contact Person"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-xs"
          type="search"
        />

        <div className="max-w-xs ">
       

          <Select
            value={clientType}
            onValueChange={setClientType}
            // className="max-w-xs"
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by Client Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="bank">Bank</SelectItem>
              <SelectItem value="nbfc">NBFC</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="table">
        <TabsList>
          <TabsTrigger value="table">Table View</TabsTrigger>
          <TabsTrigger value="grid">Grid View</TabsTrigger>
        </TabsList>

        <TabsContent value="table" className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-10">
              <Spinner size="7" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Total Branches</TableHead>
                  <TableHead>Contact Person</TableHead>
                  <TableHead>Contact Email</TableHead>
                  <TableHead>Contact Phone</TableHead>
                  <TableHead>Contract Status</TableHead>
                  <TableHead>Last Service Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedClients.length > 0 ? (
                  paginatedClients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="flex items-center gap-2">
                        {client.avatar ? (
                          <Avatar>
                            <AvatarImage
                              src={client.avatar}
                              alt={client.name}
                            />
                            <AvatarFallback>{client.initials}</AvatarFallback>
                          </Avatar>
                        ) : (
                          <Avatar>
                            <AvatarFallback>{client.initials}</AvatarFallback>
                          </Avatar>
                        )}
                        <div className="flex flex-col">
                          <p className="font-medium">{client.name}</p>
                          <p className="text-muted-foreground text-sm">
                            {client.id}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{client.type}</TableCell>
                      <TableCell>{client.totalBranches}</TableCell>
                      <TableCell>{client.contactPerson}</TableCell>
                      <TableCell className="hover:underline cursor-pointer">{client.contactEmail}</TableCell>
                      <TableCell>{client.contactPhone}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            client.contractStatus.toLowerCase() === "active"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {client.contractStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {client.lastServiceDate
                          ? format(new Date(client.lastServiceDate), "PPP")
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-6 text-muted-foreground"
                    >
                      No clients found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}

          {/* Pagination: only show if more than 5 records */}
          {filteredClients.length > ITEMS_PER_PAGE && (
            <div className="flex justify-end mt-4">
              <ReactPaginate
                previousLabel={"← Previous"}
                nextLabel={"Next →"}
                breakLabel={"..."}
                pageCount={pageCount}
                marginPagesDisplayed={1}
                pageRangeDisplayed={3}
                onPageChange={handlePageClick}
                containerClassName="flex space-x-1 text-sm select-none"
                pageClassName="px-3 py-1 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-100"
                activeClassName="bg-blue-600 text-white border-blue-600"
                previousClassName="px-3 py-1 border border-gray-300 rounded-l-md cursor-pointer hover:bg-gray-100"
                nextClassName="px-3 py-1 border border-gray-300 rounded-r-md cursor-pointer hover:bg-gray-100"
                disabledClassName="opacity-50 cursor-not-allowed"
                forcePage={currentPage}
              />
            </div>
          )}
        </TabsContent>

        <TabsContent
          value="grid"
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {loading ? (
            <div className="col-span-full flex justify-center py-10">
              <Spinner size="6" />
            </div>
          ) : paginatedClients.length > 0 ? (
            paginatedClients.map((client) => (
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
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-medium">Contact Person</div>
                      <div className="text-sm">{client.contactPerson}</div>
                    </div>
                    <div  className="flex items-center gap-3">
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
                              client?.tickets.length > 1
                                ? "destructive"
                                : client.tickets.length > 5
                                ? "default"
                                : "secondary"
                            }
                          >
                            {client.tickets.length}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium">Last Service</div>
                        <div className="text-sm">
                          {client.lastServiceDate.split("T")[0]}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center text-muted-foreground py-10">
              No clients found.
            </div>
          )}

          {/* Pagination in grid view */}
          {filteredClients.length > ITEMS_PER_PAGE && (
            <div className="col-span-full flex justify-end mt-4">
              <ReactPaginate
                previousLabel={"← Previous"}
                nextLabel={"Next →"}
                breakLabel={"..."}
                pageCount={pageCount}
                marginPagesDisplayed={1}
                pageRangeDisplayed={3}
                onPageChange={handlePageClick}
                containerClassName="flex space-x-1 text-sm select-none"
                pageClassName="px-3 py-1 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-100"
                activeClassName="bg-blue-600 text-white border-blue-600"
                previousClassName="px-3 py-1 border border-gray-300 rounded-l-md cursor-pointer hover:bg-gray-100"
                nextClassName="px-3 py-1 border border-gray-300 rounded-r-md cursor-pointer hover:bg-gray-100"
                disabledClassName="opacity-50 cursor-not-allowed"
                forcePage={currentPage}
              />
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
