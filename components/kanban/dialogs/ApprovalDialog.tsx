"use client";

import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { Ticket, Assignee } from "@/store/ticketStore"; // Assuming path
import { useTicketStore } from "@/store/ticketStore";


interface ApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticketToApprove: Ticket | null;
  accountants: Assignee[]; // Assuming Assignee type includes id and name
  onConfirmApproval: (ticketId: string, approverId: string, approvalNote: string) => Promise<void>;
}

export default function ApprovalDialog({
  open,
  onOpenChange,
  ticketToApprove,
  accountants,
  onConfirmApproval,
}: ApprovalDialogProps) {
  const [approverId, setApproverId] = useState("");
  const [approvalNote, setApprovalNote] = useState("");
  const { toast } = useToast();
  const { updateTicket } = useTicketStore();


  useEffect(() => {
    // Reset state when dialog is closed or ticket changes
    if (!open) {
      setApproverId("");
      setApprovalNote("");
    }
  }, [open]);

  const handleConfirm = async () => {
    if (!ticketToApprove) return;

    if (!approverId.trim()) {
      toast({
        title: "Missing Accountant",
        description: "Please select the accountant guaranteeing this completion.",
        variant: "destructive",
      });
      return;
    }

    // The actual ticket update logic will be passed via onConfirmApproval
    await onConfirmApproval(ticketToApprove.id, approverId, approvalNote);
    // onOpenChange(false); // Parent should control this after successful operation
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>PO Missing - Approval Required</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="approver">Who guarantees this ticket completion?</Label>
            <Select value={approverId} onValueChange={setApproverId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Accountant" />
              </SelectTrigger>
              <SelectContent>
                {accountants.map((acc) => (
                  <SelectItem key={acc.id} value={acc.id}>
                    {acc.name?.toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="approvalNote">Message (Optional)</Label>
            <Textarea
              id="approvalNote"
              placeholder="Enter message"
              value={approvalNote}
              onChange={(e) => setApprovalNote(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>Confirm Completion</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
