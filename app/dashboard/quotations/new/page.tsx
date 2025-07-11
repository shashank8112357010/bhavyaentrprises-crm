"use client";

import { useState, useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Save, Download, Search, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/useDebounce";

// Validation schemas
import { createClientSchema } from "@/lib/validations/clientSchema";
import { quotationFormSchema } from "@/lib/validations/quotationSchema";
import { inlineRateCardFormSchema } from "@/lib/validations/rateCardSchema";

// Services
import { createClient } from "@/lib/services/client";
import { getAllRateCards } from "@/lib/services/rate-card";
import { createQuotation } from "@/lib/services/quotations";
import {
  getAllTickets,
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
  type: string;
  contactPerson: string;
  contactNumber: string;
  contactEmail?: string;
  totalBranches: number;
  gstn?: string;
}

interface RateCard {
  id: string;
  srNo: number;
  description: string;
  unit: string;
  rate: number;
  bankName: string;
}

interface QuotationItem extends RateCard {
  quantity: number;
  gstPercentage: number;
  totalValue: number;
  rateCard: RateCard;
}

// Rate card service function for creating single rate card
const createSingleRateCard = async (data: any) => {
  const response = await fetch("/api/rate-cards/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          
    credentials: "include",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to create rate card");
  }

  return response.json();
};

export default function NewQuotationPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuthStore();
  const searchParams = useSearchParams();

  // State for rate cards
  const [rateCards, setRateCards] = useState<RateCard[]>([]);
  const [rateCardSearch, setRateCardSearch] = useState("");
  const [loadingRateCards, setLoadingRateCards] = useState(false);
  const debouncedRateCardSearch = useDebounce(rateCardSearch, 300);

  // State for selected rate card and quantity
  const [selectedRateCard, setSelectedRateCard] = useState<RateCard | null>(
    null
  );
  const [quantity, setQuantity] = useState<number>(1);

  // State for quotation items
  const [quotationItems, setQuotationItems] = useState<QuotationItem[]>([]);

  // State for Rate Card Creation
  const [isCreateRateCardDialogOpen, setIsCreateRateCardDialogOpen] =
    useState<boolean>(false);
  const [isCreatingRateCard, setIsCreatingRateCard] = useState<boolean>(false);

  // State for ticket and client (auto-detected from ticket)
  const [ticketsForSelection, setTicketsForSelection] = useState<
    TicketForSelection[]
  >([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | undefined>(
    undefined
  );
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isLoadingTickets, setIsLoadingTickets] = useState<boolean>(false);

  // State for save/export operations
  const [isSavingQuotation, setIsSavingQuotation] = useState<boolean>(false);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  type CreateRateCardFormData = z.infer<typeof inlineRateCardFormSchema>;

  // Form for Quotation Details - ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL LOGIC
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
      discount: "0",
      expectedExpense: "0",
    },
  });


  // Rate card form for creating new rate cards

  const rateCardForm = useForm<CreateRateCardFormData>({
    resolver: zodResolver(inlineRateCardFormSchema),
    defaultValues: {
      description: "",
      unit: "",
      rate: 0,
      bankName: "BE", // Default bank name as BE
    },
  });

  // Fetch tickets for selection
  const fetchTicketsForSelection = useCallback(async () => {
    setIsLoadingTickets(true);
    try {
      // Try using the service function first
      let tickets;
      try {
        tickets = await getTicketsForSelection();
      } catch (serviceError) {
        console.warn(
          "Service method failed, trying direct fetch:",
          serviceError
        );

        // Fallback to direct fetch using getAllTickets service
        const data = await getAllTickets();
        tickets = (data as any).tickets || data;
      }

      setTicketsForSelection(tickets || []);

      if (!tickets || tickets.length === 0) {
        toast({
          title: "No Tickets",
          description: "No tickets available for quotation creation.",
        });
      }
    } catch (error: any) {
      console.error("Error fetching tickets:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch tickets for selection.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingTickets(false);
    }
  }, [toast]);

  // Fetch rate cards
  const searchRateCards = useCallback(
    async (searchQuery: string) => {
      setLoadingRateCards(true);
      try {
        const response = await getAllRateCards({
          limit: 3,
          searchQuery,
        });
        setRateCards((response.data as RateCard[]) || []);
      } catch (error) {
        console.error("Error fetching rate cards:", error);
        toast({
          title: "Error",
          description: "Failed to fetch rate cards.",
          variant: "destructive",
        });
      } finally {
        setLoadingRateCards(false);
      }
    },
    [toast]
  );

  // Auto-fetch client info when ticket is selected
  const handleTicketSelect = useCallback(
    async (ticketId: string) => {
      setSelectedTicketId(ticketId);
      try {
        // Fetch ticket details to get client info
        const response = await fetch(`/api/ticket/${ticketId}`, {
          credentials: "include",
        });

        if (response.ok) {
          const ticketData = await response.json();
          if (ticketData.ticket.client) {
         
            setSelectedClient(ticketData.ticket.client);
            toast({
              title: "Success",
              description: `Client "${ticketData.ticket.client.name}" auto-selected from ticket.`,
            });
          }
        }
      } catch (error) {
        console.error("Error fetching ticket details:", error);
        toast({
          title: "Error",
          description: "Failed to fetch ticket details.",
          variant: "destructive",
        });
      }
    },
    [toast]
  );

  // Initial data fetch
  useEffect(() => {
    fetchTicketsForSelection();
  }, [fetchTicketsForSelection, user?.role]);

  // Auto-select ticket from URL params
  useEffect(() => {
    const ticketId = searchParams.get("ticketId");
    if (ticketId && user?.role === "ADMIN") {
      handleTicketSelect(ticketId);
    }
  }, [searchParams, handleTicketSelect, user?.role]);

  // Debounced rate card search
  useEffect(() => {
    searchRateCards(debouncedRateCardSearch);
  }, [debouncedRateCardSearch, searchRateCards]);

  // Handle rate card selection
  const handleRateCardSelect = (rateCard: RateCard) => {
    setSelectedRateCard(rateCard);
  };

  // Handle adding rate card to quotation
  const handleAddToQuotation = () => {
    if (!selectedRateCard || quantity <= 0) {
      toast({
        title: "Error",
        description: "Please select a rate card and enter a valid quantity.",
        variant: "destructive",
      });
      return;
    }

    // Check if the rate card already exists in quotation
    const existingItemIndex = quotationItems.findIndex(
      (item) => item.id === selectedRateCard.id
    );

    if (existingItemIndex !== -1) {
      // Update existing item quantity
      const updatedItems = [...quotationItems];
      updatedItems[existingItemIndex] = {
        ...updatedItems[existingItemIndex],
        quantity: updatedItems[existingItemIndex].quantity + quantity,
        totalValue:
          (updatedItems[existingItemIndex].quantity + quantity) *
          selectedRateCard.rate,
      };
      setQuotationItems(updatedItems);
    } else {
      // Add new item
      const newItem: QuotationItem = {
        ...selectedRateCard,
        quantity,
        gstPercentage: 18,
        totalValue: quantity * selectedRateCard.rate,
        rateCard: selectedRateCard,
      };
      setQuotationItems([...quotationItems, newItem]);
    }

    setSelectedRateCard(null);
    setQuantity(1);
    setRateCardSearch("");
  };

  // Handle save quotation
  const handleSaveQuotation = async () => {
    if (!selectedClient || quotationItems.length === 0 || !selectedTicketId) {
      toast({
        title: "Error",
        description: "Please select a ticket and add items to quotation.",
        variant: "destructive",
      });
      return;
    }

    // Validate form before proceeding
    const isFormValid = await quotationForm.trigger();
    if (!isFormValid) {
      toast({
        title: "Form Validation Error",
        description: "Please fill in all required fields correctly.",
        variant: "destructive",
      });
      return;
    }

    setIsSavingQuotation(true);
    try {
      const formValues = quotationForm.getValues();

      // Validate that we have a quotation number
      if (
        !formValues.quotationNumber ||
        formValues.quotationNumber.trim() === ""
      ) {
        throw new Error("Quotation number is required");
      }

      const quotationData = {
        client: {
          name: selectedClient.name,
          contactPerson: selectedClient.contactPerson,
          contactEmail: selectedClient.contactEmail,
          contactPhone: selectedClient.contactNumber,
          gstn: selectedClient.gstn,
        },
        name: formValues.quotationNumber.trim(), // Use quotation number as name
        clientId: selectedClient.id,
        ticketId: selectedTicketId,
        salesType: formValues.salesType,
        date: formValues.date,
        quotationNumber: formValues.quotationNumber.trim(),
        validUntil: formValues.validUntil,
        expectedExpense: formValues.expectedExpense
          ? parseFloat(formValues.expectedExpense) || 0
          : 0,
        discount: formValues.discount,
        serialNumber: formValues.serialNumber,
        rateCardDetails: quotationItems.map((item) => ({
          rateCardId: item.id,
          quantity: item.quantity,
          gstPercentage: item.gstPercentage,
          totalValue: item.totalValue,
          srNo: item.srNo,
          description: item.description,
          unit: item.unit,
          rate: item.rate,
          bankName: item.bankName,
        })),
        subtotal,
        gst : 18,
        grandTotal,
      };

      await createQuotation(quotationData);
      toast({
        title: "Success",
        description: "Quotation saved successfully!",
      });
      router.push("/dashboard/quotations");
    } catch (error: any) {
      console.error("Quotation creation error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save quotation.",
        variant: "destructive",
      });
    } finally {
      setIsSavingQuotation(false);
    }
  };

  // Handle export PDF
  const handleExportPdf = async () => {
    if (!selectedClient || quotationItems.length === 0 || !selectedTicketId) {
      toast({
        title: "Error",
        description: "Please select a ticket and add items to quotation.",
        variant: "destructive",
      });
      return;
    }

    // Validate form before proceeding
    const isFormValid = await quotationForm.trigger();
    if (!isFormValid) {
      toast({
        title: "Form Validation Error",
        description: "Please fill in all required fields correctly.",
        variant: "destructive",
      });
      return;
    }

    setIsExportingPdf(true);
    try {
      const formValues = quotationForm.getValues();

      // Validate that we have a quotation number
      if (
        !formValues.quotationNumber ||
        formValues.quotationNumber.trim() === ""
      ) {
        throw new Error("Quotation number is required");
      }

      // Calculate total from quotationItems
      const totalFromRateCard = quotationItems.reduce(
        (sum, item) => sum + (parseFloat(item.totalValue.toString()) || 0),
        0
      );

      const quotationData = {
        name:selectedClient.name , 
        clientId: selectedClient.id,
        ticketId: selectedTicketId,
        salesType: formValues.salesType,
        date: formValues.date,
        quotationNumber: formValues.quotationNumber.trim(),
        validUntil: formValues.validUntil,
        expectedExpense:
          formValues.expectedExpense &&
            parseFloat(formValues.expectedExpense) !== 0
            ? parseFloat(formValues.expectedExpense)
            : totalFromRateCard,
        discount: formValues.discount,
        serialNumber: formValues.serialNumber,
        rateCardDetails: quotationItems.map((item) => ({
          rateCardId: item.id,
          quantity: item.quantity,
          gstPercentage: item.gstPercentage,
          totalValue: item.totalValue,
        })),
      };

      const response = await fetch("/api/quotations/preview-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(quotationData),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `quotation-${quotationData.quotationNumber}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast({
          title: "Success",
          description: "PDF downloaded successfully!",
        });
      } else {
        const errorText = await response.text();
        console.error("PDF generation error response:", errorText);
        throw new Error(
          `Failed to generate PDF: ${response.status} ${response.statusText}`
        );
      }
    } catch (error: any) {
      console.error("PDF export error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to export PDF.",
        variant: "destructive",
      });
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Handle quantity change
  const handleQuantityChange = (index: number, newQuantity: number) => {
    if (newQuantity < 0) return;

    const updatedItems = [...quotationItems];
    updatedItems[index] = {
      ...updatedItems[index],
      quantity: newQuantity,
      totalValue: newQuantity * updatedItems[index].rate,
    };
    setQuotationItems(updatedItems);
  };

  // Handle GST change
  const handleGstChange = (index: number, newGst: number) => {
    if (newGst < 0 || newGst > 100) return;

    const updatedItems = [...quotationItems];
    updatedItems[index] = {
      ...updatedItems[index],
      gstPercentage: newGst,
    };
    setQuotationItems(updatedItems);
  };

  // Handle remove item
  const handleRemoveItem = (index: number) => {
    setQuotationItems(quotationItems.filter((_, i) => i !== index));
  };

  // Rate card form submit
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
        description: "",
        unit: "",
        rate: 0,
        bankName: "BE",
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

  // Calculate totals
  const subtotal = quotationItems.reduce(
    (sum, item) => sum + item.totalValue,
    0
  );
  const discount = parseFloat(quotationForm.watch("discount") || "0");
  const discountAmount = (subtotal * discount) / 100;
  const afterDiscount = subtotal - discountAmount;
  const gstAmount = quotationItems.reduce((sum, item) => {
    const itemTotal = item.totalValue;
    return sum + (itemTotal * item.gstPercentage) / 100;
  }, 0);
  const grandTotal = afterDiscount + gstAmount;

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
              true
              // isExportingPdf || !selectedClient || quotationItems.length === 0
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
        {/* Left Column - Rate Card Selection */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ticket Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Ticket</CardTitle>
              <CardDescription>
                Choose a ticket for which you want to create a quotation. Client
                will be auto-selected.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Label htmlFor="ticketSelect">Ticket</Label>
                </div>
                <Select
                  value={selectedTicketId}
                  onValueChange={handleTicketSelect}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a ticket" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingTickets ? (
                      <SelectItem value="loading" disabled>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading tickets...
                      </SelectItem>
                    ) : ticketsForSelection.length > 0 ? (
                      ticketsForSelection.map((ticket) => (
                        <SelectItem key={ticket.id} value={ticket.id}>
                          {ticket.ticketId} - {ticket.title}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-tickets" disabled>
                        No tickets available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>

                {/* {selectedClient && (
                  <div className="p-3 bg-muted rounded-md">
                    <h4 className="font-medium">Auto-selected Client:</h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedClient.name} (
                      {selectedClient.displayId || selectedClient.id})
                    </p>
                  </div>
                )} */}
              </div>
            </CardContent>
          </Card>

          {/* Quotation Items */}
          <Card>
            <CardHeader>
              <CardTitle>Quotation Items</CardTitle>
              <CardDescription>Items added to this quotation</CardDescription>
            </CardHeader>
            <CardContent>
              {quotationItems.length === 0 ? (
                <p className="text-center text-muted-foreground p-8">
                  No items added to quotation yet.
                </p>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead>Unit</TableHead>
                        <TableHead>RC No</TableHead>
                        <TableHead>Rate</TableHead>

                        <TableHead>Qty</TableHead>
                        <TableHead>GST%</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {quotationItems.map((item, index) => (
                        <TableRow key={`${item.id}-${index}`}>
                          <TableCell className="font-medium">
                            {item.rateCard.description}
                          </TableCell>
                          <TableCell>{item.rateCard.unit}</TableCell>
                          <TableCell>{item.rateCard.srNo}</TableCell>

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
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="w-20"
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
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="w-20"
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

          {/* Add to Quotation Section */}
          {selectedRateCard && (
            <div className="border-t pt-4 space-y-4">
              <div>
                <h4 className="font-medium">Selected Rate Card</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedRateCard.description}
                </p>
              </div>
              <div>
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(parseInt(e.target.value))
                  }
                />
              </div>
              <div className="flex justify-between text-sm">
                <span>
                  Rate: ₹{selectedRateCard.rate.toLocaleString()}
                </span>
                <span className="font-medium">
                  Total: {quantity} × ₹
                  {selectedRateCard.rate.toLocaleString()} = ₹
                  {(quantity * selectedRateCard.rate).toLocaleString()}
                </span>
              </div>
              <Button onClick={handleAddToQuotation} className="w-full">
                Add to Quotation
              </Button>
            </div>
          )}

          {/* Rate Card Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Rate Cards</CardTitle>
              <CardDescription>
                Search and add rate cards to your quotation
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Search Rate Cards */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="rateCardSearch">Search Rate Cards</Label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="rateCardSearch"
                      placeholder="Search rate cards..."
                      type="text"
                      value={rateCardSearch}
                      onChange={(e) => setRateCardSearch(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>

                {/* Rate Cards List */}
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {loadingRateCards ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Loading rate cards...
                    </div>
                  ) : rateCards.length > 0 ? (
                    <div className="space-y-2">
                      {rateCards.map((rateCard) => (
                        <div
                          key={rateCard.id}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${selectedRateCard?.id === rateCard.id
                              ? "border-primary bg-primary/5"
                              : "hover:bg-accent"
                            }`}
                          onClick={() => handleRateCardSelect(rateCard)}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium">
                                {rateCard.description}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {rateCard.bankName}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {rateCard.unit} • ₹
                                {rateCard.rate.toLocaleString()}
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              #{rateCard.srNo}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground p-4">
                      {rateCardSearch
                        ? "No rate cards found matching your search."
                        : "No rate cards available."}
                    </p>
                  )}
                </div>

                {/* Create New Rate Card Button */}
                <Button
                  variant="outline"
                  onClick={() => setIsCreateRateCardDialogOpen(true)}
                  className="w-full"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Rate Card
                </Button>


              </div>
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
                  {/* shashank */}
                  <Label>Client Name</Label>
                  <Input className="text-white" disabled defaultValue={selectedClient?.name || ""} type="text" />





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

                  {/* <FormField
                    control={quotationForm.control}
                    name="quotationNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quotation Number</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter quotation number"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  /> */}

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
                    name="discount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Discount (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            placeholder="Enter discount percentage"
                            {...field}
                          />
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
                            min="0"
                            step="0.01"
                            placeholder="Enter expected expense"
                            {...field}
                            onChange={(e) => {
                              // Update the field value while keeping it as a string for form state
                              field.onChange(e.target.value);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Items:</span>
                  <span>{quotationItems.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <>
                    <div className="flex justify-between text-green-600">
                      <span>Discount ({discount}%):</span>
                      <span>-₹{discountAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>After Discount:</span>
                      <span>₹{afterDiscount.toFixed(2)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between">
                  <span>GST:</span>
                  <span>₹{gstAmount.toFixed(2)}</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Grand Total:</span>
                    <span>₹{grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Create Rate Card Dialog */}
      <Dialog
        open={isCreateRateCardDialogOpen}
        onOpenChange={setIsCreateRateCardDialogOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Rate Card</DialogTitle>
            <DialogDescription>
              Add a new rate card to your database. Serial number will be
              auto-generated.
            </DialogDescription>
          </DialogHeader>
          <Form {...rateCardForm}>
            <form
              onSubmit={rateCardForm.handleSubmit(onRateCardFormSubmit)}
              className="space-y-4"
            >
              <FormField
                control={rateCardForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter rate card description"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={rateCardForm.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., pcs, kg, m" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={rateCardForm.control}
                  name="rate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rate *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value) || 0)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={rateCardForm.control}
                name="bankName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bank Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="BE" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateRateCardDialogOpen(false)}
                  disabled={isCreatingRateCard}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreatingRateCard}>
                  {isCreatingRateCard ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Rate Card"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
