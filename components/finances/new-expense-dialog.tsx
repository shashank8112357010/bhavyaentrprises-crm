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
import { createExpense } from "@/lib/services/expense";
import { getAllQuotations } from "@/lib/services/quotations";
import { useToast } from "@/hooks/use-toast";

type PaymentType = "VCASH" | "REST" | "ONLINE";

interface NewExpenseDialogProps {
  onSuccess?: () => void;
}

export function NewExpenseDialog({ onSuccess }: NewExpenseDialogProps) {
  const [open, setOpen] = useState(false);
  const [quotations, setQuotations] = useState<{ id: string; name: string }[]>([]);
  const [selectedQuotation, setSelectedQuotation] = useState<string | undefined>(undefined);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [requester, setRequester] = useState("");
  const [paymentType, setPaymentType] = useState<PaymentType | undefined>(undefined);
  const [remarks, setRemarks] = useState("");
  const { toast } = useToast(); // ✅

  useEffect(() => {
    async function fetchQuotations() {
      try {
        const data = await getAllQuotations({ limit: 50 });
        setQuotations(data.quotations || []);
      } catch (error) {
        console.error("Failed to fetch quotations", error);
        toast({
          title: "Error",
          description: "Failed to load quotations",
          variant: "destructive",
        });
      }
    }

    if (open) {
      fetchQuotations();
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedQuotation) {
      toast({
        title: "Error",
        description: "Please select a quotation",
        variant: "destructive",
      });
      return;
    }
    if (!amount || isNaN(Number(amount))) {
      toast({
        title: "Error",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }
    if (!category) {
      toast({
        title: "Error",
        description: "Please select a category",
        variant: "destructive",
      });
      return;
    }
    if (!file) {
      toast({
        title: "Error",
        description: "Please upload a PDF file",
        variant: "destructive",
      });
      return;
    }
    if (!requester) {
      toast({
        title: "Error",
        description: "Please enter requester name",
        variant: "destructive",
      });
      return;
    }
    if (!paymentType) {
      toast({
        title: "Error",
        description: "Please select payment type",
        variant: "destructive",
      });
      return;
    }

    try {
      await createExpense({
        amount: Number(amount),
        description: description || remarks,
        category: category.toUpperCase() as "LABOR" | "TRANSPORT" | "MATERIAL" | "OTHER",
        quotationId: selectedQuotation,
        requester,
        paymentType,
        file,
      });

      toast({
        title: "Success",
        description: "Expense created successfully!",
      });

      setOpen(false);
      setSelectedQuotation(undefined);
      setAmount("");
      setCategory(undefined);
      setDescription("");
      setFile(null);
      setRequester("");
      setPaymentType(undefined);
      setRemarks("");

      onSuccess?.(); // ✅ trigger callback if provided
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create expense",
        variant: "destructive",
      });
    }
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
          <DialogDescription>Record a new expense with all relevant details.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Quotation */}
            <div className="grid gap-2">
              <Label htmlFor="quotation">Select Quotation</Label>
              <Select onValueChange={setSelectedQuotation} value={selectedQuotation}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a quotation" />
                </SelectTrigger>
                <SelectContent>
                  {quotations.map((q) => (
                    <SelectItem key={q.id} value={q.id}>
                      {q.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Amount */}
            <div className="grid gap-2">
              <Label htmlFor="amount">Amount</Label>
              <div className="relative">
                <IndianRupee className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="amount"
                  type="number"
                  className="pl-8"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
            </div>

            {/* Category */}
            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Select onValueChange={setCategory} value={category}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LABOR">Labor</SelectItem>
                  <SelectItem value="TRANSPORT">Transport</SelectItem>
                  <SelectItem value="MATERIAL">Materials</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Requester */}
            <div className="grid gap-2">
              <Label htmlFor="requester">Requester</Label>
              <Input
                id="requester"
                type="text"
                placeholder="Who requested this expense?"
                value={requester}
                onChange={(e) => setRequester(e.target.value)}
              />
            </div>

            {/* Payment Type */}
            <div className="grid gap-2">
              <Label htmlFor="paymentType">Payment Type</Label>
              <Select onValueChange={(val) => setPaymentType(val as PaymentType)} value={paymentType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VCASH">Vcash</SelectItem>
                  <SelectItem value="ONLINE">Online</SelectItem>
                  <SelectItem value="REST">Rest</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* File Upload */}
            <div className="grid gap-2">
              <Label htmlFor="file">Upload PDF</Label>
              <Input
                id="file"
                type="file"
                accept="application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
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
