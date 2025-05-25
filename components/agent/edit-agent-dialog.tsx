"use client";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "../ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Spinner } from "../ui/spinner";
import { useAgentStore } from "@/store/agentStore";
import { Agent } from "./types";

interface EditAgentDialogProps {
  agent: Agent | null;
  onClose: () => void;
}

export function EditAgentDialog({ agent, onClose }: EditAgentDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { editAgent } = useAgentStore();
  const { toast } = useToast();
  console.log(agent, "agent from edit dialog");

  const [formData, setFormData] = useState({
    name:  "",
    email:  "",
    mobile: "",
    role:  "",
  });

  useEffect(() => {
    setFormData({
      name: agent?.name || "",
      email: agent?.email || "",
      mobile: agent?.mobile || "",
      role: agent?.role || "",
    });
  }, [agent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agent) return;
    setIsLoading(true);
    try {
      await editAgent(agent.id, {
        ...agent,
        ...formData,
      });

      toast({
        title: "Success",
        description: "Agent updated successfully.",
      });
      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update agent.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (!agent) return null;

  return (
    <Dialog open={!!agent} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Agent</DialogTitle>
          <DialogDescription>Edit the agent&apos;s details.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  placeholder="Enter agent name"
                  onChange={(e) => handleChange("name", e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  placeholder="Enter agent email"
                  onChange={(e) => handleChange("email", e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="mobile">Mobile</Label>
                <Input
                  id="mobile"
                  value={formData.mobile}
                  placeholder="Enter agent mobile"
                  onChange={(e) => handleChange("mobile", e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => handleChange("role", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="BACKEND">Backend</SelectItem>
                    <SelectItem value="RM">Relationship Manager</SelectItem>
                    <SelectItem value="MST">Maintenance Staff</SelectItem>
                    <SelectItem value="ACCOUNTS">Accounts</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Spinner size="3" />
                  Updating...
                </>
              ) : (
                "Update Agent"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
