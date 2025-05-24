"use client";

import { useState } from "react";
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

export function NewExpenseDialog() {
  const [open, setOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Plus className="mr-2 h-4 w-4" />
          New Expense
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Expense</DialogTitle>
          <DialogDescription>
            Record a new expense with all relevant details.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="amount">Amount</Label>
              <div className="relative">
                <IndianRupee className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input id="amount" type="number" className="pl-8" placeholder="Enter amount" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="requester">Payment Requester</Label>
              <Input id="requester" placeholder="Enter requester name" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="type">Transaction Type</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="materials">Materials</SelectItem>
                  <SelectItem value="labor">Labor</SelectItem>
                  <SelectItem value="transport">Transport</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="photo">Transaction Photo</Label>
              <Input id="photo" type="file" accept="image/*" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="remarks">Remarks</Label>
              <Textarea id="remarks" placeholder="Enter any additional remarks" />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Add Expense</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}