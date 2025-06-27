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
import { UploadCloud } from "lucide-react";
import { createRateCard } from "@/lib/services/rate-card";
import { useToast } from "@/hooks/use-toast";

interface UploadResponse {
  message: string;
  successCount: number;
  duplicateCount?: number;
  created?: any[];
}

interface UploadRateCardProps {
  onUploadSuccess: () => void | Promise<void>;
}

export function UploadRateCardDialog({ onUploadSuccess }: UploadRateCardProps) {
  const [open, setOpen] = useState<boolean>(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const { toast } = useToast();

  const reset = (): void => {
    setFile(null);
    setError(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
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

  const handleSubmit = async (): Promise<void> => {
    if (!file) {
      setError("No file selected");
      return;
    }

    try {
      setIsUploading(true);
      setError(null);

      const response: UploadResponse = await createRateCard(file);

      const { successCount, duplicateCount } = response;

      let toastDescription = `Uploaded ${successCount} entries successfully.`;
      if (duplicateCount && duplicateCount > 0) {
        toastDescription += ` Skipped ${duplicateCount} duplicate entries.`;
      }

      toast({
        title: "Upload Completed",
        description: toastDescription,
      });

      // Call the success callback and wait for it to complete
      await Promise.resolve(onUploadSuccess());

      setOpen(false);
      reset();
    } catch (err: any) {
      const errorMessage = err.message || "Failed to upload file";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      setError(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean): void => {
    if (!newOpen) {
      reset();
    }
    setOpen(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
            <Input
              id="csvFile"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              disabled={isUploading}
            />
            {error && (
              <p className="text-sm text-destructive mt-1" role="alert">
                {error}
              </p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={isUploading || !file}
            type="button"
          >
            {isUploading ? "Uploading..." : "Upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
