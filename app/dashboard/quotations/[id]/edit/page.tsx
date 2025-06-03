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
  // Add other client fields if needed for display or selection logic
}

// Represents a single item in the quotation's rateCardDetails, augmented with RateCard data for display
interface QuotationRateCardItem {
  rateCardId: string; // from Quotation.rateCardDetails
  description: string; // from related RateCard
  unit: string; // from related RateCard
  rate: number; // from related RateCard
  quantity: number; // from Quotation.rateCardDetails, editable
  gstPercentage: number; // from Quotation.rateCardDetails, editable
  lineTotal: number; // Calculated: rate * quantity * (1 + gstPercentage / 100)
}

// Represents the Quotation data structure fetched and used in the form
interface QuotationFormData {
  id: string;
  name: string; // Quotation name/title
  quoteNo?: string; // If available
  clientId: string;
  client?: Client; // Populated for display
  date: string; // ISO string date
  expiryDate?: string; // ISO string date
  rateCardDetails: QuotationRateCardItem[];
  status: string;
  notes?: string;
  currency?: string; // Assuming currency is part of quotation
  // Calculated fields, might be updated by backend response
  subtotal: number;
  gst: number;
  grandTotal: number;
  pdfUrl?: string; // From Prisma schema, though generatePDF is client-side
  // Include other fields from Prisma Quotation model as needed for the form
}


// Import paths (same as new/page.tsx)
import { generatePDF } from "@/lib/pdf/quotation";
// import apiRequest from "@/lib/axios"; // Will use specific service functions instead
import { getQuotationById, updateQuotation, UpdateQuotationParams } from "@/lib/services/quotations"; // Typed services
import { getAllRateCards } from "@/lib/services/rate-card"; // To fetch rate card master data

// Define type for client creation form data
type CreateClientFormData = z.infer<typeof createClientSchema>;

// Component to manage and display rate card items for the quotation
interface RateCardItemsTableProps {
  items: QuotationRateCardItem[];
  onItemChange: (index: number, field: keyof QuotationRateCardItem, value: any) => void;
  onRemoveItem: (index: number) => void; // Optional: if items can be removed
  // currency: string; // If currency symbol is needed per line
}

const RateCardItemsTable: React.FC<RateCardItemsTableProps> = ({ items, onItemChange }) => {
  // TODO: Implement the table UI with input fields for quantity and gstPercentage
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Description</TableHead>
            <TableHead>Unit</TableHead>
            <TableHead>Rate</TableHead>
            <TableHead className="w-[100px]">Quantity</TableHead>
            <TableHead className="w-[100px]">GST %</TableHead>
            <TableHead>Line Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item, index) => (
            <TableRow key={item.rateCardId}>
              <TableCell>{item.description}</TableCell>
              <TableCell>{item.unit}</TableCell>
              <TableCell>{item.rate.toFixed(2)}</TableCell>
              <TableCell>
                <Input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => onItemChange(index, "quantity", parseFloat(e.target.value) || 0)}
                  className="w-full"
                />
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  value={item.gstPercentage}
                  onChange={(e) => onItemChange(index, "gstPercentage", parseFloat(e.target.value) || 0)}
                  className="w-full"
                />
              </TableCell>
              <TableCell>{item.lineTotal.toFixed(2)}</TableCell>
            </TableRow>
          ))}
          {items.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center">
                No rate card items added.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};


// Modified ClientSearch to include a "Create New Client" button trigger
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"; // For RateCardItemsTable

