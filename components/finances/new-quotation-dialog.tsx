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
import { IndianRupee, Plus } from "lucide-react";
import { useClientStore } from "@/store/clientStore";
import { getAllRateCards } from "@/lib/services/rate-card";
import { createQuotation } from "@/lib/services/quotations";

export function NewQuotationDialog() {
  const [open, setOpen] = useState(false);
  const [clientId, setClientId] = useState<string>("");
  const [rateCards, setRateCards] = useState<any[]>([]);
  const [selectedRates, setSelectedRates] = useState<{ id: string; qty: number }[]>([]);
  const { clients, fetchClients } = useClientStore();

  useEffect(() => {
    fetchClients();
    fetchRateCards();
  }, [fetchClients]);

  const fetchRateCards = async () => {
    try {
      const data = await getAllRateCards({ limit: 100 });
      setRateCards(data?.data || []);
    } catch (error) {
      console.error("Failed to fetch rate cards", error);
    }
  };

  const handleRateCardQtyChange = (id: string, qty: number) => {
    setSelectedRates((prev) => {
      const existing = prev.find((r) => r.id === id);
      if (existing) {
        return prev.map((r) => (r.id === id ? { ...r, qty } : r));
      } else {
        return [...prev, { id, qty }];
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const name = (e.target as any).description.value;
    const rateCardIds: string[] = [];
    selectedRates.forEach(({ id, qty }) => {
      for (let i = 0; i < qty; i++) {
        rateCardIds.push(id);
      }
    });

    try {
      const result = await createQuotation({
        name,
        clientId,
        rateCardIds,
      });
      console.log("Quotation created:", result);
      setOpen(false);
    } catch (error) {
      console.error("Failed to create quotation", error);
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
          <DialogDescription>Create a new quotation for a client.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" defaultValue={new Date().toISOString().split("T")[0]} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="client">Client</Label>
              <Select onValueChange={setClientId}>
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
              <Textarea id="description" placeholder="Enter work details" required />
            </div>
            <div className="grid gap-2">
              <Label>Rate Card Items</Label>
              <div className="grid gap-2 max-h-[200px] overflow-y-auto">
                {rateCards.map((rc) => (
                  <div key={rc.id} className="flex items-center justify-between gap-2">
                    <div className="text-sm flex-1">
                      {rc.srNo}. {rc.description} - ₹{rc.rate}
                    </div>
                    <Input
                      type="number"
                      min={0}
                      placeholder="Qty"
                      className="w-20"
                      onChange={(e) => handleRateCardQtyChange(rc.id, Number(e.target.value))}
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="remarks">Additional Remarks</Label>
              <Textarea id="remarks" placeholder="Enter any additional remarks" />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Create Quotation</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
