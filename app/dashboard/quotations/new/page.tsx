"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { FileText, Download, Save, Search, Plus, Package, Trash2, Send, Loader2, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import apiRequest from "@/lib/axios"; // Assuming this is the correct path for apiRequest

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

// Actual service and schema imports
import { createClient, getAllClients } from "@/lib/services/client";
import { createClientSchema } from "@/lib/validations/clientSchema";
import { getAllRateCards, createSingleRateCard } from "@/lib/services/rate-card"; 
import { rateCardSchema as inlineRateCardFormSchema } from "@/lib/validations/rateCardSchema"; 
import { createQuotation } from "@/lib/services/quotations"; // Import createQuotation service
import { getTicketsForSelection, TicketForSelection } from "@/lib/services/ticket"; // Import ticket selection service

// Assuming CreateClientPayload might be defined in schema file or is inferred by the service
// If not, z.infer<typeof createClientSchema> should be the type for data passed to the service.
type CreateClientFormData = z.infer<typeof createClientSchema>;


// Define Client interface - This should be compatible with the object structure returned by the actual createClient service
interface Client {
  id: string;
  name: string;
  code: string;
  email?: string;
  // Add other relevant client fields if necessary
}

// Define RateCard interface
interface RateCard {
  id: string;
  srNo?: number; // From example rate list
  description: string; // Common field, from Rate List (productDescription might be more specific from UI)
  productDescription?: string; // From UI example
  unit: string; // From Rate List
  rate: string; // From Rate List (unitPrice from UI example seems to be the same)
  unitPrice?: string; // From UI example
  bankName?: string; // From example rate list
  bankRcNo?: string; // From example rate list
  rcSno?: string; // From UI example
  make?: string; // From UI example
  // Add any other fields that might come from the API or are needed
}

// Define QuotationItem interface
interface QuotationItem {
  sno: number;
  rateCard: RateCard;
  quantity: number;
  totalValue: number;
  isEditable?: boolean;
}


// Zod Schema for Quotation Details Form
const quotationFormSchema = z.object({
  serialNumber: z.string().optional(),
  date: z.string().default(new Date().toISOString().split('T')[0]),
  salesType: z.string().default("Interstate"),
  quotationNumber: z.string().min(1, "Quote number is required"),
  validUntil: z.string().optional(),
  admin: z.string().optional(),
  quoteBy: z.string().optional(),
  discount: z.string().default("0"), // Added discount field
});


