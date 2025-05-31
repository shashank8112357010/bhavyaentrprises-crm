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
}

interface RateCardDetail {
  rateCardId: string;
  quantity: number;
  gstType: number;
}

export function NewQuotationDialog({ onSuccess }: NewQuotationDialogProps) {
  const [open, setOpen] = useState(false);
  const [clientId, setClientId] = useState<string>("");
  const [rateCards, setRateCards] = useState<any[]>([]);
  const [rateCardsBackup, setRateCardsBackup] = useState<any[]>([]);
  const [selectedRates, setSelectedRates] = useState<RateCardDetail[]>([]);
  const { clients, fetchClients } = useClientStore();
  const [ticketId, setTicketId] = useState<string>("");
  const { all_tickets, fetchTickets } = useTicketStore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [loading, setLoading] = useState(false);
  const startDate = "1970-01-01";
  const endDate = "2100-12-31";

  useEffect(() => {
    fetchClients();
    fetchTickets({ startDate, endDate });
  }, [fetchClients, fetchTickets]);

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

    const form = e.target as typeof e.target & {
      description: { value: string };
      date: { value: string };
      remarks: { value: string };
    };
    const name = form.description.value;

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
    console.log("Selected Rates:", selectedRates);

    try {
      await createQuotation({
        name,
        clientId,
        rateCardDetails: selectedRates,
        ticketId: ticketId || undefined,
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
    if (ticketId) {
      const selectedTicket = all_tickets?.find((ticket: any) => ticket.id === ticketId);
      if (selectedTicket?.client?.id) {
        setClientId(selectedTicket.client.id);
      }
    }
  }, [ticketId, all_tickets]);

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
              <Select value={ticketId} onValueChange={setTicketId}>
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
              <Select value={clientId} onValueChange={setClientId} disabled={true}>
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
              <Label htmlFor="description">Work Details</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Enter work details"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label>Rate Card Items</Label>

              {selectedRates.filter((r) => r.quantity > 0).length > 0 && (
                <div className="flex flex-wrap gap-2">
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
                          className="flex items-center gap-1 border px-2 py-1 rounded-full text-sm"
                        >
                          {rc.srNo}. {rc.description} (x{r.quantity}, GST: {r.gstType}%)
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
                      <div className="text-sm flex-1">
                        {rc.srNo}. {rc.description} - ₹{rc.rate}
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
              <Label htmlFor="remarks">Additional Remarks</Label>
              <Textarea
                id="remarks"
                name="remarks"
                placeholder="Enter any additional remarks"
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
