// components/ticket/assign-ticket-dialog.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAgentStore } from "@/store/agentStore";
import { useTicketStore } from "@/store/ticketStore";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { User } from "lucide-react";

export function AssignTicketDialog({ ticketId }: { ticketId: string }) {
  const [open, setOpen] = useState(false);
  const [assigneeId, setAssigneeId] = useState("");

  const router = useRouter();
  const { agents, fetchAllAgents } = useAgentStore();
  const { updateTicketStatus } = useTicketStore();

  useEffect(() => {
    fetchAllAgents();
  }, [fetchAllAgents]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateTicketStatus(ticketId, "inProgress"); // Update ticket status to inProgress
    setOpen(false);
    router.refresh(); // Refresh the page to show the updated ticket
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <User className="mr-2 h-4 w-4" />
          Assign Ticket
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Assign Ticket</DialogTitle>
          <DialogDescription>
            Assign this ticket to an agent.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="assignee">Assignee</Label>
              <Select onValueChange={setAssigneeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select assignee" />
                </SelectTrigger>
                <SelectContent>
                  {agents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Assign Ticket</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
