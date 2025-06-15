"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useTicketStore, type Ticket, type Status } from "@/store/ticketStore"; // Assuming path

interface HoldReasonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticketToHold: Ticket | null;
  onConfirmHold: (ticketId: string, reason: string, originalStatus: Status) => Promise<void>; // More specific callback
  onCancelHold: () => void;
}

export default function HoldReasonDialog({
  open,
  onOpenChange,
  ticketToHold,
  onConfirmHold,
  onCancelHold,
}: HoldReasonDialogProps) {
  const [holdReasonText, setHoldReasonText] = useState<string>("");
  const [isLoadingHold, setLoadingHold] = useState<boolean>(false);
  const { toast } = useToast();

  // Sync holdReasonText when ticketToHold changes (e.g., when dialog opens)
  useState(() => {
    if (ticketToHold) {
      setHoldReasonText(ticketToHold.holdReason || "");
    }
  });

  const handleConfirm = async () => {
    if (!ticketToHold) return;
    setLoadingHold(true);

    if (!holdReasonText.trim()) {
      setLoadingHold(false);
      toast({
        title: "Hold Reason Required",
        description: "Please enter a reason to put the ticket on hold.",
        variant: "destructive",
      });
      return;
    }

    // The actual status update logic will be passed via onConfirmHold prop
    // to keep this component more presentational.
    await onConfirmHold(ticketToHold.id, holdReasonText.trim(), ticketToHold.status);

    setLoadingHold(false);
    // onOpenChange(false); // Parent should control this after successful operation
  };

  const handleCancel = () => {
    onCancelHold(); // Call parent's cancel logic
    onOpenChange(false);
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Put Ticket On Hold</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="holdReasonDialogText">Reason for Hold</Label> {/* Ensure unique id for Label if needed */}
            <Textarea
              id="holdReasonDialogText"
              value={holdReasonText}
              onChange={(e) => setHoldReasonText(e.target.value)}
              placeholder="Enter the reason for putting this ticket on hold"
              required
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isLoadingHold}>
            {isLoadingHold ? "Holding..." : "Confirm Hold"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
