"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState, useEffect, useRef, useMemo } from "react"; // Added useRef and useMemo
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Building,
  Calendar,
  CheckCircle,
  Clock,
  MessageSquare,
  Receipt,
  User,
  Pencil,
  Trash2,
  UploadCloud,
  Check, // Added for upload buttons
  UserPlus,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { useTicketStore } from "@/store";

interface SortableTicketProps {
  ticket: Ticket;
}

export function SortableTicket({ ticket }: SortableTicketProps) {
  const router = useRouter();
  const { toast } = useToast(); // Initialized useToast
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isReassignDialogOpen, setIsReassignDialogOpen] = useState(false);
  const today = new Date().toISOString().split("T")[0]; // 'YYYY-MM-DD'

  const [startDateTicket, setStartDateTicket] = useState<string>(today);
  const [endDateTicket, setEndDateTicket] = useState<string>(today);

  const [isUploadingJcr, setIsUploadingJcr] = useState(false);
  const [isUploadingPo, setIsUploadingPo] = useState(false);
  const jcrInputRef = useRef<HTMLInputElement>(null);
  const poInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuthStore();

  const { fetchTickets } = useTicketStore();

  // Memoize currentAssignee to prevent object recreation on every render
  const currentAssignee = useMemo(() => {
    if (ticket.assignee) {
      return {
        id: ticket.assignee.id || "",
        name: ticket.assignee.name || "Unknown",
      };
    }
    return undefined;
  }, [ticket.assignee]);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: ticket.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const priorityColor =
    ticket.priority === "Critical"
      ? "bg-destructive"
      : ticket.priority === "High"
      ? "bg-orange-500"
      : ticket.priority === "Medium"
      ? "bg-yellow-500"
      : "bg-blue-500";

  const formatDateString = (date: string) => {
    return date === "N/A"
      ? new Date().toLocaleString().split(",")[0]
      : new Date(date).toLocaleString().split(",")[0];
  };

  const handleUpdate = async () => {
    try {
      alert("Ticket updated successfully!");
      await updateTicket(ticket);
    } catch (error) {
      console.error("Failed to update ticket:", error);
    }
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this ticket?")) {
      try {
        await deleteTicket(ticket.id);
        router.refresh();
      } catch (error) {
        console.error("Failed to delete ticket:", error);
      }
    }
  };

  const handleJcrUploadClick = () => jcrInputRef.current?.click();
  const handlePoUploadClick = () => poInputRef.current?.click();

  const handleJcrFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingJcr(true);
    const formData = new FormData();
    formData.append("jcrFile", file);

    try {
      const response = await fetch(`/api/ticket/${ticket.id}/upload-jcr`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "JCR Upload failed");
      }
      toast({
        title: "Success",
        description: "JCR file uploaded successfully.",
      });

      await fetchTickets({
        startDate: startDateTicket,
        endDate: endDateTicket,
      });
      setIsUploadingJcr(false);
    } catch (error: any) {
      toast({
        title: "Error uploading JCR file",
        description: error.message || "An unknown error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingJcr(false);
      if (jcrInputRef.current) {
        jcrInputRef.current.value = ""; // Reset file input
      }
    }
  };

  const handlePoFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingPo(true);
    const formData = new FormData();
    formData.append("poFile", file);

    try {
      const response = await fetch(`/api/ticket/${ticket.id}/upload-po`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "PO Upload failed");
      }
      toast({
        title: "Success",
        description: "PO file uploaded successfully.",
      });
      await fetchTickets({
        startDate: startDateTicket,
        endDate: endDateTicket,
      });
      setIsUploadingPo(false);
    } catch (error: any) {
      toast({
        title: "Error uploading PO file",
        description: error.message || "An unknown error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingPo(false);
      if (poInputRef.current) {
        poInputRef.current.value = ""; // Reset file input
      }
    }
  };

  return (
    <>
      <input
        type="file"
        ref={jcrInputRef}
        onChange={handleJcrFileChange}
        style={{ display: "none" }}
        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
      />
      <input
        type="file"
        ref={poInputRef}
        onChange={handlePoFileChange}
        style={{ display: "none" }}
        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
      />
      <Card
        ref={setNodeRef}
        style={{ ...style }}
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

        <CardContent className="p-3 pb-0">
          <Link
            className="hover:cursor-wait"
            href={`/dashboard/ticket/${ticket.id}`}
            key={ticket.id}
            legacyBehavior
          >
            <Badge variant="outline">{ticket.ticketId}</Badge>
          </Link>

          <div {...listeners}>
            <h3 className="font-medium mt-2 line-clamp-2">{ticket.title}</h3>

            <div className="flex items-center mt-2 text-sm text-muted-foreground">
              <Building className="mr-1 h-4 w-4" />
              <span className="truncate">
                {ticket.client.name} - {ticket.branch}
              </span>
            </div>

            <div className="mt-3 space-y-2">
              <TooltipProvider>
                <div className="grid grid-cols-1 gap-2 text-xs text-muted-foreground">
                  <Tooltip>
                    <TooltipTrigger className="flex items-center">
                      <Receipt className="mr-1 h-3 w-3" />
                      <span className="flex gap-2">
                        Quote:{" "}
                        {ticket?.quotations && ticket?.quotations?.length > 0
                          ? ticket?.quotations
                              .map((i) => i.quoteNo || i.name)
                              .join(", ")
                          : "N/A"}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Amount: ₹{ticket.workStage?.quoteAmount || "N/A"}</p>
                      <p>Taxable: ₹{ticket.workStage?.quoteTaxable || "N/A"}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center">
                    <Calendar className="mr-1 h-3 w-3" />
                    <span>
                      {formatDateString(
                        ticket.workStage?.dateReceived ||
                          new Date().toISOString()
                      )}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {ticket.comments.length > 0 && (
                    <div className="flex items-center text-xs text-muted-foreground">
                      <MessageSquare className="mr-1 h-3 w-3" />
                      <span>{ticket.comments.length}</span>
                    </div>
                  )}

                  {ticket.dueDate && !ticket.completedDate && (
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Calendar className="mr-1 h-3 w-3" />
                      <span>Due: {formatDateString(ticket.dueDate)}</span>
                    </div>
                  )}

                  {ticket.scheduledDate && (
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Clock className="mr-1 h-3 w-3" />
                      <span>{formatDateString(ticket.scheduledDate)}</span>
                    </div>
                  )}

                  {ticket.completedDate !== "N/A" && (
                    <div className="flex items-center text-xs text-muted-foreground">
                      <CheckCircle className="mr-1 h-3 w-3 text-green-500" />
                      <span>
                        {formatDateString(ticket.completedDate || "")}
                      </span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center">
                    <User className="mr-1 h-3 w-3" />
                    <span>Agent: {ticket?.assignee?.name || "N/A"}</span>
                  </div>
                </div>
              </TooltipProvider>
            </div>

            <div className="flex flex-wrap gap-2 mt-3">
              <Badge
                variant="outline"
                className={`text-xs ${
                  ticket?.workStage?.poStatus
                    ? "bg-green-500 text-white"
                    : "bg-yellow-400 text-black"
                }`}
              >
                PO: {ticket?.workStage?.poStatus ? "Submitted" : "Pending"}
              </Badge>

              <Badge
                variant="outline"
                className={`text-xs ${
                  ticket.workStage?.jcrStatus
                    ? "bg-green-500 text-white"
                    : "bg-yellow-400 text-black"
                }`}
              >
                JCR: {ticket.workStage?.jcrStatus ? "Done" : "Pending"}
              </Badge>

              <Badge variant="secondary" className="text-xs">
                Quotation: ₹
                {ticket?.quotations
                  ?.reduce(
                    (total: any, exp: any) =>
                      total + (Number(exp.grandTotal) || 0),
                    0
                  )
                  .toLocaleString()}
              </Badge>

              <Badge variant="secondary" className="text-xs">
                Expense: ₹
                {ticket?.expenses
                  ?.reduce(
                    (total: any, exp: any) => total + (Number(exp.amount) || 0),
                    0
                  )
                  .toLocaleString()}
              </Badge>
            </div>

            <div className="flex flex-wrap gap-2 mt-3">
              {ticket.expenses &&
                ticket.expenses.length > 0 &&
                ticket.expenses.reduce(
                  (sum, e) => sum + (Number(e.amount) || 0),
                  0
                ) !==
                  ticket?.quotations?.reduce(
                    (total: any, exp: any) =>
                      total + (Number(exp.grandTotal) || 0),
                    0
                  ) && (
                  <Badge
                    variant="secondary"
                    className={`text-xs ${
                      ticket.expenses &&
                      ticket.expenses.reduce(
                        (sum, e) => sum + (Number(e.amount) || 0),
                        0
                      ) <
                        ticket?.quotations?.reduce(
                          (total: any, exp: any) =>
                            total + (Number(exp.grandTotal) || 0),
                          0
                        )
                        ? "bg-green-500 text-white"
                        : "bg-red-400 text-white"
                    }`}
                  >
                    {ticket.expenses &&
                    ticket.expenses.reduce(
                      (sum, e) => sum + (Number(e.amount) || 0),
                      0
                    ) <
                      ticket?.quotations?.reduce(
                        (total: any, exp: any) =>
                          total + (Number(exp.grandTotal) || 0),
                        0
                      )
                      ? "Profit"
                      : "Loss"}
                  </Badge>
                )}
            </div>
          </div>
        </CardContent>

        <CardFooter className="p-3 flex justify-between items-center">
          {" "}
          {/* Changed to justify-between */}
          <div className="flex gap-1">
            {/* Container for left-aligned buttons */}
            <Button
              variant="outline"
              size="sm"
              className="h-6 px-1.5 text-xs"
              onClick={handleJcrUploadClick}
              disabled={
                isUploadingJcr ||
                !!ticket.workStage?.jcrFilePath ||
                !ticket.workStage
              }
            >
              {ticket.workStage?.jcrFilePath ? (
                <Check className=" text-green-300 mr-1 h-3 w-3" />
              ) : (
                <UploadCloud className="mr-1 h-3 w-3" />
              )}
              {isUploadingJcr
                ? "Uploading JCR..."
                : ticket.workStage?.jcrFilePath
                ? "JCR Uploaded"
                : "Upload JCR"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-6 px-1.5 text-xs"
              onClick={handlePoUploadClick}
              disabled={
                isUploadingPo ||
                !!ticket.workStage?.poFilePath ||
                !ticket.workStage
              }
            >
              {ticket.workStage?.poFilePath ? (
                <Check className=" text-green-300 mr-1 h-3 w-3" />
              ) : (
                <UploadCloud className="mr-1 h-3 w-3" />
              )}

              {isUploadingPo
                ? "Uploading PO..."
                : ticket.workStage?.poFilePath
                ? "PO Uploaded"
                : "Upload PO"}
            </Button>
          </div>
        </CardFooter>
      </Card>

      <EditTicketDialog
        ticket={
          {
            ...ticket,
            workStage: ticket.workStage || null,
          } as any
        }
        onUpdate={handleUpdate}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      />

      <ReassignTicketDialog
        open={isReassignDialogOpen}
        onOpenChange={setIsReassignDialogOpen}
        ticketId={ticket.id}
        currentAssignee={currentAssignee}
        onReassignSuccess={() => {
          router.refresh();
          handleUpdate();
        }}
      />
    </>
  );
}