const ClientSearch = ({ // Assuming Client type is defined elsewhere or inline
  selectedClient,
  onSelectClient,
  onCreateNewClient,
}: {
  selectedClient: Client | null;
  onSelectClient: (client: Client) => void;
  onCreateNewClient: () => void; // Function to trigger client creation dialog
}) => (
  <div className="flex flex-col space-y-2">
    <div className="flex space-x-2 items-center">
      {/* Simplified: Replace with actual client search component */}
      <Input placeholder="Search Client..." disabled className="flex-grow" />
      <Button onClick={() => onSelectClient({ id: "dummy-client-1", name: "Dummy Client Inc." })}>Select Dummy</Button>
      <Button variant="outline" onClick={onCreateNewClient}>
        <UserPlus className="mr-2 h-4 w-4" /> Create New
      </Button>
    </div>
    {selectedClient && (
      <div className="p-2 border rounded-md bg-muted mt-2">
        <p className="font-medium">Selected Client:</p>
        <p><strong>Name:</strong> {selectedClient.name}</p>
        {selectedClient.email && <p><strong>Email:</strong> {selectedClient.email}</p>}
      </div>
    )}
  </div>
);

// const QuotationTable = ({ items, setItems, currency } : {items: InsertQuotationItem[], setItems: (items: InsertQuotationItem[]) => void, currency: string}) => <div>Rate Card Items Placeholder</div>; // Changed "Quotation Table" to "Rate Card Items"
// Calculations component will be updated or integrated directly based on new QuotationFormData structure
const Calculations = ({ subtotal, gst, grandTotal, currency }: { subtotal: number; gst: number; grandTotal: number; currency?: string }) => (
  <div className="mt-4 space-y-2">
    <div className="flex justify-between"><span>Subtotal:</span> <span>{currency} {subtotal.toFixed(2)}</span></div>
    <div className="flex justify-between"><span>GST:</span> <span>{currency} {gst.toFixed(2)}</span></div>
    <div className="flex justify-between font-bold"><span>Grand Total:</span> <span>{currency} {grandTotal.toFixed(2)}</span></div>
  </div>
);

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
  const { id: quotationId } = params; // From URL
  const router = useRouter();
  const { toast } = useToast();

  const [formData, setFormData] = useState<Partial<QuotationFormData>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false);

  // Fetched master list of all rate cards for description/unit/rate
  const [allRateCards, setAllRateCards] = useState<any[]>([]); // Using 'any' for now, should be RateCard[] from Prisma

  // Fetch all rate cards once on mount
  useEffect(() => {
    const fetchAllRateCards = async () => {
      try {
        // Assuming getAllRateCards returns a flat list of all rate cards without pagination,
        // or a paginated response where we fetch all pages if necessary.
        // For simplicity, let's assume it fetches what we need.
        const response = await getAllRateCards({ limit: 1000 }); // Adjust limit as needed
        setAllRateCards(response.data || []); // Assuming response.data is the array
      } catch (err) {
        console.error("Failed to fetch all rate cards:", err);
        toast({ title: "Error", description: "Could not load rate card master data.", variant: "destructive" });
      }
    };
    fetchAllRateCards();
  }, [toast]);

  // Fetch existing quotation data
  useEffect(() => {
    if (quotationId && allRateCards.length > 0) { // Ensure allRateCards are loaded
      setIsLoading(true);
      getQuotationById(quotationId)
        .then((data: any) => { // data is the raw Quotation object from Prisma
          // Transform quotation data, especially rateCardDetails
          const transformedRateCardDetails: QuotationRateCardItem[] = (data.rateCardDetails || []).map((item: any) => {
            const baseRateCard = allRateCards.find(rc => rc.id === item.rateCardId);
            const quantity = Number(item.quantity) || 0;
            const gstPercentage = Number(item.gstPercentage) || 0;
            const rate = baseRateCard ? Number(baseRateCard.rate) : 0;
            return {
              ...item,
              description: baseRateCard?.description || "N/A",
              unit: baseRateCard?.unit || "N/A",
              rate: rate,
              quantity: quantity,
              gstPercentage: gstPercentage,
              lineTotal: quantity * rate * (1 + gstPercentage / 100),
            };
          });

          setFormData({
            ...data,
            date: data.createdAt ? new Date(data.createdAt).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
            expiryDate: data.expiryDate ? new Date(data.expiryDate).toISOString().split("T")[0] : undefined,
            rateCardDetails: transformedRateCardDetails,
            // Ensure client is at least an empty object if not present, or handle null
            client: data.client || undefined,
          });
          setError(null);
        })
        .catch((err) => {
          setError(err.message || "Failed to fetch quotation data.");
          toast({ title: "Error", description: err.message, variant: "destructive" });
        })
        .finally(() => setIsLoading(false));
    } else if (!quotationId) {
        setError("No Quotation ID provided.");
        setIsLoading(false);
    }
    // Add dependency on allRateCards.length to re-run if they load after initial quotation fetch attempt
  }, [quotationId, toast, allRateCards]);


  const handleRateCardItemChange = (index: number, field: keyof QuotationRateCardItem, value: any) => {
    setFormData(prev => {
      if (!prev || !prev.rateCardDetails) return prev;
      const updatedItems = [...prev.rateCardDetails];
      const itemToUpdate = { ...updatedItems[index] };

      if (field === 'quantity' || field === 'gstPercentage') {
        itemToUpdate[field] = Number(value);
      } else {
        // itemToUpdate[field] = value; // For other fields if any were directly editable
      }

      // Recalculate lineTotal
      const quantity = field === 'quantity' ? Number(value) : itemToUpdate.quantity;
      const gstPercentage = field === 'gstPercentage' ? Number(value) : itemToUpdate.gstPercentage;
      itemToUpdate.lineTotal = itemToUpdate.rate * quantity * (1 + gstPercentage / 100);

      updatedItems[index] = itemToUpdate;

      // Recalculate overall totals (subtotal, gst, grandTotal)
      let newSubtotal = 0;
      let newGst = 0;
      updatedItems.forEach(item => {
        const itemSub = item.rate * item.quantity;
        newSubtotal += itemSub;
        newGst += itemSub * (item.gstPercentage / 100);
      });

      return {
        ...prev,
        rateCardDetails: updatedItems,
        subtotal: newSubtotal,
        gst: newGst,
        grandTotal: newSubtotal + newGst,
      };
    });
  };

  const handleClientSelect = (client: Client) => {
    setFormData(prev => ({ ...prev, clientId: client.id, client: client }));
  };

  const handleClientCreated = (newClient: Client) => {
    handleClientSelect(newClient); // Select the newly created client
    setIsClientDialogOpen(false); // Close the dialog
  };

  const handleSubmit = async () => {
    if (!formData || !formData.id) {
      toast({ title: "Error", description: "Quotation data is not loaded.", variant: "destructive" });
      return;
    }
    if (!formData.clientId) {
      toast({ title: "Validation Error", description: "Please select a client.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      const { client, ...payload } = formData; // Exclude client object from payload

      // Ensure rateCardDetails are in the format expected by the backend
      const rateCardDetailsForApi = formData.rateCardDetails?.map(item => ({
        rateCardId: item.rateCardId,
        quantity: Number(item.quantity),
        gstPercentage: Number(item.gstPercentage),
      }));

      const updatePayload: UpdateQuotationParams = {
        name: formData.name,
        clientId: formData.clientId,
        rateCardDetails: rateCardDetailsForApi,
        // other fields like notes, status, currency if they are part of formData and updatable
      };

      const updatedData = await updateQuotation(formData.id, updatePayload);

      // Assuming updatedData includes recalculated totals and potentially the populated client
      // Re-transform rateCardDetails for display if necessary, or rely on a full re-fetch/re-process
      const transformedDetailsAfterUpdate: QuotationRateCardItem[] = (updatedData.rateCardDetails || []).map((item: any) => {
        const baseRateCard = allRateCards.find(rc => rc.id === item.rateCardId);
        const quantity = Number(item.quantity) || 0;
        const gstPercentage = Number(item.gstPercentage) || 0;
        const rate = baseRateCard ? Number(baseRateCard.rate) : 0;
        return {
          ...item,
          description: baseRateCard?.description || "N/A",
          unit: baseRateCard?.unit || "N/A",
          rate: rate,
          quantity: quantity,
          gstPercentage: gstPercentage,
          lineTotal: quantity * rate * (1 + gstPercentage / 100),
        };
      });

      setFormData(prev => ({
        ...prev,
        ...updatedData, // Update with response from API
        rateCardDetails: transformedDetailsAfterUpdate, // Use re-transformed details
        client: prev?.client, // Preserve client details if not returned or to avoid flicker
      }));

      toast({ title: "Success", description: `Quotation ${updatedData.name || updatedData.id} updated.` });
      // router.push("/dashboard/quotations"); // Optionally navigate away
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to update quotation.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  // handleDelete function can be adapted similarly if needed
  const handleDelete = async () => {
    if (!formData.id) {
        toast({ title: "Error", description: "No quotation ID found to delete.", variant: "destructive" });
        return;
    }
    if (window.confirm("Are you sure you want to delete this quotation?")) {
        try {
            // Assuming there's a deleteQuotation service or use a generic apiRequest for DELETE
            // For now, this is a placeholder as the original file had it.
            // await deleteQuotation(formData.id);
            await apiRequest(`/api/quotations/${formData.id}`, { method: "DELETE" }); // Using generic for now
            toast({ title: "Success", description: "Quotation deleted." });
            router.push("/dashboard/quotations");
        } catch (error: any) {
            toast({ title: "Error deleting quotation", description: error.message, variant: "destructive" });
        }
    }
  };


  if (isLoading) return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /> Loading...</div>;
  if (error) return <div className="text-destructive p-4">Error: {error}</div>;
  if (!formData.id && !isLoading) return <div className="p-4">Quotation not found.</div>;


  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Edit Quotation {formData.name || formData.id}</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push("/dashboard/quotations")}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isSaving || isLoading}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Update
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isSaving || isLoading}><Trash2 className="mr-2 h-4 w-4" /> Delete</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>Client Details</CardTitle></CardHeader>
            <CardContent>
              <ClientSearch
                selectedClient={formData.client || null}
                onSelectClient={handleClientSelect}
                onCreateNewClient={() => setIsClientDialogOpen(true)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Quotation Info</CardTitle></CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quotationName">Quotation Name/Title</Label>
                <Input
                  id="quotationName"
                  value={formData.name || ""}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="quotationDate">Date</Label>
                <Input
                  id="quotationDate"
                  type="date"
                  value={formData.date || ""}
                  onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="expiryDate">Expiry Date (Optional)</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={formData.expiryDate || ""}
                  onChange={e => setFormData(prev => ({ ...prev, expiryDate: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status || "DRAFT"} onValueChange={value => setFormData(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="SENT">Sent</SelectItem>
                    <SelectItem value="ACCEPTED">Accepted</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Rate Card Items</CardTitle></CardHeader>
            <CardContent>
              <RateCardItemsTable
                items={formData.rateCardDetails || []}
                onItemChange={handleRateCardItemChange}
                onRemoveItem={() => {}} // Placeholder if not implementing remove
              />
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader><CardTitle>Summary & Actions</CardTitle></CardHeader>
            <CardContent>
              <Calculations
                subtotal={formData.subtotal || 0}
                gst={formData.gst || 0}
                grandTotal={formData.grandTotal || 0}
                currency={formData.currency || "INR"} // Default or from data
              />
              <div className="mt-6 space-y-2">
                 <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => {
                        if (!formData || !formData.id) {
                            toast({title: "Error", description: "Quotation data not loaded for PDF."}); return;
                        }
                        // Adapt generatePDF to accept QuotationFormData or map it
                        // generatePDF(formData as any); // May need mapping
                        toast({title: "Info", description: "PDF generation needs to be adapted."});
                    }}
                  >
                    <Printer className="mr-2 h-4 w-4" /> Generate PDF
                </Button>
                {/* Placeholder for other actions like "Send Mail" */}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
            <CardContent>
              <Textarea
                value={formData.notes || ""}
                onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Internal notes or notes for client..."
                rows={4}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <CreateClientDialog
        isOpen={isClientDialogOpen}
        onOpenChange={setIsClientDialogOpen}
        onClientCreated={handleClientCreated}
      />
    </div>
  );
};

export default EditQuotationPage;
