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
import { UploadCloud } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { importClientsFromExcel } from "@/lib/services/client"; // Assuming this is the correct path

interface UploadClientsDialogProps {
  onUploadComplete?: () => void; // Optional callback for when upload is done
}

export function UploadClientsDialog({ onUploadComplete }: UploadClientsDialogProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const resetState = () => {
    setFile(null);
    setError(null);
    setIsUploading(false);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null); // Clear previous errors
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === "text/csv" || selectedFile.name.endsWith(".csv")) {
        setFile(selectedFile);
      } else {
        setFile(null);
        setError("Invalid file type. Please select a .csv file.");
      }
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) {
      setError("Please select a file to upload.");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const response = await importClientsFromExcel(file);
      // Expected response: { message: string, successCount: number, skippedCount: number, errorCount: number, errors: Array<{ row: number, name?: string, error: string|object }> }

      const successCount = response.successCount || 0;
      const skippedCount = response.skippedCount || 0;
      const errorCount = response.errorCount || 0;

      let toastDescription = `Successfully imported ${successCount} clients.`;
      if (skippedCount > 0) {
        toastDescription += ` Skipped ${skippedCount} duplicate${skippedCount > 1 ? 's' : ''}.`;
      }
      if (errorCount > 0) {
        toastDescription += ` ${errorCount} row${errorCount > 1 ? 's' : ''} had errors.`;
        // Handle client import errors in the UI
         // Optionally, display some errors in the dialog or a more detailed toast
        // For now, logging to console as per plan.
      }


      toast({
        title: "Import Successful",
        description: toastDescription,
        variant: errorCount > 0 && successCount === 0 ? "destructive" : (errorCount > 0 ? "default" : "default"), // 'default' for success or partial success, 'destructive' if all failed
      });

      setOpen(false);
      resetState();
      if (onUploadComplete) {
        onUploadComplete();
      }
    } catch (err: any) {
      const errorMessage = err.message || "An unexpected error occurred.";
      toast({
        title: "Import Failed",
        description: errorMessage,
        variant: "destructive",
      });
      setError(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      resetState();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <UploadCloud className="mr-2 h-4 w-4" />
          Upload Clients
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Upload Client Data (.csv)</DialogTitle>
          <DialogDescription>
            Select a CSV file that follows the required format. Ensure headers match the sample.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="file-upload" className="col-span-1 text-right">
                CSV File
              </Label>
              <Input
                id="file-upload"
                type="file"
                accept=".csv, text/csv"
                onChange={handleFileChange}
                className="col-span-3"
                disabled={isUploading}
              />
            </div>
            {error && (
              <p className="col-span-4 text-sm text-red-500 text-center">{error}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="submit"
              disabled={isUploading || !file}
            >
              {isUploading ? "Uploading..." : "Upload"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
