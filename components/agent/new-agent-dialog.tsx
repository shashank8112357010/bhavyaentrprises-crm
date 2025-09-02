"use client";

import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Spinner } from "../ui/spinner";
import { useAgentStore } from "@/store/agentStore";
import { useRouter } from "next/navigation";


interface FormData {
  name: string;
  email: string;
  mobile: string;
  role: string;
}

export function NewAgentDialog() {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    mobile: "",
    role: "",
  });

  const { toast } = useToast();
  const { addAgent  } = useAgentStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true); // Set loading state to true
    try {
      await addAgent(formData);

      toast({
        title: "Success",
        description: "Agent created successfully.",
      });
      setOpen(false);
      
      // Reset form
      setFormData({
        name: "",
        email: "",
        mobile: "",
        role: "",
      });
      
      // Refresh the page to show the new agent
      router.refresh();
      
    } catch (error: any) {
     
      toast({
        title: "Error",
        description: error.message || "Failed to create agent.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false); // Set loading state to false
    }
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Agent
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Agent</DialogTitle>
          <DialogDescription>
            Create a new agent with their details and role.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="Enter agent name"
                  onChange={(e) => handleChange("name", e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
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
                  placeholder="Enter agent mobile"
                  onChange={(e) => handleChange("mobile", e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role">Role</Label>
                <Select onValueChange={(value) => handleChange("role", value)}>
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
                  <Spinner size='3'/>
                  Creating...
                </>
              ) : (
                "Create Agent"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
