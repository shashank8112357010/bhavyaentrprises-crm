"use client";

// Page for Editing Existing Quotation
import React, { useEffect, useState, useMemo, useCallback } from "react"; // Added useCallback
import { useRouter } from "next/navigation"; 
// Removed Tanstack Query imports
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Printer, Mail, Trash2, UserPlus } from "lucide-react"; // Added UserPlus
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"; // For CreateClientDialog
import { Label } from "@/components/ui/label"; // For CreateClientDialog form

// Service and schema for client creation
import { createClient } from "@/lib/services/client"; // Assuming path
import { createClientSchema } from "@/lib/validations/clientSchema"; // Assuming path
import { z } from "zod"; // For form validation and type inference

// Placeholder types (same as new/page.tsx)
interface Client {
  id: string;
  name: string;
  email?: string;
}

interface InsertQuotationItem {
  id?: string; // id will be present for existing items
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  rateCardItemId: string | null;
}

interface InsertQuotation { // This is for "inserting", for updates, it might be Partial<Quotation> or a specific UpdateQuotationDTO
  serialNo: number;
  quoteNo: string;
  clientId: string;
  date: Date;
  expiryDate?: Date;
  items: InsertQuotationItem[];
  status: string;
  subTotal: number;
  taxAmount: number;
  grandTotal: number;
  currency: string;
  notes?: string;
}

interface QuotationWithDetails extends InsertQuotation {
  id: string;
  client?: Client;
  // Potentially other fields like createdAt, updatedAt etc.
}

// Import paths (same as new/page.tsx)
import { generatePDF } from "@/lib/pdf/quotation";
// import { apiRequest, queryClient } from "@/lib/axios"; // queryClient removed
import { axiosInstance } from "@/lib/axios"; // Assuming axiosInstance is exported

// Define type for client creation form data (same as new page)
type CreateClientFormData = z.infer<typeof createClientSchema>;

// Service functions (conceptual, replace with actual imports if they exist in lib/services)
const getQuotationByIdService = async (id: string) => {
  return axiosInstance.get(`/api/quotations/${id}`);
};

const updateQuotationService = async (id: string, data: Partial<QuotationWithDetails>) => { // Use QuotationWithDetails or a specific UpdateDTO
  return axiosInstance.put(`/api/quotations/${id}`, data);
};

const deleteQuotationService = async (id: string) => {
  return axiosInstance.delete(`/api/quotations/${id}`);
};
// End of service functions

// Placeholder components (same as new/page.tsx)
// Modified ClientSearch to include a "Create New Client" button trigger
const ClientSearch = ({
  selectedClient,
  onSelectClient,
  onCreateNewClient,
}: {
  selectedClient: Client | null;
  onSelectClient: (client: Client) => void;
  onCreateNewClient: () => void;
}) => (
  <div className="flex flex-col space-y-2">
    <div className="flex space-x-2 items-center">
      <div className="flex-grow">Client Search Placeholder (To be replaced with actual search component)</div>
      <Button onClick={() => onSelectClient({ id: "dummy-client-1", name: "Dummy Client Inc.", email: "dummy@example.com" })}>Select Dummy</Button>
      <Button variant="outline" onClick={onCreateNewClient}>
        <UserPlus className="mr-2 h-4 w-4" /> Create New Client
      </Button>
    </div>
    {selectedClient && (
      <div className="p-2 border rounded-md bg-gray-50">
        <p className="font-medium">Selected Client:</p>
        <p><strong>Name:</strong> {selectedClient.name}</p>
        {selectedClient.email && <p><strong>Email:</strong> {selectedClient.email}</p>}
      </div>
    )}
  </div>
);

const QuotationTable = ({ items, setItems, currency } : {items: InsertQuotationItem[], setItems: (items: InsertQuotationItem[]) => void, currency: string}) => <div>Rate Card Items Placeholder</div>; // Changed "Quotation Table" to "Rate Card Items"
const Calculations = ({ subTotal, tax, total, currency } : {subTotal: number, tax: number, total: number, currency: string}) => <div>Calculations Placeholder: {currency} {total}</div>;
// AUBankImport is not included.

