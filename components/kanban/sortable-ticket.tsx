"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  User,
  Building,
  AlertTriangle,
  Pencil,
  Trash2,
  UploadCloud,
  Check, // Added for upload buttons
  UserPlus,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Ticket } from "./types";
import { updateTicket, deleteTicket } from "@/lib/services/ticket";
import EditTicketDialog from "../tickets/edit-ticket-dialog";
import ReassignTicketDialog from "../tickets/reassign-ticket-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/authStore";
import Link from "next/link";

interface SortableTicketProps {
  ticket: Ticket;
}

export function SortableTicket({ ticket }: SortableTicketProps) {
  const router = useRouter();
  const { toast } = useToast(); // Initialized useToast
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isReassignDialogOpen, setIsReassignDialogOpen] = useState(false);

  const [isUploadingJcr, setIsUploadingJcr] = useState(false);
  const [isUploadingPo, setIsUploadingPo] = useState(false);

  const { user } = useAuthStore();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: ticket.id,
    data: {
      type: "ticket",
      ticket,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleUpdate = () => {
    // Refresh the page or trigger a re-fetch
    router.refresh();
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this ticket?")) {
      try {
        await deleteTicket(ticket.id);
        toast({
          title: "Success",
          description: "Ticket deleted successfully.",
        });
        handleUpdate();
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to delete ticket.",
          variant: "destructive",
        });
      }
    }
  };

  const handleFileUpload = async (
    file: File,
    uploadType: "jcr" | "po",
  ): Promise<void> => {
    const formData = new FormData();
    formData.append("file", file);

    const endpoint = `/api/ticket/${ticket.id}/upload-${uploadType}`;

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to upload ${uploadType}`);
      }

      const result = await response.json();
      toast({
        title: "Success",
        description: `${uploadType.toUpperCase()} uploaded successfully!`,
      });

      // Refresh the ticket data
      handleUpdate();
    } catch (error: any) {
      console.error(`Error uploading ${uploadType}:`, error);
      toast({
        title: "Error",
        description: error.message || `Failed to upload ${uploadType}.`,
        variant: "destructive",
      });
    }
  };

  const handleJcrUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingJcr(true);
    try {
      await handleFileUpload(file, "jcr");
    } finally {
      setIsUploadingJcr(false);
      event.target.value = ""; // Reset input
    }
  };

  const handlePoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingPo(true);
    try {
      await handleFileUpload(file, "po");
    } finally {
      setIsUploadingPo(false);
      event.target.value = ""; // Reset input
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "destructive";
      case "medium":
        return "secondary";
      case "low":
        return "outline";
      default:
        return "outline";
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString();
  };

  const isOverdue = (dueDate: string | undefined) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  return (
    <>
      <Card
        ref={setNodeRef}
        style={style}
        {...listeners}
        className={`relative mb-3 transition-all duration-200`}
        {...attributes}
      >
        {/* Edit/Delete/Reassign buttons */}
        <div className="absolute top-4 right-1 flex gap-1 z-10">
          <Button
            variant="ghost"
            size="icon"
            className="h-4 w-4 p-0"
            onClick={(e) => {
              e.stopPropagation();
              setIsEditDialogOpen(true);
            }}
          >
            <Pencil className="h-3 w-3" />
          </Button>
          {(user?.role === "ADMIN" || user?.role === "ACCOUNTS") && (
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4 p-0 text-blue-500 hover:text-blue-700"
              onClick={(e) => {
                e.stopPropagation();
                setIsReassignDialogOpen(true);
              }}
            >
              <UserPlus className="h-3 w-3" />
            </Button>
          )}
          {user?.role === "ADMIN" && (
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4 p-0 text-red-500 hover:text-red-700"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete();
              }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>

        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 pr-8">
              <CardTitle className="text-sm font-medium leading-tight">
                <Link
                  href={`/dashboard/ticket/${ticket.id}`}
                  className="hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {ticket.title}
                </Link>
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                {ticket.ticketId}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Badge
              variant={getPriorityColor(ticket.priority)}
              className="text-xs"
            >
              {ticket.priority}
            </Badge>
            {isOverdue(ticket.dueDate) && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Overdue</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-0 space-y-3">
          {/* Client Info */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Building className="h-3 w-3" />
            <span className="truncate">
              {ticket.client?.name || "No client"}
            </span>
          </div>

          {/* Assignee */}
          <div className="flex items-center gap-2">
            <User className="h-3 w-3 text-muted-foreground" />
            <div className="flex items-center gap-1 flex-1 min-w-0">
              <Avatar className="h-5 w-5">
                <AvatarImage src={ticket.assignee?.avatar} />
                <AvatarFallback className="text-xs">
                  {ticket.assignee?.initials || "?"}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs truncate">
                {ticket.assignee?.name || "Unassigned"}
              </span>
            </div>
          </div>

          {/* Due Date */}
          <div className="flex items-center gap-2 text-xs">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span
              className={
                isOverdue(ticket.dueDate)
                  ? "text-destructive"
                  : "text-muted-foreground"
              }
            >
              Due: {formatDate(ticket.dueDate)}
            </span>
          </div>

          {/* Scheduled Date */}
          {ticket.scheduledDate && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>Scheduled: {formatDate(ticket.scheduledDate)}</span>
            </div>
          )}

          {/* Work Stage Info */}
          {ticket.workStage && (
            <div className="text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Quote:</span>
                <span
                  className={
                    ticket.workStage.quoteNo === "N/A"
                      ? "text-destructive"
                      : "text-green-600"
                  }
                >
                  {ticket.workStage.quoteNo}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">PO:</span>
                <span
                  className={
                    ticket.workStage.poStatus
                      ? "text-green-600"
                      : "text-orange-500"
                  }
                >
                  {ticket.workStage.poStatus ? "✓" : "Pending"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">JCR:</span>
                <span
                  className={
                    ticket.workStage.jcrStatus
                      ? "text-green-600"
                      : "text-orange-500"
                  }
                >
                  {ticket.workStage.jcrStatus ? "✓" : "Pending"}
                </span>
              </div>
            </div>
          )}

          {/* Upload Buttons for In Progress tickets */}
          {ticket.status === "inProgress" && (
            <div className="flex gap-2 mt-3">
              {/* JCR Upload */}
              <div className="flex-1">
                <input
                  type="file"
                  id={`jcr-upload-${ticket.id}`}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={handleJcrUpload}
                  className="hidden"
                  disabled={isUploadingJcr}
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs h-7"
                  onClick={() =>
                    document.getElementById(`jcr-upload-${ticket.id}`)?.click()
                  }
                  disabled={isUploadingJcr}
                >
                  {isUploadingJcr ? (
                    <UploadCloud className="h-3 w-3 animate-pulse" />
                  ) : ticket.workStage?.jcrStatus ? (
                    <Check className="h-3 w-3 text-green-600" />
                  ) : (
                    <UploadCloud className="h-3 w-3" />
                  )}
                  <span className="ml-1">JCR</span>
                </Button>
              </div>

              {/* PO Upload */}
              <div className="flex-1">
                <input
                  type="file"
                  id={`po-upload-${ticket.id}`}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={handlePoUpload}
                  className="hidden"
                  disabled={isUploadingPo}
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs h-7"
                  onClick={() =>
                    document.getElementById(`po-upload-${ticket.id}`)?.click()
                  }
                  disabled={isUploadingPo}
                >
                  {isUploadingPo ? (
                    <UploadCloud className="h-3 w-3 animate-pulse" />
                  ) : ticket.workStage?.poStatus ? (
                    <Check className="h-3 w-3 text-green-600" />
                  ) : (
                    <UploadCloud className="h-3 w-3" />
                  )}
                  <span className="ml-1">PO</span>
                </Button>
              </div>
            </div>
          )}

          {/* Hold Reason */}
          {ticket.status === "onHold" && ticket.holdReason && (
            <div className="text-xs p-2 bg-orange-50 border border-orange-200 rounded">
              <span className="font-medium text-orange-800">Hold Reason:</span>
              <p className="text-orange-700 mt-1">{ticket.holdReason}</p>
            </div>
          )}

          {/* Expenses Summary */}
          {ticket.expenses && ticket.expenses.length > 0 && (
            <div className="text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Expenses:</span>
                <span className="font-medium">
                  ₹
                  {ticket.expenses
                    .reduce((sum, exp) => sum + parseFloat(exp.amount), 0)
                    .toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* Due Amount for billing stages */}
          {(ticket.status === "billing_pending" ||
            ticket.status === "billing_completed") && (
            <div className="text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Due Amount:</span>
                <span
                  className={`font-medium ${
                    ticket.due && ticket.due > 0
                      ? "text-red-600"
                      : "text-green-600"
                  }`}
                >
                  ₹{ticket.due?.toFixed(2) || "0.00"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment Status:</span>
                <span
                  className={`font-medium ${
                    ticket.paid ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {ticket.paid ? "Paid" : "Pending"}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <EditTicketDialog
        ticket={ticket}
        onUpdate={handleUpdate}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      />

      <ReassignTicketDialog
        open={isReassignDialogOpen}
        onOpenChange={setIsReassignDialogOpen}
        ticketId={ticket.id}
        currentAssignee={
          ticket.assignee
            ? {
                id: ticket.assignee.id || "",
                name: ticket.assignee.name || "Unknown",
              }
            : undefined
        }
        onReassignSuccess={() => {
          router.refresh();
          handleUpdate();
        }}
      />
    </>
  );
}
