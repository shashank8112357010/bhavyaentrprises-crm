"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter }_DEACTIVATED_ from "next/navigation"; // Corrected import
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { FileText, Download, Save, Search, Plus, Package, Trash2, Send, Loader2, UserPlus, LinkIcon, XCircle, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

// Service and schema imports
import { createClient, getAllClients, Client as ServiceClient } from "@/lib/services/client";
import { createClientSchema } from "@/lib/validations/clientSchema";
import { getAllRateCards, createSingleRateCard, RateCard as ServiceRateCard } from "@/lib/services/rate-card";
import { rateCardSchema as inlineRateCardFormSchema } from "@/lib/validations/rateCardSchema";
import { getQuotationById, updateQuotation, deleteQuotation, getPreviewPdf } from "@/lib/services/quotations";
import { CreateQuotationPayload, quotationSchema as backendQuotationSchema, QuotationStatus as BackendQuotationStatus } from "@/lib/validations/quotationSchema";
import { getAllTickets, Ticket as ServiceTicket } from "@/lib/services/ticket";
import { Quotation } from "@prisma/client"; // For full quotation type

type CreateClientFormData = z.infer<typeof createClientSchema>;

// Frontend interface for QuotationItem (consistent with NewQuotationPage)
interface QuotationItem {
  sno: number;
  rateCard: ServiceRateCard; // Contains description, unit, rate (unitPrice)
  quantity: number;
  totalValue: number;
  isEditable?: boolean;
  // Fields from backend's quotationItemSchema for direct use in payload
  description: string;
  productDescription?: string;
  unit: string;
  unitPrice: number; // Parsed numeric value
  rateCardId?: string; // To link back
}

// Zod Schema for the main Quotation Details Form on this page
const pageQuotationFormSchema = z.object({
  quotationTitle: z.string().min(1, "Quotation title/description is required"),
  serialNumber: z.string().optional(),
  date: z.string().refine(val => !isNaN(Date.parse(val)), { message: "Invalid date" }),
  salesType: z.string().min(1, "Sales type is required"),
  validUntil: z.string().optional().nullable(),
  admin: z.string().optional(),
  quoteBy: z.string().optional(),
  discount: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) >= 0 && parseFloat(val) <= 100, { message: "Discount must be between 0 and 100"}).default("0"),
  status: z.nativeEnum(BackendQuotationStatus).default(BackendQuotationStatus.DRAFT),
});

type PageQuotationFormData = z.infer<typeof pageQuotationFormSchema>;

interface EditQuotationPageProps { params: { id: string } }

