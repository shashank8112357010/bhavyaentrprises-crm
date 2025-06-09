"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  FileText,
  Download,
  Save,
  Search,
  Plus,
  Package,
  Trash2,
  Send,
  Loader2,
  UserPlus,
  X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import apiRequest from "@/lib/axios";
import { useRouter } from "next/navigation";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// Service and schema imports
import { createClient, getAllClients } from "@/lib/services/client";
import { createClientSchema } from "@/lib/validations/clientSchema";
import {
  getAllRateCards,
  createSingleRateCard,
} from "@/lib/services/rate-card";
import { rateCardSchema as inlineRateCardFormSchema } from "@/lib/validations/rateCardSchema";
import { createQuotation } from "@/lib/services/quotations";
import {
  getTicketsForSelection,
  TicketForSelection,
} from "@/lib/services/ticket";
import { useAuthStore } from "@/store/authStore";

// Types
type CreateClientFormData = z.infer<typeof createClientSchema>;

interface Client {
  id: string;
  displayId?: string;
  name: string;
  email?: string;
  contactPerson?: string;
  contactPhone?: string;
}

interface RateCard {
  id: string;
  srNo: number;
  description: string;
  unit: string;
  rate: number;
  bankName: string;
  bankRcNo: string;
}

interface QuotationItem {
  rateCard: RateCard;
  quantity: number;
  gstPercentage: number;
  totalValue: number;
}

// Zod Schema for Quotation Details Form with all required fields
const quotationFormSchema = z.object({
  serialNumber: z.string().optional(),
  date: z.string().default(new Date().toISOString().split("T")[0]),
  salesType: z.string().default("Interstate"),
  quotationNumber: z.string().min(1, "Quote number is required"),
  validUntil: z.string().default(() => {
    // Default to 1 week from today
    const oneWeekLater = new Date();
    oneWeekLater.setDate(oneWeekLater.getDate() + 7);
    return oneWeekLater.toISOString().split("T")[0];
  }),
  admin: z.string().optional(),
  quoteBy: z.string().optional(),
  discount: z.string().default("0"),
  expectedExpense: z.string().default("0"), // Expected expense field
});

