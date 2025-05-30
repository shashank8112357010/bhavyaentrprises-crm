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

export function NewQuotationDialog({ onSuccess }: NewQuotationDialogProps) {
  const [open, setOpen] = useState(false);
  const [clientId, setClientId] = useState<string>("");
  const [rateCards, setRateCards] = useState<any[]>([]);
  const [rateCardsBackup, setRateCardsBackup] = useState<any[]>([]);
  const [selectedRates, setSelectedRates] = useState<
    { id: string; qty: number }[]
  >([]);
  const { clients, fetchClients } = useClientStore();
  const [ticketId, setTicketId] = useState<string>("");
  const { all_tickets, fetchTickets } = useTicketStore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchClients();
    fetchTickets();
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

  const handleRateCardQtyChange = (id: string, qty: number) => {
    setSelectedRates((prev) => {
      const existing = prev.find((r) => r.id === id);
      if (existing) {
        return qty > 0
          ? prev.map((r) => (r.id === id ? { ...r, qty } : r))
          : prev.filter((r) => r.id !== id);
      } else {
        return qty > 0 ? [...prev, { id, qty }] : prev;
      }
    });
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

    const rateCardIds: string[] = [];
    selectedRates.forEach(({ id, qty }) => {
      for (let i = 0; i < qty; i++) {
        rateCardIds.push(id);
      }
    });

    try {
      await createQuotation({
        name,
        clientId,
        rateCardIds,
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
              <Label htmlFor="client">Client</Label>
              <Select value={clientId} onValueChange={setClientId}>
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
              <Label htmlFor="ticket">Ticket</Label>
              <Select value={ticketId} onValueChange={setTicketId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select ticket (optional)" />
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

              {selectedRates.filter((r) => r.qty > 0).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedRates
                    .filter((r) => r.qty > 0)
                    .map((r) => {
                      const rc =
                        rateCards.find((item) => item.id === r.id) ||
                        rateCardsBackup.find((item) => item.id === r.id);
                      if (!rc) return null;
                      return (
                        <div
                          key={r.id}
                          className="flex items-center gap-1 border  px-2 py-1 rounded-full text-sm"
                        >
                          {rc.srNo}. {rc.description} (x{r.qty})
                          <button
                            type="button"
                            className="ml-1 text-red-500"
                            onClick={() =>
                              setSelectedRates((prev) =>
                                prev.filter((item) => item.id !== r.id)
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
                  const selected = selectedRates.find((r) => r.id === rc.id);
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
                        className="w-20"
                        value={selected?.qty ?? ""}
                        onChange={(e) =>
                          handleRateCardQtyChange(rc.id, Number(e.target.value))
                        }
                      />
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
