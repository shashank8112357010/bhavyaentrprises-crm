import { useState, useEffect } from "react";
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
import { Plus } from "lucide-react";
import { useAgentStore } from "@/store/agentStore";
import { useClientStore } from "@/store/clientStore";
import { useTicketStore } from "@/store/ticketStore";

export default function NewTicketDialog() {
  const [open, setOpen] = useState(false);
  const { agents, fetchAgents } = useAgentStore();
  const { clients, fetchClients } = useClientStore();
  const { createTicket } = useTicketStore();

  const [formData, setFormData] = useState({
    title: "",
    branch: "",
    priority: "",
    dueDate: "",
    scheduledDate: "",
    description: "",
    comments: 0,
    holdReason: "",
    assigneeId: "",
    clientId: "",
  });

  useEffect(() => {
    fetchAgents();
    fetchClients();
  }, [fetchAgents, fetchClients]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    try {
      const ticketData = {
        ...formData,
        dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : undefined,
        scheduledDate: formData.scheduledDate ? new Date(formData.scheduledDate).toISOString() : undefined,
        comments : Number(formData.comments)
      };
      await createTicket(ticketData);

      setOpen(false);
      setFormData({
        title: "",
        branch: "",
        priority: "",
        dueDate: "",
        scheduledDate: "",
        description: "",
        comments: 0,
        holdReason: "",
        assigneeId: "",
        clientId: "",
      });
    } catch (error) {
      console.error("Failed to create ticket:", error);
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
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="branch">Branch</Label>
            <Input
              id="branch"
              value={formData.branch}
              onChange={(e) => handleChange("branch", e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="priority">Priority</Label>
            <Input
              id="priority"
              value={formData.priority}
              onChange={(e) => handleChange("priority", e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="dueDate">Due Date</Label>
            <Input
              type="date"
              id="dueDate"
              value={formData.dueDate}
              onChange={(e) => handleChange("dueDate", e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="scheduledDate">Scheduled Date</Label>
            <Input
              type="date"
              id="scheduledDate"
              value={formData.scheduledDate}
              onChange={(e) => handleChange("scheduledDate", e.target.value)}
            />
          </div>

          <div className="grid gap-2 col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="comments">Comments Count</Label>
            <Input type="number" id="comments" value={formData.comments} onChange={(e) => handleChange("comments", (e.target.value))} />

          </div>

          <div className="grid gap-2">
            <Label htmlFor="holdReason">Hold Reason</Label>
            <Input
              id="holdReason"
              value={formData.holdReason}
              onChange={(e) => handleChange("holdReason", e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="clientId">Client</Label>
            <Select
              value={formData.clientId}
              onValueChange={(val) => handleChange("clientId", val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client: any) => (
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
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Assignee" />
              </SelectTrigger>
              <SelectContent>
                {agents.map((agent: any) => (
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
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Create</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
