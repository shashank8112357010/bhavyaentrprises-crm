"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { FileText, Download, Save, Search, Plus, Package, Trash2, Send, Loader2, UserPlus, LinkIcon, XCircle } from "lucide-react"; // Added LinkIcon, XCircle
import { useToast } from "@/hooks/use-toast";
// import apiRequest from "@/lib/axios"; // Not directly used, services use axios instance

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
// Updated quotation service and schema imports
import { createQuotation, getPreviewPdf } from "@/lib/services/quotations";
import { CreateQuotationPayload, quotationSchema as backendQuotationSchema } from "@/lib/validations/quotationSchema"; // For payload type
import { getAllTickets, Ticket as ServiceTicket } from "@/lib/services/ticket"; // Import ticket service and type


type CreateClientFormData = z.infer<typeof createClientSchema>;

interface Client {
  id: string;
  name: string;
  code: string; // Assuming 'code' is available from client data
  email?: string;
}

interface RateCard {
  id: string;
  srNo?: number;
  description: string;
  productDescription?: string;
  unit: string;
  rate: string; // This is likely string from API, ensure parsing for calculations
  unitPrice?: string; // This is likely string from API
  bankName?: string;
  bankRcNo?: string;
  rcSno?: string;
  make?: string;
}

interface QuotationItem {
  sno: number;
  rateCard: RateCard; // Contains description, unit, rate (unitPrice)
  quantity: number;
  totalValue: number;
  isEditable?: boolean;
  // Fields from backend's quotationItemSchema for direct use in payload if possible
  productDescription?: string; // if different from rateCard.description
  unitPrice?: number; // if parsed and stored separately
  rateCardId?: string; // to link back
}


// Zod Schema for Quotation Details Form on this page
// This schema is for the form fields, not the final backend payload
const pageQuotationFormSchema = z.object({
  serialNumber: z.string().optional(), // This maps to CreateQuotationPayload.serialNumber
  date: z.string().default(new Date().toISOString().split('T')[0]),
  salesType: z.string().default("Interstate"),
  // This 'quotationNumber' field in the form is used as the 'name' (title/description) for the quotation payload
  quotationTitle: z.string().min(1, "Quotation title/description is required"),
  validUntil: z.string().optional(),
  admin: z.string().optional(), // User preparing the quote, if manually entered
  quoteBy: z.string().optional(), // Person responsible for quote, if manually entered
  discount: z.string().default("0"),
});


