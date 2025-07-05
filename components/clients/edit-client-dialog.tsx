"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { Spinner } from "@/components/ui/spinner";

interface Client {
  id?: string;
  displayId?: string; // Add displayId field
  name: string;
  type: string;
  totalBranches: number;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  contractStatus: string;
  lastServiceDate: string;
  avatar: string;
  initials: string;
  activeTickets?: number;
  gstn?: string;
  state?: string;
  tickets: any[];
}

interface EditClientDialogProps {
  client: Client | null; // Allow client to be null initially;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditClientDialog({
  client,
  isOpen,
  onClose,
  onSuccess,
}: EditClientDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    type: "Bank",
    totalBranches: 1,
    contactPerson: "",
    contactEmail: "",
    contactPhone: "",
    contractStatus: "Active",
    lastServiceDate: "",
    gstn: "",
    state: "chandigarh",
  });

  // Update form data when client changes
  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name || "",
        type: client.type || "Bank",
        totalBranches: client.totalBranches || 1,
        contactPerson: client.contactPerson || "",
        contactEmail: client.contactEmail || "",
        contactPhone: client.contactPhone || "",
        contractStatus: client.contractStatus || "Active",
        lastServiceDate: client.lastServiceDate || "",
        gstn: client.gstn || "",
        state: client.state || "chandigarh",
      });
    }
  }, [client]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client) return;

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/client/${client.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update client");
      }

      toast({
        title: "Success",
        description: "Client updated successfully.",
      });

      onClose();
      onSuccess();
    } catch (error: any) {
      console.error("Error updating client:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update client.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  if (!client) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Client</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Client Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter client name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Client Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => handleInputChange("type", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose Client Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bank">Bank</SelectItem>
                  <SelectItem value="NBFC">NBFC</SelectItem>
                  <SelectItem value="Insurance">Insurance</SelectItem>
                  <SelectItem value="Corporate">Corporate</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalBranches">Total Branches *</Label>
              <Input
                id="totalBranches"
                type="number"
                value={formData.totalBranches}
                onChange={(e) =>
                  handleInputChange("totalBranches", Number(e.target.value))
                }
                min={1}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactPerson">Contact Person *</Label>
              <Input
                id="contactPerson"
                value={formData.contactPerson}
                onChange={(e) =>
                  handleInputChange("contactPerson", e.target.value)
                }
                placeholder="Enter contact person name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactEmail">Contact Email</Label>
              <Input
                id="contactEmail"
                type="email"
                value={formData.contactEmail}
                onChange={(e) =>
                  handleInputChange("contactEmail", e.target.value)
                }
                placeholder="Enter contact email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactPhone">Contact Phone *</Label>
              <Input
                id="contactPhone"
                type="tel"
                value={formData.contactPhone}
                onChange={(e) =>
                  handleInputChange("contactPhone", e.target.value)
                }
                placeholder="Enter contact phone"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gstn">GSTN</Label>
              <Input
                id="gstn"
                value={formData.gstn}
                onChange={(e) => handleInputChange("gstn", e.target.value)}
                placeholder="Enter GSTN"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => handleInputChange("state", e.target.value)}
                placeholder="Enter state"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contractStatus">Contract Status *</Label>
              <Select
                value={formData.contractStatus}
                onValueChange={(value) =>
                  handleInputChange("contractStatus", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Contract Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Last Service Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left"
                >
                  {formData.lastServiceDate
                    ? format(new Date(formData.lastServiceDate), "PPP")
                    : "Select last service date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={
                    formData.lastServiceDate
                      ? new Date(formData.lastServiceDate)
                      : undefined
                  }
                  onSelect={(date) => {
                    if (date) {
                      handleInputChange("lastServiceDate", date.toISOString());
                    }
                  }}
                  disabled={(date) => date > new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Spinner size="4" />
                  Updating...
                </>
              ) : (
                "Update Client"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
