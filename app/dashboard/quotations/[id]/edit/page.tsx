"use client";

// Page for Editing Existing Quotation
import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Printer, Trash2, UserPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

// Service and schema for client creation
import { createClient } from "@/lib/services/client";
import { createClientSchema } from "@/lib/validations/clientSchema";
import { z } from "zod";

// Service imports
import {
  updateQuotation,
  UpdateQuotationParams,
} from "@/lib/services/quotations";
import { getAllRateCards } from "@/lib/services/rate-card";
import {
  getTicketsForSelection,
  TicketForSelection,
} from "@/lib/services/ticket";
import { useQuotationStore } from "@/store/quotationStore";

import apiRequest from "@/lib/axios";
import { useAuthStore } from "@/store/authStore";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Client {
  id: string;
  name: string;
  email?: string;
}

interface QuotationRateCardItem {
  rateCardId: string;
  description: string;
  unit: string;
  rate: number;
  quantity: number;
  gstPercentage: number;
  lineTotal: number;
}

interface QuotationFormData {
  id: string;
  name: string;
  quoteNo?: string;
  clientId: string;
  client?: Client;
  date: string;
  expiryDate?: string;
  rateCardDetails: QuotationRateCardItem[];
  status: string;
  notes?: string;
  currency?: string;
  subtotal: number;
  gst: number;
  grandTotal: number;
  pdfUrl?: string;
  ticketId?: string | null;
}

type CreateClientFormData = z.infer<typeof createClientSchema>;

interface RateCardItemsTableProps {
  items: QuotationRateCardItem[];
  onItemChange: (
    index: number,
    field: keyof QuotationRateCardItem,
    value: any,
  ) => void;
  onRemoveItem: (index: number) => void;
}

const RateCardItemsTable: React.FC<RateCardItemsTableProps> = ({
  items,
  onItemChange,
  onRemoveItem,
}) => {
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
            <TableHead className="w-[80px]">Actions</TableHead>
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
                  onChange={(e) =>
                    onItemChange(
                      index,
                      "quantity",
                      parseFloat(e.target.value) || 0,
                    )
                  }
                  className="w-full"
                  min="0"
                />
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  value={item.gstPercentage}
                  onChange={(e) =>
                    onItemChange(
                      index,
                      "gstPercentage",
                      parseFloat(e.target.value) || 0,
                    )
                  }
                  className="w-full"
                  min="0"
                />
              </TableCell>
              <TableCell>{item.lineTotal.toFixed(2)}</TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemoveItem(index)}
                  aria-label="Remove item"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {items.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center">
                No rate card items added.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

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
      <Input placeholder="Search Client..." disabled className="flex-grow" />
      {/* <Button onClick={() => onSelectClient({ id: "dummy-client-1", name: "Dummy Client Inc." })}>Select Dummy</Button> */}
      <Button variant="outline" onClick={onCreateNewClient}>
        <UserPlus className="mr-2 h-4 w-4" /> Create New
      </Button>
    </div>
    {selectedClient && (
      <div className="p-2 border rounded-md bg-muted mt-2">
        <p className="font-medium">Selected Client:</p>
        <p>
          <strong>Name:</strong> {selectedClient.name}
        </p>
        {selectedClient.email && (
          <p>
            <strong>Email:</strong> {selectedClient.email}
          </p>
        )}
      </div>
    )}
  </div>
);

const Calculations = ({
  subtotal,
  gst,
  grandTotal,
  currency,
}: {
  subtotal: number;
  gst: number;
  grandTotal: number;
  currency?: string;
}) => (
  <div className="mt-4 space-y-2">
    <div className="flex justify-between">
      <span>Subtotal:</span>{" "}
      <span>
        {currency} {subtotal.toFixed(2)}
      </span>
    </div>
    <div className="flex justify-between">
      <span>GST:</span>{" "}
      <span>
        {currency} {gst.toFixed(2)}
      </span>
    </div>
    <div className="flex justify-between font-bold">
      <span>Grand Total:</span>{" "}
      <span>
        {currency} {grandTotal.toFixed(2)}
      </span>
    </div>
  </div>
);

