"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  Plus,
  Trash2,
  FileText,
  Loader2,
  ArrowLeft,
  Receipt,
} from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { Spinner } from "@/components/ui/spinner";
import { useAuthStore } from "@/store/authStore";

// Services
import { getAllRateCards } from "@/lib/services/rate-card";
import {
  createQuotation,
  previewQuotationPdf,
} from "@/lib/services/quotations";
import { getAllClients } from "@/lib/services/client";

// Validation schemas
import { quotationFormSchema } from "@/lib/validations/quotationSchema";
import { inlineRateCardFormSchema } from "@/lib/validations/rateCardSchema";

// Types
interface RateCard {
  id: string;
  srNo: number;
  description: string;
  unit: string;
  rate: number;
  bankName: string;
  bankRcNo: string;
}

interface QuotationItem extends RateCard {
  quantity: number;
  total: number;
}

interface Client {
  id: string;
  name: string;
  type: string;
  contactPerson: string;
  contactEmail: string | null;
  gstn: string | null;
  initials: string;
}

interface Ticket {
  id: string;
  ticketId: string;
  title: string;
  client: {
    id: string;
    name: string;
  };
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

const NewQuotationPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuthStore();

  // Get URL parameters
  const ticketIdFromUrl = searchParams.get("ticketId");
  const clientIdFromUrl = searchParams.get("clientId");

  // State for rate cards
  const [rateCards, setRateCards] = useState<RateCard[]>([]);
  const [rateCardSearch, setRateCardSearch] = useState("");
  const [loadingRateCards, setLoadingRateCards] = useState(false);
  const debouncedRateCardSearch = useDebounce(rateCardSearch, 300);

  // State for quotation items
  const [quotationItems, setQuotationItems] = useState<QuotationItem[]>([]);
  const [selectedRateCard, setSelectedRateCard] = useState<RateCard | null>(
    null,
  );
  const [quantity, setQuantity] = useState<number>(1);

  // State for clients and tickets
  const [clients, setClients] = useState<Client[]>([]);
  const [ticketsForSelection, setTicketsForSelection] = useState<Ticket[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [loadingTickets, setLoadingTickets] = useState(false);

  // State for form submission
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State for PDF Preview
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  // State for PDF Export
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);

  // State for Rate Card Creation
  const [isCreateRateCardDialogOpen, setIsCreateRateCardDialogOpen] =
    useState<boolean>(false);
  const [isCreatingRateCard, setIsCreatingRateCard] = useState<boolean>(false);

  // Constants
  const igstRate = 0.18; // 18% IGST

  // Form setup
  type QuotationFormData = z.infer<typeof quotationFormSchema>;
  const form = useForm<QuotationFormData>({
    resolver: zodResolver(quotationFormSchema),
    defaultValues: {
      name: "",
      clientId: clientIdFromUrl || "",
      ticketId: ticketIdFromUrl || "none",
      expectedExpense: 0,
      salesType: "IGST",
      rateCardDetails: [],
    },
  });

  // Fetch rate cards
  const searchRateCards = useCallback(
    async (searchQuery: string = "") => {
      setLoadingRateCards(true);
      try {
        const response = await getAllRateCards({
          page: 1,
          limit: 50,
          searchQuery,
        });
        setRateCards(response.data || []);
      } catch (error: any) {
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
    [toast],
  );

  // Fetch clients
  const fetchClients = useCallback(async () => {
    setLoadingClients(true);
    try {
      const response = await getAllClients({ page: 1, limit: 100 });
      setClients(response.data || []);
    } catch (error: any) {
      console.error("Error fetching clients:", error);
      toast({
        title: "Error",
        description: "Failed to fetch clients.",
        variant: "destructive",
      });
    } finally {
      setLoadingClients(false);
    }
  }, [toast]);

  // Fetch tickets for selection
  const fetchTicketsForSelection = useCallback(async () => {
    setLoadingTickets(true);
    try {
      const response = await fetch("/api/tickets/selection", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch tickets");
      }
      const data = await response.json();
      setTicketsForSelection(data.tickets || []);
    } catch (error: any) {
      console.error("Error fetching tickets:", error);
      toast({
        title: "Error",
        description: "Failed to fetch tickets for selection.",
        variant: "destructive",
      });
    } finally {
      setLoadingTickets(false);
    }
  }, [toast]);

  // Effects
  useEffect(() => {
    searchRateCards(debouncedRateCardSearch);
  }, [debouncedRateCardSearch, searchRateCards]);

  useEffect(() => {
    fetchClients();
    fetchTicketsForSelection();
  }, [fetchClients, fetchTicketsForSelection]);

  // Handle rate card selection
  const handleRateCardSelect = (rateCard: RateCard) => {
    setSelectedRateCard(rateCard);
    setQuantity(1);
  };

  // Add item to quotation
  const addItemToQuotation = () => {
    if (!selectedRateCard || quantity <= 0) {
      toast({
        title: "Error",
        description: "Please select a rate card and enter a valid quantity.",
        variant: "destructive",
      });
      return;
    }

    // Check if item already exists
    const existingItemIndex = quotationItems.findIndex(
      (item) => item.id === selectedRateCard.id,
    );

    if (existingItemIndex >= 0) {
      // Update existing item
      const updatedItems = [...quotationItems];
      updatedItems[existingItemIndex] = {
        ...updatedItems[existingItemIndex],
        quantity: updatedItems[existingItemIndex].quantity + quantity,
        total:
          (updatedItems[existingItemIndex].quantity + quantity) *
          selectedRateCard.rate,
      };
      setQuotationItems(updatedItems);
    } else {
      // Add new item
      const newItem: QuotationItem = {
        ...selectedRateCard,
        quantity,
        total: quantity * selectedRateCard.rate,
      };
      setQuotationItems([...quotationItems, newItem]);
    }

    setSelectedRateCard(null);
    setQuantity(1);
    setRateCardSearch("");
  };

  // Remove item from quotation
  const removeItemFromQuotation = (itemId: string) => {
    setQuotationItems(quotationItems.filter((item) => item.id !== itemId));
  };

  // Update item quantity
  const updateItemQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItemFromQuotation(itemId);
      return;
    }

    const updatedItems = quotationItems.map((item) =>
      item.id === itemId
        ? { ...item, quantity: newQuantity, total: newQuantity * item.rate }
        : item,
    );
    setQuotationItems(updatedItems);
  };

