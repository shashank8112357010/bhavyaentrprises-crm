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
import { Calendar, Plus } from "lucide-react";
import { useAgentStore } from "@/store/agentStore";
import { useClientStore } from "@/store/clientStore";
import { useTicketStore } from "@/store/ticketStore";
import { useToast } from "@/hooks/use-toast";

const formatDate = (date: Date) => date.toISOString().split("T")[0];

export default function NewTicketDialog() {
  const [open, setOpen] = useState(false);
  const { agents, fetchAgents } = useAgentStore();
  const { clients, fetchClients } = useClientStore();
  const { createTicket } = useTicketStore();
  const { toast } = useToast();

  const today = formatDate(new Date());
  const nextWeek = formatDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

  const [formData, setFormData] = useState({
    title: "",
    branch: "",
    priority: "",
    dueDate: nextWeek,
    scheduledDate: today,
    description: "",
    assigneeId: "",
    clientId: "",
  });

  const [isLoading, setIsLoading] = useState(false);

  const dueDateRef = useRef<HTMLInputElement>(null);
  const scheduledDateRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchAgents();
    fetchClients();
  }, [fetchAgents, fetchClients]);

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

      await createTicket(ticketData);

      setOpen(false);
      setFormData({
        title: "",
        branch: "",
        priority: "",
        dueDate: nextWeek,
        scheduledDate: today,
        description: "",
        assigneeId: "",
        clientId: "",
      });
      toast({ title: "Success", description: "Ticket created successfully!" });
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.message || "Failed to create ticket. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> New Ticket
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Create New Ticket</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Enter Issue"
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="branch">Branch</Label>
            <Input
              id="branch"
              placeholder="Enter Branch Name"
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

          {/* Due Date Field with Custom Icon */}
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

          {/* Scheduled Date Field with Custom Icon */}
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
              placeholder="Enter Issue in detail ..."
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
                {clients.map((client: any) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.initials ? `${client.name}` : client.name}
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
                {agents.map((agent: any) => (
                  <SelectItem
                    key={agent.originalId || agent.userId || agent.id}
                    value={agent.originalId || agent.userId || agent.id}
                  >
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
            onClick={() => setOpen(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Creating..." : "Create"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
