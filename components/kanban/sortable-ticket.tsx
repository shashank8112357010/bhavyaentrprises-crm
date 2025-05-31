"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState, useEffect } from "react";
import {
  ArrowUpRight,
  Building,
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  MessageSquare,
  MoreHorizontal,
  Receipt,
  User,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Ticket } from "./types";
import { updateTicket } from "@/lib/services/ticket";
import EditTicketDialog from "../tickets/edit-ticket-dialog";

interface SortableTicketProps {
  ticket: Ticket;
}

export function SortableTicket({ ticket }: SortableTicketProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

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
      await updateTicket(ticket);
    } catch (error) {
      console.error("Failed to update ticket:", error);
    } finally {
    }
  };

  useEffect(() => {
    console.log("isEditDialogOpen", isEditDialogOpen);
  }, [isEditDialogOpen]);

  const handleEditClick = () => {
    console.log("Edit button clicked");
    setIsEditDialogOpen(true);
  };

  return (
    <>
      <Card
        ref={setNodeRef}
        style={{ ...style }}
        className={`mb-3 cursor-grab transition-all duration-200
          ${
            ticket.expenses.reduce(
              (sum, e) => sum + (Number(e.amount) || 0),
              0
            ) <
            ticket?.quotations?.reduce(
              (total: any, exp: any) => total + (Number(exp.grandTotal) || 0),
              0
            )
              ? "border-[0.25px] border-green-500"
              : "border-[0.25px] border-red-500"
          }
        `}
        {...attributes}
        {...listeners}
      >
        <CardContent className="p-3 pb-0">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline">{ticket.ticketId}</Badge>
              <div
                className={`h-2 w-2 rounded-full ${priorityColor}`}
                title={`Priority: ${ticket.priority}`}
              ></div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-6 p-0 ">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="z-50">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem>View</DropdownMenuItem>
                <DropdownMenuItem
                  className="z-50 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log("Edit button clicked directly");
                    handleEditClick();
                  }}
                >
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem className="text-red-200">
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

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
                        ? ticket?.quotations.map((i) => i.id)
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
                      ticket.workStage?.dateReceived || new Date().toISOString()
                    )}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {ticket.comments > 0 && (
                  <div className="flex items-center text-xs text-muted-foreground">
                    <MessageSquare className="mr-1 h-3 w-3" />
                    <span>{ticket.comments || "N/A"}</span>
                  </div>
                )}

                {ticket.dueDate && !ticket.completedDate && (
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Calendar className="mr-1 h-3 w-3" />
                    <span>
                      Due:{" "}
                      {formatDateString(
                        ticket.dueDate || new Date().toISOString()
                      )}
                    </span>
                  </div>
                )}

                {ticket.scheduledDate && (
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Clock className="mr-1 h-3 w-3" />
                    <span>
                      {formatDateString(
                        ticket.scheduledDate || new Date().toISOString()
                      )}
                    </span>
                  </div>
                )}

                {ticket.completedDate != "N/A" && (
                  <div className="flex items-center text-xs text-muted-foreground">
                    <CheckCircle className="mr-1 h-3 w-3 text-green-500" />
                    <span>
                      {formatDateString(
                        ticket.completedDate || new Date().toISOString()
                      )}
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
                !ticket.workStage || ticket.workStage.poNumber === "N/A"
                  ? "bg-yellow-400 text-black"
                  : "bg-green-500 text-white"
              }`}
            >
              PO:{" "}
              {!ticket.workStage || ticket.workStage.poNumber === "N/A"
                ? "Pending"
                : "Approved"}
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
            {
             ticket.expenses.length > 0 && ticket.expenses.reduce(
                (sum, e) => sum + (Number(e.amount) || 0),
                0
              ) !=
              ticket?.quotations?.reduce(
                (total: any, exp: any) => total + (Number(exp.grandTotal) || 0),
                0
              ) &&    <Badge
              variant="secondary"
              className={`text-xs ${
                ticket.expenses.reduce(
                  (sum, e) => sum + (Number(e.amount) || 0),
                  0
                ) <
                ticket?.quotations?.reduce(
                  (total: any, exp: any) => total + (Number(exp.grandTotal) || 0),
                  0
                )
                  ? "bg-green-500 text-white"
                  : "bg-red-400 text-white"
              }`}
            >
              {ticket.expenses.reduce(
                (sum, e) => sum + (Number(e.amount) || 0),
                0
              ) <
              ticket?.quotations?.reduce(
                (total: any, exp: any) => total + (Number(exp.grandTotal) || 0),
                0
              )
                ? "Profit"
                : "Loss"}
            </Badge>
            }
       
          </div>
         
        </CardContent>
        <CardFooter className="p-3 flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs z-50"
            onClick={(e) => alert("k")}
          >
            <ArrowUpRight className="mr-1 h-3 w-3" />
            Details
          </Button>
        </CardFooter>
      </Card>

      <EditTicketDialog
        ticket={ticket}
        onUpdate={handleUpdate}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      />
    </>
  );
}
