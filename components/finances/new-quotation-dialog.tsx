"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useClientStore } from "@/store/clientStore";
import { getAllRateCards } from "@/lib/services/rate-card";
import { createQuotation } from "@/lib/services/quotations";
import { useTicketStore } from "@/store/ticketStore";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/useDebounce";
import { Spinner } from "../ui/spinner";

interface NewQuotationDialogProps {
  onSuccess?: () => void;
  initialTicketId?: string; // Added
  initialClientId?: string; // Added
}

interface RateCardDetail {
  rateCardId: string;
  quantity: number;
  gstType: number;
}

export function NewQuotationDialog({ onSuccess, initialTicketId, initialClientId }: NewQuotationDialogProps) {
  const [open, setOpen] = useState(false);
  const [clientId, setClientId] = useState<string>(initialClientId || "");
  const [rateCards, setRateCards] = useState<any[]>([]);
  const [rateCardsBackup, setRateCardsBackup] = useState<any[]>([]);
  const [selectedRates, setSelectedRates] = useState<RateCardDetail[]>([]);
  const { clients, fetchClients } = useClientStore();
  const [ticketId, setTicketId] = useState<string>(initialTicketId || "");
  const { all_tickets, fetchTickets } = useTicketStore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [loading, setLoading] = useState(false);
  
  // New fields state - Phase 1
  const [quotationName, setQuotationName] = useState(""); // For "Work Details"
  const [expiryDate, setExpiryDate] = useState<string>("");
  const [currency, setCurrency] = useState<string>("INR");
  const [notes, setNotesValue] = useState<string>(""); // Renamed from 'notes' to avoid conflict if 'notes' prop exists

  const startDate = "1970-01-01";
  const endDate = "2100-12-31";

  useEffect(() => {
    const shouldFetchTickets = !initialTicketId || (initialTicketId && !all_tickets.some((t: any) => t.id === initialTicketId));
    if (shouldFetchTickets) {
      fetchTickets({ startDate, endDate });
    }

    const clientIsSetByInitialTicket = initialTicketId && clientId;
    const shouldFetchClients = !clientIsSetByInitialTicket && (!initialClientId || (initialClientId && !clients.some((c: any) => c.id === initialClientId)));

    if (shouldFetchClients) {
      fetchClients();
    }
  }, [fetchClients, fetchTickets, initialTicketId, initialClientId, clientId, all_tickets, clients]);

  useEffect(() => {
    fetchRateCards(debouncedSearch);
  }, [debouncedSearch]);

  const fetchRateCards = async (search: string = "") => {
    try {
      const data = await getAllRateCards({ limit: 3, searchQuery: search });
      setRateCards(data?.data || []);
      setRateCardsBackup((prev) => {
        const all = [...prev];
        data?.data?.forEach((item: any) => {
          if (!all.find((r) => r.id === item.id)) {
            all.push(item);
          }
        });
        return all;
      });
    } catch (error) {
      console.error("Failed to fetch rate cards", error);
      toast({
        title: "Error",
        description: "Failed to load rate cards",
        variant: "destructive",
      });
    }
  };

  const handleRateCardQtyChange = (rateCardId: string, quantity: number) => {
    setSelectedRates((prev) => {
      const existing = prev.find((r) => r.rateCardId === rateCardId);
      if (existing) {
        return quantity > 0
          ? prev.map((r) => (r.rateCardId === rateCardId ? { ...r, quantity } : r))
          : prev.filter((r) => r.rateCardId !== rateCardId);
      } else {
        return quantity > 0 ? [...prev, { rateCardId, quantity, gstType: 18 }] : prev;
      }
    });
  };

  const handleGstTypeChange = (rateCardId: string, gstType: number) => {
    setSelectedRates((prev) =>
      prev.map((r) => (r.rateCardId === rateCardId ? { ...r, gstType } : r))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // const form = e.target as typeof e.target & { // No longer using direct form access for these
    //   description: { value: string };
    //   // date: { value: string }; // Date is handled by state or default
    //   remarks: { value: string };
    // };
    // const name = form.description.value; // Using quotationName state
    // const notes = form.remarks.value; // Using notesValue state
    const quotationDate = (e.target as any).date.value; // Keep date from form directly for now

    if (!quotationName.trim()) {
        setLoading(false);
        toast({ title: "Error", description: "Work Details (Quotation Name) is required.", variant: "destructive" });
        return;
    }
    if (!clientId) {
      setLoading(false);
      toast({
        title: "Error",
        description: "Please select a client",
        variant: "destructive",
      });
      return;
    }

    if (selectedRates.length === 0) {
      setLoading(false);
      toast({
        title: "Error",
        description: "Please select at least one rate card item with quantity",
        variant: "destructive",
      });
      return;
    }

    // Log selectedRates to ensure it's correctly structured

    try {
      // Ensure createQuotation service can handle all these fields.
      // The backend API /api/quotations/create-quotations will handle defaults for status, currency if not provided.
      // It will also recalculate totals.
      await createQuotation({
        name: quotationName,
        clientId,
        rateCardDetails: selectedRates,
        ticketId: ticketId || undefined,
        status: "DRAFT", // Default status
        expiryDate: expiryDate || undefined,
        currency: currency || "INR",
        notes: notesValue || undefined,
        // Date is also part of the quotation, ensure it's passed if not handled by backend default.
        // The backend schema doesn't explicitly list `date` but it's a common field.
        // For now, assuming backend handles date if not explicitly passed or `createQuotation` service adds it.
        // The original code had a date field, so it should be passed.
        date: quotationDate ? new Date(quotationDate) : new Date(), // Pass the date
      });
      toast({
        title: "Success",
        description: "Quotation created successfully!",
      });
      setOpen(false);
      setClientId("");
      setTicketId("");
      setSelectedRates([]);
      setSearchTerm("");
      // Reset new fields
      setQuotationName("");
      setExpiryDate("");
      setCurrency("INR");
      setNotesValue("");
      
      onSuccess?.();
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.error("Failed to create quotation", error);
      toast({
        title: "Error",
        description: "Failed to create quotation",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (initialTicketId) {
      // Always set ticketId state if initialTicketId is provided
      setTicketId(initialTicketId);
      const selectedTicket = all_tickets?.find((ticket: any) => ticket.id === initialTicketId);
      if (selectedTicket?.client?.id) {
        setClientId(selectedTicket.client.id);
      } else if (initialClientId) {
        // If ticket not in all_tickets (e.g. list is stale/not loaded yet) but initialClientId was given
        setClientId(initialClientId);
      } else {
        // Ticket not found and no initialClientId given, clear client or wait for all_tickets to load.
        // Setting to "" might be premature if all_tickets is loading.
        // However, if all_tickets has loaded and ticket not found, then "" is correct.
        if(all_tickets && all_tickets.length > 0 || !initialTicketId) setClientId("");
      }
    } else if (initialClientId) {
      // Only initialClientId is provided (no initialTicketId)
      setClientId(initialClientId);
      // ticketId remains user-selectable or empty, so clear it if it's not meant to be set.
      // setTicketId(""); // Or not, if user might have selected one before client was initialised.
    } else if (ticketId) {
      // This is for manual ticket selection when dialog is not pre-filled
      const selectedTicket = all_tickets?.find((ticket: any) => ticket.id === ticketId);
      if (selectedTicket?.client?.id) {
        setClientId(selectedTicket.client.id);
      } else {
        setClientId(""); // Reset client if selected ticket has no client
      }
    } else {
      // No initial values, no manual selection, so client should be empty
      setClientId("");
    }
  }, [initialTicketId, initialClientId, ticketId, all_tickets]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Quotation
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] overflow-y-auto max-h-screen">
        <DialogHeader>
          <DialogTitle>Create New Quotation</DialogTitle>
          <DialogDescription>
            Create a new quotation for a client.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                name="date"
                type="date"
                defaultValue={new Date().toISOString().split("T")[0]}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ticket">Ticket</Label>
              <Select value={ticketId} onValueChange={setTicketId} disabled={!!initialTicketId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select ticket" />
                </SelectTrigger>
                <SelectContent>
                  {all_tickets?.map((ticket: any) => (
                    <SelectItem key={ticket.id} value={ticket.id}>
                      {ticket.title || ticket.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="client">Client</Label>
              <Select value={clientId} onValueChange={setClientId} disabled={!!initialTicketId || !!initialClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="quotationName">Work Details (Quotation Name)</Label>
              <Textarea
                id="quotationName"
                name="quotationName" // Name attribute for form submission if not using state directly
                placeholder="Enter work details / quotation name"
                value={quotationName}
                onChange={(e) => setQuotationName(e.target.value)}
                required
              />
            </div>
            
            {/* New Fields - Phase 1 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="expiryDate">Expiry Date</Label>
                <Input 
                  id="expiryDate" 
                  name="expiryDate" 
                  type="date" 
                  value={expiryDate} 
                  onChange={(e) => setExpiryDate(e.target.value)} 
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="currency">Currency</Label>
                <Input 
                  id="currency" 
                  name="currency" 
                  type="text" 
                  value={currency} 
                  onChange={(e) => setCurrency(e.target.value.toUpperCase())} 
                  placeholder="e.g., INR"
                />
              </div>
            </div>


            <div className="grid gap-2">
              <Label>Rate Card Items</Label>

              {selectedRates.filter((r) => r.quantity > 0).length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2 p-2 border rounded-md bg-muted">
                  {selectedRates
                    .filter((r) => r.quantity > 0)
                    .map((r) => {
                      const rc =
                        rateCards.find((item) => item.id === r.rateCardId) ||
                        rateCardsBackup.find((item) => item.id === r.rateCardId);
                      if (!rc) return null;
                      return (
                        <div
                          key={r.rateCardId}
                          className="flex items-center gap-1 border bg-background px-2 py-1 rounded-full text-xs" // Changed to text-xs for compactness
                        >
                          {rc.description} ({rc.unit || 'N/A'}) x{r.quantity} @ {rc.rate} (GST: {r.gstType}%) {/* Added unit and rate */}
                          <button
                            type="button"
                            className="ml-1 text-red-500"
                            onClick={() =>
                              setSelectedRates((prev) =>
                                prev.filter((item) => item.rateCardId !== r.rateCardId)
                              )
                            }
                          >
                            ×
                          </button>
                        </div>
                      );
                    })}
                </div>
              )}

              <Input
                type="search"
                placeholder="Search rate card..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />

              <div className="grid gap-2 max-h-[200px] overflow-y-auto">
                {rateCards.map((rc) => {
                  const selected = selectedRates.find((r) => r.rateCardId === rc.id);
                  return (
                    <div
                      key={rc.id}
                      className="flex items-center justify-between gap-2"
                    >
                      <div className="text-sm flex-1 truncate" title={`${rc.description} (Unit: ${rc.unit || 'N/A'}) - Rate: ₹${rc.rate}`}>
                        {rc.srNo}. {rc.description} (Unit: {rc.unit || 'N/A'}) - ₹{rc.rate} {/* Display unit here - Phase 2 */}
                      </div>
                      <Input
                        type="number"
                        min={0}
                        placeholder="Qty"
                        className="w-20"
                        value={selected?.quantity ?? ""}
                        onChange={(e) =>
                          handleRateCardQtyChange(rc.id, Number(e.target.value))
                        }
                      />
                      <Select
                        value={selected?.gstType?.toString() || "18"}
                        onValueChange={(value) =>
                          handleGstTypeChange(rc.id, Number(value))
                        }
                      >
                        <SelectTrigger className="w-[80px]">
                          <SelectValue placeholder="GST" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="18">18%</SelectItem>
                          <SelectItem value="28">28%</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Additional Remarks / Notes</Label>
              <Textarea
                id="notes"
                name="notes" // Name attribute for form submission if not using state directly
                placeholder="Enter any additional remarks or notes for the quotation"
                value={notesValue}
                onChange={(e) => setNotesValue(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? <Spinner size="4" /> : "Add Quotation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
