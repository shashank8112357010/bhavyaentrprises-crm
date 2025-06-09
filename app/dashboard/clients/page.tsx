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
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/authStore";
import {
  createClient,
  exportClientsToCsv,
  getAllClients,
} from "@/lib/services/client";
import { UploadClientsDialog } from "@/components/clients/UploadClientsDialog";
import { EditClientDialog } from "@/components/clients/edit-client-dialog";
import { Spinner } from "@/components/ui/spinner";

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
  displayId?: string; // Add displayId field
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
  tickets: any[];
};

export default function ClientsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [clientType, setClientType] = useState("all");
  const [clients, setClients] = useState<GetClient[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingClient, setEditingClient] = useState<GetClient | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { user } = useAuthStore();

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

  const [currentPage, setCurrentPage] = useState(0);

  async function refreshClients() {
    try {
      setLoading(true);
      const data = await getAllClients();
      setClients(data?.clients || []);
    } catch (err) {
      console.error("Failed to fetch clients:", err);
      toast({
        title: "Error",
        description: "Could not refresh client list.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshClients();
  }, []);

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (client.id?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      (client.displayId?.toLowerCase().includes(searchQuery.toLowerCase()) ??
        false);

    const matchesType =
      clientType === "all" ||
      client.type.toLowerCase() === clientType.toLowerCase();

    return matchesSearch && matchesType;
  });

  const pageCount =
    itemsPerPage > 0 ? Math.ceil(filteredClients.length / itemsPerPage) : 0;
  const paginatedClients = filteredClients.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage,
  );

  useEffect(() => {
    setCurrentPage(0);
  }, [searchQuery, clientType, itemsPerPage]);

  useEffect(() => {
    if (pageCount > 0 && currentPage >= pageCount) {
      setCurrentPage(pageCount - 1);
    } else if (pageCount === 0 && currentPage !== 0) {
      setCurrentPage(0);
    }
  }, [pageCount, currentPage]);

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

    try {
      const initials = newClient.name
        .split(" ")
        .map((n) => n[0])
        .join("");
      const createdClient = await createClient({ ...newClient, initials });

      setIsDialogOpen(false);

      const data = await getAllClients();
      setClients(data?.clients || []);

      toast({
        title: "Success",
        description: "Client created successfully.",
      });

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

  function handlePageClick(selectedItem: { selected: number }) {
    setCurrentPage(selectedItem.selected);
  }

  const handleEditClient = (client: GetClient) => {
    setEditingClient(client);
    setIsEditDialogOpen(true);
  };

  const handleDeleteClient = async (clientId: string, clientName: string) => {
    if (
      !confirm(
        `Are you sure you want to delete client "${clientName}"? This action cannot be undone.`,
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/client/${clientId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete client");
      }

      toast({
        title: "Success",
        description: "Client deleted successfully.",
      });

      refreshClients();
    } catch (error: any) {
      console.error("Error deleting client:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete client.",
        variant: "destructive",
      });
    }
  };

  const handleEditSuccess = () => {
    setIsEditDialogOpen(false);
    setEditingClient(null);
    refreshClients();
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground">
            Manage client information and service requests
          </p>
        </div>

        <div className="flex items-end gap-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Client
              </Button>
            </DialogTrigger>
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
                    <SelectValue placeholder="Choose Client Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Choose Bank">
                      Choose Client Type
                    </SelectItem>
                    <SelectItem value="Bank">Bank</SelectItem>
                    <SelectItem value="NBFC">NBFC</SelectItem>
                    <SelectItem value="Insurance">Insurance</SelectItem>
                    <SelectItem value="Corporate">Corporate</SelectItem>
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
                    setNewClient({
                      ...newClient,
                      contactPerson: e.target.value,
                    })
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
                  value={newClient.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                  readOnly
                />

                <DialogFooter>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Creating..." : "Create Client"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Button variant="outline" onClick={exportClientsToCsv}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <UploadClientsDialog onUploadComplete={refreshClients} />
          <a href="/sample_client_import.csv" download>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Download Sample
            </Button>
          </a>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <Input
          placeholder="Search by ID, Name or Contact Person"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-xs"
          type="search"
        />

        <div className="max-w-xs w-[190px]">
          <Select value={clientType} onValueChange={setClientType}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by Client Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Select Client Types</SelectItem>
              <SelectItem value="bank">Bank</SelectItem>
              <SelectItem value="nbfc">NBFC</SelectItem>
              <SelectItem value="insurance">Insurance</SelectItem>
              <SelectItem value="corporate">Corporate</SelectItem>
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
                  {user?.role === "ADMIN" && (
                    <TableHead className="text-right">Actions</TableHead>
                  )}
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
                            {client.displayId || client.id}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{client.type}</TableCell>
                      <TableCell>{client.totalBranches}</TableCell>
                      <TableCell>{client.contactPerson}</TableCell>
                      <TableCell className="hover:underline cursor-pointer">
                        {client.contactEmail}
                      </TableCell>
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
                      {user?.role === "ADMIN" && (
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
                              <DropdownMenuItem
                                onClick={() => handleEditClient(client)}
                              >
                                Edit Client
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() =>
                                  handleDeleteClient(client.id!, client.name)
                                }
                              >
                                Delete Client
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={user?.role === "ADMIN" ? 9 : 8}
                      className="text-center py-6 text-muted-foreground"
                    >
                      No clients found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}

          {/* Pagination Controls Area */}
          <div className="mt-4 flex flex-col items-center gap-4 md:flex-row md:justify-between">
            <div className="text-sm text-muted-foreground mb-2 md:mb-0">
              {filteredClients.length > 0
                ? `Showing ${currentPage * itemsPerPage + 1} - ${Math.min((currentPage + 1) * itemsPerPage, filteredClients.length)} of ${filteredClients.length} clients`
                : "No clients found"}
            </div>

            {filteredClients.length > itemsPerPage && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">Rows:</span>
                <Select
                  value={String(itemsPerPage)}
                  onValueChange={(value) => {
                    setItemsPerPage(Number(value));
                  }}
                >
                  <SelectTrigger className="w-[75px] h-9">
                    <SelectValue placeholder={String(itemsPerPage)} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="15">15</SelectItem>
                  </SelectContent>
                </Select>

                <ReactPaginate
                  previousLabel={"← Previous"}
                  nextLabel={"Next →"}
                  breakLabel={"..."}
                  pageCount={pageCount}
                  marginPagesDisplayed={1}
                  pageRangeDisplayed={2}
                  onPageChange={handlePageClick}
                  containerClassName="flex items-center space-x-1 text-sm select-none"
                  pageLinkClassName="px-3 py-1.5 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
                  activeLinkClassName="bg-blue-600 text-white border-blue-600 dark:bg-blue-500 dark:border-blue-500"
                  previousLinkClassName="px-3 py-1.5 border border-gray-300 rounded-l-md cursor-pointer hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
                  nextLinkClassName="px-3 py-1.5 border border-gray-300 rounded-r-md cursor-pointer hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
                  disabledLinkClassName="opacity-50 cursor-not-allowed"
                  forcePage={currentPage}
                />
              </div>
            )}
          </div>
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
                        <CardDescription>
                          {client.displayId || client.id}
                        </CardDescription>
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
                    <div className="flex items-center gap-3">
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
                              client.tickets.length > 1
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

          {/* Pagination Controls Area for Grid View */}
          <div className="col-span-full mt-4 flex flex-col items-center gap-4 md:flex-row md:justify-between">
            <div className="text-sm text-muted-foreground mb-2 md:mb-0">
              {filteredClients.length > 0
                ? `Showing ${currentPage * itemsPerPage + 1} - ${Math.min((currentPage + 1) * itemsPerPage, filteredClients.length)} of ${filteredClients.length} clients`
                : "No clients found"}
            </div>

            {filteredClients.length > itemsPerPage && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">Rows:</span>
                <Select
                  value={String(itemsPerPage)}
                  onValueChange={(value) => {
                    setItemsPerPage(Number(value));
                  }}
                >
                  <SelectTrigger className="w-[75px] h-9">
                    <SelectValue placeholder={String(itemsPerPage)} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="15">15</SelectItem>
                  </SelectContent>
                </Select>

                <ReactPaginate
                  previousLabel={"← Previous"}
                  nextLabel={"Next →"}
                  breakLabel={"..."}
                  pageCount={pageCount}
                  marginPagesDisplayed={1}
                  pageRangeDisplayed={2}
                  onPageChange={handlePageClick}
                  containerClassName="flex items-center space-x-1 text-sm select-none"
                  pageLinkClassName="px-3 py-1.5 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
                  activeLinkClassName="bg-blue-600 text-white border-blue-600 dark:bg-blue-500 dark:border-blue-500"
                  previousLinkClassName="px-3 py-1.5 border border-gray-300 rounded-l-md cursor-pointer hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
                  nextLinkClassName="px-3 py-1.5 border border-gray-300 rounded-r-md cursor-pointer hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
                  disabledLinkClassName="opacity-50 cursor-not-allowed"
                  forcePage={currentPage}
                />
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Client Dialog */}
      <EditClientDialog
        client={editingClient}
        isOpen={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false);
          setEditingClient(null);
        }}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
}
