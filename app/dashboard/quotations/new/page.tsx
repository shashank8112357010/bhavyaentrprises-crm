"use client";

// Modified Code for NewQuotationPage
import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation"; 
// Removed Tanstack Query imports: useQuery, useMutation, useQueryClient as useReactQueryClient
import { Button } from "@/components/ui/button"; 
import { Input } from "@/components/ui/input"; 
import { Textarea } from "@/components/ui/textarea"; 
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Corrected path
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // Corrected path
// import { DatePicker } from "@/components/ui/date-picker"; // Assuming this exists, corrected path
import { useToast } from "@/hooks/use-toast"; // Corrected path
import { Loader2, Save, PlusCircle, MinusCircle, Printer, Mail, UserPlus } from "lucide-react"; // Added UserPlus, removed Trash2
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

// Placeholder types as @shared/schema is invalid and structure is unknown
interface Client {
  id: string;
  name: string;
  email?: string;
}

interface InsertQuotationItem { // This type is for the PDF generation data structure
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number; // Pre-GST rate
  total: number;     // Pre-GST total (quantity * unitPrice)
  rateCardItemId: string | null; 
}

// This type defines the data structure the frontend page manages and prepares for submission.
// It may contain more fields than the backend's creation schema accepts directly (e.g. calculated totals),
// but represents the full set of data collected on the client side.
interface InsertQuotation {
  name: string; 
  serialNo: number;
  quoteNo: string;
  clientId: string;
  date: Date;
  expiryDate?: Date;
  itemsForPdf: InsertQuotationItem[]; // For PDF data, distinct from backend rateCardDetails
  rateCardDetails: { rateCardId: string; quantity: number; gstType: number; }[]; // For backend submission
  status: string; 
  subTotal: number; // Calculated pre-GST total from quotationLineItems
  gst: number;      // Total GST amount from quotationLineItems
  grandTotal: number; // subTotal + gst
  currency: string;
  notes?: string;
  ticketId?: string; // Optional, as per backend schema
}

// QuotationWithDetails is used for PDF generation.
// It should align with the structure generatePDF expects.
interface QuotationWithDetails {
  id: string; 
  name: string;
  serialNo: number;
  quoteNo: string;
  client?: Client; // Full client object
  clientId: string; // Client ID
  date: Date;
  expiryDate?: Date;
  itemsForPdf: InsertQuotationItem[]; // Use itemsForPdf here
  status: string; 
  subTotal: number; 
  gst: number;      
  grandTotal: number; 
  currency: string;
  notes?: string;
  ticketId?: string;
}


// Corrected import paths
import { generatePDF } from "@/lib/pdf/quotation"; 
// Assuming apiRequest is a generic fetcher, or replace with direct axiosInstance calls
// import { apiRequest, queryClient } from "@/lib/axios"; // queryClient removed
import { axiosInstance } from "@/lib/axios"; // Assuming axiosInstance is exported

// Service functions (these would ideally be in separate files like lib/services/...)
// Mocking them here for demonstration if not modifying those files in this step
const getNextQuotationSerialNumberService = async () => {
  // In a real scenario, this would be: return axiosInstance.get("/api/quotations/next-serial");
  // For now, returning a promise that mimics an API call
  return new Promise<{ serialNo: number; quoteNo: string }>((resolve) =>
    setTimeout(() => resolve({ serialNo: Date.now() % 1000, quoteNo: `QN-${Date.now() % 1000}` }), 500)
  );
};

const createQuotationService = async (quotationData: InsertQuotation) => {
  return axiosInstance.post("/api/quotations", quotationData);
};
// End of mock service functions

// Define type for client creation form data
type CreateClientFormData = z.infer<typeof createClientSchema>;

// Placeholder components if actual ones are not found at these paths
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
// AUBankImport is removed as per instruction "no need for bank"


// CreateClientDialog Component (defined within the same file for simplicity)
interface CreateClientDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onClientCreated: (client: Client) => void; // Callback to update selected client
}

