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
import { Spinner } from "../ui/spinner";


type PaymentType = "VCASH" | "REST" | "ONLINE";
type ClientDetail = {
  name: string;
  id: string;
};
type TicketOBJ = {
  id: string;
  title: string;
};
interface QuotationForDialog {
  id: string;
  name: string;
  client: ClientDetail;
  ticket: TicketOBJ;
  displayId: string;

}

interface NewExpenseDialogProps {
  onSuccess?: () => void;
  ticketId?: string; // Added
  ticketQuotations?: QuotationForDialog[]; // Added
}

export function NewExpenseDialog({
  onSuccess,
  ticketId,
  ticketQuotations,
  
}: NewExpenseDialogProps) {
  const [open, setOpen] = useState(false);
  const [quotationsToDisplay, setQuotationsToDisplay] = useState<
    QuotationForDialog[]
  >([]);
  const [selectedQuotation, setSelectedQuotation] = useState<
    string | undefined
  >(undefined);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [requester, setRequester] = useState("");
  const [paymentType, setPaymentType] = useState<PaymentType | undefined>(
    undefined,
  );
  const [approvalName, setApprovalName] = useState("");
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [remarks, setRemarks] = useState("");
  const { toast } = useToast(); // ✅
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchAllQuotations() {
      try {
        // This limit might need to be adjusted if users have many quotations
        const data: any = await getAllQuotations({ limit: 100, searchQuery: "" });
        setQuotationsToDisplay(data.quotations || []);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load all quotations",
          variant: "destructive",
        });
      }
    }

    if (open) {
      if (ticketQuotations && ticketQuotations.length > 0) {
        setQuotationsToDisplay(ticketQuotations);
        // If there's only one quotation related to the ticket, pre-select it.
        if (ticketQuotations.length === 1) {
          setSelectedQuotation(ticketQuotations[0].id);
        } else {
          setSelectedQuotation(undefined); // Clear selection if multiple options
        }
      } else if (ticketId) {
        // Ticket ID is provided, but no specific ticketQuotations.
        // This case implies we should probably still fetch ALL quotations,
        // as the dialog's original behavior was to show all.
        // Or, it could mean "no quotations for this ticket, so don't show any/disable expense creation".
        // Given the button on ticket page is conditional on ticket.Quotation.length > 0,
        // this 'else if' branch where ticketQuotations is empty but ticketId exists, shouldn't be hit often.
        // If it is, it means the ticket *has* quotations, but they weren't passed.
        // For safety, fetch all if specific ones aren't passed.
        fetchAllQuotations();
      } else {
        // No ticket context, fetch all quotations (original behavior)
        fetchAllQuotations();
      }
    }
  }, [open, ticketId, ticketQuotations, toast]); // Ensure toast is in dependency array

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true); // Start loading
    if (!selectedQuotation) {
      setLoading(false);
      toast({
        title: "Error",
        description: "Please select a quotation",
        variant: "destructive",
      });
      return;
    }
    if (!amount || isNaN(Number(amount))) {
      setLoading(false);
      toast({
        title: "Error",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }
    if (!category) {
      setLoading(false);
      toast({
        title: "Error",
        description: "Please select a category",
        variant: "destructive",
      });
      return;
    }
    if (!file) {
      setLoading(false);
      toast({
        title: "Error",
        description: "Please upload a PDF file",
        variant: "destructive",
      });
      return;
    }
    if (!requester) {
      setLoading(false);
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

    // Validate conditional fields based on payment type
    if (paymentType === "ONLINE" && !screenshotFile) {
      setLoading(false);
      toast({
        title: "Error",
        description: "Please upload payment screenshot for online payments",
        variant: "destructive",
      });
      return;
    }

    if (
      (paymentType === "VCASH" || paymentType === "REST") &&
      !approvalName.trim()
    ) {
      setLoading(false);
      toast({
        title: "Error",
        description: "Please enter approval name for offline payments",
        variant: "destructive",
      });
      return;
    }

    try {
      await createExpense({
        amount: Number(amount),
        description: description || remarks,
        category: category.toUpperCase() as
          | "LABOR"
          | "TRANSPORT"
          | "MATERIAL"
          | "OTHER",
        quotationId: selectedQuotation,
        requester,
        paymentType,
        file: file || undefined,
        screenshotFile:
          paymentType === "ONLINE" ? screenshotFile || undefined : undefined,
        approvalName:
          paymentType === "VCASH" || paymentType === "REST"
            ? approvalName
            : undefined,
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
      setApprovalName("");
      setScreenshotFile(null);
      setLoading(false);

      onSuccess?.(); // ✅ trigger callback if provided
    } catch (error: any) {
      setLoading(false);
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
          <DialogDescription>
            Record a new expense with all relevant details.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Quotation */}
            <div className="grid gap-2">
              <Label htmlFor="quotation">Select Quotation</Label>
              <Select
                onValueChange={setSelectedQuotation}
                value={selectedQuotation}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a quotation" />
                </SelectTrigger>
                <SelectContent>
                  {quotationsToDisplay.map((q) => (
                    <SelectItem key={q.id} value={q.id}>
                      {q.displayId}-{q?.client?.name}-{q?.ticket?.title}
                      {/* Assuming 'name' is the display field */}
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
              <Select
                onValueChange={(val) => setPaymentType(val as PaymentType)}
                value={paymentType}
              >
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

            {/* Conditional fields based on payment type */}
            {paymentType === "ONLINE" && (
              <div className="grid gap-2">
                <Label htmlFor="screenshot">Payment Screenshot *</Label>
                <Input
                  id="screenshot"
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setScreenshotFile(e.target.files?.[0] ?? null)
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Upload a screenshot of the online payment confirmation
                </p>
              </div>
            )}

            {(paymentType === "VCASH" || paymentType === "REST") && (
              <div className="grid gap-2">
                <Label htmlFor="approvalName">Approval Name *</Label>
                <Input
                  id="approvalName"
                  type="text"
                  placeholder="Name of person who approved this expense"
                  value={approvalName}
                  onChange={(e) => setApprovalName(e.target.value)}
                />
              </div>
            )}

            {/* File Upload */}
            <div className="grid gap-2">
              <Label htmlFor="file">Upload Receipt/Bill</Label>
              <Input
                id="file"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              <p className="text-xs text-muted-foreground">
                Upload the expense receipt or bill (PDF, JPG, PNG)
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? <Spinner size="4" /> : "Add Expense"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
