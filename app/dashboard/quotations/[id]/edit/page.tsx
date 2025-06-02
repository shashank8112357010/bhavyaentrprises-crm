"use client";

// Page for Editing Existing Quotation
import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation"; // Using next/navigation
import { useQuery, useMutation, useQueryClient as useReactQueryClient } from "@tanstack/react-query";
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
import { apiRequest, queryClient } from "@/lib/axios";

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
  const reactQueryClient = useReactQueryClient();
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

  const createClientMutation = useMutation(
    (clientData: CreateClientFormData) => createClient(clientData),
    {
      onSuccess: (newClient) => {
        toast({ title: "Success", description: "New client created successfully." });
        reactQueryClient.invalidateQueries(["clients"]);
        onClientCreated(newClient as Client);
        onOpenChange(false);
        setFormData({ type: "Bank", contractStatus: "Active", lastServiceDate: new Date().toISOString().split('T')[0] });
        setErrors({});
      },
      onError: (error: Error) => {
        toast({ title: "Error", description: `Failed to create client: ${error.message}`, variant: "destructive" });
      },
    }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    try {
      const validatedData = createClientSchema.parse(formData);
      createClientMutation.mutate(validatedData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Partial<Record<keyof CreateClientFormData, string>> = {};
        error.errors.forEach(err => {
          if (err.path[0]) fieldErrors[err.path[0] as keyof CreateClientFormData] = err.message;
        });
        setErrors(fieldErrors);
        toast({ title: "Validation Error", description: "Please check the form fields.", variant: "destructive"});
      } else {
        toast({ title: "Submission Error", description: (error as Error).message, variant: "destructive"});
      }
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
            <Button type="submit" disabled={createClientMutation.isLoading}>
              {createClientMutation.isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Create Client
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
  const { id: quotationId } = params; // Extract id, rename to avoid conflict if 'id' is used elsewhere
  const router = useRouter();
  const { toast } = useToast();
  const reactQueryClient = useReactQueryClient();

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [quotationDate, setQuotationDate] = useState<Date | undefined>(); // Initialize as undefined for edit
  const [expiryDate, setExpiryDate] = useState<Date | undefined>();
  const [items, setItems] = useState<InsertQuotationItem[]>([]); // Initialize as empty for edit
  const [status, setStatus] = useState<string>("DRAFT");
  const [notes, setNotes] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [quoteNo, setQuoteNo] = useState("");
  const [serialNo, setSerialNo] = useState(0);

  // Fetch existing quotation using params.id
  const { data: existingQuotation, isLoading: isLoadingExisting, error: existingQuotationError } = useQuery<QuotationWithDetails>(
    ["/api/quotations", quotationId], // Use quotationId from params
    async () => apiRequest(`/api/quotations/${quotationId}`),
    {
      enabled: !!quotationId, // Only fetch if quotationId is present
    }
  );

  // Fetch next serial number - Disabled for edit page (existing quotations have serials)
  const { data: serialData, isLoading: isLoadingSerial } = useQuery<{ serialNo: number; quoteNo: string }>(
    ["/api/next-serial"],
    async () => apiRequest("/api/next-serial"),
    {
      enabled: !quotationId, // Disabled if quotationId is present (i.e., for an edit page)
    }
  );

  // Effect to load data from existingQuotation into form state
  useEffect(() => {
    if (existingQuotation) {
      setSelectedClient(existingQuotation.client || null); // Assuming client data might be nested or just an ID
      setQuotationDate(new Date(existingQuotation.date));
      setExpiryDate(existingQuotation.expiryDate ? new Date(existingQuotation.expiryDate) : undefined);
      // Ensure items have a 'total' field if not present, or calculate it
      setItems(existingQuotation.items.map(item => ({ ...item, total: item.quantity * item.unitPrice })));
      setStatus(existingQuotation.status);
      setNotes(existingQuotation.notes || "");
      setCurrency(existingQuotation.currency);
      setQuoteNo(existingQuotation.quoteNo);
      setSerialNo(existingQuotation.serialNo);
    }
  }, [existingQuotation]);

  // If serialData was intended for new quotations, this useEffect might not be relevant here,
  // or only as a fallback if somehow an "edit" page was reached without an ID (which shouldn't happen).
  useEffect(() => {
    if (!quotationId && serialData) { // This condition should ideally not be met on an edit page
      setQuoteNo(serialData.quoteNo);
      setSerialNo(serialData.serialNo);
      toast({ title: "Warning", description: "Editing page loaded without ID, but got new serial. Check routing.", variant: "destructive" });
    }
  }, [serialData, quotationId, toast]);


  const subTotal = useMemo(() => items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0), [items]);
  const taxRate = 0.10; // Example: 10%
  const taxAmount = subTotal * taxRate;
  const grandTotal = subTotal + taxAmount;

  const saveQuotationMutation = useMutation(
    async (quotationData: Partial<InsertQuotation>) => { // Use Partial for updates, or a specific UpdateDTO
      if (quotationId) { // Logic for UPDATE
        return apiRequest(`/api/quotations/${quotationId}`, {
          method: "PUT",
          body: JSON.stringify(quotationData),
        });
      } else {
        // This block should ideally not be reached on an "edit" page.
        // If it is, it implies an issue with routing or page logic.
        toast({ title: "Error", description: "Attempted to create a new quotation from the edit page.", variant: "destructive" });
        throw new Error("Cannot create new quotation from edit page without ID.");
        // return apiRequest("/api/quotations", {
        //   method: "POST",
        //   body: JSON.stringify(quotationData), // Fallback to POST, though not ideal for an edit page
        // });
      }
    },
    {
      onSuccess: (data: any) => {
        toast({ title: "Success", description: `Quotation ${data.quoteNo} updated.` });
        reactQueryClient.invalidateQueries(["/api/quotations", quotationId]); // Invalidate specific quotation
        reactQueryClient.invalidateQueries(["/api/quotations"]); // Invalidate list
      },
      onError: (error: Error) => {
        toast({ title: "Error updating quotation", description: error.message, variant: "destructive" });
      },
    }
  );

  const handleSubmit = () => {
    if (!selectedClient) {
      toast({ title: "Validation Error", description: "Please select a client.", variant: "destructive" });
      return;
    }
    // For an update, you might send only changed fields or the full object.
    // The DTO might differ (e.g., UpdateQuotationDto). Using InsertQuotation for now.
    const quotationData: Partial<InsertQuotation> = {
      // id: quotationId, // ID is in URL, not usually in body for PUT, but depends on API
      serialNo, // Serial and QuoteNo might be non-editable or validated on backend
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
    saveQuotationMutation.mutate(quotationData);
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
        reactQueryClient.invalidateQueries(["/api/quotations"]);
        router.push("/dashboard/quotations"); // Navigate back to list
    } catch (error: any) {
        toast({ title: "Error deleting quotation", description: error.message, variant: "destructive" });
    }
  };


  if (isLoadingExisting) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /> Loading quotation data...</div>;
  }

  if (existingQuotationError) {
      return <div className="text-red-500 p-4">Error loading quotation: {(existingQuotationError as Error).message}</div>;
  }

  if (!existingQuotation && !isLoadingExisting) {
      return <div className="text-red-500 p-4">Quotation not found. It might have been deleted.</div>;
  }


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
