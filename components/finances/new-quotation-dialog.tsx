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


export function NewQuotationDialog() {
  const [open, setOpen] = useState(false);
  const [clientId, setClientId] = useState<string>("");
  const {clients , fetchClients} = useClientStore();


  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const formData = {
      date: new Date((e.target as any).date.value),
      clientId,
      amount: parseFloat((e.target as any).amount.value),
      description: (e.target as any).description.value,
      remarks: (e.target as any).remarks.value,
    };

    console.log("Submit Quotation:", formData);

    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Quotation
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
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
              <Label htmlFor="amount">Amount</Label>
              <div className="relative">
                <IndianRupee className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input id="amount" type="number" className="pl-8" required placeholder="Enter amount" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Work Details</Label>
              <Textarea id="description" placeholder="Enter work details" required />
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