const EditQuotationPage: React.FC<EditQuotationPageProps> = ({ params }) => {
  const { id: quotationId } = params;
  const router = useRouter();
  const { toast } = useToast();

  const [isLoadingPageData, setIsLoadingPageData] = useState(true);
  const [existingQuotationData, setExistingQuotationData] = useState<Quotation | null>(null);

  const quotationForm = useForm<PageQuotationFormData>({
    resolver: zodResolver(pageQuotationFormSchema),
    defaultValues: {
      quotationTitle: "",
      serialNumber: "",
      date: new Date().toISOString().split('T')[0],
      salesType: "Interstate",
      validUntil: "",
      admin: "",
      quoteBy: "",
      discount: "0",
      status: BackendQuotationStatus.DRAFT,
    },
  });

  const [selectedClient, setSelectedClient] = useState<ServiceClient | null>(null);
  const [clientSearch, setClientSearch] = useState<string>("");
  const [clientSearchResults, setClientSearchResults] = useState<ServiceClient[]>([]);
  const [isClientSearchLoading, setIsClientSearchLoading] = useState<boolean>(false);
  const [showClientSearchDropdown, setShowClientSearchDropdown] = useState<boolean>(false);
  const [isCreateClientDialogOpen, setIsCreateClientDialogOpen] = useState<boolean>(false);

  const [selectedTicket, setSelectedTicket] = useState<ServiceTicket | null>(null);
  const [ticketSearchQuery, setTicketSearchQuery] = useState<string>("");
  const [ticketSearchResults, setTicketSearchResults] = useState<ServiceTicket[]>([]);
  const [isTicketSearchLoading, setIsTicketSearchLoading] = useState<boolean>(false);
  const [showTicketSearchDropdown, setShowTicketSearchDropdown] = useState<boolean>(false);

  const [quotationItems, setQuotationItems] = useState<QuotationItem[]>([]);
  const [rateCardSearch, setRateCardSearch] = useState<string>("");
  const [rateCardSearchResults, setRateCardSearchResults] = useState<ServiceRateCard[]>([]);
  const [isRateCardSearchLoading, setIsRateCardSearchLoading] = useState<boolean>(false);
  const [showRateCardSearch, setShowRateCardSearch] = useState<boolean>(false);

  const [isSavingQuotation, setIsSavingQuotation] = useState<boolean>(false);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Debounce timer refs
  const clientSearchDebounceRef = React.useRef<NodeJS.Timeout | null>(null);
  const rateCardSearchDebounceRef = React.useRef<NodeJS.Timeout | null>(null);
  const ticketSearchDebounceRef = React.useRef<NodeJS.Timeout | null>(null);

  // Data Fetching Effect
  useEffect(() => {
    if (!quotationId) {
      toast({ title: "Error", description: "No quotation ID provided.", variant: "destructive" });
      setIsLoadingPageData(false);
      router.push("/dashboard/quotations");
      return;
    }

    const fetchData = async () => {
      setIsLoadingPageData(true);
      try {
        const data = await getQuotationById(quotationId);
        setExistingQuotationData(data);

        // Populate form
        quotationForm.reset({
          quotationTitle: data.name || "",
          serialNumber: data.serialNumber || "",
          date: data.date ? new Date(data.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          salesType: data.salesType || "Interstate",
          validUntil: data.validUntil ? new Date(data.validUntil).toISOString().split('T')[0] : "",
          admin: data.admin || "",
          quoteBy: data.quoteBy || "",
          discount: data.discountPercentage?.toString() || "0",
          status: data.status || BackendQuotationStatus.DRAFT,
        });

        // Populate client
        if (data.client) {
          // Type assertion needed if ServiceClient and data.client structure differs
          setSelectedClient(data.client as ServiceClient);
          setClientSearch(data.client.name);
        }

        // Populate ticket
        if (data.ticket) {
          // Type assertion needed if ServiceTicket and data.ticket structure differs
          setSelectedTicket(data.ticket as ServiceTicket);
          setTicketSearchQuery(data.ticket.title || "");
        }

        // Populate items
        if (data.items && Array.isArray(data.items)) {
          const transformedItems: QuotationItem[] = (data.items as any[]).map((item: any, index: number) => ({
            sno: item.sno || index + 1,
            rateCard: { // This assumes item has enough details to reconstruct a RateCard-like object
              id: item.rateCardId || `item-${index}`, // If rateCardId is stored, use it
              description: item.description || item.productDescription || "",
              productDescription: item.productDescription || item.description || "",
              unit: item.unit || "N/A",
              rate: (item.unitPrice || 0).toString(), // Store as string like ServiceRateCard
              unitPrice: (item.unitPrice || 0).toString(), // Store as string
            } as ServiceRateCard, // Type assertion
            quantity: item.quantity || 1,
            totalValue: item.totalValue || (item.quantity * item.unitPrice),
            isEditable: false,
            // Pass through fields for payload construction
            description: item.description || item.productDescription || "",
            productDescription: item.productDescription || item.description || "",
            unit: item.unit || "N/A",
            unitPrice: item.unitPrice || 0,
            rateCardId: item.rateCardId,
          }));
          setQuotationItems(transformedItems);
        }

      } catch (error: any) {
        toast({ title: "Error Fetching Quotation", description: error.message, variant: "destructive" });
        router.push("/dashboard/quotations");
      } finally {
        setIsLoadingPageData(false);
      }
    };
    fetchData();
  }, [quotationId, router, toast, quotationForm]);


  // Debounced search functions (copied from NewQuotationPage and adapted)
  const handleClientSearch = useCallback(async (query: string) => { /* ... same as NewQuotationPage ... */
    if (!query.trim()) { setClientSearchResults([]); setShowClientSearchDropdown(false); return; }
    setIsClientSearchLoading(true);
    try { const response = await getAllClients({ searchQuery: query }); setClientSearchResults(response.clients || []); setShowClientSearchDropdown(true); }
    catch (error) { console.error("Failed to search clients:", error); toast({ title: "Error", description: "Failed to fetch clients.", variant: "destructive" }); setClientSearchResults([]); }
    finally { setIsClientSearchLoading(false); }
  }, [toast]);
  useEffect(() => { /* ... same as NewQuotationPage ... */
    if (clientSearch.trim() === "" || clientSearch === selectedClient?.name) { setClientSearchResults([]); setShowClientSearchDropdown(false); return; }
    if (clientSearchDebounceRef.current) clearTimeout(clientSearchDebounceRef.current);
    clientSearchDebounceRef.current = setTimeout(() => handleClientSearch(clientSearch), 500);
    return () => { if (clientSearchDebounceRef.current) clearTimeout(clientSearchDebounceRef.current); };
  }, [clientSearch, selectedClient?.name, handleClientSearch]);

  const handleTicketSearch = useCallback(async (query: string) => { /* ... same as NewQuotationPage ... */
    if (!query.trim()) { setTicketSearchResults([]); setShowTicketSearchDropdown(false); return; }
    setIsTicketSearchLoading(true);
    try { const response = await getAllTickets({ searchQuery: query }); setTicketSearchResults(response.tickets || []); setShowTicketSearchDropdown(true); }
    catch (error) { console.error("Failed to search tickets:", error); toast({ title: "Error", description: "Failed to fetch tickets.", variant: "destructive" }); setTicketSearchResults([]); }
    finally { setIsTicketSearchLoading(false); }
  }, [toast]);
  useEffect(() => { /* ... same as NewQuotationPage ... */
    if (ticketSearchQuery.trim() === "" || ticketSearchQuery === selectedTicket?.title) { setTicketSearchResults([]); setShowTicketSearchDropdown(false); return; }
    if (ticketSearchDebounceRef.current) clearTimeout(ticketSearchDebounceRef.current);
    ticketSearchDebounceRef.current = setTimeout(() => handleTicketSearch(ticketSearchQuery), 500);
    return () => { if (ticketSearchDebounceRef.current) clearTimeout(ticketSearchDebounceRef.current); };
  }, [ticketSearchQuery, selectedTicket?.title, handleTicketSearch]);

  const handleRateCardSearch = useCallback(async (query: string) => { /* ... same as NewQuotationPage ... */
    if (!query.trim()) { setRateCardSearchResults([]); return; }
    setIsRateCardSearchLoading(true);
    try { const response = await getAllRateCards({ searchQuery: query }); setRateCardSearchResults(response.data || []); }
    catch (error) { console.error("Failed to search rate cards:", error); toast({ title: "Error", description: "Failed to fetch rate cards.", variant: "destructive" }); setRateCardSearchResults([]); }
    finally { setIsRateCardSearchLoading(false); }
  }, [toast]);
  useEffect(() => { /* ... same as NewQuotationPage ... */
    if (rateCardSearch.trim() === "") { setRateCardSearchResults([]); return; }
    if (rateCardSearchDebounceRef.current) clearTimeout(rateCardSearchDebounceRef.current);
    rateCardSearchDebounceRef.current = setTimeout(() => handleRateCardSearch(rateCardSearch), 500);
    return () => { if (rateCardSearchDebounceRef.current) clearTimeout(rateCardSearchDebounceRef.current); };
  }, [rateCardSearch, handleRateCardSearch]);

  // Client and Ticket selection handlers (copied from NewQuotationPage)
  const handleClientSelect = (client: ServiceClient) => { setSelectedClient(client); setClientSearch(client.name); setShowClientSearchDropdown(false); setClientSearchResults([]); };
  const handleTicketSelect = (ticket: ServiceTicket) => { setSelectedTicket(ticket); setTicketSearchQuery(ticket.title); setShowTicketSearchDropdown(false); setTicketSearchResults([]); };
  const clearSelectedTicket = () => { setSelectedTicket(null); setTicketSearchQuery(""); setTicketSearchResults([]); setShowTicketSearchDropdown(false); };

  // Quotation items logic (copied from NewQuotationPage and adapted)
  const inlineRateCardForm = useForm<z.infer<typeof inlineRateCardFormSchema>>({ resolver: zodResolver(inlineRateCardFormSchema), defaultValues: { description: "", unit: "Unit", rate: 0 }});
  const addRateCardToQuotation = (rateCard: ServiceRateCard) => { /* ... same as NewQuotationPage, ensure QuotationItem fields are correctly populated ... */
    const newSno = quotationItems.length + 1;
    const price = parseFloat(rateCard.unitPrice || rateCard.rate || "0");
    const newItem: QuotationItem = {
      sno: newSno, rateCard: rateCard, quantity: 1, totalValue: price * 1, isEditable: false,
      description: rateCard.productDescription || rateCard.description, productDescription: rateCard.productDescription, unit: rateCard.unit, unitPrice: price, rateCardId: rateCard.id,
    };
    setQuotationItems([...quotationItems, newItem]);
    setRateCardSearch(""); setRateCardSearchResults([]); setShowRateCardSearch(false);
    toast({ title: "Item Added", description: `${rateCard.description || rateCard.productDescription} added.` });
  };
  const updateQuotationItemQuantity = (index: number, newQuantityStr: string) => { /* ... same as NewQuotationPage ... */
    const newQuantity = parseInt(newQuantityStr, 10);
    if (isNaN(newQuantity) || newQuantity < 1) { toast({ title: "Invalid Quantity", variant: "destructive" }); return; }
    const updatedItems = quotationItems.map((item, i) => {
      if (i === index) { const price = item.unitPrice; return { ...item, quantity: newQuantity, totalValue: price * newQuantity }; } return item;
    });
    setQuotationItems(updatedItems);
  };
  const removeQuotationItem = (indexToRemove: number) => { /* ... same as NewQuotationPage ... */
    const updatedItems = quotationItems.filter((_, index) => index !== indexToRemove).map((item, newIndex) => ({ ...item, sno: newIndex + 1 }));
    setQuotationItems(updatedItems); toast({ title: "Item Removed" });
  };
  const handleAddManually = () => { /* ... same as NewQuotationPage, ensure QuotationItem fields are correctly populated ... */
    const newSno = quotationItems.length + 1;
    const newItem: QuotationItem = {
      sno: newSno, rateCard: { id: `new-${Date.now()}`, description: "", unit: "Unit", rate: "0" } as ServiceRateCard, quantity: 1, totalValue: 0, isEditable: true,
      description: "", productDescription: "", unit: "Unit", unitPrice: 0,
    };
    setQuotationItems([...quotationItems, newItem]); inlineRateCardForm.reset({ description: "", unit: "Unit", rate: 0 });
  };
  const onSaveInlineRateCard = async (data: z.infer<typeof inlineRateCardFormSchema>, itemIndex: number) => { /* ... same as NewQuotationPage, ensure QuotationItem fields are correctly populated ... */
    try {
      const newRateCard = await createSingleRateCard(data); const price = parseFloat(newRateCard.rate || "0");
      const updatedItems = quotationItems.map((item, index) => {
        if (index === itemIndex) return { ...item, rateCard: newRateCard, isEditable: false, quantity: item.quantity, totalValue: price * item.quantity, description: newRateCard.description, unit: newRateCard.unit, unitPrice: price, rateCardId: newRateCard.id };
        return item;
      });
      setQuotationItems(updatedItems); toast({ title: "Rate Card Saved" }); inlineRateCardForm.reset();
    } catch (error: any) { toast({ title: "Save Failed", description: error.message, variant: "destructive" }); }
  };

  // Financial Calculations (copied from NewQuotationPage)
  const subtotal = useMemo(() => quotationItems.reduce((acc, item) => acc + item.totalValue, 0), [quotationItems]);
  const discountPercentageStr = quotationForm.watch("discount") || "0";
  const discountPercentage = parseFloat(discountPercentageStr) || 0;
  const discountAmount = useMemo(() => (subtotal * discountPercentage) / 100, [subtotal, discountPercentage]);
  const taxableValue = useMemo(() => subtotal - discountAmount, [subtotal, discountAmount]);
  const igstRate = 0.18; // 18% IGST
  const igstAmount = useMemo(() => taxableValue * igstRate, [taxableValue]);
  const netGrossAmount = useMemo(() => taxableValue + igstAmount, [taxableValue, igstAmount]);
  const totalItems = quotationItems.length;
  const totalQuantity = useMemo(() => quotationItems.reduce((acc, item) => acc + item.quantity, 0), [quotationItems]);
  const numberToWords = (num: number): string => `Rupees ${num.toFixed(2)} Only`;
  const subtotalInWords = numberToWords(subtotal);
  const netGrossAmountInWords = numberToWords(netGrossAmount);

  // Payload Builder for Update
  const buildUpdatePayload = (): Partial<CreateQuotationPayload> | null => {
    if (!selectedClient) { toast({ title: "Validation Error", description: "Client is required.", variant: "destructive" }); return null; }
    if (quotationItems.length === 0) { toast({ title: "Validation Error", description: "At least one item is required.", variant: "destructive" }); return null; }

    const formData = quotationForm.getValues();
    const itemsForPayload = quotationItems.map(item => ({
      sno: item.sno,
      description: item.description,
      productDescription: item.productDescription,
      unit: item.unit,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalValue: item.totalValue,
      rateCardId: item.rateCardId?.startsWith("new-") ? undefined : item.rateCardId,
    }));

    // Construct a partial payload, only including fields that are meant to be updated.
    // Backend `updateQuotationSchema.partial()` will handle what's provided.
    const payload: Partial<CreateQuotationPayload> = {
      name: formData.quotationTitle,
      clientId: selectedClient.id,
      items: itemsForPayload,
      ticketId: selectedTicket?.id || undefined,
      serialNumber: formData.serialNumber,
      date: formData.date,
      salesType: formData.salesType,
      validUntil: formData.validUntil || null,
      admin: formData.admin,
      quoteBy: formData.quoteBy,
      subtotal: subtotal, // Recalculated
      discountPercentage: discountPercentage, // From form, parsed
      discountAmount: discountAmount, // Recalculated
      taxableValue: taxableValue, // Recalculated
      igstAmount: igstAmount, // Recalculated
      netGrossAmount: netGrossAmount, // Recalculated
      status: formData.status,
    };
    return payload;
  };

  const handleUpdateQuotation = async () => {
    setIsSavingQuotation(true);
    const payload = buildUpdatePayload();
    if (!payload) { setIsSavingQuotation(false); return; }

    try {
      await updateQuotation(quotationId, payload);
      toast({ title: "Success", description: "Quotation updated successfully!" });
      router.push("/dashboard/quotations"); // Or refresh data: router.refresh() then re-fetch
    } catch (error: any) {
      toast({ title: "Update Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsSavingQuotation(false);
    }
  };

  const handleGeneratePdf = async () => { /* ... adapted from NewQuotationPage's handleExportPdf ... */
    setIsExportingPdf(true);
    const payloadForPdf = buildUpdatePayload(); // Use current data
    if (!payloadForPdf) { setIsExportingPdf(false); return; }
    // The getPreviewPdf expects a full CreateQuotationPayload.
    // Ensure all required fields are present, even if using Partial for update.
    // For PDF, it's often better to fetch the latest saved version if there are complex server-side defaults.
    // Here, we use the current client-side state.
    const fullPayloadForPdf: CreateQuotationPayload = {
        name: payloadForPdf.name!,
        clientId: payloadForPdf.clientId!,
        items: payloadForPdf.items!,
        date: payloadForPdf.date!,
        salesType: payloadForPdf.salesType!,
        subtotal: payloadForPdf.subtotal!,
        discountPercentage: payloadForPdf.discountPercentage!,
        discountAmount: payloadForPdf.discountAmount!,
        taxableValue: payloadForPdf.taxableValue!,
        igstAmount: payloadForPdf.igstAmount!,
        netGrossAmount: payloadForPdf.netGrossAmount!,
        status: payloadForPdf.status!,
        // Optional fields
        ticketId: payloadForPdf.ticketId,
        serialNumber: payloadForPdf.serialNumber,
        validUntil: payloadForPdf.validUntil,
        admin: payloadForPdf.admin,
        quoteBy: payloadForPdf.quoteBy,
    };


    try { await getPreviewPdf(fullPayloadForPdf); toast({ title: "PDF Generated" }); }
    catch (error: any) { toast({ title: "PDF Error", description: error.message, variant: "destructive" }); }
    finally { setIsExportingPdf(false); }
  };

  const handleDeleteQuotation = async () => {
    setIsDeleting(true);
    try {
      await deleteQuotation(quotationId);
      toast({ title: "Success", description: "Quotation deleted successfully." });
      router.push("/dashboard/quotations");
    } catch (error: any) {
      toast({ title: "Delete Failed", description: error.message, variant: "destructive" });
      setIsDeleting(false);
    }
  };

  if (isLoadingPageData) return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /> Loading...</div>;
  if (!existingQuotationData && !isLoadingPageData) return <div className="text-red-500 p-4">Quotation not found.</div>;

  // Main JSX structure (heavily based on NewQuotationPage)
  return (
    <div className="min-h-screen p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="rounded-lg shadow-sm border p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Edit className="h-8 w-8 text-blue-600" /> {/* Changed Icon */}
              <div>
                <h1 className="text-xl font-semibold">Edit Quotation</h1>
                <p className="text-sm text-gray-500">Quotation ID: {existingQuotationData?.quotationNumber || quotationId}</p>
              </div>
            </div>
            <div className="space-x-2">
              <Button variant="outline" onClick={handleGeneratePdf} disabled={isExportingPdf || isSavingQuotation || isDeleting}>
                {isExportingPdf ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                Generate PDF
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={isDeleting || isSavingQuotation}>
                    {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                    Delete Quotation
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. This will permanently delete the quotation.</AlertDialogDescription></AlertDialogHeader>
                  <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDeleteQuotation}>Delete</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-1 space-y-6">
            {/* Client Information Card (Adapted from NewQuotationPage) */}
            <Card>
              <CardHeader><CardTitle className="flex items-center"><UserPlus className="mr-2 h-5 w-5" />Client Information</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="clientSearchEdit">Client Search</Label>
                  <div className="relative">
                    <Input id="clientSearchEdit" type="text" value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} onFocus={() => { if (clientSearch.trim() && clientSearchResults.length > 0) setShowClientSearchDropdown(true);}} placeholder="Search by name or code..." className="pr-10" />
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

            {/* Ticket Association Card (Adapted from NewQuotationPage) */}
            <Card>
              <CardHeader><CardTitle className="flex items-center"><LinkIcon className="mr-2 h-5 w-5" />Ticket Association (Optional)</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                 <div>
                  <Label htmlFor="ticketSearchEdit">Search Ticket</Label>
                  <div className="relative">
                    <Input id="ticketSearchEdit" type="text" value={ticketSearchQuery} onChange={(e) => setTicketSearchQuery(e.target.value)} onFocus={() => { if (ticketSearchQuery.trim() && ticketSearchResults.length > 0) setShowTicketSearchDropdown(true); }} placeholder="Search by title or ticket ID..." className="pr-10" />
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

            {/* Quotation Details Form (Adapted from NewQuotationPage) */}
            <Card>
              <CardHeader><CardTitle>Quotation Details</CardTitle></CardHeader>
              <CardContent>
                <Form {...quotationForm}>
                  <form className="space-y-4">
                    <FormField control={quotationForm.control} name="quotationTitle" render={({ field }) => (<FormItem><FormLabel>Quotation Title/Description</FormLabel><FormControl><Input placeholder="Main work description" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={quotationForm.control} name="serialNumber" render={({ field }) => (<FormItem><FormLabel>Ref/Serial Number</FormLabel><FormControl><Input placeholder="Optional reference" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={quotationForm.control} name="date" render={({ field }) => (<FormItem><FormLabel>Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={quotationForm.control} name="salesType" render={({ field }) => (<FormItem><FormLabel>Sales Type</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select sales type" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Interstate">Interstate</SelectItem><SelectItem value="Intrastate">Intrastate</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                    <FormField control={quotationForm.control} name="validUntil" render={({ field }) => (<FormItem><FormLabel>Valid Until</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={quotationForm.control} name="admin" render={({ field }) => (<FormItem><FormLabel>Admin/Prepared By</FormLabel><FormControl><Input placeholder="Name of admin/user" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={quotationForm.control} name="quoteBy" render={({ field }) => (<FormItem><FormLabel>Quoted By (Person Responsible)</FormLabel><FormControl><Input placeholder="Name of person quoting" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={quotationForm.control} name="status" render={({ field }) => (<FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger></FormControl><SelectContent>{Object.values(BackendQuotationStatus).map(s => (<SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          {/* Right Column (Rate Cards, Calculations - Adapted from NewQuotationPage) */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader><CardTitle className="flex justify-between items-center"><div className="flex items-center"><Package className="mr-2 h-5 w-5" />Rate Cards & Services</div><div className="space-x-2"><Button variant="outline" size="sm" onClick={() => setShowRateCardSearch(!showRateCardSearch)}><Search className="mr-1 h-4 w-4" />{showRateCardSearch ? "Hide Search" : "Search"}</Button><Button variant="outline" size="sm" onClick={handleAddManually}><Plus className="mr-1 h-4 w-4" />Manual</Button></div></CardTitle></CardHeader>
              {showRateCardSearch && ( <div className="p-4 border-b"> {/* ... same as NewQuotationPage ... */} </div>)}
              <CardContent className="p-0">
                {quotationItems.length === 0 ? (<div className="flex flex-col items-center justify-center h-40"><Package className="h-10 w-10 mb-2 text-gray-400" /><p className="text-gray-500">No items added.</p></div>) : (
                  <Table>
                    <TableHeader><TableRow><TableHead className="w-[50px]">S.No</TableHead><TableHead className="min-w-[200px]">Description</TableHead><TableHead>Unit</TableHead><TableHead className="w-[100px]">Qty</TableHead><TableHead>Unit Price</TableHead><TableHead>Total</TableHead><TableHead className="w-[100px] text-right">Action</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {quotationItems.map((item, index) => (
                        <TableRow key={item.rateCard.id || `new-${item.sno}`}>
                          <TableCell>{item.sno}</TableCell>
                          <TableCell>{item.isEditable ? <FormField control={inlineRateCardForm.control} name="description" render={({ field }) => <Input placeholder="Description" {...field} defaultValue={item.rateCard.description} />} /> : (item.rateCard.productDescription || item.rateCard.description)}</TableCell>
                          <TableCell>{item.isEditable ? <FormField control={inlineRateCardForm.control} name="unit" render={({ field }) => (<Select onValueChange={field.onChange} defaultValue={item.rateCard.unit || "Unit"}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Unit">Unit</SelectItem><SelectItem value="Piece">Piece</SelectItem><SelectItem value="Set">Set</SelectItem><SelectItem value="Meter">Meter</SelectItem><SelectItem value="SqFt">SqFt</SelectItem><SelectItem value="Job">Job</SelectItem></SelectContent></Select>)} /> : item.rateCard.unit}</TableCell>
                          <TableCell><Input type="number" value={item.quantity} min="1" onChange={(e) => updateQuotationItemQuantity(index, e.target.value)} className="w-full" disabled={item.isEditable} /></TableCell>
                          <TableCell>{item.isEditable ? <FormField control={inlineRateCardForm.control} name="rate" render={({ field }) => <Input type="number" placeholder="0.00" {...field} defaultValue={item.rateCard.unitPrice || item.rateCard.rate} />} /> : (item.unitPrice.toFixed(2))}</TableCell>
                          <TableCell>{item.totalValue.toFixed(2)}</TableCell>
                          <TableCell className="text-right">{item.isEditable ? <Button size="sm" onClick={inlineRateCardForm.handleSubmit((data) => onSaveInlineRateCard(data, index))}><Save className="mr-1 h-4 w-4" />Save</Button> : <Button variant="ghost" size="icon" onClick={() => removeQuotationItem(index)}><Trash2 className="h-4 w-4 text-red-500" /></Button>}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Calculations & Summary</CardTitle></CardHeader>
              <CardContent> {/* ... Calculations layout same as NewQuotationPage, bound to quotationForm.watch('discount') and derived financial states ... */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  <div className="space-y-3"> {/* Summary */}
                    <div className="flex justify-between text-sm"><span>Total Items:</span><span className="font-medium">{totalItems}</span></div>
                    <div className="flex justify-between text-sm"><span>Total Quantity:</span><span className="font-medium">{totalQuantity}</span></div>
                    <div className="flex justify-between text-sm"><span>Subtotal:</span><span className="font-medium">₹{subtotal.toFixed(2)}</span></div>
                    <div className="pt-1"><Label className="text-xs">Subtotal (In Words)</Label><div className="text-sm p-2 border rounded-md min-h-[36px] bg-gray-50">{subtotalInWords}</div></div>
                  </div>
                  <div className="space-y-3 p-3 rounded-lg bg-gray-50"> {/* Tax Calc */}
                    <div className="flex justify-between text-sm"><span>Subtotal:</span><span className="font-medium">₹{subtotal.toFixed(2)}</span></div>
                    <div className="flex justify-between items-center text-sm space-x-2">
                      <Label htmlFor="discountEditInput" className="whitespace-nowrap">Discount:</Label>
                      <div className="flex items-center w-full max-w-[130px]">
                        <FormField control={quotationForm.control} name="discount" render={({ field }) => (<Input id="discountEditInput" type="number" min="0" max="100" step="0.01" {...field} className="w-full h-8 text-right pr-1 text-sm" />)} />
                        <span className="pl-1 pr-1">%</span>
                      </div>
                      <span className="font-medium text-red-500 whitespace-nowrap">-₹{discountAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm"><span>Taxable Value:</span><span className="font-medium">₹{taxableValue.toFixed(2)}</span></div>
                    <div className="flex justify-between text-sm"><span>IGST (18%):</span><span className="font-medium">₹{igstAmount.toFixed(2)}</span></div>
                    <Separator className="my-2" />
                    <div className="flex justify-between text-base"><span>Net Gross Amount:</span><span className="font-bold text-blue-700 text-lg">₹{netGrossAmount.toFixed(2)}</span></div>
                    <div className="pt-1"><Label className="text-xs">Net Gross Amount (In Words)</Label><div className="text-sm p-2 border rounded-md min-h-[36px] bg-white">{netGrossAmountInWords}</div></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-center space-x-3 pt-4">
              <Button onClick={handleUpdateQuotation} disabled={isSavingQuotation || isLoadingPageData || isExportingPdf || isDeleting}>
                {isSavingQuotation ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Update Quotation
              </Button>
              <Button variant="outline" onClick={() => router.push("/dashboard/quotations")} disabled={isSavingQuotation || isDeleting}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// CreateClientDialog (copied from NewQuotationPage, ensure props are correct)
const CreateClientDialog: React.FC<{isOpen: boolean; onOpenChange: (isOpen: boolean) => void; onClientCreated: (client: ServiceClient) => void;}> = ({ isOpen, onOpenChange, onClientCreated }) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const clientForm = useForm<CreateClientFormData>({ resolver: zodResolver(createClientSchema), defaultValues: { name: "", type: "Corporate", totalBranches: 1, contactPerson: "", contactPhone: "", contractEmail: "", contractStatus: "Active", lastServiceDate: new Date().toISOString().split('T')[0], gstn: "", avatar: "", initials: "" }});
  const onSubmit = async (data: CreateClientFormData) => {
    setIsSubmitting(true);
    try { const newClient = await createClient(data); toast({ title: "Success", description: "Client created." }); onClientCreated(newClient); clientForm.reset(); onOpenChange(false); }
    catch (error: any) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
    finally { setIsSubmitting(false); }
  };
  return (<Dialog open={isOpen} onOpenChange={onOpenChange}><DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>Create New Client</DialogTitle></DialogHeader>
  <Form {...clientForm}><form onSubmit={clientForm.handleSubmit(onSubmit)} className="space-y-3 py-3 max-h-[70vh] overflow-y-auto px-2">
      <FormField control={clientForm.control} name="name" render={({ field }) => (<FormItem><FormLabel>Client Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
      <FormField control={clientForm.control} name="type" render={({ field }) => (<FormItem><FormLabel>Client Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="Bank">Bank</SelectItem><SelectItem value="NBFC">NBFC</SelectItem><SelectItem value="Corporate">Corporate</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
      <FormField control={clientForm.control} name="totalBranches" render={({ field }) => (<FormItem><FormLabel>Total Branches</FormLabel><FormControl><Input type="number" {...field} onChange={e=>field.onChange(Number(e.target.value))} /></FormControl><FormMessage /></FormItem>)} />
      <FormField control={clientForm.control} name="contactPerson" render={({ field }) => (<FormItem><FormLabel>Contact Person</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
      <FormField control={clientForm.control} name="contactPhone" render={({ field }) => (<FormItem><FormLabel>Contact Phone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
      <FormField control={clientForm.control} name="contactEmail" render={({ field }) => (<FormItem><FormLabel>Contact Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>)} />
      <FormField control={clientForm.control} name="contractStatus" render={({ field }) => (<FormItem><FormLabel>Contract Status</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="Active">Active</SelectItem><SelectItem value="Inactive">Inactive</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
      <FormField control={clientForm.control} name="lastServiceDate" render={({ field }) => (<FormItem><FormLabel>Last Service Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
      <FormField control={clientForm.control} name="gstn" render={({ field }) => (<FormItem><FormLabel>GSTN</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
      <DialogFooter className="pt-4"><DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose><Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create</Button></DialogFooter>
  </form></Form></DialogContent></Dialog>);
};

export default EditQuotationPage;
