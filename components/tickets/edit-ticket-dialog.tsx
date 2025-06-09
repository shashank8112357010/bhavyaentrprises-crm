"use client";

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
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
import { Calendar, Edit } from "lucide-react";
import { useAgentStore } from "@/store/agentStore";
import { useClientStore } from "@/store/clientStore";
import { useTicketStore } from "@/store/ticketStore";
import { useToast } from "@/hooks/use-toast";
import { Ticket } from "@/lib/services/ticket";
type Comment = {
  text: string;
  ticketId: string;
  userId: string; // Assuming GST types are 18 and 28
};
interface EditTicketInput {
  id: string;
  title: string;
  client: {
    id: string;
    name: string;
    type?: string;
    contactPerson?: string;
  };
  branch: string;
  priority: string;
  assignee: {
    name: string;
    avatar: string | null;
    initials: string | null;
  };
  dueDate?: any;
  comments?: Comment[];
  scheduledDate?: string;
  completedDate?: string;
  description: string;
  holdReason?: string;
}

type EditTicketDialogProps = {
  ticket: EditTicketInput;
  onUpdate: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const formatDate = (date: Date | string) => {
  if (typeof date === "string") {
    return new Date(date).toISOString().split("T")[0];
  }
  return date.toISOString().split("T")[0];
};

export default function EditTicketDialog({
  ticket,
  onUpdate,
  open,
  onOpenChange,
}: EditTicketDialogProps) {
  const { agents, fetchAgents } = useAgentStore();
  const { clients, fetchClients } = useClientStore();
  const { updateTicket } = useTicketStore();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: ticket.title,
    branch: ticket.branch,
    priority: ticket.priority,
    dueDate: ticket.dueDate
      ? formatDate(ticket.dueDate)
      : formatDate(new Date()),
    scheduledDate: ticket.scheduledDate
      ? formatDate(ticket.scheduledDate)
      : formatDate(new Date()),
    description: ticket.description,
    assigneeId: (ticket.assignee as any)?.id || "",
    clientId: ticket.client?.id || "",
  });

  const [isLoading, setIsLoading] = useState(false);

  const dueDateRef = useRef<HTMLInputElement>(null);
  const scheduledDateRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchAgents();
    fetchClients();
  }, [fetchAgents, fetchClients]);

  useEffect(() => {
    if (agents.length > 0 && (ticket.assignee as any)?.id) {
      // Try to find by ID first, then by name as fallback
      const assigneeId = (ticket.assignee as any).id;
      const assignee =
        agents.find((agent) => agent.id === assigneeId) ||
        agents.find((agent) => agent.name === ticket.assignee?.name);
      if (assignee) {
        setFormData((prev) => ({ ...prev, assigneeId: assignee.id }));
      }
    }
  }, [agents, ticket.assignee]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (
      !formData.title ||
      !formData.branch ||
      !formData.priority ||
      !formData.description ||
      !formData.assigneeId ||
      !formData.clientId
    ) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const ticketData = {
        id: ticket.id,
        title: formData.title,
        branch: formData.branch,
        priority: formData.priority,
        description: formData.description,
        assigneeId: formData.assigneeId,
        clientId: formData.clientId,
        dueDate: formData.dueDate
          ? new Date(formData.dueDate).toISOString()
          : undefined,
        scheduledDate: formData.scheduledDate
          ? new Date(formData.scheduledDate).toISOString()
          : undefined,
      };

      await updateTicket(ticketData);
      onOpenChange(false);
      onUpdate();
      toast({ title: "Success", description: "Ticket updated successfully!" });
    } catch (error: any) {
      console.error("Failed to update ticket:", error);
      toast({
        title: "Error",
        description:
          error.message || "Failed to update ticket. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {/* <Button>
          <Edit className="mr-2 h-4 w-4" /> Edit Ticket
        </Button> */}
      </DialogTrigger>
      <DialogContent className="max-w-2xl overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Edit Ticket</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="branch">Branch</Label>
            <Input
              id="branch"
              value={formData.branch}
              onChange={(e) => handleChange("branch", e.target.value)}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="priority">Priority</Label>
            <Select
              value={formData.priority}
              onValueChange={(val) => handleChange("priority", val)}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="dueDate">Due Date</Label>
            <div className="relative">
              <Input
                type="date"
                id="dueDate"
                ref={dueDateRef}
                value={formData.dueDate}
                onChange={(e) => handleChange("dueDate", e.target.value)}
                className="pr-10 hide-date-icon"
                required
              />
              <Calendar
                className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground cursor-pointer"
                onClick={() => dueDateRef.current?.showPicker()}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="scheduledDate">Scheduled Date</Label>
            <div className="relative">
              <Input
                type="date"
                id="scheduledDate"
                ref={scheduledDateRef}
                value={formData.scheduledDate}
                onChange={(e) => handleChange("scheduledDate", e.target.value)}
                className="pr-10 hide-date-icon"
                required
              />
              <Calendar
                className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground cursor-pointer"
                onClick={() => scheduledDateRef.current?.showPicker()}
              />
            </div>
          </div>

          <div className="grid gap-2 col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="clientId">Client</Label>
            <Select
              value={formData.clientId}
              onValueChange={(val) => handleChange("clientId", val)}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.initials
                      ? `${client.initials} - ${client.name}`
                      : client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="assigneeId">Assignee</Label>
            <Select
              value={formData.assigneeId}
              onValueChange={(val) => handleChange("assigneeId", val)}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Assignee" />
              </SelectTrigger>
              <SelectContent>
                {agents.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id}>
                    {agent.avatar
                      ? `${agent.avatar} - ${agent.name}`
                      : agent.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Updating..." : "Update"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
