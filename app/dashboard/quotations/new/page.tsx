"use client";

// Modified Code for NewQuotationPage
import React, { useEffect, useState, useMemo, useCallback } from "react";
// import { useParams } from "next/navigation"; // No longer needed for 'new' page
import { useRouter } from "next/navigation"; // Changed from wouter
import { Button } from "@/components/ui/button"; // Corrected path
import { Input } from "@/components/ui/input"; // Corrected path
import { Textarea } from "@/components/ui/textarea"; // Corrected path
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

interface InsertQuotationItem {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  rateCardItemId: string | null; // from original
}

interface InsertQuotation {
  serialNo: number;
  quoteNo: string;
  clientId: string;
  date: Date;
  expiryDate?: Date;
  items: InsertQuotationItem[];
  status: string; // Consider a more specific enum type if available
  subTotal: number;
  taxAmount: number;
  grandTotal: number;
  currency: string;
  notes?: string;
}

// QuotationWithDetails would be more comprehensive, for now, use InsertQuotation as a base for what PDF might need
interface QuotationWithDetails extends InsertQuotation {
  id: string; // Typically, a full quotation object would have an ID
  client?: Client; // And potentially the resolved client object
}


// Corrected import paths
import { generatePDF } from "@/lib/pdf/quotation"; // Corrected path
import { apiRequest, queryClient } from "@/lib/axios"; // Corrected path, assuming apiRequest is from axios.ts / queryClient is related

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
  const [formData, setFormData] = useState<Partial<CreateClientFormData>>({
    type: "Bank", // Default value
    contractStatus: "Active", // Default value
    lastServiceDate: new Date().toISOString().split('T')[0] // Default to today
  });
  const [errors, setErrors] = useState<Partial<Record<keyof CreateClientFormData, string>>>({});
  const [isCreatingClient, setIsCreatingClient] = useState(false); // New state for loading

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value, 10) : value,
    }));
    // Clear error for this field on change
    setErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const handleSelectChange = (name: keyof CreateClientFormData, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({}); // Clear previous errors

    try {
      const validatedData = createClientSchema.parse(formData);
      setIsCreatingClient(true);
      const newClient = await createClient(validatedData); // Direct API call

      toast({ title: "Success", description: "New client created successfully." });
      onClientCreated(newClient as Client);
      onOpenChange(false); // Close dialog
      setFormData({ type: "Bank", contractStatus: "Active", lastServiceDate: new Date().toISOString().split('T')[0] }); // Reset form
      setErrors({});

    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Partial<Record<keyof CreateClientFormData, string>> = {};
        error.errors.forEach(err => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as keyof CreateClientFormData] = err.message;
          }
        });
        setErrors(fieldErrors);
        toast({ title: "Validation Error", description: "Please check the form fields.", variant: "destructive"});
      } else {
        toast({ title: "Error", description: `Failed to create client: ${(error as Error).message}`, variant: "destructive" });
      }
    } finally {
      setIsCreatingClient(false);
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
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
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
            {errors.type && <p className="text-red-500 text-xs mt-1">{errors.type}</p>}
          </div>

          <div>
            <Label htmlFor="totalBranches">Total Branches</Label>
            <Input id="totalBranches" name="totalBranches" type="number" value={formData.totalBranches || ""} onChange={handleInputChange} />
            {errors.totalBranches && <p className="text-red-500 text-xs mt-1">{errors.totalBranches}</p>}
          </div>

          <div>
            <Label htmlFor="contactPerson">Contact Person</Label>
            <Input id="contactPerson" name="contactPerson" value={formData.contactPerson || ""} onChange={handleInputChange} />
            {errors.contactPerson && <p className="text-red-500 text-xs mt-1">{errors.contactPerson}</p>}
          </div>

          <div>
            <Label htmlFor="contactPhone">Contact Phone</Label>
            <Input id="contactPhone" name="contactPhone" value={formData.contactPhone || ""} onChange={handleInputChange} />
            {errors.contactPhone && <p className="text-red-500 text-xs mt-1">{errors.contactPhone}</p>}
          </div>

          <div>
            <Label htmlFor="contactEmail">Contact Email (Optional)</Label>
            <Input id="contactEmail" name="contactEmail" type="email" value={formData.contactEmail || ""} onChange={handleInputChange} />
            {errors.contactEmail && <p className="text-red-500 text-xs mt-1">{errors.contactEmail}</p>}
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
            {errors.contractStatus && <p className="text-red-500 text-xs mt-1">{errors.contractStatus}</p>}
          </div>

          <div>
            <Label htmlFor="lastServiceDate">Last Service Date</Label>
            <Input id="lastServiceDate" name="lastServiceDate" type="date" value={formData.lastServiceDate || ""} onChange={handleInputChange} />
            {errors.lastServiceDate && <p className="text-red-500 text-xs mt-1">{errors.lastServiceDate}</p>}
          </div>

          <div>
            <Label htmlFor="gstn">GSTN (Optional)</Label>
            <Input id="gstn" name="gstn" value={formData.gstn || ""} onChange={handleInputChange} />
          </div>

          <div>
            <Label htmlFor="avatar">Avatar URL (Optional)</Label>
            <Input id="avatar" name="avatar" value={formData.avatar || ""} onChange={handleInputChange} />
          </div>

          <div>
            <Label htmlFor="initials">Initials (Optional)</Label>
            <Input id="initials" name="initials" value={formData.initials || ""} onChange={handleInputChange} />
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={isCreatingClient}>
              {isCreatingClient && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isCreateClientDialogOpen, setIsCreateClientDialogOpen] = useState(false); // State for dialog
  const [quotationDate, setQuotationDate] = useState<Date | undefined>(new Date());
  const [expiryDate, setExpiryDate] = useState<Date | undefined>();
  const [items, setItems] = useState<InsertQuotationItem[]>([{ description: "", quantity: 1, unitPrice: 0, total: 0, rateCardItemId: null }]);
  const [status, setStatus] = useState<string>("DRAFT");
  const [notes, setNotes] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [quoteNo, setQuoteNo] = useState("");
  const [serialNo, setSerialNo] = useState(0);

  // REMOVED: Fetch existing quotation logic
  // const { data: existingQuotation, isLoading: isLoadingExisting } = useQuery<QuotationWithDetails>(
  //   ["/api/quotations", id],
  //   async () => apiRequest(`/api/quotations/${id}`),
  //   {
  //     enabled: !!id, // Only fetch if id is present
  //   }
  // );

  // New state for managing serial number loading
  const [isLoadingSerial, setIsLoadingSerial] = useState(true);

  useEffect(() => {
    const fetchSerialData = async () => {
      setIsLoadingSerial(true);
      try {
        const data = await apiRequest<{ serialNo: number; quoteNo: string }>("/api/next-serial");
        if (data) {
          setQuoteNo(data.quoteNo);
          setSerialNo(data.serialNo);
        }
      } catch (error) {
        console.error("Failed to fetch serial data:", error);
        toast({ title: "Error", description: "Failed to load serial number.", variant: "destructive" });
      } finally {
        setIsLoadingSerial(false);
      }
    };
    fetchSerialData();
  }, [toast]); // Assuming toast is stable

  const subTotal = useMemo(() => items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0), [items]); // Type for item updated
  const taxRate = 0.10; // Example: 10%
  const taxAmount = subTotal * taxRate;
  const grandTotal = subTotal + taxAmount;

  const [isSavingQuotation, setIsSavingQuotation] = useState(false); // Manage loading state

  const handleSubmit = async () => {
    if (!selectedClient) {
      toast({ title: "Validation Error", description: "Please select a client.", variant: "destructive" });
      return;
    }
    if (!quoteNo || !serialNo) {
        toast({ title: "Error", description: "Serial number not loaded.", variant: "destructive"});
        return;
    }
    const quotationData: InsertQuotation = { // Type updated
      serialNo,
      quoteNo,
      clientId: selectedClient.id,
      date: quotationDate || new Date(),
      expiryDate,
      items, // Type for items updated
      status,
      subTotal,
      taxAmount,
      grandTotal,
      currency,
      notes,
    };

    setIsSavingQuotation(true);
    try {
      const data = await apiRequest("/api/quotations", { // Assuming /api/quotations is the POST endpoint
        method: "POST",
        body: JSON.stringify(quotationData),
      });
      toast({ title: "Success", description: `Quotation saved: ${data.quoteNo}` });
      // router.push(`/dashboard/quotations/${data.id}`); // Navigate to view/edit the new quotation
      // If `queryClient.invalidateQueries` was important for other parts of the app,
      // that logic would need to be handled differently. For now, it's removed.
    } catch (error) {
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsSavingQuotation(false);
    }
  };

  // if (isLoadingExisting || (isLoadingSerial && !id)) { // isLoadingExisting removed, !id condition removed
  if (isLoadingSerial) { // Only check serial loading for new page
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /> Loading initial data...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      {/* Title changed to always be "New Quotation" */}
      <h1 className="text-2xl font-bold mb-4">New Quotation {quoteNo || '(loading serial...)'}</h1>

      {/* <AUBankImport /> // Removed */}

      <Card className="mb-4">
        <CardHeader><CardTitle>Client</CardTitle></CardHeader>
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
          setSelectedClient(newClient); // Set the newly created client as selected
        }}
      />

      {/* Other form sections */}
      {/* Ensure these components are correctly defined or replaced with actual implementations */}
      <Card className="mb-4">
        <CardHeader><CardTitle>Rate Card Items</CardTitle></CardHeader>{/* Changed "Items" to "Rate Card Items" */}
        <CardContent>
          <QuotationTable items={items} setItems={setItems} currency={currency} />
        </CardContent>
      </Card>
      <Calculations subTotal={subTotal} tax={taxAmount} total={grandTotal} currency={currency} />

      <Button onClick={handleSubmit} disabled={isSavingQuotation}>
        {isSavingQuotation ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
        Save Quotation {/* Button text simplified */}
      </Button>
      {/* PDF and Send buttons could be enabled after saving, or use current (unsaved) data */}
      <Button variant="outline" onClick={() => {
          if (!selectedClient || !quoteNo) {
              toast({title: "Cannot generate PDF", description: "Client and quotation number required.", variant: "destructive"});
              return;
          }
          // Create a temporary QuotationWithDetails-like object for the PDF
          const currentDataForPdf: QuotationWithDetails = {
              id: "new-unsaved", // Placeholder ID
              serialNo, quoteNo, clientId: selectedClient.id, client: selectedClient, date: quotationDate || new Date(),
              expiryDate, items, status, subTotal, taxAmount, grandTotal, currency, notes
          };
          generatePDF(currentDataForPdf);
      }}> <Printer className="mr-2 h-4 w-4" /> PDF</Button>
      <Button variant="outline"> <Mail className="mr-2 h-4 w-4" /> Send</Button>
      {/* Delete button removed as it's for existing quotations */}

      {/* This is a basic representation. The actual issue code would be more detailed. */}
    </div>
  );
};

export default NewQuotationPage; // Exporting renamed component
