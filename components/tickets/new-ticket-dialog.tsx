"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";

export function NewTicketDialog() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    client: "",
    branch: "",
    title: "",
    description: "",
    priority: "",
    quoteNo: "",
    quoteAmount: "",
    workDetails: "",
  });

  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically make an API call to create the ticket
    console.log("Creating new ticket:", formData);
    setOpen(false);
    router.refresh(); // Refresh the page to show the new ticket
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Ticket
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Ticket</DialogTitle>
          <DialogDescription>
            Create a new maintenance ticket with work details and quotation.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="client">Client</Label>
                <Select onValueChange={(value) => handleChange("client", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hdfc">HDFC Bank</SelectItem>
                    <SelectItem value="sbi">SBI Bank</SelectItem>
                    <SelectItem value="icici">ICICI Bank</SelectItem>
                    <SelectItem value="axis">Axis Bank</SelectItem>
                    <SelectItem value="pnb">Punjab National Bank</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="branch">Branch</Label>
                <Input 
                  id="branch" 
                  placeholder="Enter branch location"
                  onChange={(e) => handleChange("branch", e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input 
                id="title" 
                placeholder="Enter ticket title"
                onChange={(e) => handleChange("title", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                placeholder="Enter ticket description"
                onChange={(e) => handleChange("description", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="priority">Priority</Label>
                <Select onValueChange={(value) => handleChange("priority", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="quoteNo">Quote No.</Label>
                <Input 
                  id="quoteNo" 
                  placeholder="Enter quote number"
                  onChange={(e) => handleChange("quoteNo", e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="quoteAmount">Quote Amount</Label>
              <Input 
                id="quoteAmount" 
                type="number" 
                placeholder="Enter quote amount"
                onChange={(e) => handleChange("quoteAmount", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="workDetails">Work Details</Label>
              <Textarea 
                id="workDetails" 
                placeholder="Enter detailed work requirements"
                onChange={(e) => handleChange("workDetails", e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Create Ticket</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}