const NewQuotationPage = () => {
  const { toast } = useToast();

  // Form for Quotation Details (includes discount now)
  const quotationForm = useForm<z.infer<typeof quotationFormSchema>>({
    resolver: zodResolver(quotationFormSchema),
    defaultValues: {
      serialNumber: "",
      date: new Date().toISOString().split('T')[0],
      salesType: "Interstate",
      quotationNumber: `Q-${Date.now()}`,
      validUntil: "",
      admin: "",
      quoteBy: "",
      discount: "0", // Default discount
    },
  });

  const onQuotationFormSubmit = (values: z.infer<typeof quotationFormSchema>) => {
    console.log("Quotation Form Submitted:", values);
    toast({
      title: "Quotation Data",
      description: <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4"><code className="text-white">{JSON.stringify(values, null, 2)}</code></pre>,
    });
  };


  // State for Client Information
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientSearch, setClientSearch] = useState<string>("");
  const [clientSearchResults, setClientSearchResults] = useState<Client[]>([]);
  const [isClientSearchLoading, setIsClientSearchLoading] = useState<boolean>(false);
  const [showClientSearchDropdown, setShowClientSearchDropdown] = useState<boolean>(false);
  const [isCreateClientDialogOpen, setIsCreateClientDialogOpen] = useState<boolean>(false);

  // State for Rate Cards & Services
  const [quotationItems, setQuotationItems] = useState<QuotationItem[]>([]);
  const [rateCardSearch, setRateCardSearch] = useState<string>("");
  const [rateCardSearchResults, setRateCardSearchResults] = useState<RateCard[]>([]);
  const [isRateCardSearchLoading, setIsRateCardSearchLoading] = useState<boolean>(false);
  const [showRateCardSearch, setShowRateCardSearch] = useState<boolean>(false);
  const [isSavingQuotation, setIsSavingQuotation] = useState<boolean>(false);

  // State for Ticket Selection
  const [ticketsForSelection, setTicketsForSelection] = useState<TicketForSelection[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | undefined>(undefined);
  const [isLoadingTickets, setIsLoadingTickets] = useState<boolean>(false);


  // Debounce timer refs
  const clientSearchDebounceRef = React.useRef<NodeJS.Timeout | null>(null);
  const rateCardSearchDebounceRef = React.useRef<NodeJS.Timeout | null>(null);


  // Debounced client search function
  const searchClients = async (query: string) => {
    if (!query.trim()) {
      setClientSearchResults([]);
      setShowClientSearchDropdown(false);
      return;
    }
    setIsClientSearchLoading(true);
    try {
      // Assuming an API endpoint like /clients/search?q=query getAllClients
      // Adjust if using getAllClients from a service layer and its signature is known
      const response = await getAllClients({searchQuery : query})
      setClientSearchResults(response.clients || []); // Ensure response is not null/undefined
      setShowClientSearchDropdown(true);
    } catch (error) {
      console.error("Failed to search clients:", error);
      toast({
        title: "Error",
        description: "Failed to fetch clients. Please try again.",
        variant: "destructive",
      });
      setClientSearchResults([]);
    } finally {
      setIsClientSearchLoading(false);
    }
  };

  useEffect(() => {
    if (clientSearch.trim() === "") {
      setClientSearchResults([]);
      setShowClientSearchDropdown(false);
      return;
    }

    if (clientSearchDebounceRef.current) {
      clearTimeout(clientSearchDebounceRef.current);
    }

    clientSearchDebounceRef.current = setTimeout(() => {
      if (clientSearch === selectedClient?.name) { 
        setShowClientSearchDropdown(false);
        return;
      }
      searchClients(clientSearch);
    }, 500); 

    return () => {
      if (clientSearchDebounceRef.current) {
        clearTimeout(clientSearchDebounceRef.current);
      }
    };
  }, [clientSearch, selectedClient?.name]); 

  // Fetch tickets for selection on mount
  useEffect(() => {
    const fetchTickets = async () => {
      setIsLoadingTickets(true);
      try {
        const tickets = await getTicketsForSelection();
        setTicketsForSelection(tickets);
      } catch (error) {
        console.error("Failed to fetch tickets for selection:", error);
        toast({
          title: "Error",
          description: "Failed to load tickets for selection. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingTickets(false);
      }
    };
    fetchTickets();
  }, [toast]);


  // Debounced Rate Card search function
  const searchRateCards = async (query: string) => {
    if (!query.trim()) {
      setRateCardSearchResults([]);
      return;
    }
    setIsRateCardSearchLoading(true);
    try {
      // Assuming getAllRateCards takes a query string or an object like { search: query }
      // Adjust the call based on the actual signature of getAllRateCards
      const response = await getAllRateCards({ searchQuery: query }); // Or potentially just getAllRateCards(query)
      setRateCardSearchResults(response.data || []); // Ensure response is not null/undefined
    } catch (error) {
      console.error("Failed to search rate cards:", error);
      toast({
        title: "Error",
        description: "Failed to fetch rate cards. Please try again.",
        variant: "destructive",
      });
      setRateCardSearchResults([]);
    } finally {
      setIsRateCardSearchLoading(false);
    }
  };

  useEffect(() => {
    if (rateCardSearch.trim() === "") {
      setRateCardSearchResults([]);
      return;
    }
    if (rateCardSearchDebounceRef.current) {
      clearTimeout(rateCardSearchDebounceRef.current);
    }
    rateCardSearchDebounceRef.current = setTimeout(() => {
      searchRateCards(rateCardSearch);
    }, 500);

    return () => {
      if (rateCardSearchDebounceRef.current) {
        clearTimeout(rateCardSearchDebounceRef.current);
      }
    };
  }, [rateCardSearch]);

  const handleClientSelect = (client: Client) => {
    setSelectedClient(client);
    setClientSearch(client.name); // Set input to client's name
    setShowClientSearchDropdown(false);
    setClientSearchResults([]); // Clear search results
  };

  const handlePlaceholderClick = (action: string) => {
    toast({
      title: "Placeholder Action",
      description: `${action} button clicked. Functionality to be implemented.`,
    });
  };

  // For inline rate card form
  const inlineRateCardForm = useForm<z.infer<typeof inlineRateCardFormSchema>>({
    resolver: zodResolver(inlineRateCardFormSchema),
    defaultValues: {
      description: "",
      unit: "Unit", // Default unit
      rate: 0,    // Default rate
  
      // Add other fields from inlineRateCardFormSchema with defaults if necessary
      // srNo, bankName, bankRcNo are part of rateCardSchema from lib/validations/rateCardSchema.ts
      // Ensure these are covered or handled as optional.
      srNo: undefined, // Explicitly undefined if optional and not set initially
      bankName: undefined,
      bankRcNo: undefined,
    },
  });


  const addRateCardToQuotation = (rateCard: RateCard) => {
    const newSno = quotationItems.length + 1;
    // Use unitPrice if available (from UI example), otherwise fallback to rate (from JSON example)
    const price = parseFloat(rateCard.unitPrice || rateCard.rate || "0");

    const newItem: QuotationItem = {
      sno: newSno,
      rateCard: rateCard,
      quantity: 1, // Default quantity
      totalValue: price * 1, // Calculate total based on default quantity
      isEditable: false, // Default to not editable initially
    };
    setQuotationItems([...quotationItems, newItem]);
    setRateCardSearch(""); 
    setRateCardSearchResults([]); 
    setShowRateCardSearch(false); 
    toast({ title: "Item Added", description: `${rateCard.description || rateCard.productDescription} added to quotation.` });
  };

  const updateQuotationItemQuantity = (index: number, newQuantityStr: string) => {
    const newQuantity = parseInt(newQuantityStr, 10);
    if (isNaN(newQuantity) || newQuantity < 1) {
      toast({ title: "Invalid Quantity", description: "Quantity must be at least 1.", variant: "destructive" });
      // Optionally revert input to old value or handle more gracefully
      return;
    }

    const updatedItems = quotationItems.map((item, i) => {
      if (i === index) {
        const price = parseFloat(item.rateCard.unitPrice || item.rateCard.rate || "0");
        return {
          ...item,
          quantity: newQuantity,
          totalValue: price * newQuantity,
        };
      }
      return item;
    });
    setQuotationItems(updatedItems);
  };

  const removeQuotationItem = (indexToRemove: number) => {
    const updatedItems = quotationItems
      .filter((_, index) => index !== indexToRemove)
      .map((item, newIndex) => ({
        ...item,
        sno: newIndex + 1, // Re-sequence serial numbers
      }));
    setQuotationItems(updatedItems);
    toast({ title: "Item Removed", description: "Rate card removed from quotation." });
  };
  
  const handleAddManually = () => {
    // Check if there's already an item being edited; if so, perhaps prevent adding another
    // or save the current one first. For now, we allow multiple.
    const newSno = quotationItems.length + 1;
    const newEditableItem: QuotationItem = {
      sno: newSno,
      rateCard: { // Temporary ID for new, unsaved rate cards
        id: `new-${Date.now()}`, // This ID helps to find and replace it upon saving
        description: "", 
        productDescription: "",
        unit: "Unit", // Default unit
        rate: "0",    // Default rate
        unitPrice: "0",
        rcSno: "",
        // Initialize other RateCard fields as needed
      },
      quantity: 1,
      totalValue: 0,
      isEditable: true,
    };
    setQuotationItems([...quotationItems, newEditableItem]);
    // Set default values for the form, targeting this new item for editing
    inlineRateCardForm.reset({
        description: "",
        unit: "Unit",
        rate: 0,
     
        // Reset other fields from inlineRateCardFormSchema
    });
  };

  const onSaveInlineRateCard = async (data: z.infer<typeof inlineRateCardFormSchema>, itemIndex: number) => {
    try {
      // Assuming createSingleRateCard is the correct service function
      // and data matches its expected payload (CreateRateCardPayload)
      const newRateCard = await createSingleRateCard(data); 

      const updatedItems = quotationItems.map((item, index) => {
        if (index === itemIndex) {
          return {
            ...item,
            rateCard: newRateCard, // Use the returned rate card from the service
            isEditable: false,
            quantity: item.quantity, // Keep existing quantity or reset to 1
            totalValue: (parseFloat(newRateCard.rate || "0")) * item.quantity,
          };
        }
        return item;
      });
      setQuotationItems(updatedItems);
      toast({ title: "Rate Card Saved", description: `${newRateCard.description} has been saved.` });
      inlineRateCardForm.reset(); // Reset for next potential inline add
    } catch (error: any) {
      console.error("Failed to save inline rate card:", error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to save rate card.";
      toast({ title: "Save Failed", description: errorMessage, variant: "destructive" });
    }
  };

  // Derived Calculations
  const subtotal = quotationItems.reduce((acc, item) => acc + item.totalValue, 0);
  const discountPercentageStr = quotationForm.watch("discount") || "0";
  const discountPercentage = parseFloat(discountPercentageStr) || 0;
  const discountAmount = (subtotal * discountPercentage) / 100;
  const taxableValue = subtotal - discountAmount;
  const igstRate = 0.18; // 18% IGST
  const igstAmount = taxableValue * igstRate;
  const netGrossAmount = taxableValue + igstAmount;
  const totalItems = quotationItems.length;
  const totalQuantity = quotationItems.reduce((acc, item) => acc + item.quantity, 0);

  // Basic number to words (placeholder)
  const numberToWords = (num: number): string => {
    if (num === 0) return "Zero";
    // For simplicity, just returning the number as a string with "Rupees ... Only"
    // A proper library should be used for a real application.
    return `Rupees ${num.toFixed(2)} Only`; 
  };
  const subtotalInWords = numberToWords(subtotal);
  const netGrossAmountInWords = numberToWords(netGrossAmount);

  const handleSaveQuotation = async (status: "draft" | "sent") => {
    setIsSavingQuotation(true);

    if (!selectedClient) {
      toast({ title: "Validation Error", description: "Please select a client.", variant: "destructive" });
      setIsSavingQuotation(false);
      return;
    }

    if (quotationItems.length === 0) {
      toast({ title: "Validation Error", description: "Please add at least one rate card item.", variant: "destructive" });
      setIsSavingQuotation(false);
      return;
    }

    const formData = quotationForm.getValues();
    const rateCardDetailsApi = quotationItems.map(item => ({
      rateCardId: item.rateCard.id,
      quantity: item.quantity,
      // Assuming gstType needs to be a number, e.g., 18 for 18%
      // This might need adjustment based on backend expectations for gstType.
      gstType: 18, // Placeholder, adjust if dynamic GST is needed.
    }));

    const quotationPayload = {
      name: formData.quotationNumber, // Or a more descriptive name if available/needed
      clientId: selectedClient.id,
      rateCardDetails: rateCardDetailsApi,
      ticketId: selectedTicketId || undefined,

      // Extended fields (may or may not be used by current backend)
      serialNumber: formData.serialNumber,
      date: formData.date, 
      salesType: formData.salesType,
      validUntil: formData.validUntil || null, // Ensure null if empty and optional
      admin: formData.admin,
      quoteBy: formData.quoteBy,
      
      subtotal: subtotal.toString(),
      discount: formData.discount,
      discountAmount: discountAmount.toString(),
      taxableValue: taxableValue.toString(),
      igst: igstAmount.toString(),
      netGrossAmount: netGrossAmount.toString(),
      
      status: status,
    };

    console.log(`Saving quotation with status: ${status}`, quotationPayload);

    try {
      await createQuotation(quotationPayload);
      toast({ title: "Success", description: `Quotation saved as ${status} successfully!` });
      
      // Reset form state after successful save
      quotationForm.reset(); 
      setQuotationItems([]);
      setSelectedClient(null);
      setClientSearch(""); 
      // Consider navigating or other post-save actions
      // router.push("/dashboard/quotations");

    } catch (error: any) {
      console.error("Failed to save quotation:", error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to save quotation.";
      toast({ title: "Save Failed", description: errorMessage, variant: "destructive" });
    } finally {
      setIsSavingQuotation(false);
    }
  };


  return (
    <div className="min-h-screen  p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        {/* Header buttons are outside the main save form, so they don't need to be disabled by isSavingQuotation directly */}
        <div className=" rounded-lg shadow-sm border p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <FileText className="h-8 w-8 " />
              <div>
                <h1 className="text-xl font-semibold ">Bhavya Enterprises</h1>
                <p className="text-sm ">Smart Quotation System</p>
              </div>
            </div>
            <div className="space-x-2">
              <Button 
                variant="outline" 
                onClick={() => toast({ title: "Export to PDF", description: "PDF export functionality will be implemented" })}
              >
                <Download className="mr-2 h-4 w-4" />
                Export PDF
              </Button>
              {/* This top-level save button might be redundant if actions are at bottom of form */}
              {/* <Button onClick={() => handleSaveQuotation("draft")} disabled={isSavingQuotation}>
                {isSavingQuotation ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Quotation
              </Button> */}
            </div>
          </div>
        </div>

        {/* Company Info Card */}
        <Card>
          <CardContent className="p-4">
            <div className=" text-center">
              <h1 className="text-lg">Bhavya Enterprises</h1>
              <p className="text-sm">123 Business Park, Main Street</p>
              <p className="text-sm">Cityville, State, Zip Code - 12345</p>
              <p className="text-sm">Phone: (123) 456-7890</p>
              <p className="text-sm">Email: info@bhavyaenterprises.com</p>
              <p className="text-sm">GSTIN: 27ABCDE1234F1Z5</p>
            </div>
          </CardContent>
        </Card>

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Search className="mr-2 h-5 w-5 text-gray-600" />
                  Client Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="clientSearch">Client Search</Label>
                  <div className="relative">
                    <Input
                      id="clientSearch"
                      type="text"
                      value={clientSearch}
                      onChange={(e) => setClientSearch(e.target.value)}
                      onFocus={() => {
                        if (clientSearch.trim() && clientSearchResults.length > 0) {
                           setShowClientSearchDropdown(true);
                        }
                      }}
                      placeholder="Search by name or code..."
                      className="pr-10" // Add padding for loading icon
                    />
                    {isClientSearchLoading && (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                      </div>
                    )}
                  </div>

                  {showClientSearchDropdown && clientSearch.trim() && clientSearchResults.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full  border rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {clientSearchResults.map((client) => (
                        <div
                          key={client.id}
                          className="p-2 cursor-pointer"
                          onClick={() => handleClientSelect(client)}
                        >
                          <p className="font-medium">{client.code} {client.name}</p>
                          {/* <p className="text-xs ">{client.code}</p> */}
                        </div>
                      ))}
                    </div>
                  )}
                   {showClientSearchDropdown && clientSearch.trim() && !isClientSearchLoading && clientSearchResults.length === 0 && (
                     <div className="absolute z-10 mt-1 w-full  border  rounded-md shadow-lg p-2 text-sm ">
                        No clients found.
                     </div>
                   )}
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setIsCreateClientDialogOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Client
                </Button>

                {selectedClient && (
                  <div className="p-3  rounded-lg border  space-y-1">
                    <h3 className="text-sm font-semibold text-blue-700">Selected Client:</h3>
                    <p><strong>Name:</strong> {selectedClient.name}</p>
                    <p><strong>Code:</strong> {selectedClient.code}</p>
                    {selectedClient.email && <p><strong>Email:</strong> {selectedClient.email}</p>}
                    <Button variant="link" size="sm" className="p-0 h-auto text-red-500" onClick={() => {
                      setSelectedClient(null);
                      setClientSearch(""); // Optionally clear search input
                    }}>
                      Clear Selection
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Full Create Client Dialog */}
            <CreateClientDialog
              isOpen={isCreateClientDialogOpen}
              onOpenChange={setIsCreateClientDialogOpen}
              onClientCreated={(newClient) => {
                setSelectedClient(newClient);
                setClientSearch(newClient.name); // Update search input with new client's name
                setIsCreateClientDialogOpen(false); // Close dialog
                toast({ title: "Client Created", description: `${newClient.name} has been successfully created and selected.` });
              }}
            />

            <Card>
              <CardHeader>
                <CardTitle>Quotation Details</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...quotationForm}>
                  <form onSubmit={quotationForm.handleSubmit(onQuotationFormSubmit)} className="space-y-4">
                    <FormField
                      control={quotationForm.control}
                      name="serialNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Serial Number</FormLabel>
                          <FormControl>
                            <Input placeholder="Auto-generated or enter" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
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
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select sales type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Interstate">Interstate</SelectItem>
                              <SelectItem value="Intrastate">Intrastate</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={quotationForm.control}
                      name="quotationNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quote Number</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Q-2023-001" {...field} disabled />
                          </FormControl>
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
                    {/* Ticket Selection Dropdown */}
                    <FormItem>
                       <FormLabel>Link to Ticket (Optional)</FormLabel>
                       <Select onValueChange={setSelectedTicketId} value={selectedTicketId}>
                         <FormControl>
                           <SelectTrigger disabled={isLoadingTickets}>
                             <SelectValue placeholder={isLoadingTickets ? "Loading tickets..." : "Select a ticket"} />
                           </SelectTrigger>
                         </FormControl>
                         <SelectContent>
                           <SelectItem value="">None</SelectItem>
                           {ticketsForSelection.map((ticket) => (
                             <SelectItem key={ticket.id} value={ticket.id}>
                               {ticket.ticketId} - {ticket.title}
                             </SelectItem>
                           ))}
                         </SelectContent>
                       </Select>
                       <FormMessage />
                     </FormItem>
          
                   
                    {/* <Button type="submit">Save Quotation Details (Test)</Button> */}
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Package className="mr-2 h-5 w-5 text-gray-600" />
                    Rate Cards & Services
                  </div>
                  <div className="space-x-2">
                    <Button variant="outline" size="sm" onClick={() => setShowRateCardSearch(!showRateCardSearch)}>
                      <Search className="mr-1 h-4 w-4" />
                      {showRateCardSearch ? "Hide Search" : "Search Rate Cards"}
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleAddManually}>
                      <Plus className="mr-1 h-4 w-4" />
                      Add Manually
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              {showRateCardSearch && (
                <div className="p-4  border-b">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Type rate card name, code, or description..."
                      value={rateCardSearch}
                      onChange={(e) => setRateCardSearch(e.target.value)}
                      className="pl-10 w-full"
                    />
                    {isRateCardSearchLoading && (
                       <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                         <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                       </div>
                    )}
                  </div>
                  {rateCardSearchResults.length > 0 && (
                    <div className="mt-2  border rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {rateCardSearchResults.map((rc) => (
                        <div
                          key={rc.id}
                          className="p-3  cursor-pointer border-b last:border-b-0"
                          onClick={() => addRateCardToQuotation(rc)}
                        >
                          <p className="font-medium">{rc.productDescription || rc.description}</p>
                          <p className="text-xs text-gray-600">
                            RC-SNo: {rc.bankRcNo || "N/A"} | Unit: {rc.unit} | Price: {rc.unitPrice || rc.rate}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                  {rateCardSearch.trim() && !isRateCardSearchLoading && rateCardSearchResults.length === 0 && (
                    <div className="mt-2 text-sm  p-2 text-center">No rate cards found.</div>
                  )}
                </div>
              )}
              <CardContent className="p-0"> {/* Remove padding if table is direct child */}
                {quotationItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 ">
                    <Package className="h-10 w-10 mb-2" />
                    <p>No rate cards added yet.</p>
                    <p className="text-sm">Use "Search Rate Cards" or "Add Manually" to add items.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">S.No</TableHead>
                        <TableHead className="min-w-[200px]">Description</TableHead>
                        <TableHead>RC-SNo</TableHead>
                        <TableHead>Unit</TableHead>
                        <TableHead className="w-[100px]">Qty</TableHead>
                        <TableHead>Unit Price</TableHead>
                        <TableHead>Total Value</TableHead>
                        <TableHead className="w-[120px] text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {quotationItems.map((item, index) => (
                        <TableRow key={item.rateCard.id || `new-${item.sno}`}>
                          <TableCell>{item.sno}</TableCell>
                          <TableCell>
                            {item.isEditable ? (
                              <FormField
                                control={inlineRateCardForm.control}
                                name="description"
                                render={({ field }) => <Input placeholder="Rate Card Description" {...field} defaultValue={item.rateCard.description} />}
                              />
                            ) : (
                              item.rateCard.productDescription || item.rateCard.description
                            )}
                          </TableCell>
                          <TableCell>
                            {item.isEditable ? (
                               <FormField
                               control={inlineRateCardForm.control}
                               name="rcSno"
                               render={({ field }) => <Input placeholder="RC-SNo" {...field} defaultValue={item.rateCard.rcSno} />}
                             />
                            ) : (
                              item.rateCard.bankRcNo || "N/A"
                            )}
                          </TableCell>
                          <TableCell>
                            {item.isEditable ? (
                              <FormField
                                control={inlineRateCardForm.control}
                                name="unit"
                                render={({ field }) => (
                                  <Select onValueChange={field.onChange} defaultValue={item.rateCard.unit || "Unit"}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Unit">Unit</SelectItem>
                                      <SelectItem value="Piece">Piece</SelectItem>
                                      <SelectItem value="Set">Set</SelectItem>
                                      <SelectItem value="Meter">Meter</SelectItem>
                                      <SelectItem value="SqFt">SqFt</SelectItem>
                                      <SelectItem value="Job">Job</SelectItem>
                                    </SelectContent>
                                  </Select>
                                )}
                              />
                            ) : (
                              item.rateCard.unit
                            )}
                          </TableCell>
                          <TableCell>
                            {item.isEditable ? (
                              <Input
                                type="number"
                                min="1"
                                defaultValue={1}
                                // This Qty input for editable row needs to be handled by the inline form state
                                // For now, it will use the updateQuotationItemQuantity, but ideally part of the inline form
                                onChange={(e) => updateQuotationItemQuantity(index, e.target.value)}
                                className="w-full"
                              />
                            ) : (
                              <Input
                                type="number"
                                value={1}
                                min="1"
                                onChange={(e) => updateQuotationItemQuantity(index, e.target.value)}
                                className="w-full"
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            {item.isEditable ? (
                              <FormField
                                control={inlineRateCardForm.control}
                                name="rate" // This should align with the schema field (rate or unitPrice)
                                render={({ field }) => <Input type="number" placeholder="0.00" {...field} defaultValue={item.rateCard.unitPrice || item.rateCard.rate} />}
                              />
                            ) : (
                              item.rateCard.unitPrice || item.rateCard.rate
                            )}
                          </TableCell>
                          <TableCell>{item.totalValue.toFixed(2)}</TableCell>
                          <TableCell className="text-right">
                            {item.isEditable ? (
                              <Button 
                                size="sm" 
                                onClick={inlineRateCardForm.handleSubmit((data) => onSaveInlineRateCard(data, index))}
                              >
                                <Save className="mr-1 h-4 w-4" /> Save
                              </Button>
                            ) : (
                              <Button variant="ghost" size="icon" onClick={() => removeQuotationItem(index)}>
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Calculations & Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4"> {/* Adjusted gap */}
                  {/* Left Column: Quotation Summary */}
                  <div className="space-y-3">
                    <h4 className="text-md font-semibold  mb-2">Quotation Summary</h4>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total Items:</span>
                      <span className="font-medium">{totalItems}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total Quantity:</span>
                      <span className="font-medium">{totalQuantity}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-medium">₹{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="pt-1">
                      <Label htmlFor="subtotalInWords" className="text-xs ">Subtotal (In Words)</Label>
                      <div id="subtotalInWords" className="text-sm p-2 border rounded-md  min-h-[36px] ">
                        {subtotalInWords}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Tax Calculations */}
                  <div className="space-y-3  p-3 rounded-lg"> {/* Adjusted padding */}
                    <h4 className="text-md font-semibold  mb-2">Tax Calculations</h4>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-medium">₹{subtotal.toFixed(2)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center text-sm space-x-2">
                      <Label htmlFor="discountInput" className="whitespace-nowrap text-gray-600">Discount:</Label> {/* Changed from FormLabel to Label for direct use */}
                      <div className="flex items-center w-full max-w-[130px]"> {/* Adjusted max-width */}
                        <FormField
                          control={quotationForm.control}
                          name="discount"
                          render={({ field }) => (
                            <Input
                              id="discountInput"
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              {...field}
                              className="w-full h-8 text-right pr-1 text-sm" 
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === "" || (parseFloat(val) >= 0 && parseFloat(val) <= 100)) {
                                  field.onChange(val);
                                } else if (parseFloat(val) < 0) {
                                  field.onChange("0");
                                } else if (parseFloat(val) > 100) {
                                  field.onChange("100");
                                }
                              }}
                            />
                          )}
                        />
                        <span className="pl-1 pr-1 text-gray-600">%</span> {/* Adjusted padding */}
                      </div>
                      <span className="font-medium text-red-500 whitespace-nowrap">-₹{discountAmount.toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Taxable Value:</span>
                      <span className="font-medium">₹{taxableValue.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">IGST (18%):</span>
                      <span className="font-medium">₹{igstAmount.toFixed(2)}</span>
                    </div>
                    <Separator className="my-2" /> {/* Adjusted margin */}
                    <div className="flex justify-between text-sm"> {/* Adjusted text size for consistency */}
                      <span className="font-semibold text-blue-700">Net Gross Amount:</span>
                      <span className="font-bold text-blue-700 text-md">₹{netGrossAmount.toFixed(2)}</span>
                    </div>
                     <div className="pt-1">
                      <Label htmlFor="netGrossInWords" className="text-xs ">Net Gross Amount (In Words)</Label>
                      <div id="netGrossInWords" className="text-sm p-2 border rounded-md  min-h-[36px] ">
                        {netGrossAmountInWords}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-center space-x-3 pt-4">
              <Button 
                variant="outline" 
                onClick={() => handleSaveQuotation("draft")}
                disabled={isSavingQuotation}
              >
                {isSavingQuotation && quotationForm.getValues().status !== 'sent' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Draft
              </Button>
              <Button 
                onClick={() => handleSaveQuotation("sent")}
                disabled={isSavingQuotation}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSavingQuotation && quotationForm.getValues().status === 'sent' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Send Quotation
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => toast({ title: "Export to PDF", description: "PDF export functionality will be implemented" })}
              >
                <Download className="mr-2 h-4 w-4" />
                Export PDF
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// CreateClientDialog Component (defined within the same file for now)
// This is a reconstruction based on the prompt and typical dialog structure.
// Actual implementation might vary based on "@/lib/services/client" and "@/lib/validations/clientSchema"
interface CreateClientDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onClientCreated: (client: Client) => void;
}

const CreateClientDialog: React.FC<CreateClientDialogProps> = ({ isOpen, onOpenChange, onClientCreated }) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Renamed 'form' to 'clientForm' for clarity within this specific dialog context
  const clientForm = useForm<CreateClientFormData>({
    resolver: zodResolver(createClientSchema), // Uses imported schema
    defaultValues: {
      name: "",
      // Ensure these defaults are compatible with the imported createClientSchema
      // For example, if the schema expects numbers for some fields, provide numbers.
      // The previous placeholder schema used z.coerce.number for totalBranches.
      // Assuming createClientSchema also has sensible defaults or handles optional fields.
      type: createClientSchema.shape.type._def.defaultValue?.() || "Corporate",
      totalBranches: createClientSchema.shape.totalBranches._def.defaultValue?.() || 1,
      contactPerson: "",
      contactPhone: "",
      contactEmail: "",
      contractStatus: createClientSchema.shape.contractStatus._def.defaultValue?.() || "Active",
      lastServiceDate: createClientSchema.shape.lastServiceDate._def.defaultValue?.() || new Date().toISOString().split('T')[0],
      gstn: "",
      avatar: "",
      initials: "",
      // Add any other fields that are part of createClientSchema and require default values
    },
  });

  const onSubmit = async (data: CreateClientFormData) => {
    setIsSubmitting(true);
    try {
      // Data is already validated by react-hook-form using zodResolver
      const newClient = await createClient(data); // Uses imported createClient service

      toast({ title: "Success", description: "New client created successfully." });
      
      // Assuming newClient is the client object directly.
      // Adjust if the service wraps it, e.g., newClient.data or newClient.client
      onClientCreated(newClient as Client); // Pass the new client up (ensure 'Client' type is compatible)
      
      clientForm.reset(); // Reset form after successful creation
      onOpenChange(false); // Close dialog
    } catch (error: any) {
      console.error("Failed to create client:", error);
      // Attempt to get a more specific error message
      const errorMessage = error.response?.data?.message || error.message || "Unknown error occurred";
      toast({
        title: "Error Creating Client",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Client</DialogTitle>
          <DialogDescription>Fill in the details below to add a new client.</DialogDescription>
        </DialogHeader>
        <Form {...clientForm}>
          <form onSubmit={clientForm.handleSubmit(onSubmit)} className="space-y-3 py-3 max-h-[70vh] overflow-y-auto px-2">
            <FormField
              control={clientForm.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client Name</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={clientForm.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select client type" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="Bank">Bank</SelectItem>
                      <SelectItem value="NBFC">NBFC</SelectItem>
                      <SelectItem value="Insurance">Insurance</SelectItem>
                      <SelectItem value="Corporate">Corporate</SelectItem>
                      {/* Add other types if defined in the actual schema */}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={clientForm.control}
              name="totalBranches"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Branches</FormLabel>
                  <FormControl><Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField control={clientForm.control} name="contactPerson" render={({ field }) => (
                <FormItem><FormLabel>Contact Person</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <FormField control={clientForm.control} name="contactPhone" render={({ field }) => (
                <FormItem><FormLabel>Contact Phone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <FormField control={clientForm.control} name="contactEmail" render={({ field }) => (
                <FormItem><FormLabel>Contact Email (Optional)</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
             <FormField
              control={clientForm.control}
              name="contractStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contract Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                       {/* Add other statuses if defined in the actual schema */}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField control={clientForm.control} name="lastServiceDate" render={({ field }) => (
                <FormItem><FormLabel>Last Service Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <FormField control={clientForm.control} name="gstn" render={({ field }) => (
                <FormItem><FormLabel>GSTN (Optional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
             <FormField control={clientForm.control} name="avatar" render={({ field }) => (
                <FormItem><FormLabel>Avatar URL (Optional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
             <FormField control={clientForm.control} name="initials" render={({ field }) => (
                <FormItem><FormLabel>Initials (Optional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            {/* Ensure all fields from the actual createClientSchema are represented here */}
            <DialogFooter className="pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Client
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};


export default NewQuotationPage;
// Click outside handler for dropdown
// This might be better as a custom hook (useClickOutside)
// For simplicity, adding a basic version here or it can be added later.
// useEffect(() => {
//   const handleClickOutside = (event: MouseEvent) => {
//     if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
//         inputRef.current && !inputRef.current.contains(event.target as Node)) {
//       setShowClientSearchDropdown(false);
//     }
//   };
//   document.addEventListener("mousedown", handleClickOutside);
//   return () => {
//     document.removeEventListener("mousedown", handleClickOutside);
//   };
// }, []); // Assuming dropdownRef and inputRef are created with React.useRef() and attached to respective elements.
// This part is commented out as it requires useRef for input and dropdown, which can be added in a refinement step.