// CreateClientDialog Component (copied from new/page.tsx and adapted if needed)
interface CreateClientDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onClientCreated: (client: Client) => void;
}

const CreateClientDialog: React.FC<CreateClientDialogProps> = ({ isOpen, onOpenChange, onClientCreated }) => {
  const { toast } = useToast();
  // const reactQueryClient = useReactQueryClient(); // Removed
  const [isLoading, setIsLoading] = useState(false); // Manual loading state
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof CreateClientFormData, string>>>({});
  const [formData, setFormData] = useState<Partial<CreateClientFormData>>({
    type: "Bank", contractStatus: "Active", lastServiceDate: new Date().toISOString().split('T')[0]
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseInt(value, 10) : value }));
    setFormErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const handleSelectChange = (name: keyof CreateClientFormData, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    setFormErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    setIsLoading(true);
    try {
      const validatedData = createClientSchema.parse(formData);
      const newClient = await createClient(validatedData); // Assumes createClient uses axiosInstance
      toast({ title: "Success", description: "New client created successfully." });
      onClientCreated(newClient as Client);
      onOpenChange(false);
      setFormData({ type: "Bank", contractStatus: "Active", lastServiceDate: new Date().toISOString().split('T')[0] });
      setFormErrors({});
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const fieldErrorsZod: Partial<Record<keyof CreateClientFormData, string>> = {};
        error.errors.forEach(err => {
          if (err.path[0]) fieldErrorsZod[err.path[0] as keyof CreateClientFormData] = err.message;
        });
        setFormErrors(fieldErrorsZod);
        toast({ title: "Validation Error", description: "Please check the form fields.", variant: "destructive"});
      } else {
        toast({ title: "Submission Error", description: error.message || "Failed to create client.", variant: "destructive"});
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Client</DialogTitle>
          <DialogDescription>Fill in the details below to add a new client.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Form fields (name, type, totalBranches, contactPerson, contactPhone, contactEmail, contractStatus, lastServiceDate, gstn, avatar, initials) */}
          {/* Name */}
          <div>
            <Label htmlFor="name_edit">Client Name</Label> 
            <Input id="name_edit" name="name" value={formData.name || ""} onChange={handleInputChange} />
            {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
          </div>
          {/* Type */}
          <div>
            <Label htmlFor="type_edit">Client Type</Label>
            <Select name="type" value={formData.type || "Bank"} onValueChange={(value) => handleSelectChange("type", value)}>
              <SelectTrigger id="type_edit"><SelectValue placeholder="Select client type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Bank">Bank</SelectItem><SelectItem value="NBFC">NBFC</SelectItem>
                <SelectItem value="Insurance">Insurance</SelectItem><SelectItem value="Corporate">Corporate</SelectItem>
              </SelectContent>
            </Select>
            {formErrors.type && <p className="text-red-500 text-xs mt-1">{formErrors.type}</p>}
          </div>
           {/* totalBranches */}
          <div>
            <Label htmlFor="totalBranches_edit">Total Branches</Label>
            <Input id="totalBranches_edit" name="totalBranches" type="number" value={formData.totalBranches || ""} onChange={handleInputChange} />
            {formErrors.totalBranches && <p className="text-red-500 text-xs mt-1">{formErrors.totalBranches}</p>}
          </div>
          {/* contactPerson */}
          <div>
            <Label htmlFor="contactPerson_edit">Contact Person</Label>
            <Input id="contactPerson_edit" name="contactPerson" value={formData.contactPerson || ""} onChange={handleInputChange} />
            {formErrors.contactPerson && <p className="text-red-500 text-xs mt-1">{formErrors.contactPerson}</p>}
          </div>
          {/* contactPhone */}
          <div>
            <Label htmlFor="contactPhone_edit">Contact Phone</Label>
            <Input id="contactPhone_edit" name="contactPhone" value={formData.contactPhone || ""} onChange={handleInputChange} />
            {formErrors.contactPhone && <p className="text-red-500 text-xs mt-1">{formErrors.contactPhone}</p>}
          </div>
          {/* contactEmail */}
          <div>
            <Label htmlFor="contactEmail_edit">Contact Email (Optional)</Label>
            <Input id="contactEmail_edit" name="contactEmail" type="email" value={formData.contactEmail || ""} onChange={handleInputChange} />
            {formErrors.contactEmail && <p className="text-red-500 text-xs mt-1">{formErrors.contactEmail}</p>}
          </div>
          {/* contractStatus */}
          <div>
            <Label htmlFor="contractStatus_edit">Contract Status</Label>
            <Select name="contractStatus" value={formData.contractStatus || "Active"} onValueChange={(value) => handleSelectChange("contractStatus", value)}>
              <SelectTrigger id="contractStatus_edit"><SelectValue placeholder="Select status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem><SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            {formErrors.contractStatus && <p className="text-red-500 text-xs mt-1">{formErrors.contractStatus}</p>}
          </div>
          {/* lastServiceDate */}
          <div>
            <Label htmlFor="lastServiceDate_edit">Last Service Date</Label>
            <Input id="lastServiceDate_edit" name="lastServiceDate" type="date" value={formData.lastServiceDate || ""} onChange={handleInputChange} />
            {formErrors.lastServiceDate && <p className="text-red-500 text-xs mt-1">{formErrors.lastServiceDate}</p>}
          </div>
          {/* gstn */}
          <div>
            <Label htmlFor="gstn_edit">GSTN (Optional)</Label>
            <Input id="gstn_edit" name="gstn" value={formData.gstn || ""} onChange={handleInputChange} />
            {formErrors.gstn && <p className="text-red-500 text-xs mt-1">{formErrors.gstn}</p>}
          </div>
          {/* avatar */}
          <div>
            <Label htmlFor="avatar_edit">Avatar URL (Optional)</Label>
            <Input id="avatar_edit" name="avatar" value={formData.avatar || ""} onChange={handleInputChange} />
            {formErrors.avatar && <p className="text-red-500 text-xs mt-1">{formErrors.avatar}</p>}
          </div>
          {/* initials */}
          <div>
            <Label htmlFor="initials_edit">Initials (Optional)</Label>
            <Input id="initials_edit" name="initials" value={formData.initials || ""} onChange={handleInputChange} />
            {formErrors.initials && <p className="text-red-500 text-xs mt-1">{formErrors.initials}</p>}
          </div>
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Create Client
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Define props for the page component to accept params.id
interface EditQuotationPageProps {
  params: {
    id: string;
  };
}

const EditQuotationPage: React.FC<EditQuotationPageProps> = ({ params }) => {
  const { id: quotationId } = params; 
  const router = useRouter();
  const { toast } = useToast();
  // const reactQueryClient = useReactQueryClient(); // Removed

  // Form states
  const [quotationName, setQuotationName] = useState(""); 
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isCreateClientDialogOpen, setIsCreateClientDialogOpen] = useState(false);
  const [quotationDate, setQuotationDate] = useState<string>(""); 
  const [expiryDate, setExpiryDate] = useState<string>("");
  
  // State for QuotationTable items (Phase 2.1)
  interface QuotationLineItem { // Same as new/page.tsx
    id: string; 
    rateCardId: string; 
    description: string; 
    unit: string;        
    rate: number;        
    quantity: number;
    gstRate: number;     
    total: number;       
  }
  const [quotationLineItems, setQuotationLineItems] = useState<QuotationLineItem[]>([]);
  // States for Rate Card Search Dialog (will be needed for QuotationTable)
  const [isRateCardSearchOpen, setIsRateCardSearchOpen] = useState(false);
  const [rateCardSearchQuery, setRateCardSearchQuery] = useState("");
  const [rateCardSearchResults, setRateCardSearchResults] = useState<MockRateCard[]>([]); // MockRateCard type will be defined later
  const [isLoadingRateCards, setIsLoadingRateCards] = useState(false);


  const [status, setStatus] = useState<string>("DRAFT");
  const [notes, setNotes] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [quoteNo, setQuoteNo] = useState("");
  const [serialNo, setSerialNo] = useState(0);
  
  // Loading and error states
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [errorLoadingData, setErrorLoadingData] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [errorUpdating, setErrorUpdating] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  // Removed errorDeleting as toast is used directly

  // Effect to load existing quotation data
  useEffect(() => {
    if (!quotationId) {
      setIsLoadingData(false);
      setErrorLoadingData("No quotation ID provided.");
      toast({ title: "Error", description: "No quotation ID provided.", variant: "destructive" });
      router.push("/dashboard/quotations"); // Redirect if no ID
      return;
    }

    const fetchQuotation = async () => {
      setIsLoadingData(true);
      try {
        const response = await getQuotationByIdService(quotationId);
        const data: QuotationWithDetails = response.data; // Assuming response.data is QuotationWithDetails
        
        setQuotationName(data.name || `Quotation ${data.quoteNo}`); 
        setSelectedClient(data.client || null);
        setQuotationDate(data.date ? new Date(data.date).toISOString().split('T')[0] : "");
        setExpiryDate(data.expiryDate ? new Date(data.expiryDate).toISOString().split('T')[0] : "");
        
        // Transform fetched rateCardDetails (or items) into QuotationLineItem[]
        // Assuming data.rateCardDetails is an array like: { rateCardId, quantity, gstType, rateCard: {description, unit, rate} }
        // Or data.items is an array with similar structure.
        // This needs to match the actual structure of `QuotationWithDetails` from the API.
        // For now, I'll assume `data.items` is the source and contains necessary fields or nested objects.
        const fetchedItems = data.items || (data as any).rateCardDetails || []; // Adapt based on actual API response
        const transformedLineItems: QuotationLineItem[] = fetchedItems.map((item: any) => {
          const rate = item.rate || item.unitPrice || item.rateCard?.rate || 0;
          const quantity = item.quantity || 0;
          const gstRate = item.gstType || item.gstRate || 18; // Default if not present
          return {
            id: item.id || crypto.randomUUID(), // Use existing item ID or generate new for client-side key
            rateCardId: item.rateCardId || item.rateCard?.id || "",
            description: item.description || item.rateCard?.description || "N/A",
            unit: item.unit || item.rateCard?.unit || "N/A",
            rate: rate,
            quantity: quantity,
            gstRate: gstRate,
            total: rate * quantity * (1 + gstRate / 100),
          };
        });
        setQuotationLineItems(transformedLineItems);
        
        setStatus(data.status);
        setNotes(data.notes || "");
        setCurrency(data.currency);
        setQuoteNo(data.quoteNo);
        setSerialNo(data.serialNo);
        setErrorLoadingData(null);
      } catch (err: any) {
        setErrorLoadingData(err.message || "Failed to fetch quotation data.");
        toast({ title: "Error", description: err.message || "Failed to fetch quotation data.", variant: "destructive" });
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchQuotation();
  }, [quotationId, router, toast]);

  // Calculations based on quotationLineItems (same as new/page.tsx)
  const subTotal = useMemo(() => 
    quotationLineItems.reduce((acc, item) => acc + (item.rate * item.quantity), 0), 
  [quotationLineItems]); 

  const totalGstAmount = useMemo(() => 
    quotationLineItems.reduce((acc, item) => acc + (item.rate * item.quantity * (item.gstRate / 100)), 0),
  [quotationLineItems]);

  const grandTotal = useMemo(() => subTotal + totalGstAmount, [subTotal, totalGstAmount]);

  // Mock RateCard type and search function (from new/page.tsx) - will be needed for QuotationTable
  interface MockRateCard { id: string; description: string; unit: string; rate: number; }
  const mockRateCards: MockRateCard[] = [ // This would be fetched from a service
      { id: "rc1", description: "Standard Service A", unit: "Hour", rate: 100 },
      { id: "rc2", description: "Premium Consult B", unit: "Session", rate: 250 },
      { id: "rc3", description: "Material Pack C", unit: "Pack", rate: 50 },
  ];

  const searchRateCardsService = useCallback(async (query: string): Promise<MockRateCard[]> => {
    setIsLoadingRateCards(true);
    return new Promise(resolve => setTimeout(() => {
      const results = mockRateCards.filter(rc => rc.description.toLowerCase().includes(query.toLowerCase()));
      setRateCardSearchResults(results);
      setIsLoadingRateCards(false);
      resolve(results);
    }, 300));
  }, []); 
  
  const handleSearchRateCards = useCallback(async () => {
    if (!rateCardSearchQuery.trim()) {
      setRateCardSearchResults(mockRateCards); 
      return;
    }
    await searchRateCardsService(rateCardSearchQuery);
  }, [rateCardSearchQuery, searchRateCardsService]);

  const addLineItemFromRateCard = useCallback((rateCard: MockRateCard) => {
    setQuotationLineItems(prevItems => [
      ...prevItems,
      {
        id: crypto.randomUUID(),
        rateCardId: rateCard.id,
        description: rateCard.description,
        unit: rateCard.unit,
        rate: rateCard.rate,
        quantity: 1,
        gstRate: 18, 
        total: rateCard.rate * (1 + 18 / 100), 
      },
    ]);
    setIsRateCardSearchOpen(false);
    setRateCardSearchQuery("");
    setRateCardSearchResults([]);
  }, []); 

  const updateLineItem = useCallback((index: number, field: keyof QuotationLineItem, value: string | number) => {
    setQuotationLineItems(prevItems => {
      const updatedItems = [...prevItems];
      const itemToUpdate = { ...updatedItems[index] };
      
      if (field === 'quantity' || field === 'rate' || field === 'gstRate') {
        (itemToUpdate[field] as number) = Number(value) || 0;
      } else {
        // (itemToUpdate[field] as string) = String(value); // If other string fields were editable
      }
      itemToUpdate.total = itemToUpdate.rate * itemToUpdate.quantity * (1 + itemToUpdate.gstRate / 100);
      updatedItems[index] = itemToUpdate;
      return updatedItems;
    });
  }, []);

  const removeLineItem = useCallback((index: number) => {
    setQuotationLineItems(prevItems => prevItems.filter((_, i) => i !== index));
  }, []);

  const handleSubmit = async () => {
    if (!selectedClient) {
      toast({ title: "Validation Error", description: "Please select a client.", variant: "destructive" });
      return;
    }
    if (!quotationName.trim()) {
        toast({ title: "Validation Error", description: "Quotation Name/Title is required.", variant: "destructive"});
        return;
    }

    const quotationDataToUpdate: Partial<QuotationWithDetails> = { // Or a specific UpdateDTO
      name: quotationName,
      clientId: selectedClient.id,
      date: quotationDate ? new Date(quotationDate) : undefined, 
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
      rateCardDetails: quotationLineItems.map(item => ({ // Format for backend
        rateCardId: item.rateCardId,
        quantity: item.quantity,
        gstType: item.gstRate,
      })),
      // items: [], // Deprecated if using rateCardDetails
      status,
      subTotal, 
      gst: totalGstAmount, // Use the correct calculated GST total
      grandTotal, 
      currency,
      notes,
      // serialNo and quoteNo are typically not part of an update payload from client
      // quoteNo and serialNo are generally not updated or handled by backend
    };

    setIsUpdating(true);
    setErrorUpdating(null);
    try {
      const response = await updateQuotationService(quotationId, quotationDataToUpdate);
      toast({ title: "Success", description: `Quotation ${response.data.quoteNo} updated.` });
      // No direct query invalidation, data will be refetched if user navigates or via page refresh
      router.push("/dashboard/quotations"); // Optionally navigate away or refresh data
    } catch (error: any) {
      setErrorUpdating(error.response?.data?.message || error.message || "Failed to update quotation.");
      toast({ title: "Error updating quotation", description: error.response?.data?.message || error.message, variant: "destructive" });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!quotationId) {
        toast({ title: "Error", description: "No quotation ID found to delete.", variant: "destructive" });
        return;
    }
    // TODO: Implement a confirmation dialog before deleting
    setIsDeleting(true);
    try {
        await deleteQuotationService(quotationId);
        toast({ title: "Success", description: "Quotation deleted." });
        router.push("/dashboard/quotations"); 
    } catch (error: any) {
        toast({ title: "Error deleting quotation", description: error.message || "Failed to delete quotation.", variant: "destructive" });
    } finally {
        setIsDeleting(false);
    }
  };

  if (isLoadingData) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /> Loading quotation data...</div>;
  }

  if (errorLoadingData) {
      return <div className="text-red-500 p-4">Error loading quotation: {errorLoadingData}</div>;
  }

  // If no existingQuotation data after loading (and no error string), it implies not found.
  // This check might need refinement based on how getQuotationByIdService resolves if not found.
  // For now, errorLoadingData string check is the primary error display.


  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Edit Quotation {quoteNo || ''}</h1>
        <div>
            <Button variant="outline" onClick={() => router.push("/dashboard/quotations")} className="mr-2">Cancel</Button>
            <Button onClick={handleSubmit} disabled={saveQuotationMutation.isLoading} className="mr-2">
                {saveQuotationMutation.isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Update Quotation
            </Button>
            <Button variant="destructive" onClick={handleDelete}><Trash2 className="mr-2 h-4 w-4" /> Delete</Button>
        </div>
      </div>

      <Card className="mb-4">
        <CardHeader><CardTitle>Client</CardTitle></CardHeader>
        <CardContent>
          <ClientSearch selectedClient={selectedClient} onSelectClient={setSelectedClient} />
        </CardContent>
      </Card>

      {/* Form sections: Details, Items, Calculations */}
      {/* These would be similar to NewQuotationPage, ensure they are correctly wired */}
      <Card className="mb-4">
        <CardHeader><CardTitle>Details</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-4">
            <div><label>Quotation Date</label><Input type="date" value={quotationDate ? quotationDate.toISOString().split('T')[0] : ''} onChange={e => setQuotationDate(new Date(e.target.value))} /></div>
            <div><label>Expiry Date</label><Input type="date" value={expiryDate ? expiryDate.toISOString().split('T')[0] : ''} onChange={e => setExpiryDate(new Date(e.target.value))} /></div>
            <div><label>Status</label>
                <Select value={status} onValueChange={(value: string) => setStatus(value)}>
                    <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="DRAFT">Draft</SelectItem>
                        <SelectItem value="SENT">Sent</SelectItem>
                        <SelectItem value="ACCEPTED">Accepted</SelectItem>
                        <SelectItem value="REJECTED">Rejected</SelectItem>
                        <SelectItem value="ARCHIVED">Archived</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div><label>Currency</label><Input value={currency} onChange={e => setCurrency(e.target.value.toUpperCase())} /></div>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader><CardTitle>Rate Card Items</CardTitle></CardHeader>{/* Changed "Items" to "Rate Card Items" */}
        <CardContent>
          <QuotationTable items={items} setItems={setItems} currency={currency} />
        </CardContent>
      </Card>
      <Calculations subTotal={subTotal} tax={taxAmount} total={grandTotal} currency={currency} />

      <div className="mt-4">
          <Card>
            <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
            <CardContent>
                <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Internal notes or notes for client..." />
            </CardContent>
          </Card>
      </div>

      <div className="mt-6 flex justify-end gap-2">
        {/* Action buttons moved to top */}
        <Button variant="outline" onClick={() => {
            if (!existingQuotation) {
                 toast({title: "Error", description: "Quotation data not loaded for PDF."}); return;
            }
            generatePDF(existingQuotation);
        }}> <Printer className="mr-2 h-4 w-4" /> Generate PDF</Button>
        {/* Add Send Mail functionality if needed */}
      </div>
    </div>
  );
};

export default EditQuotationPage;