interface CreateClientDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onClientCreated: (client: Client) => void;
}

const CreateClientDialog: React.FC<CreateClientDialogProps> = ({
  isOpen,
  onOpenChange,
  onClientCreated,
}) => {
  const { toast } = useToast();
  const [isSubmittingDialog, setIsSubmittingDialog] = useState(false);
  const [dialogFormData, setDialogFormData] = useState<
    Partial<CreateClientFormData>
  >({
    type: "Bank",
    contractStatus: "Active",
    lastServiceDate: new Date().toISOString().split("T")[0],
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof CreateClientFormData, string>>
  >({});

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target;
    setDialogFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? parseInt(value, 10) : value,
    }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSelectChange = (
    name: keyof CreateClientFormData,
    value: string,
  ) => {
    setDialogFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleDialogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsSubmittingDialog(true);

    try {
      const validatedData = createClientSchema.parse(dialogFormData);
      const newClient = await createClient(validatedData);
      toast({
        title: "Success",
        description: "New client created successfully.",
      });
      onClientCreated(newClient as Client);
      onOpenChange(false);
      setDialogFormData({
        type: "Bank",
        contractStatus: "Active",
        lastServiceDate: new Date().toISOString().split("T")[0],
      });
      setErrors({});
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Partial<Record<keyof CreateClientFormData, string>> =
          {};
        error.errors.forEach((err) => {
          if (err.path[0])
            fieldErrors[err.path[0] as keyof CreateClientFormData] =
              err.message;
        });
        setErrors(fieldErrors);
        toast({
          title: "Validation Error",
          description: "Please check the form fields.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: `Failed to create client: ${(error as Error).message}`,
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmittingDialog(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Client</DialogTitle>
          <DialogDescription>
            Fill in the details below to add a new client.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleDialogSubmit} className="space-y-4 py-4">
          <div>
            <Label htmlFor="name_edit_dialog">Client Name</Label>
            <Input
              id="name_edit_dialog"
              name="name"
              value={dialogFormData.name || ""}
              onChange={handleInputChange}
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name}</p>
            )}
          </div>
          <div>
            <Label htmlFor="type_edit_dialog">Client Type</Label>
            <Select
              name="type"
              value={dialogFormData.type || "Bank"}
              onValueChange={(value) => handleSelectChange("type", value)}
            >
              <SelectTrigger id="type_edit_dialog">
                <SelectValue placeholder="Select client type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Bank">Bank</SelectItem>
                <SelectItem value="NBFC">NBFC</SelectItem>
                <SelectItem value="Insurance">Insurance</SelectItem>
                <SelectItem value="Corporate">Corporate</SelectItem>
              </SelectContent>
            </Select>
            {errors.type && (
              <p className="text-red-500 text-xs mt-1">{errors.type}</p>
            )}
          </div>
          <div>
            <Label htmlFor="totalBranches_edit_dialog">Total Branches</Label>
            <Input
              id="totalBranches_edit_dialog"
              name="totalBranches"
              type="number"
              value={dialogFormData.totalBranches || ""}
              onChange={handleInputChange}
            />
            {errors.totalBranches && (
              <p className="text-red-500 text-xs mt-1">
                {errors.totalBranches}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="contactPerson_edit_dialog">Contact Person</Label>
            <Input
              id="contactPerson_edit_dialog"
              name="contactPerson"
              value={dialogFormData.contactPerson || ""}
              onChange={handleInputChange}
            />
            {errors.contactPerson && (
              <p className="text-red-500 text-xs mt-1">
                {errors.contactPerson}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="contactPhone_edit_dialog">Contact Phone</Label>
            <Input
              id="contactPhone_edit_dialog"
              name="contactPhone"
              value={dialogFormData.contactPhone || ""}
              onChange={handleInputChange}
            />
            {errors.contactPhone && (
              <p className="text-red-500 text-xs mt-1">{errors.contactPhone}</p>
            )}
          </div>
          <div>
            <Label htmlFor="contactEmail_edit_dialog">
              Contact Email (Optional)
            </Label>
            <Input
              id="contactEmail_edit_dialog"
              name="contactEmail"
              type="email"
              value={dialogFormData.contactEmail || ""}
              onChange={handleInputChange}
            />
            {errors.contactEmail && (
              <p className="text-red-500 text-xs mt-1">{errors.contactEmail}</p>
            )}
          </div>
          <div>
            <Label htmlFor="contractStatus_edit_dialog">Contract Status</Label>
            <Select
              name="contractStatus"
              value={dialogFormData.contractStatus || "Active"}
              onValueChange={(value) =>
                handleSelectChange("contractStatus", value)
              }
            >
              <SelectTrigger id="contractStatus_edit_dialog">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            {errors.contractStatus && (
              <p className="text-red-500 text-xs mt-1">
                {errors.contractStatus}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="lastServiceDate_edit_dialog">
              Last Service Date
            </Label>
            <Input
              id="lastServiceDate_edit_dialog"
              name="lastServiceDate"
              type="date"
              value={dialogFormData.lastServiceDate || ""}
              onChange={handleInputChange}
            />
            {errors.lastServiceDate && (
              <p className="text-red-500 text-xs mt-1">
                {errors.lastServiceDate}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="gstn_edit_dialog">GSTN (Optional)</Label>
            <Input
              id="gstn_edit_dialog"
              name="gstn"
              value={dialogFormData.gstn || ""}
              onChange={handleInputChange}
            />
          </div>
          <div>
            <Label htmlFor="avatar_edit_dialog">Avatar URL (Optional)</Label>
            <Input
              id="avatar_edit_dialog"
              name="avatar"
              value={dialogFormData.avatar || ""}
              onChange={handleInputChange}
            />
          </div>
          <div>
            <Label htmlFor="initials_edit_dialog">Initials (Optional)</Label>
            <Input
              id="initials_edit_dialog"
              name="initials"
              value={dialogFormData.initials || ""}
              onChange={handleInputChange}
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmittingDialog}>
              {isSubmittingDialog && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}{" "}
              Create Client
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

interface EditQuotationPageProps {
  params: {
    id: string;
  };
}

const EditQuotationPage: React.FC<EditQuotationPageProps> = ({ params }) => {
  const { id: quotationId } = params;
  const router = useRouter();
  const { toast } = useToast();

  const [formData, setFormData] = useState<Partial<QuotationFormData>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false);

  const [allRateCards, setAllRateCards] = useState<any[]>([]);
  const [ticketsForSelection, setTicketsForSelection] = useState<
    TicketForSelection[]
  >([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState<boolean>(true);

  // State for Rate Card Search
  const [rateCardSearchQuery, setRateCardSearchQuery] = useState<string>("");
  const [rateCardSearchResults, setRateCardSearchResults] = useState<any[]>([]);
  const [isSearchingRateCards, setIsSearchingRateCards] =
    useState<boolean>(false);
  const rateCardSearchDebounceRef = React.useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoadingTickets(true);
      try {
        const rateCardsPromise = getAllRateCards({ limit: 1000 });
        const ticketsPromise = getTicketsForSelection();

        const [rateCardsResponse, ticketsData] = await Promise.all([
          rateCardsPromise,
          ticketsPromise,
        ]);

        setAllRateCards(rateCardsResponse.data || []);
        setTicketsForSelection(ticketsData || []);
      } catch (err) {
        console.error("Failed to fetch initial data:", err);
        toast({
          title: "Error",
          description: "Could not load required data (rate cards or tickets).",
          variant: "destructive",
        });
      } finally {
        setIsLoadingTickets(false);
      }
    };
    fetchInitialData();
  }, [toast]);

  useEffect(() => {
    if (quotationId) {
      setIsLoading(true);
      getQuotationById(quotationId)
        .then((data: any) => {
          const transformedRateCardDetails: QuotationRateCardItem[] = (
            allRateCards.length > 0 && data.rateCardDetails
              ? data.rateCardDetails
              : []
          ).map((item: any) => {
            const baseRateCard = allRateCards.find(
              (rc) => rc.id === item.rateCardId,
            );
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
            date: data.createdAt
              ? new Date(data.createdAt).toISOString().split("T")[0]
              : new Date().toISOString().split("T")[0],
            expiryDate: data.expiryDate
              ? new Date(data.expiryDate).toISOString().split("T")[0]
              : undefined,
            rateCardDetails: transformedRateCardDetails,
            client: data.client || undefined,
            ticketId: data.ticketId || null,
            quoteNo: data.quoteNo || "", // Ensure quoteNo is populated
          });
          setError(null);
        })
        .catch((err) => {
          setError(err.message || "Failed to fetch quotation data.");
          toast({
            title: "Error",
            description: err.message,
            variant: "destructive",
          });
        })
        .finally(() => setIsLoading(false));
    } else if (!quotationId) {
      setError("No Quotation ID provided.");
      setIsLoading(false);
    }
  }, [quotationId, toast, allRateCards]);

  // Debounced Rate Card Search
  useEffect(() => {
    if (rateCardSearchDebounceRef.current) {
      clearTimeout(rateCardSearchDebounceRef.current);
    }
    if (rateCardSearchQuery.trim() === "") {
      setRateCardSearchResults([]);
      setIsSearchingRateCards(false);
      return;
    }
    setIsSearchingRateCards(true);
    rateCardSearchDebounceRef.current = setTimeout(() => {
      const searchLower = rateCardSearchQuery.toLowerCase();
      const results = allRateCards.filter(
        (rc) =>
          (rc.description &&
            rc.description.toLowerCase().includes(searchLower)) ||
          (rc.productDescription &&
            rc.productDescription.toLowerCase().includes(searchLower)) ||
          (rc.bankRcNo && rc.bankRcNo.toLowerCase().includes(searchLower)),
      );
      setRateCardSearchResults(results);
      setIsSearchingRateCards(false);
    }, 500);

    return () => {
      if (rateCardSearchDebounceRef.current) {
        clearTimeout(rateCardSearchDebounceRef.current);
      }
    };
  }, [rateCardSearchQuery, allRateCards]);

  const handleAddRateCardItemToQuotation = (rateCard: any) => {
    const newItem: QuotationRateCardItem = {
      rateCardId: rateCard.id,
      description: rateCard.description || rateCard.productDescription || "N/A",
      unit: rateCard.unit || "N/A",
      rate: parseFloat(rateCard.rate || rateCard.unitPrice || "0"),
      quantity: 1, // Default quantity
      gstPercentage: 18, // Default GST
      lineTotal:
        parseFloat(rateCard.rate || rateCard.unitPrice || "0") *
        1 *
        (1 + 18 / 100),
    };

    setFormData((prev) => {
      if (!prev) return prev;
      const updatedItems = [...(prev.rateCardDetails || []), newItem];

      let newSubtotal = 0;
      let newGst = 0;
      updatedItems.forEach((item) => {
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
    setRateCardSearchQuery(""); // Clear search query
    setRateCardSearchResults([]); // Clear search results
    toast({
      title: "Item Added",
      description: `${newItem.description} added to quotation.`,
    });
  };

  const handleRateCardItemChange = (
    index: number,
    field: keyof QuotationRateCardItem,
    value: any,
  ) => {
    setFormData((prev) => {
      if (!prev || !prev.rateCardDetails) return prev;
      const updatedItems = [...prev.rateCardDetails];
      const itemToUpdate = { ...updatedItems[index] };

      if (field === "quantity" || field === "gstPercentage") {
        itemToUpdate[field] = Number(value);
      }

      const quantity =
        field === "quantity" ? Number(value) : itemToUpdate.quantity;
      const gstPercentage =
        field === "gstPercentage" ? Number(value) : itemToUpdate.gstPercentage;
      itemToUpdate.lineTotal =
        itemToUpdate.rate * quantity * (1 + gstPercentage / 100);

      updatedItems[index] = itemToUpdate;

      let newSubtotal = 0;
      let newGst = 0;
      updatedItems.forEach((item) => {
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

  const handleRemoveRateCardItem = (indexToRemove: number) => {
    setFormData((prev) => {
      if (!prev || !prev.rateCardDetails) return prev;
      const updatedItems = prev.rateCardDetails.filter(
        (_, index) => index !== indexToRemove,
      );

      let newSubtotal = 0;
      let newGst = 0;
      updatedItems.forEach((item) => {
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
    toast({
      title: "Item Removed",
      description: "Rate card item removed from quotation.",
    });
  };

  const handleClientSelect = (client: Client) => {
    setFormData((prev) => ({ ...prev, clientId: client.id, client: client }));
  };

  const handleClientCreated = (newClient: Client) => {
    handleClientSelect(newClient);
    setIsClientDialogOpen(false);
  };

  const handleSubmit = async () => {
    if (!formData || !formData.id) {
      toast({
        title: "Error",
        description: "Quotation data is not loaded.",
        variant: "destructive",
      });
      return;
    }
    if (!formData.clientId) {
      toast({
        title: "Validation Error",
        description: "Please select a client.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const { client, ...payload } = formData;

      const rateCardDetailsForApi = formData.rateCardDetails?.map((item) => ({
        rateCardId: item.rateCardId,
        quantity: Number(item.quantity),
        gstPercentage: Number(item.gstPercentage),
      }));

      const updatePayload: UpdateQuotationParams = {
        name: formData.name, // This is now Quotation Title
        clientId: formData.clientId,
        rateCardDetails: rateCardDetailsForApi,
        ticketId: formData.ticketId || "",
        // quoteNo is not part of UpdateQuotationParams as it's system-generated and shouldn't be updated by user
      };

      const updatedData = await updateQuotation(formData.id, updatePayload);

      const transformedDetailsAfterUpdate: QuotationRateCardItem[] = (
        updatedData.rateCardDetails || []
      ).map((item: any) => {
        const baseRateCard = allRateCards.find(
          (rc) => rc.id === item.rateCardId,
        );
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

      setFormData((prev) => ({
        ...prev,
        ...updatedData,
        rateCardDetails: transformedDetailsAfterUpdate,
        client: prev?.client,
        ticketId: updatedData.ticketId,
        quoteNo: updatedData.quoteNo, // Ensure quoteNo is updated from response
      }));

      toast({
        title: "Success",
        description: `Quotation ${updatedData.quoteNo} updated.`,
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to update quotation.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!formData.id) {
      toast({
        title: "Error",
        description: "No quotation ID found to delete.",
        variant: "destructive",
      });
      return;
    }
    if (window.confirm("Are you sure you want to delete this quotation?")) {
      try {
        await apiRequest(`/api/quotations/${formData.id}`, {
          method: "DELETE",
        });
        toast({ title: "Success", description: "Quotation deleted." });
        router.push("/dashboard/quotations");
      } catch (error: any) {
        toast({
          title: "Error deleting quotation",
          description: error.message,
          variant: "destructive",
        });
      }
    }
  };

  if (isLoading && !formData.id)
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" /> Loading...
      </div>
    );
  if (error) return <div className="text-destructive p-4">Error: {error}</div>;
  if (!formData.id && !isLoading)
    return <div className="p-4">Quotation not found.</div>;

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">
          Edit Quotation {formData.quoteNo || `(ID: ${formData.id})`}
        </h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/quotations")}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving || isLoading}>
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}{" "}
            Update
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isSaving || isLoading}
          >
            <Trash2 className="mr-2 h-4 w-4" /> Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Client Details</CardTitle>
            </CardHeader>
            <CardContent>
              <ClientSearch
                selectedClient={formData.client || null}
                onSelectClient={handleClientSelect}
                onCreateNewClient={() => setIsClientDialogOpen(true)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quotation Info</CardTitle>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quotationNumberDisplay">Quotation Number</Label>
                <Input
                  id="quotationNumberDisplay"
                  value={formData.quoteNo || ""}
                  readOnly
                />
              </div>
              <div>
                <Label htmlFor="quotationName">Quotation Title</Label>
                <Input
                  id="quotationName"
                  value={formData.name || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="E.g., Supply of Office Stationery"
                />
              </div>
              <div>
                <Label htmlFor="quotationDate">Date</Label>
                <Input
                  id="quotationDate"
                  type="date"
                  value={formData.date || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, date: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="expiryDate">Expiry Date (Optional)</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={formData.expiryDate || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      expiryDate: e.target.value,
                    }))
                  }
                />
              </div>
              {/* Status field removed */}
              <div>
                <Label htmlFor="linkedTicket">Linked Ticket (Optional)</Label>
                <Select
                  value={formData.ticketId || ""}
                  onValueChange={(value) => {
                    setFormData((prev) => ({
                      ...prev,
                      ticketId: value === "" ? null : value,
                    }));
                  }}
                  disabled={isLoadingTickets || isLoading}
                >
                  <SelectTrigger id="linkedTicket">
                    <SelectValue
                      placeholder={
                        isLoadingTickets
                          ? "Loading tickets..."
                          : "Select a ticket"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      None - No ticket linked
                    </SelectItem>
                    {ticketsForSelection.map((ticket) => (
                      <SelectItem key={ticket.id} value={ticket.id}>
                        {ticket.ticketId} - {ticket.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Rate Card Items</CardTitle>
            </CardHeader>
            <CardContent>
              <RateCardItemsTable
                items={formData.rateCardDetails || []}
                onItemChange={handleRateCardItemChange}
                onRemoveItem={handleRemoveRateCardItem}
              />
              <div className="mt-4 space-y-2">
                <Label htmlFor="rateCardSearch">Add Rate Card Item</Label>
                <div className="flex space-x-2">
                  <Input
                    id="rateCardSearch"
                    placeholder="Search rate cards by name or description..."
                    value={rateCardSearchQuery}
                    onChange={(e) => setRateCardSearchQuery(e.target.value)}
                    className="flex-grow"
                  />
                  {isSearchingRateCards && (
                    <Loader2 className="h-5 w-5 animate-spin self-center" />
                  )}
                </div>
                {rateCardSearchResults.length > 0 && (
                  <div className="border rounded-md max-h-60 overflow-y-auto">
                    {rateCardSearchResults.map((rc) => (
                      <div
                        key={rc.id}
                        className="p-2 hover:bg-accent cursor-pointer border-b last:border-b-0"
                        onClick={() => handleAddRateCardItemToQuotation(rc)}
                      >
                        <p className="font-medium">
                          {rc.description || rc.productDescription}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Unit: {rc.unit} | Rate: {rc.rate || rc.unitPrice}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
                {rateCardSearchQuery.trim() &&
                  !isSearchingRateCards &&
                  rateCardSearchResults.length === 0 && (
                    <div className="text-sm text-muted-foreground p-2 text-center">
                      No rate cards found.
                    </div>
                  )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Summary & Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <Calculations
                subtotal={formData.subtotal || 0}
                gst={formData.gst || 0}
                grandTotal={formData.grandTotal || 0}
                currency={formData.currency || "INR"}
              />
              <div className="mt-6 space-y-2">
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => {
                    if (
                      formData.pdfUrl &&
                      typeof formData.pdfUrl === "string" &&
                      formData.pdfUrl.trim() !== ""
                    ) {
                      window.open(formData.pdfUrl, "_blank");
                    } else {
                      toast({
                        title: "PDF Not Available",
                        description:
                          "The PDF for this quotation has not been generated or the URL is missing. Please save the quotation or try generating the PDF if applicable.",
                        variant: "default",
                      });
                    }
                  }}
                  disabled={!formData.pdfUrl}
                >
                  <Printer className="mr-2 h-4 w-4" /> View PDF
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.notes || ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, notes: e.target.value }))
                }
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