const NewQuotationPage = () => {
  const { toast } = useToast();

  const quotationForm = useForm<z.infer<typeof pageQuotationFormSchema>>({
    resolver: zodResolver(pageQuotationFormSchema),
    defaultValues: {
      serialNumber: "",
      date: new Date().toISOString().split('T')[0],
      salesType: "Interstate",
      quotationTitle: `Q-${Date.now()}`, // Placeholder, user should edit; maps to 'name' in payload
      validUntil: "",
      admin: "",
      quoteBy: "",
      discount: "0",
    },
  });

  // State for Client Information
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientSearch, setClientSearch] = useState<string>("");
  const [clientSearchResults, setClientSearchResults] = useState<Client[]>([]);
  const [isClientSearchLoading, setIsClientSearchLoading] = useState<boolean>(false);
  const [showClientSearchDropdown, setShowClientSearchDropdown] = useState<boolean>(false);
  const [isCreateClientDialogOpen, setIsCreateClientDialogOpen] = useState<boolean>(false);

  // State for Ticket Association
  const [selectedTicket, setSelectedTicket] = useState<ServiceTicket | null>(null);
  const [ticketSearchQuery, setTicketSearchQuery] = useState<string>("");
  const [ticketSearchResults, setTicketSearchResults] = useState<ServiceTicket[]>([]);
  const [isTicketSearchLoading, setIsTicketSearchLoading] = useState<boolean>(false);
  const [showTicketSearchDropdown, setShowTicketSearchDropdown] = useState<boolean>(false);

  // State for Rate Cards & Services
  const [quotationItems, setQuotationItems] = useState<QuotationItem[]>([]);
  const [rateCardSearch, setRateCardSearch] = useState<string>("");
  const [rateCardSearchResults, setRateCardSearchResults] = useState<RateCard[]>([]);
  const [isRateCardSearchLoading, setIsRateCardSearchLoading] = useState<boolean>(false);
  const [showRateCardSearch, setShowRateCardSearch] = useState<boolean>(false);

  const [isSavingQuotation, setIsSavingQuotation] = useState<boolean>(false);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);


  // Debounce timer refs
  const clientSearchDebounceRef = React.useRef<NodeJS.Timeout | null>(null);
  const rateCardSearchDebounceRef = React.useRef<NodeJS.Timeout | null>(null);
  const ticketSearchDebounceRef = React.useRef<NodeJS.Timeout | null>(null);

  // Debounced client search function
  const handleClientSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setClientSearchResults([]);
      setShowClientSearchDropdown(false);
      return;
    }
    setIsClientSearchLoading(true);
    try {
      const response = await getAllClients({ searchQuery: query });
      setClientSearchResults(response.clients || []);
      setShowClientSearchDropdown(true);
    } catch (error) {
      console.error("Failed to search clients:", error);
      toast({ title: "Error", description: "Failed to fetch clients.", variant: "destructive" });
      setClientSearchResults([]);
    } finally {
      setIsClientSearchLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (clientSearch.trim() === "" || clientSearch === selectedClient?.name) {
      setClientSearchResults([]);
      setShowClientSearchDropdown(false);
      return;
    }
    if (clientSearchDebounceRef.current) clearTimeout(clientSearchDebounceRef.current);
    clientSearchDebounceRef.current = setTimeout(() => handleClientSearch(clientSearch), 500);
    return () => { if (clientSearchDebounceRef.current) clearTimeout(clientSearchDebounceRef.current); };
  }, [clientSearch, selectedClient?.name, handleClientSearch]);

  // Debounced Ticket search function
  const handleTicketSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setTicketSearchResults([]);
      setShowTicketSearchDropdown(false);
      return;
    }
    setIsTicketSearchLoading(true);
    try {
      // Using getAllTickets with searchQuery. Ensure API supports this.
      const response = await getAllTickets({ searchQuery: query });
      setTicketSearchResults(response.tickets || []);
      setShowTicketSearchDropdown(true);
    } catch (error) {
      console.error("Failed to search tickets:", error);
      toast({ title: "Error", description: "Failed to fetch tickets.", variant: "destructive" });
      setTicketSearchResults([]);
    } finally {
      setIsTicketSearchLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (ticketSearchQuery.trim() === "" || ticketSearchQuery === selectedTicket?.title) {
      setTicketSearchResults([]);
      setShowTicketSearchDropdown(false);
      return;
    }
    if (ticketSearchDebounceRef.current) clearTimeout(ticketSearchDebounceRef.current);
    ticketSearchDebounceRef.current = setTimeout(() => handleTicketSearch(ticketSearchQuery), 500);
    return () => { if (ticketSearchDebounceRef.current) clearTimeout(ticketSearchDebounceRef.current); };
  }, [ticketSearchQuery, selectedTicket?.title, handleTicketSearch]);


  // Debounced Rate Card search function
  const handleRateCardSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setRateCardSearchResults([]);
      return;
    }
    setIsRateCardSearchLoading(true);
    try {
      const response = await getAllRateCards({ searchQuery: query });
      setRateCardSearchResults(response.data || []);
    } catch (error) {
      console.error("Failed to search rate cards:", error);
      toast({ title: "Error", description: "Failed to fetch rate cards.", variant: "destructive" });
      setRateCardSearchResults([]);
    } finally {
      setIsRateCardSearchLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (rateCardSearch.trim() === "") {
      setRateCardSearchResults([]);
      return;
    }
    if (rateCardSearchDebounceRef.current) clearTimeout(rateCardSearchDebounceRef.current);
    rateCardSearchDebounceRef.current = setTimeout(() => handleRateCardSearch(rateCardSearch), 500);
    return () => { if (rateCardSearchDebounceRef.current) clearTimeout(rateCardSearchDebounceRef.current); };
  }, [rateCardSearch, handleRateCardSearch]);


  const handleClientSelect = (client: Client) => {
    setSelectedClient(client);
    setClientSearch(client.name);
    setShowClientSearchDropdown(false);
    setClientSearchResults([]);
  };

  const handleTicketSelect = (ticket: ServiceTicket) => {
    setSelectedTicket(ticket);
    setTicketSearchQuery(ticket.title); // Set input to ticket's title
    setShowTicketSearchDropdown(false);
    setTicketSearchResults([]);
  };

  const clearSelectedTicket = () => {
    setSelectedTicket(null);
    setTicketSearchQuery("");
    setTicketSearchResults([]);
    setShowTicketSearchDropdown(false);
  };

  const inlineRateCardForm = useForm<z.infer<typeof inlineRateCardFormSchema>>({
    resolver: zodResolver(inlineRateCardFormSchema),
    defaultValues: { description: "", unit: "Unit", rate: 0, srNo: undefined, bankName: undefined, bankRcNo: undefined },
  });

  const addRateCardToQuotation = (rateCard: RateCard) => {
    const newSno = quotationItems.length + 1;
    const price = parseFloat(rateCard.unitPrice || rateCard.rate || "0");
    const newItem: QuotationItem = {
      sno: newSno,
      rateCard: rateCard,
      quantity: 1,
      totalValue: price * 1,
      isEditable: false,
      // For direct use in payload, ensure these match backend schema if needed
      description: rateCard.productDescription || rateCard.description,
      productDescription: rateCard.productDescription || rateCard.description,
      unit: rateCard.unit,
      unitPrice: price,
      rateCardId: rateCard.id,
    };
    setQuotationItems([...quotationItems, newItem]);
    setRateCardSearch(""); 
    setRateCardSearchResults([]); 
    setShowRateCardSearch(false); 
    toast({ title: "Item Added", description: `${rateCard.description || rateCard.productDescription} added.` });
  };

  const updateQuotationItemQuantity = (index: number, newQuantityStr: string) => {
    const newQuantity = parseInt(newQuantityStr, 10);
    if (isNaN(newQuantity) || newQuantity < 1) {
      toast({ title: "Invalid Quantity", description: "Quantity must be at least 1.", variant: "destructive" });
      return;
    }
    const updatedItems = quotationItems.map((item, i) => {
      if (i === index) {
        const price = parseFloat(item.rateCard.unitPrice || item.rateCard.rate || "0");
        return { ...item, quantity: newQuantity, totalValue: price * newQuantity, unitPrice: price };
      }
      return item;
    });
    setQuotationItems(updatedItems);
  };

  const removeQuotationItem = (indexToRemove: number) => {
    const updatedItems = quotationItems
      .filter((_, index) => index !== indexToRemove)
      .map((item, newIndex) => ({ ...item, sno: newIndex + 1 }));
    setQuotationItems(updatedItems);
    toast({ title: "Item Removed" });
  };
  
  const handleAddManually = () => {
    const newSno = quotationItems.length + 1;
    const newEditableItem: QuotationItem = {
      sno: newSno,
      rateCard: { id: `new-${Date.now()}`, description: "", productDescription: "", unit: "Unit", rate: "0", unitPrice: "0", rcSno: "" },
      quantity: 1, totalValue: 0, isEditable: true,
      // Populate fields for payload
      description: "", productDescription: "", unit: "Unit", unitPrice: 0,
    };
    setQuotationItems([...quotationItems, newEditableItem]);
    inlineRateCardForm.reset({ description: "", unit: "Unit", rate: 0 });
  };

  const onSaveInlineRateCard = async (data: z.infer<typeof inlineRateCardFormSchema>, itemIndex: number) => {
    try {
      const newRateCard = await createSingleRateCard(data); 
      const price = parseFloat(newRateCard.rate || "0");
      const updatedItems = quotationItems.map((item, index) => {
        if (index === itemIndex) {
          return {
            ...item,
            rateCard: newRateCard, isEditable: false, quantity: item.quantity,
            totalValue: price * item.quantity,
            // Update payload fields
            description: newRateCard.description, productDescription: newRateCard.description,
            unit: newRateCard.unit, unitPrice: price, rateCardId: newRateCard.id,
          };
        }
        return item;
      });
      setQuotationItems(updatedItems);
      toast({ title: "Rate Card Saved", description: `${newRateCard.description} saved.` });
      inlineRateCardForm.reset();
    } catch (error: any) {
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

  const numberToWords = (num: number): string => {
    if (num === 0) return "Zero";
    return `Rupees ${num.toFixed(2)} Only`; 
  };
  const subtotalInWords = numberToWords(subtotal);
  const netGrossAmountInWords = numberToWords(netGrossAmount);

  const buildQuotationPayload = (statusToSet: "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED" | "ARCHIVED"): CreateQuotationPayload | null => {
    if (!selectedClient) {
      toast({ title: "Validation Error", description: "Please select a client.", variant: "destructive" });
      return null;
    }
    if (quotationItems.length === 0) {
      toast({ title: "Validation Error", description: "Please add at least one item.", variant: "destructive" });
      return null;
    }

    const formData = quotationForm.getValues();

    // Transform quotationItems to match CreateQuotationPayload.items structure
    const itemsForPayload = quotationItems.map(item => ({
      sno: item.sno,
      description: item.rateCard.productDescription || item.rateCard.description, // Main description from rate card
      productDescription: item.rateCard.productDescription || item.rateCard.description, // Can be more specific
      unit: item.rateCard.unit,
      quantity: item.quantity,
      unitPrice: parseFloat(item.rateCard.unitPrice || item.rateCard.rate || "0"),
      totalValue: item.totalValue,
      rateCardId: item.rateCard.id.startsWith("new-") ? undefined : item.rateCard.id, // Don't send temp IDs
    }));

    const payload: CreateQuotationPayload = {
      name: formData.quotationTitle, // From form's 'quotationTitle'
      clientId: selectedClient.id,
      items: itemsForPayload,
      ticketId: selectedTicket?.id || undefined,

      serialNumber: formData.serialNumber,
      date: formData.date, 
      salesType: formData.salesType,
      validUntil: formData.validUntil || null,
      admin: formData.admin,
      quoteBy: formData.quoteBy,
      
      subtotal: subtotal,
      discountPercentage: discountPercentage,
      discountAmount: discountAmount,
      taxableValue: taxableValue,
      igstAmount: igstAmount,
      netGrossAmount: netGrossAmount,
      
      status: statusToSet,
    };
    return payload;
  };

  const handleSaveQuotation = async (status: "DRAFT" | "SENT") => {
    setIsSavingQuotation(true);
    const payload = buildQuotationPayload(status);

    if (!payload) {
      setIsSavingQuotation(false);
      return;
    }

    console.log(`Saving quotation with status: ${status}`, payload);

    try {
      await createQuotation(payload); // createQuotation now expects full payload
      toast({ title: "Success", description: `Quotation saved as ${status.toLowerCase()} successfully!` });
      
      quotationForm.reset({ quotationTitle: `Q-${Date.now()}`}); // Reset with new placeholder
      setQuotationItems([]);
      setSelectedClient(null);
      setClientSearch(""); 
      setSelectedTicket(null);
      setTicketSearchQuery("");
      // router.push("/dashboard/quotations");
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || "Failed to save quotation.";
      toast({ title: "Save Failed", description: errorMessage, variant: "destructive" });
    } finally {
      setIsSavingQuotation(false);
    }
  };

  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    // For preview, typically DRAFT status is fine, or a dedicated status could be used.
    const payload = buildQuotationPayload("DRAFT");

    if (!payload) {
      setIsExportingPdf(false);
      return;
    }

    console.log("Generating PDF preview with payload:", payload);

    try {
      await getPreviewPdf(payload);
      toast({ title: "PDF Generated", description: "Your PDF preview has started downloading." });
    } catch (error: any) {
      const errorMessage = error.message || "Failed to generate PDF preview.";
      toast({ title: "PDF Error", description: errorMessage, variant: "destructive" });
    } finally {
      setIsExportingPdf(false);
    }
  };


  return (
    <div className="min-h-screen p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="rounded-lg shadow-sm border p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <FileText className="h-8 w-8" />
              <div>
                <h1 className="text-xl font-semibold">Bhavya Enterprises</h1>
                <p className="text-sm">Smart Quotation System</p>
              </div>
            </div>
            <div className="space-x-2">
              <Button 
                variant="outline" 
                onClick={handleExportPdf}
                disabled={isExportingPdf || isSavingQuotation}
              >
                {isExportingPdf ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                Export PDF
              </Button>
            </div>
          </div>
        </div>

        {/* Company Info Card - Assuming this is static or fetched elsewhere */}
        <Card>
          <CardContent className="p-4 text-center">
            <h1 className="text-lg">Bhavya Enterprises</h1>
            {/* ... other company details ... */}
            <p className="text-sm">GSTIN: 27ABCDE1234F1Z5</p>
          </CardContent>
        </Card>

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-1 space-y-6">
            {/* Client Information Card */}
            <Card>
              <CardHeader><CardTitle className="flex items-center"><UserPlus className="mr-2 h-5 w-5" />Client Information</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="clientSearch">Client Search</Label>
                  <div className="relative">
                    <Input id="clientSearch" type="text" value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} onFocus={() => { if (clientSearch.trim() && clientSearchResults.length > 0) setShowClientSearchDropdown(true);}} placeholder="Search by name or code..." className="pr-10" />
                    {isClientSearchLoading && <div className="absolute inset-y-0 right-0 flex items-center pr-3"><Loader2 className="h-4 w-4 animate-spin text-gray-400" /></div>}
                  </div>
                  {showClientSearchDropdown && clientSearch.trim() && clientSearchResults.length > 0 && (
                    <div className="absolute z-20 mt-1 w-full bg-background border rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {clientSearchResults.map((client) => (<div key={client.id} className="p-2 hover:bg-accent cursor-pointer" onClick={() => handleClientSelect(client)}><p className="font-medium">{client.code} {client.name}</p></div>))}
                    </div>
                  )}
                  {showClientSearchDropdown && clientSearch.trim() && !isClientSearchLoading && clientSearchResults.length === 0 && (<div className="absolute z-20 mt-1 w-full bg-background border rounded-md shadow-lg p-2 text-sm">No clients found.</div>)}
                </div>
                <Button variant="outline" className="w-full" onClick={() => setIsCreateClientDialogOpen(true)}><Plus className="mr-2 h-4 w-4" />Create New Client</Button>
                {selectedClient && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-1">
                    <h3 className="text-sm font-semibold text-blue-700">Selected Client:</h3>
                    <p><strong>Name:</strong> {selectedClient.name}</p><p><strong>Code:</strong> {selectedClient.code}</p>
                    {selectedClient.email && <p><strong>Email:</strong> {selectedClient.email}</p>}
                    <Button variant="link" size="sm" className="p-0 h-auto text-red-500" onClick={() => { setSelectedClient(null); setClientSearch(""); }}>Clear Selection</Button>
                  </div>
                )}
              </CardContent>
            </Card>
            <CreateClientDialog isOpen={isCreateClientDialogOpen} onOpenChange={setIsCreateClientDialogOpen} onClientCreated={(newClient) => { setSelectedClient(newClient); setClientSearch(newClient.name); setIsCreateClientDialogOpen(false); toast({ title: "Client Created", description: `${newClient.name} created and selected.` }); }} />

            {/* Ticket Association Card */}
            <Card>
              <CardHeader><CardTitle className="flex items-center"><LinkIcon className="mr-2 h-5 w-5" />Ticket Association (Optional)</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="ticketSearch">Search Ticket</Label>
                  <div className="relative">
                    <Input id="ticketSearch" type="text" value={ticketSearchQuery} onChange={(e) => setTicketSearchQuery(e.target.value)} onFocus={() => { if (ticketSearchQuery.trim() && ticketSearchResults.length > 0) setShowTicketSearchDropdown(true); }} placeholder="Search by title or ticket ID..." className="pr-10" />
                    {isTicketSearchLoading && <div className="absolute inset-y-0 right-0 flex items-center pr-3"><Loader2 className="h-4 w-4 animate-spin text-gray-400" /></div>}
                  </div>
                  {showTicketSearchDropdown && ticketSearchQuery.trim() && ticketSearchResults.length > 0 && (
                    <div className="absolute z-20 mt-1 w-full bg-background border rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {ticketSearchResults.map((ticket) => (<div key={ticket.id} className="p-2 hover:bg-accent cursor-pointer" onClick={() => handleTicketSelect(ticket)}><p className="font-medium">{ticket.title} ({ticket.id})</p></div>))}
                    </div>
                  )}
                  {showTicketSearchDropdown && ticketSearchQuery.trim() && !isTicketSearchLoading && ticketSearchResults.length === 0 && (<div className="absolute z-20 mt-1 w-full bg-background border rounded-md shadow-lg p-2 text-sm ">No tickets found.</div>)}
                </div>
                {selectedTicket && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg space-y-1">
                    <h3 className="text-sm font-semibold text-green-700">Selected Ticket:</h3>
                    <p><strong>Title:</strong> {selectedTicket.title}</p>
                    <p><strong>ID:</strong> {selectedTicket.id}</p>
                    <Button variant="link" size="sm" className="p-0 h-auto text-red-500 flex items-center" onClick={clearSelectedTicket}><XCircle className="mr-1 h-4 w-4" />Clear Ticket</Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quotation Details Card */}
            <Card>
              <CardHeader><CardTitle>Quotation Details</CardTitle></CardHeader>
              <CardContent>
                <Form {...quotationForm}>
                  <form className="space-y-4"> {/* Removed onSubmit from here as it's handled by main save buttons */}
                    <FormField control={quotationForm.control} name="serialNumber" render={({ field }) => (<FormItem><FormLabel>Ref/Serial Number</FormLabel><FormControl><Input placeholder="Optional reference" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={quotationForm.control} name="date" render={({ field }) => (<FormItem><FormLabel>Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={quotationForm.control} name="salesType" render={({ field }) => (<FormItem><FormLabel>Sales Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select sales type" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Interstate">Interstate</SelectItem><SelectItem value="Intrastate">Intrastate</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                    <FormField control={quotationForm.control} name="quotationTitle" render={({ field }) => (<FormItem><FormLabel>Quotation Title/Description</FormLabel><FormControl><Input placeholder="Enter main work description" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={quotationForm.control} name="validUntil" render={({ field }) => (<FormItem><FormLabel>Valid Until</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={quotationForm.control} name="admin" render={({ field }) => (<FormItem><FormLabel>Admin/Prepared By</FormLabel><FormControl><Input placeholder="Name of admin/user" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={quotationForm.control} name="quoteBy" render={({ field }) => (<FormItem><FormLabel>Quoted By (Person Responsible)</FormLabel><FormControl><Input placeholder="Name of person quoting" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Rate Cards & Services Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <div className="flex items-center"><Package className="mr-2 h-5 w-5" />Rate Cards & Services</div>
                  <div className="space-x-2">
                    <Button variant="outline" size="sm" onClick={() => setShowRateCardSearch(!showRateCardSearch)}><Search className="mr-1 h-4 w-4" />{showRateCardSearch ? "Hide Search" : "Search"}</Button>
                    <Button variant="outline" size="sm" onClick={handleAddManually}><Plus className="mr-1 h-4 w-4" />Manual</Button>
                  </div>
                </CardTitle>
              </CardHeader>
              {showRateCardSearch && (
                <div className="p-4 border-b">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input type="text" placeholder="Search rate cards..." value={rateCardSearch} onChange={(e) => setRateCardSearch(e.target.value)} className="pl-10 w-full" />
                    {isRateCardSearchLoading && <div className="absolute inset-y-0 right-0 flex items-center pr-3"><Loader2 className="h-4 w-4 animate-spin text-gray-400" /></div>}
                  </div>
                  {rateCardSearchResults.length > 0 && (
                    <div className="mt-2 border rounded-md shadow-lg max-h-60 overflow-y-auto z-10 bg-background">
                      {rateCardSearchResults.map((rc) => (<div key={rc.id} className="p-3 hover:bg-accent cursor-pointer border-b last:border-b-0" onClick={() => addRateCardToQuotation(rc)}><p className="font-medium">{rc.productDescription || rc.description}</p><p className="text-xs text-gray-600">Unit: {rc.unit} | Price: {rc.unitPrice || rc.rate}</p></div>))}
                    </div>
                  )}
                  {rateCardSearch.trim() && !isRateCardSearchLoading && rateCardSearchResults.length === 0 && (<div className="mt-2 text-sm text-center p-2">No rate cards found.</div>)}
                </div>
              )}
              <CardContent className="p-0">
                {quotationItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40"><Package className="h-10 w-10 mb-2 text-gray-400" /><p className="text-gray-500">No items added yet.</p></div>
                ) : (
                  <Table>
                    <TableHeader><TableRow><TableHead className="w-[50px]">S.No</TableHead><TableHead className="min-w-[200px]">Description</TableHead><TableHead>Unit</TableHead><TableHead className="w-[100px]">Qty</TableHead><TableHead>Unit Price</TableHead><TableHead>Total</TableHead><TableHead className="w-[100px] text-right">Action</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {quotationItems.map((item, index) => (
                        <TableRow key={item.rateCard.id || `new-${item.sno}`}>
                          <TableCell>{item.sno}</TableCell>
                          <TableCell>{item.isEditable ? <FormField control={inlineRateCardForm.control} name="description" render={({ field }) => <Input placeholder="Description" {...field} defaultValue={item.rateCard.description} />} /> : (item.rateCard.productDescription || item.rateCard.description)}</TableCell>
                          <TableCell>{item.isEditable ? <FormField control={inlineRateCardForm.control} name="unit" render={({ field }) => (<Select onValueChange={field.onChange} defaultValue={item.rateCard.unit || "Unit"}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Unit">Unit</SelectItem><SelectItem value="Piece">Piece</SelectItem><SelectItem value="Set">Set</SelectItem><SelectItem value="Meter">Meter</SelectItem><SelectItem value="SqFt">SqFt</SelectItem><SelectItem value="Job">Job</SelectItem></SelectContent></Select>)} /> : item.rateCard.unit}</TableCell>
                          <TableCell><Input type="number" value={item.quantity} min="1" onChange={(e) => updateQuotationItemQuantity(index, e.target.value)} className="w-full" disabled={item.isEditable} /></TableCell>
                          <TableCell>{item.isEditable ? <FormField control={inlineRateCardForm.control} name="rate" render={({ field }) => <Input type="number" placeholder="0.00" {...field} defaultValue={item.rateCard.unitPrice || item.rateCard.rate} />} /> : (item.rateCard.unitPrice || item.rateCard.rate)}</TableCell>
                          <TableCell>{item.totalValue.toFixed(2)}</TableCell>
                          <TableCell className="text-right">{item.isEditable ? <Button size="sm" onClick={inlineRateCardForm.handleSubmit((data) => onSaveInlineRateCard(data, index))}><Save className="mr-1 h-4 w-4" />Save</Button> : <Button variant="ghost" size="icon" onClick={() => removeQuotationItem(index)}><Trash2 className="h-4 w-4 text-red-500" /></Button>}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Calculations & Summary Card */}
            <Card>
              <CardHeader><CardTitle>Calculations & Summary</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  <div className="space-y-3">
                    <h4 className="text-md font-semibold mb-2">Quotation Summary</h4>
                    <div className="flex justify-between text-sm"><span className="text-gray-600">Total Items:</span><span className="font-medium">{totalItems}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-gray-600">Total Quantity:</span><span className="font-medium">{totalQuantity}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-gray-600">Subtotal:</span><span className="font-medium">₹{subtotal.toFixed(2)}</span></div>
                    <div className="pt-1"><Label htmlFor="subtotalInWords" className="text-xs">Subtotal (In Words)</Label><div id="subtotalInWords" className="text-sm p-2 border rounded-md min-h-[36px] bg-gray-50">{subtotalInWords}</div></div>
                  </div>
                  <div className="space-y-3 p-3 rounded-lg bg-gray-50">
                    <h4 className="text-md font-semibold mb-2">Tax Calculations</h4>
                    <div className="flex justify-between text-sm"><span className="text-gray-600">Subtotal:</span><span className="font-medium">₹{subtotal.toFixed(2)}</span></div>
                    <div className="flex justify-between items-center text-sm space-x-2">
                      <Label htmlFor="discountInput" className="whitespace-nowrap text-gray-600">Discount:</Label>
                      <div className="flex items-center w-full max-w-[130px]">
                        <FormField control={quotationForm.control} name="discount" render={({ field }) => (<Input id="discountInput" type="number" min="0" max="100" step="0.01" {...field} className="w-full h-8 text-right pr-1 text-sm" onChange={(e) => { const val = e.target.value; if (val === "" || (parseFloat(val) >= 0 && parseFloat(val) <= 100)) field.onChange(val); else if (parseFloat(val) < 0) field.onChange("0"); else if (parseFloat(val) > 100) field.onChange("100");}} />)} />
                        <span className="pl-1 pr-1 text-gray-600">%</span>
                      </div>
                      <span className="font-medium text-red-500 whitespace-nowrap">-₹{discountAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm"><span className="text-gray-600">Taxable Value:</span><span className="font-medium">₹{taxableValue.toFixed(2)}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-gray-600">IGST (18%):</span><span className="font-medium">₹{igstAmount.toFixed(2)}</span></div>
                    <Separator className="my-2" />
                    <div className="flex justify-between text-base"><span className="font-semibold text-blue-700">Net Gross Amount:</span><span className="font-bold text-blue-700 text-lg">₹{netGrossAmount.toFixed(2)}</span></div>
                    <div className="pt-1"><Label htmlFor="netGrossInWords" className="text-xs">Net Gross Amount (In Words)</Label><div id="netGrossInWords" className="text-sm p-2 border rounded-md min-h-[36px] bg-white">{netGrossAmountInWords}</div></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-center space-x-3 pt-4">
              <Button variant="outline" onClick={() => handleSaveQuotation("DRAFT")} disabled={isSavingQuotation || isExportingPdf}>
                {(isSavingQuotation && quotationForm.getValues().status !== 'SENT') ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Save Draft
              </Button>
              <Button onClick={() => handleSaveQuotation("SENT")} disabled={isSavingQuotation || isExportingPdf} className="bg-blue-600 hover:bg-blue-700">
                {(isSavingQuotation && quotationForm.getValues().status === 'SENT') ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />} Send Quotation
              </Button>
              <Button variant="secondary" onClick={handleExportPdf} disabled={isExportingPdf || isSavingQuotation}>
                {isExportingPdf ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />} Export PDF
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// CreateClientDialog Component (assuming it's mostly correct from previous context)
interface CreateClientDialogProps { isOpen: boolean; onOpenChange: (isOpen: boolean) => void; onClientCreated: (client: Client) => void; }
const CreateClientDialog: React.FC<CreateClientDialogProps> = ({ isOpen, onOpenChange, onClientCreated }) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const clientForm = useForm<CreateClientFormData>({
    resolver: zodResolver(createClientSchema),
    defaultValues: { name: "", type: "Corporate", totalBranches: 1, contactPerson: "", contactPhone: "", contactEmail: "", contractStatus: "Active", lastServiceDate: new Date().toISOString().split('T')[0], gstn: "", avatar: "", initials: "" },
  });
  const onSubmit = async (data: CreateClientFormData) => {
    setIsSubmitting(true);
    try {
      const newClient = await createClient(data);
      toast({ title: "Success", description: "New client created." });
      onClientCreated(newClient as Client); // Assuming newClient is compatible
      clientForm.reset();
      onOpenChange(false);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || "Error";
      toast({ title: "Error Creating Client", description: errorMessage, variant: "destructive" });
    } finally { setIsSubmitting(false); }
  };
  return (<Dialog open={isOpen} onOpenChange={onOpenChange}><DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>Create New Client</DialogTitle><DialogDescription>Fill details to add a new client.</DialogDescription></DialogHeader>
  <Form {...clientForm}><form onSubmit={clientForm.handleSubmit(onSubmit)} className="space-y-3 py-3 max-h-[70vh] overflow-y-auto px-2">
      {/* FormField for name */}
      <FormField control={clientForm.control} name="name" render={({ field }) => (<FormItem><FormLabel>Client Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
      {/* FormField for type */}
      <FormField control={clientForm.control} name="type" render={({ field }) => (<FormItem><FormLabel>Client Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Bank">Bank</SelectItem><SelectItem value="NBFC">NBFC</SelectItem><SelectItem value="Insurance">Insurance</SelectItem><SelectItem value="Corporate">Corporate</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
      {/* FormField for totalBranches */}
      <FormField control={clientForm.control} name="totalBranches" render={({ field }) => (<FormItem><FormLabel>Total Branches</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} /></FormControl><FormMessage /></FormItem>)} />
      {/* Other fields: contactPerson, contactPhone, contactEmail, contractStatus, lastServiceDate, gstn, avatar, initials */}
      <FormField control={clientForm.control} name="contactPerson" render={({ field }) => (<FormItem><FormLabel>Contact Person</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
      <FormField control={clientForm.control} name="contactPhone" render={({ field }) => (<FormItem><FormLabel>Contact Phone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
      <FormField control={clientForm.control} name="contactEmail" render={({ field }) => (<FormItem><FormLabel>Contact Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>)} />
      <FormField control={clientForm.control} name="contractStatus" render={({ field }) => (<FormItem><FormLabel>Contract Status</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Active">Active</SelectItem><SelectItem value="Inactive">Inactive</SelectItem><SelectItem value="Pending">Pending</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
      <FormField control={clientForm.control} name="lastServiceDate" render={({ field }) => (<FormItem><FormLabel>Last Service Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
      <FormField control={clientForm.control} name="gstn" render={({ field }) => (<FormItem><FormLabel>GSTN</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
      <DialogFooter className="pt-4"><DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose><Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create Client</Button></DialogFooter>
  </form></Form></DialogContent></Dialog>);
};

export default NewQuotationPage;
