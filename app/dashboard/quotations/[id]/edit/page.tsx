"use client";

// Page for Editing Existing Quotation
import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation"; // Using next/navigation
// TanStack Query imports removed
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
import apiRequest from "@/lib/axios"; // Corrected import for apiRequest

// Define type for client creation form data
type CreateClientFormData = z.infer<typeof createClientSchema>;

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
  // const reactQueryClient = useReactQueryClient(); // Removed: reactQueryClient not used directly for mutation
  const [isSubmittingDialog, setIsSubmittingDialog] = useState(false); // Added for dialog's loading state
  const [formData, setFormData] = useState<Partial<CreateClientFormData>>({
    type: "Bank", contractStatus: "Active", lastServiceDate: new Date().toISOString().split('T')[0]
  });
  const [errors, setErrors] = useState<Partial<Record<keyof CreateClientFormData, string>>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseInt(value, 10) : value }));
    setErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const handleSelectChange = (name: keyof CreateClientFormData, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: undefined }));
  };

  // Removed useMutation block for createClientMutation

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsSubmittingDialog(true); // Set dialog loading state

    try {
      const validatedData = createClientSchema.parse(formData);
      // Directly call the createClient service
      const newClient = await createClient(validatedData);

      // Success handling
      toast({ title: "Success", description: "New client created successfully." });
      // reactQueryClient.invalidateQueries(["clients"]); // Removed: Was used to refetch client list. Handle via callback or state if needed.
      onClientCreated(newClient as Client); // Pass the new client up
      onOpenChange(false); // Close dialog
      setFormData({ type: "Bank", contractStatus: "Active", lastServiceDate: new Date().toISOString().split('T')[0] }); // Reset form
      setErrors({});

    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Partial<Record<keyof CreateClientFormData, string>> = {};
        error.errors.forEach(err => {
          if (err.path[0]) fieldErrors[err.path[0] as keyof CreateClientFormData] = err.message;
        });
        setErrors(fieldErrors);
        toast({ title: "Validation Error", description: "Please check the form fields.", variant: "destructive"});
      } else {
        // API error or other unexpected error
        toast({ title: "Error", description: `Failed to create client: ${(error as Error).message}`, variant: "destructive" });
      }
    } finally {
      setIsSubmittingDialog(false); // Reset dialog loading state
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
            <Label htmlFor="name_edit">Client Name</Label> {/* Changed id to avoid conflict if rendered together by mistake */}
            <Input id="name_edit" name="name" value={formData.name || ""} onChange={handleInputChange} />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
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
            {errors.type && <p className="text-red-500 text-xs mt-1">{errors.type}</p>}
          </div>
           {/* totalBranches */}
          <div>
            <Label htmlFor="totalBranches_edit">Total Branches</Label>
            <Input id="totalBranches_edit" name="totalBranches" type="number" value={formData.totalBranches || ""} onChange={handleInputChange} />
            {errors.totalBranches && <p className="text-red-500 text-xs mt-1">{errors.totalBranches}</p>}
          </div>
          {/* contactPerson */}
          <div>
            <Label htmlFor="contactPerson_edit">Contact Person</Label>
            <Input id="contactPerson_edit" name="contactPerson" value={formData.contactPerson || ""} onChange={handleInputChange} />
            {errors.contactPerson && <p className="text-red-500 text-xs mt-1">{errors.contactPerson}</p>}
          </div>
          {/* contactPhone */}
          <div>
            <Label htmlFor="contactPhone_edit">Contact Phone</Label>
            <Input id="contactPhone_edit" name="contactPhone" value={formData.contactPhone || ""} onChange={handleInputChange} />
            {errors.contactPhone && <p className="text-red-500 text-xs mt-1">{errors.contactPhone}</p>}
          </div>
          {/* contactEmail */}
          <div>
            <Label htmlFor="contactEmail_edit">Contact Email (Optional)</Label>
            <Input id="contactEmail_edit" name="contactEmail" type="email" value={formData.contactEmail || ""} onChange={handleInputChange} />
            {errors.contactEmail && <p className="text-red-500 text-xs mt-1">{errors.contactEmail}</p>}
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
            {errors.contractStatus && <p className="text-red-500 text-xs mt-1">{errors.contractStatus}</p>}
          </div>
          {/* lastServiceDate */}
          <div>
            <Label htmlFor="lastServiceDate_edit">Last Service Date</Label>
            <Input id="lastServiceDate_edit" name="lastServiceDate" type="date" value={formData.lastServiceDate || ""} onChange={handleInputChange} />
            {errors.lastServiceDate && <p className="text-red-500 text-xs mt-1">{errors.lastServiceDate}</p>}
          </div>
          {/* gstn */}
          <div>
            <Label htmlFor="gstn_edit">GSTN (Optional)</Label>
            <Input id="gstn_edit" name="gstn" value={formData.gstn || ""} onChange={handleInputChange} />
          </div>
          {/* avatar */}
          <div>
            <Label htmlFor="avatar_edit">Avatar URL (Optional)</Label>
            <Input id="avatar_edit" name="avatar" value={formData.avatar || ""} onChange={handleInputChange} />
          </div>
          {/* initials */}
          <div>
            <Label htmlFor="initials_edit">Initials (Optional)</Label>
            <Input id="initials_edit" name="initials" value={formData.initials || ""} onChange={handleInputChange} />
          </div>
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
            <Button type="submit" disabled={isSubmittingDialog}>
              {isSubmittingDialog && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Create Client
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

  // State for existing quotation data
  const [existingQuotation, setExistingQuotation] = useState<QuotationWithDetails | null>(null);
  const [isLoadingExisting, setIsLoadingExisting] = useState(true);
  const [existingQuotationError, setExistingQuotationError] = useState<string | null>(null);

  // State for form fields
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [quotationDate, setQuotationDate] = useState<Date | undefined>();
  const [expiryDate, setExpiryDate] = useState<Date | undefined>();
  const [items, setItems] = useState<InsertQuotationItem[]>([]);
  const [status, setStatus] = useState<string>("DRAFT");
  const [notes, setNotes] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [quoteNo, setQuoteNo] = useState("");
  const [serialNo, setSerialNo] = useState(0);

  // State for saving quotation
  const [isSavingQuotation, setIsSavingQuotation] = useState(false);

  // Effect to fetch existing quotation data
  useEffect(() => {
    if (quotationId) {
      const fetchQuotation = async () => {
        setIsLoadingExisting(true);
        setExistingQuotationError(null);
        try {
          const data = await apiRequest<QuotationWithDetails>(`/api/quotations/${quotationId}`);
          setExistingQuotation(data);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error fetching quotation";
          setExistingQuotationError(errorMessage);
          toast({ title: "Error Fetching Quotation", description: errorMessage, variant: "destructive" });
          console.error("Error fetching quotation:", error);
        } finally {
          setIsLoadingExisting(false);
        }
      };
      fetchQuotation();
    } else {
      setIsLoadingExisting(false);
      setExistingQuotationError("No Quotation ID provided.");
      toast({ title: "Error", description: "No Quotation ID provided.", variant: "destructive" });
    }
  }, [quotationId, toast]);

  // Effect to load data from existingQuotation into form state
  useEffect(() => {
    if (existingQuotation) {
      setSelectedClient(existingQuotation.client || null);
      setQuotationDate(new Date(existingQuotation.date));
      setExpiryDate(existingQuotation.expiryDate ? new Date(existingQuotation.expiryDate) : undefined);
      setItems(existingQuotation.items.map(item => ({ ...item, total: item.quantity * item.unitPrice })));
      setStatus(existingQuotation.status);
      setNotes(existingQuotation.notes || "");
      setCurrency(existingQuotation.currency);
      setQuoteNo(existingQuotation.quoteNo);
      setSerialNo(existingQuotation.serialNo);
    }
  }, [existingQuotation]);

  // Serial number fetching logic and related useEffect removed as it's not used on edit page

  const subTotal = useMemo(() => items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0), [items]);
  const taxRate = 0.10; // Example: 10%
  const taxAmount = subTotal * taxRate;
  const grandTotal = subTotal + taxAmount;

  // saveQuotationMutation removed

  const handleSubmit = async () => {
    if (!selectedClient) {
      toast({ title: "Validation Error", description: "Please select a client.", variant: "destructive" });
      return;
    }
    if (!quotationId) {
      toast({ title: "Error", description: "Quotation ID is missing.", variant: "destructive" });
      return;
    }

    setIsSavingQuotation(true);
    try {
      const quotationData: Partial<InsertQuotation> = {
        serialNo,
        quoteNo,
        clientId: selectedClient.id,
        date: quotationDate,
        expiryDate,
        items,
        status,
        subTotal,
        taxAmount,
        grandTotal,
        currency,
        notes,
      };

      const updatedQuotation = await apiRequest(`/api/quotations/${quotationId}`, {
        method: "PUT",
        body: JSON.stringify(quotationData),
      });

      toast({ title: "Success", description: `Quotation ${updatedQuotation.quoteNo} updated.` });
      // Optionally update local state if API returns the full updated object
      // setExistingQuotation(updatedQuotation); // If API returns the updated object
      // reactQueryClient.invalidateQueries calls removed
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error saving quotation";
      toast({ title: "Error updating quotation", description: errorMessage, variant: "destructive" });
      console.error("Error saving quotation:", error);
    } finally {
      setIsSavingQuotation(false);
    }
  };

  const handleDelete = async () => {
    if (!quotationId) {
        toast({ title: "Error", description: "No quotation ID found to delete.", variant: "destructive" });
        return;
    }
    // Add a confirmation dialog here in a real app
    try {
        await apiRequest(`/api/quotations/${quotationId}`, { method: "DELETE" });
        toast({ title: "Success", description: "Quotation deleted." });
        // reactQueryClient.invalidateQueries(["/api/quotations"]); // Removed
        router.push("/dashboard/quotations"); // Navigate back to list
    } catch (error: any) {
        toast({ title: "Error deleting quotation", description: error.message, variant: "destructive" });
    }
  };

  if (isLoadingExisting) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /> Loading quotation data...</div>;
  }

  if (existingQuotationError) {
      return <div className="text-red-500 p-4">Error loading quotation: {existingQuotationError}</div>;
  }

  if (!existingQuotation && !isLoadingExisting) { // Check error state as well
      return <div className="text-red-500 p-4">Quotation not found. It might have been deleted or the ID is invalid.</div>;
  }


  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Edit Quotation {quoteNo || ''}</h1>
        <div>
            <Button variant="outline" onClick={() => router.push("/dashboard/quotations")} className="mr-2">Cancel</Button>
            <Button onClick={handleSubmit} disabled={isSavingQuotation || isLoadingExisting} className="mr-2">
                {isSavingQuotation ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Update Quotation
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isSavingQuotation || isLoadingExisting}><Trash2 className="mr-2 h-4 w-4" /> Delete</Button>
        </div>
      </div>

      <Card className="mb-4">
        <CardHeader><CardTitle>Client</CardTitle></CardHeader>
        <CardContent>
          {/* The ClientSearch component in edit/page.tsx did not have onCreateNewClient. CreateClientDialog is present but seems orphaned. */}
          {/* For now, rendering ClientSearch as it was. If dialog needs to be triggered, ClientSearch props or another button is needed. */}
          <ClientSearch selectedClient={selectedClient} onSelectClient={setSelectedClient} onCreateNewClient={() => {
            // This function was missing in the original ClientSearch wiring for edit page.
            // If a CreateClientDialog is intended to be used, its trigger mechanism needs to be defined.
            // For now, this will do nothing, or you can hook it up to a dialog state if one exists.
            toast({ title: "Info", description: "Create new client functionality not fully wired on this page."});
          }} />
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
