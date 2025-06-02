"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {  UploadCloud } from "lucide-react";

import { createRateCard } from "@/lib/services/rate-card";
import { useToast } from "@/hooks/use-toast";

/**
 * UploadRateCardDialog – handles CSV file selection, client‑side validation (.csv),
 * calls the backend API, and surfaces basic success / error feedback.
 */

interface UploadRateCardProps {
  onUploadSuccess: () => void;
}

export function UploadRateCardDialog({onUploadSuccess} :UploadRateCardProps ) {
    const [open, setOpen] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const { toast } = useToast();
  
    const reset = () => {
      setFile(null);
      setError(null);
    };
  
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = e.target.files?.[0];
      if (!selected) return;
  
      if (selected.type !== "text/csv" && !selected.name.endsWith(".csv")) {
        setError("Please select a valid .csv file");
        setFile(null);
        return;
      }
      setError(null);
      setFile(selected);
    };
  
    const handleSubmit = async () => {
        if (!file) {
          setError("No file selected");
          return;
        }
        try {
          setIsUploading(true);
          const response = await createRateCard(file);
          setOpen(false);
          reset();
          onUploadSuccess()
      
          // Example response: { message: "Upload completed", successCount, duplicateCount, created }
          const { successCount, duplicateCount } = response;
      
          let toastDescription = `Uploaded ${successCount} entries successfully.`;
          if (duplicateCount && duplicateCount > 0) {
            toastDescription += ` Skipped ${duplicateCount} duplicate entries.`;
          }
      
          toast({
            title: "Upload Completed",
            description: toastDescription,
          });
      
          console.log("Upload successful", response);
        } catch (err: any) {
          toast({
            title: "Error",
            description: err.message || "Failed to upload file",
            variant: "destructive",
          });
          setError(err.message || "Failed to upload file");
        } finally {
          setIsUploading(false);
        }
      };
      
  
    return (
      <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); setOpen(o); }}>
        <DialogTrigger asChild>
          <Button variant="outline">
            <UploadCloud className="mr-2 h-4 w-4" />
            Upload Rate Card
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Upload Rate Card (.csv)</DialogTitle>
            <DialogDescription>
              Select a CSV file that follows the required format.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="csvFile">CSV File</Label>
              <Input id="csvFile" type="file" accept=".csv" onChange={handleFileChange} />
              {error && <p className="text-sm text-destructive mt-1">{error}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSubmit} disabled={isUploading}>
              {isUploading ? "Uploading..." : "Upload"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }