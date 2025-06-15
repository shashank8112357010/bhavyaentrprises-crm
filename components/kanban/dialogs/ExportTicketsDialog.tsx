"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { exportTicketsToExcel } from "@/lib/services/ticket"; // Assuming this path is correct
import { type Status } from "@/store/ticketStore"; // Assuming this path is correct

interface ExportTicketsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticketStatuses: Status[];
  startDateTicket: string;
  endDateTicket: string;
}

export default function ExportTicketsDialog({
  open,
  onOpenChange,
  ticketStatuses,
  startDateTicket,
  endDateTicket,
}: ExportTicketsDialogProps) {
  const { toast } = useToast();

  const handleExportTickets = async (status: Status) => {
    if (!startDateTicket || !endDateTicket) {
      toast({
        title: "Select Date Range",
        description: "Please select start and end dates.",
        variant: "destructive",
      });
      return;
    }

    try {
      await exportTicketsToExcel({
        status,
        startDate: startDateTicket,
        endDate: endDateTicket,
      });
      onOpenChange(false); // Close dialog on success
      toast({
        title: "Export Successful",
        description: `${status.replaceAll(
          "_",
          " "
        )} tickets exported successfully.`,
      });
    } catch (err: any) {
      toast({
        title: "Export Failed",
        description: err.message || "Failed to export tickets.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export Tickets</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-2 py-4">
          {ticketStatuses.map((status) => (
            <Button
              key={status}
              variant="outline"
              onClick={() => handleExportTickets(status)}
            >
              Export {status.replaceAll("_", " ")}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
