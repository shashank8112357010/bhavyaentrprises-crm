"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPlus, Loader2 } from "lucide-react";
import { useAgentStore } from "@/store/agentStore";
import { useTicketStore } from "@/store/ticketStore";
import { useToast } from "@/hooks/use-toast";

interface ReassignTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticketId: string;
  currentAssignee?: {
    id: string;
    name: string;
  };
  onReassignSuccess?: () => void;
}

export default function ReassignTicketDialog({
  open,
  onOpenChange,
  ticketId,
  currentAssignee,
  onReassignSuccess,
}: ReassignTicketDialogProps) {
  const { agents, fetchAgents } = useAgentStore();
  const { updateTicket } = useTicketStore();
  const { toast } = useToast();

  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  // Reset function to clear state when dialog closes
  const resetDialog = () => {
    setSelectedAssigneeId("");
    setIsLoading(false);
  };

  useEffect(() => {
    if (open) {
      fetchAgents();
    }
  }, [open, fetchAgents]);

  // Separate effect for setting the current assignee to avoid infinite loops
  useEffect(() => {
    if (open && currentAssignee?.id) {
      setSelectedAssigneeId(currentAssignee.id);
    } else if (open) {
      setSelectedAssigneeId("");
    }
  }, [open, currentAssignee?.id]); // Only depend on the ID, not the whole object

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      resetDialog();
    }
  }, [open]);

  const handleReassign = async () => {
    if (!selectedAssigneeId) {
      toast({
        title: "Error",
        description: "Please select an assignee.",
        variant: "destructive",
      });
      return;
    }

    if (selectedAssigneeId === currentAssignee?.id) {
      toast({
        title: "Error",
        description: "Please select a different assignee.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await updateTicket({
        id: ticketId,
        assigneeId: selectedAssigneeId,
      });

      toast({
        title: "Success",
        description: "Ticket reassigned successfully!",
      });

      onOpenChange(false);
      setSelectedAssigneeId("");

      if (onReassignSuccess) {
        onReassignSuccess();
      }
    } catch (error: any) {
      console.error("Failed to reassign ticket:", error);
      toast({
        title: "Error",
        description:
          error.message || "Failed to reassign ticket. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Reassign Ticket
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {currentAssignee && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Current Assignee:</p>
              <p className="font-medium">{currentAssignee.name}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="assignee">Select New Assignee</Label>
            <Select
              value={selectedAssigneeId}
              onValueChange={setSelectedAssigneeId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an assignee" />
              </SelectTrigger>
              <SelectContent>
                {agents.map((agent: any) => (
                  <SelectItem key={agent.id} value={agent.id}>
                    <div className="flex items-center gap-2">
                      <span className="capitalize">{agent.name}</span>
                      {agent.role && (
                        <span className="text-xs text-muted-foreground">
                          ({agent.role})
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={handleReassign} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Reassigning...
              </>
            ) : (
              "Reassign Ticket"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
