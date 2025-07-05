"use client";

import { useCallback, useEffect, useState } from "react";
import { Building, Download, MoreHorizontal, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useClientStore } from "@/store/clientStore";
import {
  createClient,
  exportClientsToCsv,
} from "@/lib/services/client";
import { UploadClientsDialog } from "@/components/clients/UploadClientsDialog";
import { EditClientDialog } from "@/components/clients/edit-client-dialog";
import InfiniteScrollList from "@/components/ui/infinite-scroll";
import { useDebounce } from "@/hooks/useDebounce";

type Client = {
  id?: string;
  displayId?: string;
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
  state?: string;
  tickets: any[];
};

const CLIENT_TYPES = [
  { value: "all", label: "All Client Types" },
  { value: "bank", label: "Bank" },
  { value: "nbfc", label: "NBFC" },
  { value: "insurance", label: "Insurance" },
  { value: "corporate", label: "Corporate" },
];

export default function InfiniteClientsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [clientType, setClientType] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  const { toast } = useToast();
  const { user } = useAuthStore();
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // Use the enhanced client store
  const {
    allClients,
    loading,
    loadingMore,
    error,
    hasNextPage,
    searchQuery: storeSearchQuery,
    filters: storeFilters,
    fetchClients,
    fetchNextPage,
    setSearchQuery: setStoreSearchQuery,
    setFilters: setStoreFilters,
    forceRefresh,
  } = useClientStore();

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
    state: "chandigarh",
    tickets: [],
  });

  // Handle search changes
  useEffect(() => {
    if (debouncedSearchQuery !== storeSearchQuery) {
      setStoreSearchQuery(debouncedSearchQuery);
    }
  }, [debouncedSearchQuery, storeSearchQuery, setStoreSearchQuery]);

  // Handle filter changes
  useEffect(() => {
    const newFilters = clientType === "all" ? {} : { type: clientType };
    if (JSON.stringify(newFilters) !== JSON.stringify(storeFilters)) {
      setStoreFilters(newFilters);
    }
  }, [clientType, storeFilters, setStoreFilters]);

  // Initial data fetch
  useEffect(() => {
    if (allClients.length === 0) {
      fetchClients();
    }
  }, [allClients.length, fetchClients]);

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

    // Validation
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
      await createClient({ ...newClient, initials });

      setIsDialogOpen(false);
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
        state: "chandigarh",
        tickets: [],
      });

      // Refresh the list
      forceRefresh();
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

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setIsEditDialogOpen(true);
  };

  const handleDeleteClient = async (clientId: string, clientName: string) => {
    if (
      !confirm(
        `Are you sure you want to delete client "${clientName}"? This action cannot be undone.`
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

      forceRefresh();
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
    forceRefresh();
  };

  const handleRefresh = useCallback(async () => {
    setSearchQuery("");
    setClientType("all");
    await forceRefresh();
  }, [forceRefresh]);

  // Render individual client card
  const renderClientCard = useCallback((client: Client, index: number) => {
    const key = client.id || `client-${index}`;
    
    return (
      <Card key={key} className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
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
            <div className="flex items-center gap-2">
              <Badge variant="outline">{client.type}</Badge>
              {user?.role === "ADMIN" && (
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
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium text-muted-foreground">Contact Person</p>
              <p>{client.contactPerson}</p>
            </div>
            <div>
              <p className="font-medium text-muted-foreground">Total Branches</p>
              <p>{client.totalBranches}</p>
            </div>
            <div>
              <p className="font-medium text-muted-foreground">Contact Info</p>
              <p className="truncate">{client.contactEmail}</p>
              <p className="text-muted-foreground">{client.contactPhone}</p>
            </div>
            <div>
              <p className="font-medium text-muted-foreground">Status</p>
              <Badge
                variant={
                  client.contractStatus.toLowerCase() === "active"
                    ? "default"
                    : "secondary"
                }
                className="mt-1"
              >
                {client.contractStatus}
              </Badge>
            </div>
            <div className="col-span-2">
              <p className="font-medium text-muted-foreground">Last Service</p>
              <p>
                {client.lastServiceDate
                  ? format(new Date(client.lastServiceDate), "PPP")
                  : "—"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }, [user, handleEditClient, handleDeleteClient]);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground">
            Manage client information and service requests with infinite scroll
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
                <Input
                  placeholder="State"
                  value={newClient.state}
                  onChange={(e) =>
                    setNewClient({ ...newClient, state: e.target.value })
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
          <UploadClientsDialog onUploadComplete={forceRefresh} />
          <a href="/sample_client_import.csv" download>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Download Sample
            </Button>
          </a>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="relative w-full md:w-auto">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by ID, Name or Contact Person"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full md:w-[300px] pl-8"
            type="search"
          />
        </div>

        <div className="w-full md:w-[190px]">
          <Select value={clientType} onValueChange={setClientType}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by Client Type" />
            </SelectTrigger>
            <SelectContent>
              {CLIENT_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Infinite Scroll List */}
      <InfiniteScrollList
        data={allClients}
        hasMore={hasNextPage}
        loading={loading}
        loadingMore={loadingMore}
        error={error}
        fetchMore={fetchNextPage}
        onRefresh={handleRefresh}
        renderItem={renderClientCard}
        searchQuery={searchQuery}
        activeFilters={clientType !== "all" ? { type: clientType } : {}}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      />

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