  // Calculate totals
  const subtotal = quotationItems.reduce((sum, item) => sum + item.total, 0);
  const gstAmount = subtotal * igstRate;
  const grandTotal = subtotal + gstAmount;

  // Handle preview
  const handlePreview = async () => {
    const formData = form.getValues();

    if (!formData.name || !formData.clientId || quotationItems.length === 0) {
      toast({
        title: "Error",
        description:
          "Please fill in quotation name, select a client, and add at least one item.",
        variant: "destructive",
      });
      return;
    }

    setIsLoadingPreview(true);
    try {
      const previewData = {
        ...formData,
        rateCardDetails: quotationItems.map((item) => ({
          rateCardId: item.id,
          quantity: item.quantity,
          rate: item.rate,
          total: item.total,
        })),
        subtotal,
        gst: gstAmount,
        grandTotal,
      };

      const response = await previewQuotationPdf(previewData);
      setPreviewPdfUrl(response.pdfUrl);
      setIsPreviewDialogOpen(true);
    } catch (error: any) {
      console.error("Error generating preview:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate preview.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingPreview(false);
    }
  };

  // Handle form submission
  const onSubmit = async (data: QuotationFormData) => {
    if (quotationItems.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one item to the quotation.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const quotationData = {
        ...data,
        rateCardDetails: quotationItems.map((item) => ({
          rateCardId: item.id,
          quantity: item.quantity,
          rate: item.rate,
          total: item.total,
        })),
        subtotal,
        gst: gstAmount,
        grandTotal,
      };

      await createQuotation(quotationData);
      toast({
        title: "Success",
        description: "Quotation created successfully!",
      });
      router.push("/dashboard/quotations");
    } catch (error: any) {
      console.error("Error creating quotation:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create quotation.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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

  const handleExportPdf = async () => {
    const formData = form.getValues();

    if (!formData.name || !formData.clientId || quotationItems.length === 0) {
      toast({
        title: "Error",
        description:
          "Please fill in quotation name, select a client, and add at least one item before exporting.",
        variant: "destructive",
      });
      return;
    }

    setIsExportingPdf(true);
    try {
      await onSubmit(formData);
    } catch (error: any) {
      console.error("Error exporting PDF:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to export PDF.",
        variant: "destructive",
      });
    } finally {
      setIsExportingPdf(false);
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
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Create New Quotation
            </h1>
            <p className="text-muted-foreground">
              Generate a new quotation for your client
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handlePreview}
            disabled={isLoadingPreview || quotationItems.length === 0}
          >
            {isLoadingPreview ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Preview PDF
              </>
            )}
          </Button>
          <Button
            onClick={handleExportPdf}
            disabled={isExportingPdf || quotationItems.length === 0}
          >
            {isExportingPdf ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Receipt className="mr-2 h-4 w-4" />
                Create & Export
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Rate Card Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Rate Cards</CardTitle>
            <CardDescription>
              Search and add rate cards to your quotation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search Rate Cards */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search rate cards..."
                className="pl-8"
                value={rateCardSearch}
                onChange={(e) => setRateCardSearch(e.target.value)}
              />
            </div>

            {/* Rate Cards List */}
            <div className="max-h-64 overflow-y-auto border rounded-md">
              {loadingRateCards ? (
                <div className="flex justify-center items-center py-8">
                  <Spinner size="6" />
                </div>
              ) : rateCards.length > 0 ? (
                <div className="divide-y">
                  {rateCards.map((rateCard) => (
                    <div
                      key={rateCard.id}
                      className={`p-3 cursor-pointer hover:bg-muted transition-colors ${
                        selectedRateCard?.id === rateCard.id
                          ? "bg-primary/10 border-l-4 border-l-primary"
                          : ""
                      }`}
                      onClick={() => handleRateCardSelect(rateCard)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium text-sm">
                            {rateCard.description}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {rateCard.unit} • ₹{rateCard.rate.toLocaleString()}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          #{rateCard.srNo}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {rateCardSearch
                    ? "No rate cards found matching your search."
                    : "No rate cards available."}
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
                      <TableHead>Item</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Rate</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quotationItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">
                              {item.description}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {item.unit}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              updateItemQuantity(
                                item.id,
                                parseInt(e.target.value) || 0,
                              )
                            }
                            className="w-16 h-8"
                          />
                        </TableCell>
                        <TableCell>₹{item.rate.toLocaleString()}</TableCell>
                        <TableCell>₹{item.total.toLocaleString()}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItemFromQuotation(item.id)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
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

            {/* Add Selected Item */}
            {selectedRateCard && (
              <div className="border rounded-lg p-4 bg-muted/50">
                <h4 className="font-medium mb-2">Add Selected Item</h4>
                <div className="space-y-2">
                  <p className="text-sm">{selectedRateCard.description}</p>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="quantity" className="text-sm">
                      Quantity:
                    </Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) =>
                        setQuantity(parseInt(e.target.value) || 1)
                      }
                      className="w-20 h-8"
                    />
                    <span className="text-sm text-muted-foreground">
                      × ₹{selectedRateCard.rate.toLocaleString()} = ₹
                      {(quantity * selectedRateCard.rate).toLocaleString()}
                    </span>
                  </div>
                  <Button
                    onClick={addItemToQuotation}
                    size="sm"
                    className="w-full"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add to Quotation
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Column - Quotation Details */}
        <Card>
          <CardHeader>
            <CardTitle>Quotation Details</CardTitle>
            <CardDescription>Fill in the quotation information</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                {/* Quotation Name */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quotation Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter quotation name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Client Selection */}
                <FormField
                  control={form.control}
                  name="clientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a client" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {loadingClients ? (
                            <div className="flex justify-center py-2">
                              <Spinner size="4" />
                            </div>
                          ) : (
                            clients.map((client) => (
                              <SelectItem key={client.id} value={client.id}>
                                {client.initials
                                  ? `${client.initials} - ${client.name}`
                                  : client.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Ticket Selection */}
                <FormField
                  control={form.control}
                  name="ticketId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Associated Ticket (Optional)</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a ticket (optional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">No ticket</SelectItem>
                          {ticketsForSelection.map((ticket) => (
                            <SelectItem key={ticket.id} value={ticket.id}>
                              {ticket.ticketId} - {ticket.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Expected Expense */}
                <FormField
                  control={form.control}
                  name="expectedExpense"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expected Expense</FormLabel>
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

                {/* Sales Type */}
                <FormField
                  control={form.control}
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
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="IGST">IGST (18%)</SelectItem>
                          <SelectItem value="CGST_SGST">
                            CGST + SGST (9% + 9%)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Quotation Summary */}
                {quotationItems.length > 0 && (
                  <div className="border rounded-lg p-4 bg-muted/50">
                    <h4 className="font-medium mb-3">Quotation Summary</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>₹{subtotal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>
                          {form.watch("salesType") === "IGST"
                            ? "IGST (18%)"
                            : "CGST + SGST (18%)"}
                          :
                        </span>
                        <span>₹{gstAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-medium border-t pt-2">
                        <span>Grand Total:</span>
                        <span>₹{grandTotal.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )}
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      {/* Preview Dialog */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Quotation Preview</DialogTitle>
            <DialogDescription>
              Review your quotation before creating it.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            {previewPdfUrl && (
              <iframe
                src={previewPdfUrl}
                className="w-full h-[70vh] border rounded-md"
                title="Quotation Preview"
              />
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsPreviewDialogOpen(false)}
            >
              Close
            </Button>
            <Button
              onClick={() => {
                setIsPreviewDialogOpen(false);
                handleExportPdf();
              }}
              disabled={isExportingPdf}
            >
              {isExportingPdf ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Quotation"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Rate Card Dialog */}
      <Dialog
        open={isCreateRateCardDialogOpen}
        onOpenChange={setIsCreateRateCardDialogOpen}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Rate Card</DialogTitle>
            <DialogDescription>
              Add a new rate card to your database.
            </DialogDescription>
          </DialogHeader>
          <Form {...rateCardForm}>
            <form
              onSubmit={rateCardForm.handleSubmit(onRateCardFormSubmit)}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={rateCardForm.control}
                  name="srNo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Serial Number *</FormLabel>
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
                  control={rateCardForm.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Each, Nos, Set" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={rateCardForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
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

                <FormField
                  control={rateCardForm.control}
                  name="bankName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bank Name *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={rateCardForm.control}
                  name="bankRcNo"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Bank RC Number *</FormLabel>
                      <FormControl>
                        <Input {...field} />
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
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NewQuotationPage;