const CreateClientDialog: React.FC<CreateClientDialogProps> = ({ isOpen, onOpenChange, onClientCreated }) => {
  const { toast } = useToast();
  // const reactQueryClient = useReactQueryClient(); // Removed Tanstack Query client
  const [isLoading, setIsLoading] = useState(false); // Manual loading state
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof CreateClientFormData, string>>>({}); // Renamed 'errors' to 'formErrors' for clarity
  const [formData, setFormData] = useState<Partial<CreateClientFormData>>({
    type: "Bank", 
    contractStatus: "Active", 
    lastServiceDate: new Date().toISOString().split('T')[0] // Default to today
  });
  // const [errors, setErrors] = useState<Partial<Record<keyof CreateClientFormData, string>>>({}); // Replaced by formErrors

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value, 10) : value,
    }));
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
      // Directly call the service function
      const newClient = await createClient(validatedData); // createClient is assumed to use axiosInstance
      toast({ title: "Success", description: "New client created successfully." });
      // reactQueryClient.invalidateQueries(["clients"]); // Tanstack Query specific
      onClientCreated(newClient as Client); 
      onOpenChange(false); 
      setFormData({ type: "Bank", contractStatus: "Active", lastServiceDate: new Date().toISOString().split('T')[0] }); 
      setFormErrors({});
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const fieldErrorsZod: Partial<Record<keyof CreateClientFormData, string>> = {};
        error.errors.forEach(err => {
          if (err.path[0]) {
            fieldErrorsZod[err.path[0] as keyof CreateClientFormData] = err.message;
          }
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
          <div>
            <Label htmlFor="name">Client Name</Label>
            <Input id="name" name="name" value={formData.name || ""} onChange={handleInputChange} />
            {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
          </div>

          <div>
            <Label htmlFor="type">Client Type</Label>
            <Select name="type" value={formData.type || "Bank"} onValueChange={(value) => handleSelectChange("type", value)}>
              <SelectTrigger><SelectValue placeholder="Select client type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Bank">Bank</SelectItem>
                <SelectItem value="NBFC">NBFC</SelectItem>
                <SelectItem value="Insurance">Insurance</SelectItem>
                <SelectItem value="Corporate">Corporate</SelectItem>
              </SelectContent>
            </Select>
            {formErrors.type && <p className="text-red-500 text-xs mt-1">{formErrors.type}</p>}
          </div>

          <div>
            <Label htmlFor="totalBranches">Total Branches</Label>
            <Input id="totalBranches" name="totalBranches" type="number" value={formData.totalBranches || ""} onChange={handleInputChange} />
            {formErrors.totalBranches && <p className="text-red-500 text-xs mt-1">{formErrors.totalBranches}</p>}
          </div>

          <div>
            <Label htmlFor="contactPerson">Contact Person</Label>
            <Input id="contactPerson" name="contactPerson" value={formData.contactPerson || ""} onChange={handleInputChange} />
            {formErrors.contactPerson && <p className="text-red-500 text-xs mt-1">{formErrors.contactPerson}</p>}
          </div>

          <div>
            <Label htmlFor="contactPhone">Contact Phone</Label>
            <Input id="contactPhone" name="contactPhone" value={formData.contactPhone || ""} onChange={handleInputChange} />
            {formErrors.contactPhone && <p className="text-red-500 text-xs mt-1">{formErrors.contactPhone}</p>}
          </div>

          <div>
            <Label htmlFor="contactEmail">Contact Email (Optional)</Label>
            <Input id="contactEmail" name="contactEmail" type="email" value={formData.contactEmail || ""} onChange={handleInputChange} />
            {formErrors.contactEmail && <p className="text-red-500 text-xs mt-1">{formErrors.contactEmail}</p>}
          </div>

          <div>
            <Label htmlFor="contractStatus">Contract Status</Label>
            <Select name="contractStatus" value={formData.contractStatus || "Active"} onValueChange={(value) => handleSelectChange("contractStatus", value)}>
              <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            {formErrors.contractStatus && <p className="text-red-500 text-xs mt-1">{formErrors.contractStatus}</p>}
          </div>

          <div>
            <Label htmlFor="lastServiceDate">Last Service Date</Label>
            <Input id="lastServiceDate" name="lastServiceDate" type="date" value={formData.lastServiceDate || ""} onChange={handleInputChange} />
            {formErrors.lastServiceDate && <p className="text-red-500 text-xs mt-1">{formErrors.lastServiceDate}</p>}
          </div>

          <div>
            <Label htmlFor="gstn">GSTN (Optional)</Label>
            <Input id="gstn" name="gstn" value={formData.gstn || ""} onChange={handleInputChange} />
            {formErrors.gstn && <p className="text-red-500 text-xs mt-1">{formErrors.gstn}</p>}
          </div>

          <div>
            <Label htmlFor="avatar">Avatar URL (Optional)</Label>
            <Input id="avatar" name="avatar" value={formData.avatar || ""} onChange={handleInputChange} />
            {formErrors.avatar && <p className="text-red-500 text-xs mt-1">{formErrors.avatar}</p>}
          </div>

          <div>
            <Label htmlFor="initials">Initials (Optional)</Label>
            <Input id="initials" name="initials" value={formData.initials || ""} onChange={handleInputChange} />
            {formErrors.initials && <p className="text-red-500 text-xs mt-1">{formErrors.initials}</p>}
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Client
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};


const NewQuotationPage = () => {
  const router = useRouter();
  const { toast } = useToast();
  // const reactQueryClient = useReactQueryClient(); // Removed

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isCreateClientDialogOpen, setIsCreateClientDialogOpen] = useState(false); 
  
  // Form states
  const [quotationName, setQuotationName] = useState(""); // Added for quotation title/name
  const [quotationDate, setQuotationDate] = useState<string>(new Date().toISOString().split('T')[0]); // Store as string for date input
  const [expiryDate, setExpiryDate] = useState<string>(""); // Store as string
  
  // State for QuotationTable items - Phase 3
  interface QuotationLineItem {
    id: string; // Client-side unique ID for react key prop
    rateCardId: string; 
    description: string; 
    unit: string;        
    rate: number;        // Unit price from RateCard
    quantity: number;
    gstRate: number;     // GST Rate like 18 for 18%
    total: number;       // Calculated total for this line item: rate * quantity * (1 + gstRate/100)
  }
  const [quotationLineItems, setQuotationLineItems] = useState<QuotationLineItem[]>([]);
  const [isRateCardSearchOpen, setIsRateCardSearchOpen] = useState(false); 

  // States for Rate Card Search Dialog (Step 3.2)
  const [rateCardSearchQuery, setRateCardSearchQuery] = useState("");
  const [rateCardSearchResults, setRateCardSearchResults] = useState<MockRateCard[]>([]);
  const [isLoadingRateCards, setIsLoadingRateCards] = useState(false);

  const [status, setStatus] = useState<string>("DRAFT"); // Default status
  const [notes, setNotes] = useState("");
  const [currency, setCurrency] = useState("INR"); // Default currency INR
  const [quoteNo, setQuoteNo] = useState("");
  const [serialNo, setSerialNo] = useState(0);

  // Loading and error states for serial number
  const [isLoadingSerial, setIsLoadingSerial] = useState(true);
  const [errorSerial, setErrorSerial] = useState<string | null>(null);

  // Loading and error states for saving quotation
  const [isSavingQuotation, setIsSavingQuotation] = useState(false);
  const [errorSavingQuotation, setErrorSavingQuotation] = useState<string | null>(null);


  useEffect(() => {
    const fetchSerial = async () => {
      setIsLoadingSerial(true);
      setErrorSerial(null);
      try {
        const data = await getNextQuotationSerialNumberService();
        setQuoteNo(data.quoteNo);
        setSerialNo(data.serialNo);
      } catch (err: any) {
        setErrorSerial(err.message || "Failed to fetch serial number.");
        toast({ title: "Error", description: err.message || "Failed to fetch serial number.", variant: "destructive" });
      } finally {
        setIsLoadingSerial(false);
      }
    };
    fetchSerial();
  }, [toast]);

  // Calculations will be updated in Step 3.4 to use quotationLineItems
  const subTotal = useMemo(() => 
    quotationLineItems.reduce((acc, item) => acc + (item.rate * item.quantity), 0), 
  [quotationLineItems]); 

  const totalGstAmount = useMemo(() => 
    quotationLineItems.reduce((acc, item) => acc + (item.rate * item.quantity * (item.gstRate / 100)), 0),
  [quotationLineItems]);

  const grandTotal = useMemo(() => subTotal + totalGstAmount, [subTotal, totalGstAmount]);


  // Mock RateCard type and search function (Step 3.2) - This should be moved outside component or to a service file in a real app
  interface MockRateCard { id: string; description: string; unit: string; rate: number; }
  const mockRateCards: MockRateCard[] = [ // This would be fetched from a service
    { id: "rc1", description: "Standard Service A", unit: "Hour", rate: 100 },
    { id: "rc2", description: "Premium Consult B", unit: "Session", rate: 250 },
    { id: "rc3", description: "Material Pack C", unit: "Pack", rate: 50 },
  ];

  const searchRateCardsService = useCallback(async (query: string): Promise<MockRateCard[]> => {
    setIsLoadingRateCards(true);
    // console.log("Searching for:", query);
    return new Promise(resolve => setTimeout(() => {
      const results = mockRateCards.filter(rc => rc.description.toLowerCase().includes(query.toLowerCase()));
      setRateCardSearchResults(results);
      setIsLoadingRateCards(false);
      // console.log("Search results:", results);
      resolve(results);
    }, 300));
  }, []); // Empty dependency array if mockRateCards is stable
  
  const handleSearchRateCards = useCallback(async () => {
    if (!rateCardSearchQuery.trim()) {
      setRateCardSearchResults(mockRateCards); 
      return;
    }
    await searchRateCardsService(rateCardSearchQuery);
  }, [rateCardSearchQuery, searchRateCardsService]); // Added dependencies

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
        total: rateCard.rate * (1 + 18 / 100), // Initial total for quantity 1
      },
    ]);
    setIsRateCardSearchOpen(false);
    setRateCardSearchQuery("");
    setRateCardSearchResults([]);
  }, []); // Empty dependency array

  const updateLineItem = useCallback((index: number, field: keyof QuotationLineItem, value: string | number) => {
    setQuotationLineItems(prevItems => {
      const updatedItems = [...prevItems];
      const itemToUpdate = { ...updatedItems[index] };
      
      if (field === 'quantity' || field === 'rate' || field === 'gstRate') {
        (itemToUpdate[field] as number) = Number(value) || 0;
      } else {
        // For other fields like description, unit (if they become editable)
        // (itemToUpdate[field] as string) = String(value);
      }

      // Recalculate total for the item
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
    if (!quoteNo || !serialNo) {
        toast({ title: "Error", description: "Serial number not loaded or invalid.", variant: "destructive"});
        return;
    }
    if (!quotationName.trim()) { // Added validation for quotation name
        toast({ title: "Validation Error", description: "Please enter a quotation name/title.", variant: "destructive"});
        return;
    }

    const quotationData: InsertQuotation = { 
      serialNo,
      quoteNo,
      name: quotationName,
      serialNo,
      quoteNo,
      clientId: selectedClient.id,
      date: new Date(quotationDate),
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
      rateCardDetails: quotationLineItems.map(item => ({
        rateCardId: item.rateCardId,
        quantity: item.quantity,
        gstType: item.gstRate,
      })),
      itemsForPdf: quotationLineItems.map(item => ({ // For PDF data
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.rate,
        total: item.rate * item.quantity, // Pre-GST total for this line item
        rateCardItemId: item.rateCardId,
      })),
      status,
      subTotal, 
      gst: totalGstAmount, 
      grandTotal, 
      currency,
      notes,
    };

    setIsSavingQuotation(true);
    setErrorSavingQuotation(null);
    try {
      // Directly call the service function
      const savedQuotation = await createQuotationService(quotationDataPayload); // Use the correctly typed payload
      toast({ title: "Success", description: `Quotation saved: ${savedQuotation.data.quoteNo}` });
      router.push(`/dashboard/quotations`); 
    } catch (error: any) {
      setErrorSavingQuotation(error.response?.data?.message || error.message || "Failed to save quotation.");
      toast({ title: "Error", description: error.response?.data?.message || error.message || "Failed to save quotation.", variant: "destructive" });
    } finally {
      setIsSavingQuotation(false);
    }
  };

  if (isLoadingSerial) { 
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /> Loading initial data...</div>;
  }
  if (errorSerial) {
    return <div className="text-red-500 text-center py-10">Error loading serial number: {errorSerial}</div>;
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold mb-4">New Quotation {quoteNo || '(loading serial...)'}</h1>
      
      <Card>
        <CardHeader><CardTitle>Client Information</CardTitle></CardHeader>
        <CardContent>
          <ClientSearch
            selectedClient={selectedClient}
            onSelectClient={setSelectedClient}
            onCreateNewClient={() => setIsCreateClientDialogOpen(true)}
          />
        </CardContent>
      </Card>

      <CreateClientDialog
        isOpen={isCreateClientDialogOpen}
        onOpenChange={setIsCreateClientDialogOpen}
        onClientCreated={(newClient) => {
          setSelectedClient(newClient); 
        }}
      />

      <Card>
        <CardHeader><CardTitle>Quotation Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="quotationName">Quotation Name/Title</Label>
            <Input id="quotationName" value={quotationName} onChange={(e) => setQuotationName(e.target.value)} placeholder="e.g., Annual Maintenance Contract" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quotationDate">Quotation Date</Label>
              <Input id="quotationDate" type="date" value={quotationDate} onChange={(e) => setQuotationDate(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="expiryDate">Expiry Date</Label>
              <Input id="expiryDate" type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
            </div>
          </div>
          <div>
            <Label htmlFor="currency">Currency</Label>
            <Input id="currency" type="text" value={currency} onChange={(e) => setCurrency(e.target.value)} placeholder="e.g., INR" />
          </div>
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any additional notes for the client..." />
          </div>
           {/* Status is DRAFT by default and not shown in UI for new quotation */}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Quotation Items</CardTitle>
          <Button size="sm" onClick={() => { setRateCardSearchResults(mockRateCards); setIsRateCardSearchOpen(true); } }>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Item
          </Button>
        </CardHeader>
        <CardContent>
          {quotationLineItems.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No items added yet. Click "Add Item" to start.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[30%]">Description</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>GST (%)</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotationLineItems.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.description}</TableCell>
                    <TableCell>{item.unit}</TableCell>
                    <TableCell>
                       <Input type="number" value={item.rate} onChange={(e) => updateLineItem(index, "rate", parseFloat(e.target.value))} className="w-24 h-8"/>
                    </TableCell>
                    <TableCell>
                      <Input type="number" value={item.quantity} onChange={(e) => updateLineItem(index, "quantity", parseInt(e.target.value, 10))} className="w-20 h-8"/>
                    </TableCell>
                    <TableCell>
                      <Input type="number" value={item.gstRate} onChange={(e) => updateLineItem(index, "gstRate", parseFloat(e.target.value))} className="w-20 h-8"/>
                    </TableCell>
                    <TableCell className="text-right">{item.total.toFixed(2)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => removeLineItem(index)} className="h-8 w-8">
                        <MinusCircle className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      {/* Dialog for Rate Card Search */}
      <Dialog open={isRateCardSearchOpen} onOpenChange={setIsRateCardSearchOpen}>
        <DialogContent className="sm:max-w-2xl"> {/* Increased width for better layout */}
          <DialogHeader>
            <DialogTitle>Add Item from Rate Card</DialogTitle>
            <DialogDescription>Search for rate card items to add to the quotation.</DialogDescription>
          </DialogHeader>
          <div className="flex space-x-2 my-4">
            <Input 
              placeholder="Search by description..." 
              value={rateCardSearchQuery} 
              onChange={(e) => setRateCardSearchQuery(e.target.value)}
              onKeyPress={(e) => { if (e.key === 'Enter') handleSearchRateCards(); }}
            />
            <Button onClick={handleSearchRateCards} disabled={isLoadingRateCards}>
              {isLoadingRateCards ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
            </Button>
          </div>
          <div className="max-h-60 overflow-y-auto space-y-2">
            {isLoadingRateCards && <div className="text-center p-4"><Loader2 className="h-6 w-6 animate-spin mx-auto"/></div>}
            {!isLoadingRateCards && rateCardSearchResults.length === 0 && rateCardSearchQuery && (
              <p className="text-sm text-muted-foreground text-center py-4">No results found for "{rateCardSearchQuery}".</p>
            )}
            {!isLoadingRateCards && rateCardSearchResults.length === 0 && !rateCardSearchQuery && (
              <p className="text-sm text-muted-foreground text-center py-4">Type to search for rate card items.</p>
            )}
            {!isLoadingRateCards && rateCardSearchResults.map(rc => (
              <div key={rc.id} className="flex justify-between items-center p-3 hover:bg-muted rounded-md border">
                <div>
                  <p className="font-medium">{rc.description}</p>
                  <p className="text-sm text-muted-foreground">Unit: {rc.unit}, Rate: {currency} {rc.rate.toFixed(2)}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => addLineItemFromRateCard(rc)}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Add
                </Button>
              </div>
            ))}
          </div>
          <DialogFooter className="mt-4">
            <Button variant="ghost" onClick={() => { setIsRateCardSearchOpen(false); setRateCardSearchQuery(""); setRateCardSearchResults([]); }}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Calculations component will use the updated subTotal, totalGstAmount, grandTotal */}
      <Calculations subTotal={subTotal} tax={totalGstAmount} total={grandTotal} currency={currency} />

      <div className="flex items-center justify-end space-x-2 mt-6">
        <Button onClick={handleSubmit} disabled={isSavingQuotation || isLoadingSerial}>
          {isSavingQuotation ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save Quotation
        </Button>
        <Button variant="outline" onClick={() => {
            if (!selectedClient || !quoteNo) {
                toast({title: "Cannot generate PDF", description: "Client and quotation number required.", variant: "destructive"});
                return;
            }
            // Map line items for PDF generation - this will be refined in Step 3.5
            const pdfLineItems = quotationLineItems.map(li => ({
                description: li.description,
                quantity: li.quantity,
                unitPrice: li.rate, 
                total: li.rate * li.quantity, 
                rateCardItemId: li.rateCardId,
            }));
            const currentDataForPdf: QuotationWithDetails = {
                id: "new-unsaved", // Placeholder for new quotation
                name: quotationName,
                serialNo, 
                quoteNo, 
                clientId: selectedClient.id, 
                client: selectedClient, // Pass the selected client object
                date: new Date(quotationDate),
                expiryDate: expiryDate ? new Date(expiryDate) : undefined, 
                itemsForPdf: pdfLineItems, 
                status, 
                subTotal, 
                gst: totalGstAmount, 
                grandTotal, 
                currency, 
                notes,
                // ticketId: undefined, // Set if available
            };
            generatePDF(currentDataForPdf);
        }}> <Printer className="mr-2 h-4 w-4" /> PDF</Button>
        <Button variant="outline"> <Mail className="mr-2 h-4 w-4" /> Send</Button>
      </div>
      {errorSavingQuotation && <p className="text-red-500 text-sm mt-2 text-right">Error saving: {errorSavingQuotation}</p>}
    </div>
  );
};

export default NewQuotationPage;
