import { useState, useEffect, useMemo } from "react"; // Added useMemo
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// import { Badge } from "@/components/ui/badge"; // Not used in the provided code
import { Separator } from "@/components/ui/separator";
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"; // Not used directly, assuming part of a larger UI system if needed
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { FileText, Search, Plus, Trash2, Download, Send, Save, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import axiosInstance from "@/lib/axios"; // Correct import for axiosInstance (this is the new apiRequest)
// import { queryClient } from "@/lib/queryClient"; // Will be removed

// START Placeholder types (due to @shared/schema unavailability)
interface Client {
  id: number; // Assuming number from original quotationFormSchema. Adjust if API sends string.
  name: string;
  code?: string;
  email?: string;
}

interface RateCard {
  id: string | number; // Example: 'uuid-string-123' or 123
  srNo?: number; // Example: 1
  description: string; // Example: "Brick wall, 4 1/2" thk"
  unit: string; // Example: "sft"
  rate: string; // Example: "99" or "137.5" (string from API, parse to float for calculations)
  bankName: string; 
  bankRcNo?: string; 
  uploadedAt?: Date | string; 
  make?: string;
  whereInUse?: string;
  isActive?: boolean; 
  // rcSno is used in forms/schemas internally and mapped to bankRcNo for RateCard interface
}

const insertRateCardSchema = z.object({
  description: z.string().min(1, "Description is required"),
  rcSno: z.string().optional(), // This will be mapped to bankRcNo in the RateCard object
  make: z.string().optional(),
  whereInUse: z.string().optional(),
  unit: z.string().min(1, "Unit is required"),
  rate: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, { message: "Rate must be a non-negative number"}),
  bankName: z.string().default("Bhavya Enterprises"),
  isActive: z.boolean().default(true),
});

interface QuotationItem {
  id?: number; // Or string if using UUIDs for items not yet saved
  sno: number;
  rateCard: RateCard;
  quantity: number;
  totalValue: number;
  isEditable?: boolean;
}
// END Placeholder types

const quotationFormSchema = z.object({
  clientId: z.number().optional(), // Assuming client ID is a number
  serialNumber: z.string().optional(),
  salesType: z.string().default("Interstate"),
  quotationNumber: z.string().min(1, "Quote number is required"),
  date: z.string().optional(), // Added date field for RHF
  validUntil: z.string().optional(), 
  admin: z.string().optional(),
  quoteBy: z.string().optional(),
  discount: z.string().default("0").refine(val => {
    const num = parseFloat(val);
    return !isNaN(num) && num >= 0 && num <= 100;
  }, { message: "Discount must be a number between 0 and 100" }),
});