const NewQuotationPage = () => {
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useAuthStore();

  // Form for Quotation Details - MUST be called before any conditional returns
  const quotationForm = useForm<z.infer<typeof quotationFormSchema>>({
    resolver: zodResolver(quotationFormSchema),
    defaultValues: {
      serialNumber: "",
      date: new Date().toISOString().split("T")[0],
      salesType: "Interstate",
      quotationNumber: `Q-${Date.now()}`,
      validUntil: (() => {
        const oneWeekLater = new Date();
        oneWeekLater.setDate(oneWeekLater.getDate() + 7);
        return oneWeekLater.toISOString().split("T")[0];
      })(),
      admin: "",
      quoteBy: "",
      discount: "0",
      expectedExpense: "0", // Default expected expense
    },
  });

  // State for Client Information
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientSearch, setClientSearch] = useState<string>("");
  const [clientSearchResults, setClientSearchResults] = useState<Client[]>([]);
  const [isClientSearchLoading, setIsClientSearchLoading] =
    useState<boolean>(false);
  const [showClientSearchDropdown, setShowClientSearchDropdown] =
    useState<boolean>(false);
  const [isCreateClientDialogOpen, setIsCreateClientDialogOpen] =
    useState<boolean>(false);

  // State for Rate Cards & Services
  const [quotationItems, setQuotationItems] = useState<QuotationItem[]>([]);
  const [rateCardSearch, setRateCardSearch] = useState<string>("");
  const [rateCardSearchResults, setRateCardSearchResults] = useState<
    RateCard[]
  >([]);
  const [isRateCardSearchLoading, setIsRateCardSearchLoading] =
    useState<boolean>(false);
  const [showRateCardSearch, setShowRateCardSearch] = useState<boolean>(false);
  const [isSavingQuotation, setIsSavingQuotation] = useState<boolean>(false);

  // State for Ticket Selection
  const [ticketsForSelection, setTicketsForSelection] = useState<
    TicketForSelection[]
  >([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | undefined>(
    undefined,
  );
  const [isLoadingTickets, setIsLoadingTickets] = useState<boolean>(false);

  // State for PDF Export
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);

  // State for Rate Card Creation
  const [isCreateRateCardDialogOpen, setIsCreateRateCardDialogOpen] =
    useState<boolean>(false);
  const [isCreatingRateCard, setIsCreatingRateCard] = useState<boolean>(false);

  // Constants
  const igstRate = 0.18; // 18% IGST

  // Fetch tickets on component mount
  useEffect(() => {
    const fetchTickets = async () => {
      setIsLoadingTickets(true);
      try {
        const tickets = await getTicketsForSelection();
        setTicketsForSelection(tickets);
      } catch (error) {
        console.error("Error fetching tickets:", error);
        toast({
          title: "Error",
          description: "Failed to load tickets.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingTickets(false);
      }
    };

    fetchTickets();
  }, [toast]);

  // Debounced client search function
  const searchClients = async (query: string) => {
    if (!query.trim()) {
      setClientSearchResults([]);
      setShowClientSearchDropdown(false);
      return;
    }

    setIsClientSearchLoading(true);
    try {
      const response = await getAllClients({ searchQuery: query });
      setClientSearchResults(response?.clients || []);
      setShowClientSearchDropdown(true);
    } catch (error) {
      console.error("Error searching clients:", error);
      toast({
        title: "Search Error",
        description: "Failed to search clients.",
        variant: "destructive",
      });
    } finally {
      setIsClientSearchLoading(false);
    }
  };

  // Debounced rate card search function
  const searchRateCards = async (query: string) => {
    if (!query.trim()) {
      setRateCardSearchResults([]);
      setShowRateCardSearch(false);
      return;
    }

    setIsRateCardSearchLoading(true);
    try {
      const response = await getAllRateCards({ searchQuery: query });
      setRateCardSearchResults(response?.data || []);
      setShowRateCardSearch(true);
    } catch (error) {
      console.error("Error searching rate cards:", error);
      toast({
        title: "Search Error",
        description: "Failed to search rate cards.",
        variant: "destructive",
      });
    } finally {
      setIsRateCardSearchLoading(false);
    }
  };

  // Handle client search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      searchClients(clientSearch);
    }, 300);

    return () => clearTimeout(timer);
  }, [clientSearch]);

  // Handle rate card search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      searchRateCards(rateCardSearch);
    }, 300);

    return () => clearTimeout(timer);
  }, [rateCardSearch]);

  // Handle client selection
  const handleClientSelect = (client: Client) => {
    setSelectedClient(client);
    setClientSearch("");
    setShowClientSearchDropdown(false);
  };

  // Handle rate card selection
  const handleRateCardSelect = (rateCard: RateCard) => {
    const newItem: QuotationItem = {
      rateCard,
      quantity: 1,
      gstPercentage: 18,
      totalValue: rateCard.rate,
    };
    setQuotationItems([...quotationItems, newItem]);
    setRateCardSearch("");
    setShowRateCardSearch(false);
  };

  // Handle quantity change
  const handleQuantityChange = (index: number, quantity: number) => {
    const updatedItems = [...quotationItems];
    updatedItems[index].quantity = quantity;
    updatedItems[index].totalValue =
      updatedItems[index].rateCard.rate * quantity;
    setQuotationItems(updatedItems);
  };

  // Handle GST percentage change
  const handleGstChange = (index: number, gstPercentage: number) => {
    const updatedItems = [...quotationItems];
    updatedItems[index].gstPercentage = gstPercentage;
    setQuotationItems(updatedItems);
  };

  // Remove item from quotation
  const handleRemoveItem = (index: number) => {
    const updatedItems = quotationItems.filter((_, i) => i !== index);
    setQuotationItems(updatedItems);
  };

  // Calculate totals
  const subtotal = quotationItems.reduce(
    (acc, item) => acc + item.totalValue,
    0,
  );
  const discountPercentage = parseFloat(quotationForm.watch("discount")) || 0;
  const discountAmount = (subtotal * discountPercentage) / 100;
  const taxableValue = subtotal - discountAmount;
  const igstAmount = taxableValue * igstRate;
  const netGrossAmount = taxableValue + igstAmount;

  // Handle quotation save
  const handleSaveQuotation = async () => {
    if (!selectedClient) {
      toast({
        title: "Error",
        description: "Please select a client first.",
        variant: "destructive",
      });
      return;
    }

    if (quotationItems.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one item to the quotation.",
        variant: "destructive",
      });
      return;
    }

    setIsSavingQuotation(true);

    try {
      const formData = quotationForm.getValues();
      const rateCardDetailsApi = quotationItems.map((item) => ({
        rateCardId: item.rateCard.id,
        quantity: Number(item.quantity),
        gstType: Number(item.gstPercentage),
      }));

      const quotationPayload = {
        name: formData.quotationNumber,
        clientId: selectedClient.id,
        rateCardDetails: rateCardDetailsApi,
        ticketId: selectedTicketId || undefined,
        salesType: formData.salesType,
        validUntil: formData.validUntil || undefined,
        expectedExpense: parseFloat(formData.expectedExpense) || 0,
      };

      const response = await createQuotation(quotationPayload);

      toast({
        title: "Success",
        description: "Quotation saved successfully!",
      });

      // Reset form
      quotationForm.reset();
      setQuotationItems([]);
      setSelectedClient(null);
      setClientSearch("");

      // Navigate back to quotations list
      router.push("/dashboard/quotations");
    } catch (error: any) {
      console.error("Failed to save quotation:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to save quotation.";
      toast({
        title: "Save Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSavingQuotation(false);
    }
  };

  // Handle PDF export for preview
  const handleExportPdf = async () => {
    if (!selectedClient) {
      toast({
        title: "Error",
        description: "Please select a client first.",
        variant: "destructive",
      });
      return;
    }

    if (quotationItems.length === 0) {
      toast({
        title: "Error",
        description: "Please add items first.",
        variant: "destructive",
      });
      return;
    }

    setIsExportingPdf(true);

    try {
      const quotationFormValues = quotationForm.getValues();

      const payload = {
        quotationId:
          quotationFormValues.quotationNumber || `PREVIEW-${Date.now()}`,
        clientName: selectedClient.name,
        clientId: selectedClient.id,
        name: quotationFormValues.serialNumber || "Quotation Preview",
        rateCardDetails: quotationItems.map((item) => ({
          rateCardId: item.rateCard.id,
          quantity: Number(item.quantity),
          gstType: Number(item.gstPercentage),
        })),
        subtotal: Number(subtotal.toFixed(2)),
        gst: Number(igstAmount.toFixed(2)),
        grandTotal: Number(netGrossAmount.toFixed(2)),
        validUntil: quotationFormValues.validUntil,
        expectedExpense: parseFloat(quotationFormValues.expectedExpense) || 0,
      };

      const response = await apiRequest.post(
        "/quotations/preview-pdf",
        payload,
        {
          responseType: "blob",
          withCredentials: true,
        },
      );

      // Create blob and download
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${quotationFormValues.quotationNumber || "quotation"}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "PDF Generated",
        description: "PDF has been downloaded successfully.",
      });
    } catch (error: any) {
      console.error("Failed to export PDF:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to generate PDF.";
      toast({
        title: "Export Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Client form for creating new clients - MUST be called before any conditional returns
  const clientForm = useForm<CreateClientFormData>({
    resolver: zodResolver(createClientSchema),
    defaultValues: {
      name: "",
      type: "Bank",
      totalBranches: 1,
      contactPerson: "",
      contactEmail: "",
      contactPhone: "",
      contractStatus: "Active",
      lastServiceDate: new Date().toISOString().split("T")[0],
      gstn: "",
      avatar: "",
      initials: "",
    },
  });

  // Rate card form for creating new rate cards
  type CreateRateCardFormData = z.infer<typeof inlineRateCardFormSchema>;
  const rateCardForm = useForm<CreateRateCardFormData>({
    resolver: zodResolver(inlineRateCardFormSchema),
    defaultValues: {
      srNo: 1,
      description: "",
      unit: "",
      rate: 0,
      bankName: "BE", // Default bank name as BE
      bankRcNo: "N/A", // Default BankRc as N/A
    },
  });

  // Role-based access control - only ADMIN users can create quotations
  // This check MUST come AFTER all hooks are declared
  if (user?.role !== "ADMIN") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">
              Only administrators can create quotations.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const onClientFormSubmit = async (values: CreateClientFormData) => {
    try {
      const newClient = await createClient(values);
      toast({
        title: "Success",
        description: "Client created successfully!",
      });
      setIsCreateClientDialogOpen(false);
      clientForm.reset();

      // Refresh client search to include new client
      if (clientSearch) {
        searchClients(clientSearch);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create client.",
        variant: "destructive",
      });
    }
  };

  const onRateCardFormSubmit = async (values: CreateRateCardFormData) => {
    setIsCreatingRateCard(true);
    try {
      const newRateCard = await createSingleRateCard(values);
      toast({
        title: "Success",
        description: "Rate card created successfully!",
      });
      setIsCreateRateCardDialogOpen(false);
      rateCardForm.reset({
        srNo: 1,
        description: "",
        unit: "",
        rate: 0,
        bankName: "BE",
        bankRcNo: "N/A",
      });

      // Automatically add the new rate card to the quotation
      if (newRateCard) {
        handleRateCardSelect(newRateCard);
      }

      // Refresh rate card search to include new card
      if (rateCardSearch) {
        searchRateCards(rateCardSearch);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create rate card.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingRateCard(false);
    }
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Create New Quotation
          </h2>
          <p className="text-muted-foreground">
            Create a new quotation for your clients.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleExportPdf}
            disabled={
              isExportingPdf || !selectedClient || quotationItems.length === 0
            }
          >
            {isExportingPdf ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Export PDF
          </Button>
          <Button
            onClick={handleSaveQuotation}
            disabled={
              isSavingQuotation ||
              !selectedClient ||
              quotationItems.length === 0
            }
          >
            {isSavingQuotation ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Quotation
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Client and Rate Cards */}
        <div className="lg:col-span-2 space-y-6">
          {/* Client Information Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Client Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="clientSearch">Client Search</Label>
                <div className="relative">
                  <Input
                    id="clientSearch"
                    placeholder="Search for a client..."
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                    className="pr-10"
                  />
                  {isClientSearchLoading && (
                    <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin" />
                  )}
                </div>

                {/* Client Search Dropdown - Fixed positioning */}
                {showClientSearchDropdown && clientSearchResults.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {clientSearchResults.map((client) => (
                      <div
                        key={client.id}
                        className="p-3 hover:bg-accent cursor-pointer border-b last:border-b-0"
                        onClick={() => handleClientSelect(client)}
                      >
                        <div className="font-medium">{client.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {client.displayId || client.id}
                        </div>
                        {client.contactPerson && (
                          <div className="text-sm text-muted-foreground">
                            Contact: {client.contactPerson}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button
                variant="outline"
                onClick={() => setIsCreateClientDialogOpen(true)}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create New Client
              </Button>

              {/* Selected Client Display */}
              {selectedClient && (
                <div className="p-4 border rounded-lg bg-muted/50 flex items-center justify-between">
                  <div>
                    <p className="font-medium">Selected Client:</p>
                    <p className="text-lg font-semibold">
                      {selectedClient.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selectedClient.displayId || selectedClient.id}
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setSelectedClient(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Rate Cards & Services Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Rate Cards & Services
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="rateCardSearch">Search Rate Cards</Label>
                <div className="relative">
                  <Input
                    id="rateCardSearch"
                    placeholder="Search for rate cards..."
                    value={rateCardSearch}
                    onChange={(e) => setRateCardSearch(e.target.value)}
                    className="pr-10"
                  />
                  {isRateCardSearchLoading && (
                    <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin" />
                  )}
                </div>

                {/* Rate Card Search Dropdown - Fixed positioning */}
                {showRateCardSearch && rateCardSearchResults.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {rateCardSearchResults.map((rateCard) => (
                      <div
                        key={rateCard.id}
                        className="p-3 hover:bg-accent cursor-pointer border-b last:border-b-0"
                        onClick={() => handleRateCardSelect(rateCard)}
                      >
                        <div className="font-medium">
                          {rateCard.description}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Rate: ₹{rateCard.rate} | Unit: {rateCard.unit}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {rateCard.bankName} - {rateCard.bankRcNo}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button
                variant="outline"
                onClick={() => setIsCreateRateCardDialogOpen(true)}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create New Rate Card
              </Button>

              {/* Selected Items Table */}
              {quotationItems.length > 0 && (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead>Unit</TableHead>
                        <TableHead>Rate</TableHead>
                        <TableHead className="w-[100px]">Quantity</TableHead>
                        <TableHead className="w-[100px]">GST %</TableHead>
                        <TableHead>Line Total</TableHead>
                        <TableHead className="w-[80px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {quotationItems.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.rateCard.description}</TableCell>
                          <TableCell>{item.rateCard.unit}</TableCell>
                          <TableCell>
                            ₹{item.rateCard.rate.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) =>
                                handleQuantityChange(
                                  index,
                                  parseFloat(e.target.value) || 0,
                                )
                              }
                              className="w-full"
                              min="0"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={item.gstPercentage}
                              onChange={(e) =>
                                handleGstChange(
                                  index,
                                  parseFloat(e.target.value) || 0,
                                )
                              }
                              className="w-full"
                              min="0"
                              max="100"
                            />
                          </TableCell>
                          <TableCell>₹{item.totalValue.toFixed(2)}</TableCell>
                          <TableCell>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleRemoveItem(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Quotation Details and Summary */}
        <div className="space-y-6">
          {/* Quotation Details */}
          <Card>
            <CardHeader>
              <CardTitle>Quotation Details</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...quotationForm}>
                <form className="space-y-4">
                  <FormField
                    control={quotationForm.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={quotationForm.control}
                    name="salesType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sales Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select sales type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Interstate">
                              Interstate
                            </SelectItem>
                            <SelectItem value="Intrastate">
                              Intrastate
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={quotationForm.control}
                    name="validUntil"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valid Until</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={quotationForm.control}
                    name="expectedExpense"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expected Expense</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            min="0"
                            step="0.01"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Ticket Selection */}
                  <div>
                    <Label>Link to Ticket (Optional)</Label>
                    <Select
                      value={selectedTicketId || "none"}
                      onValueChange={(value) =>
                        setSelectedTicketId(
                          value === "none" ? undefined : value,
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a ticket" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No ticket</SelectItem>
                        {ticketsForSelection.map((ticket) => (
                          <SelectItem key={ticket.id} value={ticket.id}>
                            {ticket.ticketId} - {ticket.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Calculations & Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Calculations & Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Quotation Summary</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Total Items:</span>
                      <span>{quotationItems.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Quantity:</span>
                      <span>
                        {quotationItems.reduce(
                          (acc, item) => acc + item.quantity,
                          0,
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>₹{subtotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h4 className="font-medium">Tax Calculations</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>₹{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Discount:</span>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          className="w-16 h-6 text-xs"
                          {...quotationForm.register("discount")}
                        />
                        <span className="text-xs">%</span>
                        <span className="text-red-500">
                          -₹{discountAmount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span>Taxable Value:</span>
                      <span>₹{taxableValue.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>IGST (18%):</span>
                      <span>₹{igstAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between font-bold text-lg">
                  <span>Grand Total:</span>
                  <span>₹{netGrossAmount.toFixed(2)}</span>
                </div>

                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium">Amount in Words:</p>
                  <p className="text-sm text-muted-foreground">
                    {/* This would be calculated by the backend */}
                    Rupees {Math.floor(netGrossAmount).toLocaleString()} Only
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Create Client Dialog */}
      <Dialog
        open={isCreateClientDialogOpen}
        onOpenChange={setIsCreateClientDialogOpen}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Client</DialogTitle>
            <DialogDescription>
              Add a new client to your database.
            </DialogDescription>
          </DialogHeader>
          <Form {...clientForm}>
            <form
              onSubmit={clientForm.handleSubmit(onClientFormSubmit)}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={clientForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter client name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={clientForm.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client Type *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Bank">Bank</SelectItem>
                          <SelectItem value="NBFC">NBFC</SelectItem>
                          <SelectItem value="Insurance">Insurance</SelectItem>
                          <SelectItem value="Corporate">Corporate</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={clientForm.control}
                  name="contactPerson"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Person *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter contact person" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={clientForm.control}
                  name="contactPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Phone *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter phone number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={clientForm.control}
                  name="contactEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Email</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter email"
                          type="email"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={clientForm.control}
                  name="totalBranches"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Branches *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value) || 1)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={clientForm.control}
                  name="gstn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>GSTN</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter GSTN" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={clientForm.control}
                  name="lastServiceDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Service Date *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter className="pt-4">
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="submit">Create Client</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NewQuotationPage;