// Component name should match file name convention, e.g., NewQuotationPage
export default function NewQuotationPage() { 
  const { toast } = useToast();
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientSearch, setClientSearch] = useState("");
  
  // State for client search results, loading, and error (NEW)
  const [clients, setClients] = useState<Client[]>([]);
  const [clientSearchLoading, setClientSearchLoading] = useState<boolean>(false);
  const [clientSearchError, setClientSearchError] = useState<string | null>(null);

  const [rateCardSearch, setRateCardSearch] = useState("");
  // State for rate card search results, loading, and error (NEW)
  const [rateCards, setRateCards] = useState<RateCard[]>([]);
  const [rateCardSearchLoading, setRateCardSearchLoading] = useState<boolean>(false);
  const [rateCardSearchError, setRateCardSearchError] = useState<string | null>(null);

  const [quotationItems, setQuotationItems] = useState<QuotationItem[]>([]);
  const [showClientSearch, setShowClientSearch] = useState(false);
  const [showRateCardSearch, setShowRateCardSearch] = useState(false);
  const [isSavingQuotation, setIsSavingQuotation] = useState<boolean>(false);
  const [isCreatingRateCard, setIsCreatingRateCard] = useState<boolean>(false);

  const form = useForm<z.infer<typeof quotationFormSchema>>({ // Typed useForm
    resolver: zodResolver(quotationFormSchema),
    defaultValues: {
      salesType: "Interstate",
      quotationNumber: `Q${Date.now()}`,
      discount: "0",
      serialNumber: "",
      validUntil: "",
      admin: "",
      quoteBy: "",
      date: new Date().toISOString().split('T')[0], // Default date
    },
  });

  const rateCardForm = useForm<z.infer<typeof insertRateCardSchema>>({ // Typed useForm
    resolver: zodResolver(insertRateCardSchema),
    defaultValues: {
      description: "", // Standardized
      rcSno: "",
      make: "",
      whereInUse: "",
      unit: "Unit", 
      rate: "0", // Standardized
      bankName: "Bhavya Enterprises",
      isActive: true,
    },
  });

  // Client search: useEffect to fetch clients when search text changes (NEW)
  useEffect(() => {
    if (showClientSearch && clientSearch.trim().length > 0) {
      setClientSearchLoading(true);
      setClientSearchError(null);
      
      const fetchClients = async () => {
        try {
          const response = await axiosInstance.get<Client[]>(`/api/clients/search?q=${encodeURIComponent(clientSearch)}`);
          setClients(response.data || []); 
        } catch (error: any) {
          console.error("Failed to fetch clients:", error);
          setClientSearchError(error.message || "Failed to fetch clients.");
          setClients([]); 
        } finally {
          setClientSearchLoading(false);
        }
      };

      const timerId = setTimeout(fetchClients, 300);
      return () => clearTimeout(timerId);
    } else {
      setClients([]); 
      setClientSearchLoading(false); 
    }
  }, [clientSearch, showClientSearch]);

  // Rate Card Search: useEffect to fetch rate cards when search text changes (NEW)
  useEffect(() => {
    if (showRateCardSearch && rateCardSearch.trim().length > 0) {
      setRateCardSearchLoading(true);
      setRateCardSearchError(null);

      const fetchRateCards = async () => {
        try {
          const response = await axiosInstance.get<RateCard[]>(`/api/rate-cards/search?q=${encodeURIComponent(rateCardSearch)}`);
          setRateCards(response.data || []);
        } catch (error: any) {
          console.error("Failed to fetch rate cards:", error);
          setRateCardSearchError(error.message || "Failed to fetch rate cards.");
          setRateCards([]);
        } finally {
          setRateCardSearchLoading(false);
        }
      };

      const timerId = setTimeout(fetchRateCards, 300);
      return () => clearTimeout(timerId);
    } else {
      setRateCards([]);
      setRateCardSearchLoading(false);
    }
  }, [rateCardSearch, showRateCardSearch]);

  // All Rate Cards (will be addressed in a future step)
  // const { data: allRateCards = [] } = useQuery<RateCard[]>({ 
  //   queryKey: ["/api/rate-cards"],
  //   queryFn: async () => {
  //     const response = await axiosInstance.get("/api/rate-cards");
  //     return response.data; 
  //   },
  // });

  const handleSaveNewRateCard = async (rateCardData: z.infer<typeof insertRateCardSchema>, itemTemporaryId: string | number) => {
    setIsCreatingRateCard(true);
    try {
      // Map rcSno from form to bankRcNo for the API payload if necessary,
      // or expect the API to handle rcSno. Assuming API expects standardized fields.
      const payload = { 
        ...rateCardData, 
        bankRcNo: rateCardData.rcSno, // Mapping rcSno to bankRcNo
        bankName: rateCardData.bankName || "Bhavya Enterprises",
      };
      // Remove rcSno if it's not an API field after mapping
      // delete payload.rcSno; // Uncomment if API doesn't expect rcSno
      
      const newRateCardResponse = await axiosInstance.post<RateCard>("/api/rate-cards", payload);
      const newRateCard = newRateCardResponse.data;

      toast({
        title: "Success",
        description: "Rate card created successfully",
      });

      setQuotationItems(prevItems => prevItems.map(item => {
        if (item.rateCard.id === itemTemporaryId && item.isEditable) {
          return {
            ...item,
            rateCard: newRateCard,
            isEditable: false,
            totalValue: item.quantity * parseFloat(newRateCard.rate || "0"),
          };
        }
        return item;
      }));
      
      rateCardForm.reset();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || error.message || "Failed to create rate card",
        variant: "destructive",
      });
    } finally {
      setIsCreatingRateCard(false);
    }
  };

  const subtotal = useMemo(() => quotationItems.reduce((sum, item) => sum + item.totalValue, 0), [quotationItems]);
  const discountFormValue = form.watch("discount");
  const discount = useMemo(() => parseFloat(discountFormValue || "0"), [discountFormValue]);
  const discountAmount = useMemo(() => (subtotal * discount) / 100, [subtotal, discount]);
  const taxableValue = useMemo(() => subtotal - discountAmount, [subtotal, discountAmount]);
  const igstRate = 0.18; 
  const igst = useMemo(() => taxableValue * igstRate, [taxableValue]);
  const netGrossAmount = useMemo(() => taxableValue + igst, [taxableValue, igst]);

  const addRateCard = (rateCard: RateCard) => {
    const newItem: QuotationItem = {
      sno: quotationItems.length + 1,
      rateCard, 
      quantity: 1,
      totalValue: parseFloat(rateCard.rate || "0"), 
    };
    setQuotationItems([...quotationItems, newItem]);
    setRateCardSearch("");
    setShowRateCardSearch(false);
  };

  const removeRateCard = (index: number) => {
    const updated = quotationItems.filter((_, i) => i !== index);
    const reNumbered = updated.map((item, i) => ({ ...item, sno: i + 1 }));
    setQuotationItems(reNumbered);
  };

  const updateQuantity = (index: number, quantityStr: string) => {
    let quantity = parseInt(quantityStr);
    if (isNaN(quantity) || quantity < 1) quantity = 1;
    const updated = [...quotationItems];
    updated[index].quantity = quantity;
    updated[index].totalValue = quantity * parseFloat(updated[index].rateCard.rate || "0");
    setQuotationItems(updated);
  };
  
  const onSaveQuotation = async (status: "draft" | "sent" = "draft") => {
    const isValid = await form.trigger();
    if (!isValid) {
      toast({ title: "Validation Error", description: "Please check the quotation details.", variant: "destructive" });
      return;
    }
    if (!selectedClient) {
      toast({ title: "Client Missing", description: "Please select a client.", variant: "destructive" });
      return;
    }
    if (quotationItems.length === 0) {
      toast({ title: "Items Missing", description: "Please add at least one rate card.", variant: "destructive" });
      return;
    }

    const formDataValues = form.getValues();
    const quotationData = {
      ...formDataValues,
      clientId: selectedClient.id,
      // date is already in formDataValues from RHF
      // validUntil is already in formDataValues from RHF
      subtotal: subtotal, 
      discount: parseFloat(formDataValues.discount || "0"), 
      taxableValue: taxableValue, 
      igst: igst, 
      netGrossAmount: netGrossAmount, 
      status,
      items: quotationItems.map(item => ({
        rateCardId: item.rateCard.id,
        quantity: item.quantity,
        unitPrice: parseFloat(item.rateCard.rate || "0"), 
        description: item.rateCard.description, 
        unit: item.rateCard.unit,
        totalValue: item.totalValue,
      })),
    };
    setIsSavingQuotation(true);
    try {
      // const response = await axiosInstance.post("/api/quotations", quotationData); // Assuming quotationData is correctly prepared
      await axiosInstance.post("/api/quotations", quotationData); 
      // Success handling:
      toast({
        title: "Success",
        description: "Quotation saved successfully", // Or use response.data.message if available
      });
      form.reset(); 
      setQuotationItems([]); 
      setSelectedClient(null); 
      setClientSearch(""); 
      // Consider if navigation or further state reset is needed based on response.data
    } catch (error: any) {
      // Error handling:
      toast({
        title: "Error",
        description: error.response?.data?.message || error.message || "Failed to save quotation",
        variant: "destructive",
      });
    } finally {
      setIsSavingQuotation(false);
    }
  };

  const exportToPDF = () => {
    toast({
      title: "Export to PDF",
      description: "PDF export functionality will be implemented (placeholder)",
    });
  };
  
  const handleAddNewRateCardItem = () => {
    const newId = `new-${Date.now()}`; // Temporary unique ID
    const newRateCardPlaceholder: RateCard = {
      id: newId, 
      description: rateCardForm.getValues("description") || "", 
      unit: rateCardForm.getValues("unit") || "Unit", 
      rate: rateCardForm.getValues("rate") || "0", 
      bankName: rateCardForm.getValues("bankName") || "Bhavya Enterprises", 
      bankRcNo: rateCardForm.getValues("rcSno"), // map from form's rcSno
      make: rateCardForm.getValues("make"),
      whereInUse: rateCardForm.getValues("whereInUse"),
      isActive: rateCardForm.getValues("isActive"),
      // uploadedAt will be set by server
    };
    const newItem: QuotationItem = {
      sno: quotationItems.length + 1,
      rateCard: newRateCardPlaceholder,
      quantity: 1, 
      totalValue: 0, 
      isEditable: true, 
    };
    setQuotationItems(prevItems => [...prevItems, newItem]);
    // Optionally reset rateCardForm if it's for a dialog that closes
    // rateCardForm.reset(); 
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(() => onSaveQuotation("sent"))} className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg"><FileText className="h-6 w-6 text-blue-600" /></div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Bhavya Enterprises</h1>
                  <p className="text-sm text-gray-500">Smart Quotation System</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={exportToPDF} disabled={isSavingQuotation || isCreatingRateCard}>
                  <Download className="h-4 w-4 mr-2" />Export PDF
                </Button>
                <Button type="button" variant="default" size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => onSaveQuotation("draft")} disabled={isSavingQuotation || isCreatingRateCard}>
                  {isSavingQuotation ? "Saving..." : <><Save className="h-4 w-4 mr-2" /> Save Draft</>}
                </Button>
              </div>
            </div>
          </div>

          {/* Company Info Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <h2 className="text-xl font-bold text-gray-900 mb-2">Bhavya Enterprises Ok</h2>
                <p className="text-sm text-gray-600 mb-1">Regd Office: SCO 393 2nd Floor, Sector 37-D, Chandigarh 160036</p>
                <p className="text-sm text-gray-600 mb-1">B.O. : Plot No. 1025, Rani Sati Nagar, Nirman Nagar, Jaipur-302019</p>
                <p className="text-sm text-gray-600">Helpdesk No: +919988818489, +919815922428</p>
              </div>
            </CardContent>
          </Card>

          {/* Main Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="lg:col-span-1 space-y-6">
              {/* Client Information Card */}
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Search className="h-5 w-5" />Client Information</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="clientSearchInput">Client Search</Label>
                    <div className="relative">
                      <Input
                        id="clientSearchInput"
                        placeholder="Type client name or code..."
                        value={clientSearch}
                        onChange={(e) => { setClientSearch(e.target.value); setShowClientSearch(true); }}
                        onFocus={() => setShowClientSearch(true)}
                        onBlur={() => setTimeout(() => setShowClientSearch(false), 150)} // Delay to allow click on results
                      />
                      {showClientSearch && (
                        <div className="absolute z-20 w-full mt-1 bg-white border rounded-md shadow-lg max-h-48 overflow-y-auto">
                          {clientSearchLoading && <div className="p-2 text-center text-sm text-gray-500">Loading...</div>}
                          {clientSearchError && <div className="p-2 text-red-500 text-center text-sm">{clientSearchError}</div>}
                          {!clientSearchLoading && !clientSearchError && clients.length === 0 && clientSearch.trim().length > 0 && (
                            <div className="p-2 text-center text-sm text-gray-500">No clients found.</div>
                          )}
                          {!clientSearchLoading && !clientSearchError && clients.map((client) => (
                            <div
                              key={client.id}
                              className="p-2 hover:bg-gray-100 cursor-pointer"
                              onClick={() => {
                                setSelectedClient(client);
                                form.setValue("clientId", client.id); 
                                setClientSearch(client.name); 
                                setShowClientSearch(false);
                              }}
                            >
                              <div className="font-medium">{client.name}</div>
                              <div className="text-sm text-gray-500">{client.code}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  {selectedClient && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-blue-900">{selectedClient.name}</h4>
                      {selectedClient.code && <p className="text-sm text-blue-700">Code: {selectedClient.code}</p>}
                      {selectedClient.email && <p className="text-sm text-blue-600">Email: {selectedClient.email}</p>}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quotation Details Card */}
              <Card>
                <CardHeader><CardTitle>Quotation Details</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <FormField control={form.control} name="serialNumber" render={({ field }) => (
                    <FormItem><FormLabel>Serial Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )}/>
                  <FormField control={form.control} name="date" render={({ field }) => (
                     <FormItem><FormLabel>Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                  )}/>
                  <FormField control={form.control} name="salesType" render={({ field }) => (
                    <FormItem><FormLabel>Sales Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent><SelectItem value="Interstate">Interstate</SelectItem><SelectItem value="Intrastate">Intrastate</SelectItem></SelectContent>
                    </Select><FormMessage /></FormItem>
                  )}/>
                  <FormField control={form.control} name="quotationNumber" render={({ field }) => (
                    <FormItem><FormLabel>Quote Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )}/>
                  <FormField control={form.control} name="validUntil" render={({ field }) => (
                    <FormItem><FormLabel>Valid Until</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                  )}/>
                  <FormField control={form.control} name="admin" render={({ field }) => (
                    <FormItem><FormLabel>Admin</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )}/>
                  <FormField control={form.control} name="quoteBy" render={({ field }) => (
                    <FormItem><FormLabel>Quote By</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )}/>
                </CardContent>
              </Card>
            </div> {/* End Left Column */}

            {/* Right Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Rate Cards & Services Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2"><Package className="h-5 w-5 text-blue-600" />Rate Cards & Services</div>
                    <div className="flex gap-2">
                      <Button type="button" size="sm" variant="outline" className="text-blue-600 border-blue-600 hover:bg-blue-50" onClick={() => setShowRateCardSearch(prev => !prev)}>
                        <Search className="h-4 w-4 mr-2" /> {showRateCardSearch ? "Hide Search" : "Search Rate Cards"}
                      </Button>
                      <Button type="button" size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={handleAddNewRateCardItem}>
                        <Plus className="h-4 w-4 mr-2" /> Add New Item
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                {showRateCardSearch && (
                  <div className="px-6 pb-4"> 
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input placeholder="Type rate card name, code, or description..." value={rateCardSearch} onChange={(e) => setRateCardSearch(e.target.value)} className="pl-10 bg-white border-0 focus:ring-2 focus:ring-blue-500" />
                      </div>
                      {rateCardSearchLoading && <div className="mt-2 text-sm text-gray-500">Searching rate cards...</div>}
                      {rateCardSearchError && <div className="mt-2 text-sm text-red-500">{rateCardSearchError}</div>}
                      {!rateCardSearchLoading && !rateCardSearchError && rateCards.length > 0 && rateCardSearch.trim().length > 0 && (
                        <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
                          {rateCards.map((rc) => ( // rc here is a RateCard from API
                            <div key={rc.id} className="p-3 bg-white rounded border hover:bg-blue-50 cursor-pointer transition-colors" onClick={() => addRateCard(rc)}>
                              <div className="font-medium text-gray-900">{rc.description}</div>
                              <div className="text-sm text-gray-500">{rc.bankRcNo} • {rc.make} • ₹{rc.rate}</div>
                            </div>
                          ))}
                        </div>
                      )}
                      {!rateCardSearchLoading && !rateCardSearchError && rateCards.length === 0 && rateCardSearch.trim().length > 0 && (
                        <div className="mt-2 text-sm text-gray-500">No rate cards found for "{rateCardSearch}".</div>
                      )}
                    </div>
                  </div>
                )}
                <CardContent> 
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-gray-200">
                        <TableHead className="w-12">S.No</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="w-24">RC-SNO</TableHead>
                        <TableHead className="w-20">Unit</TableHead>
                        <TableHead className="w-20">Qty</TableHead>
                        <TableHead className="w-28">Unit Price</TableHead>
                        <TableHead className="w-32">Total Value</TableHead>
                        <TableHead className="w-16">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {quotationItems.length === 0 ? (
                        <TableRow><TableCell colSpan={8} className="text-center py-12">
                          <div className="flex flex-col items-center justify-center space-y-3">
                            <Package className="h-12 w-12 text-gray-300" />
                            <div className="text-gray-500 font-medium">No rate cards added yet.</div>
                            <div className="text-sm text-gray-400">Add items using "Search Rate Cards" or "Add New Item".</div>
                          </div>
                        </TableCell></TableRow>
                      ) : (
                        quotationItems.map((item, index) => (
                          <TableRow key={item.rateCard.id.toString()} className="border-b border-gray-100 hover:bg-gray-50">
                            <TableCell className="font-medium text-sm">{item.sno}</TableCell>
                            <TableCell className="text-sm">
                              {item.isEditable ? (
                                <Input value={item.rateCard.description} placeholder="Description" 
                                  onChange={e => {
                                    const updated = [...quotationItems];
                                    updated[index].rateCard.description = e.target.value;
                                    setQuotationItems(updated);
                                  }} 
                                  className="text-sm p-1 h-8"/>
                              ) : item.rateCard.description}
                            </TableCell>
                            <TableCell className="text-sm">
                              {item.isEditable ? (
                                <Input value={item.rateCard.bankRcNo || ""} placeholder="RC-SNO"
                                  onChange={e => {
                                    const updated = [...quotationItems];
                                    updated[index].rateCard.bankRcNo = e.target.value; 
                                    setQuotationItems(updated);
                                  }}
                                  className="text-sm p-1 h-8 w-full"/>
                              ) : item.rateCard.bankRcNo}
                            </TableCell>
                            <TableCell className="text-sm">
                              {item.isEditable ? (
                                <Input value={item.rateCard.unit} placeholder="Unit"
                                  onChange={e => {
                                    const updated = [...quotationItems];
                                    updated[index].rateCard.unit = e.target.value;
                                    setQuotationItems(updated);
                                  }}
                                  className="text-sm p-1 h-8 w-full"/>
                              ) : item.rateCard.unit}
                            </TableCell>
                            <TableCell className="text-sm">
                              <Input type="number" value={item.quantity.toString()} 
                                onChange={e => updateQuantity(index, e.target.value)}
                                className="w-16 h-8 text-center text-sm p-1"/>
                            </TableCell>
                            <TableCell className="text-sm">
                              {item.isEditable ? (
                                <Input type="number" value={item.rateCard.rate} placeholder="0.00" step="0.01"
                                  onChange={e => {
                                    const updated = [...quotationItems];
                                    const newRateVal = e.target.value;
                                    updated[index].rateCard.rate = newRateVal;
                                    updated[index].totalValue = updated[index].quantity * parseFloat(newRateVal || "0");
                                    setQuotationItems(updated);
                                  }}
                                  className="text-sm p-1 h-8 w-full text-right"/>
                              ) : `₹${parseFloat(item.rateCard.rate || "0").toFixed(2)}`}
                            </TableCell>
                            <TableCell className="text-sm text-right">₹{item.totalValue.toFixed(2)}</TableCell>
                            <TableCell>
                              {item.isEditable ? (
                                <Button 
                                  type="button" 
                                  size="sm" 
                                  variant="outline"
                                  className="h-8 text-xs px-2 py-1 bg-green-100 text-green-700 hover:bg-green-200"
                                  disabled={isCreatingRateCard}
                                  onClick={() => {
                                    const currentItem = quotationItems[index];
                                    const dataToSave = {
                                      description: currentItem.rateCard.description,
                                      rate: currentItem.rateCard.rate,
                                      unit: currentItem.rateCard.unit,
                                      rcSno: currentItem.rateCard.bankRcNo, // map bankRcNo back to rcSno for schema
                                      make: currentItem.rateCard.make,
                                      whereInUse: currentItem.rateCard.whereInUse,
                                      bankName: currentItem.rateCard.bankName || "Bhavya Enterprises",
                                      isActive: currentItem.rateCard.isActive !== undefined ? currentItem.rateCard.isActive : true,
                                    };
                                    const validationResult = insertRateCardSchema.safeParse(dataToSave);
                                    if (validationResult.success) {
                                      handleSaveNewRateCard(validationResult.data, currentItem.rateCard.id);
                                    } else {
                                      const errors = validationResult.error.flatten().fieldErrors;
                                      const errorMessages = Object.values(errors).map(errList => errList?.join(", ")).join("; ");
                                      toast({ title: "Validation Error", description: errorMessages || "Please check the item details.", variant: "destructive"});
                                    }
                                  }}
                                >
                                  {isCreatingRateCard ? "Saving..." : "Save"}
                                </Button>
                              ) : (
                                <Button type="button" size="icon" variant="ghost" onClick={() => removeRateCard(index)} className="h-8 w-8">
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Calculations & Summary Card */}
              <Card>
                <CardHeader><CardTitle>Calculations & Summary</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div> 
                      <h4 className="font-medium mb-3">Quotation Summary</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between"><span>Total Items:</span><span>{quotationItems.length}</span></div>
                        <div className="flex justify-between"><span>Total Quantity:</span><span>{quotationItems.reduce((sum, item) => sum + item.quantity, 0)}</span></div>
                        <div className="flex justify-between"><span>Subtotal:</span><span>₹{subtotal.toFixed(2)}</span></div>
                      </div>
                      <div className="mt-4">
                        <Label>Total Value (In Words)</Label>
                        <div className="text-sm text-gray-600 mt-1"> 
                          Rupees {netGrossAmount.toFixed(2)} Only {/* Placeholder */}
                        </div>
                      </div>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg"> 
                      <h4 className="font-medium mb-3">Tax Calculations</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between"><span>Subtotal:</span><span>₹{subtotal.toFixed(2)}</span></div>
                        <FormField control={form.control} name="discount" render={({ field }) => (
                          <FormItem className="flex justify-between items-center">
                            <FormLabel className="text-sm">Discount:</FormLabel>
                            <div className="flex items-center gap-1">
                              <FormControl>
                                <Input type="number" {...field} className="w-16 h-7 text-xs p-1 text-right" />
                              </FormControl>
                              <span className="text-xs">%</span>
                              <span className="text-red-600 w-20 text-right text-xs">-₹{discountAmount.toFixed(2)}</span>
                            </div>
                            <FormMessage className="text-xs w-full text-right" /> 
                          </FormItem>
                        )}/>
                        <div className="flex justify-between"><span>Taxable Value:</span><span>₹{taxableValue.toFixed(2)}</span></div>
                        <div className="flex justify-between"><span>IGST (18%):</span><span>₹{igst.toFixed(2)}</span></div>
                        <Separator className="my-2"/>
                        <div className="flex justify-between font-semibold text-blue-600 text-base">
                          <span>Net Gross Amount:</span><span>₹{netGrossAmount.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons at the bottom */}
              <div className="flex justify-end gap-4 pt-4">
                <Button type="button" variant="outline" onClick={() => onSaveQuotation("draft")} disabled={isSavingQuotation || isCreatingRateCard}>
                  <Save className="h-4 w-4 mr-2" /> Save Draft
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isSavingQuotation || isCreatingRateCard}>
                  <Send className="h-4 w-4 mr-2" /> {isSavingQuotation ? "Submitting..." : "Submit Quotation"}
                </Button>
              </div>
            </div> {/* End Right Column */}
          </div> {/* End Grid */}
        </div> {/* End Max Width Container */}
      </form>
    </Form> 
  );
}
