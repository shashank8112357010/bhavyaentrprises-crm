"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Ticket } from "./types";

interface SortableTicketProps {
  ticket: Ticket;
}

export function SortableTicket({ ticket }: SortableTicketProps) {
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

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`mb-3 cursor-grab transition-all duration-200
    ${
      ticket.expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0) <
      (ticket.workStage?.quoteAmount || 0)
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
            <Badge variant="outline">{ticket.id.slice(0, 9)}</Badge>
            <div
              className={`h-2 w-2 rounded-full ${priorityColor}`}
              title={`Priority: ${ticket.priority}`}
            ></div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem>View Details</DropdownMenuItem>
              {/* <DropdownMenuItem>Update Work Stage</DropdownMenuItem> */}
              {/* <DropdownMenuSeparator /> */}
              {/* <DropdownMenuItem>Change Status</DropdownMenuItem> */}
              <DropdownMenuItem>Edit Ticket</DropdownMenuItem>
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
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <Tooltip>
                <TooltipTrigger className="flex items-center">
                  <Receipt className="mr-1 h-3 w-3" />
                  <span>Quote:{ticket.workStage?.quoteNo || "N/A"}</span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Amount: ₹{ticket.workStage?.quoteAmount || "N/A"}</p>
                  <p>Taxable: ₹{ticket.workStage?.quoteTaxable || "N/A"}</p>
                </TooltipContent>
              </Tooltip>

              <div className="flex items-center">
                {/* <FileText className="mr-1 h-3 w-3" /> */}
                <span
                  className={`px-2 ml-[-4px] py-0.4 rounded-full text-xs font-medium ${
                    ticket.workStage?.poNumber === "N/A"
                      ? "bg-yellow-400 text-black"
                      : "bg-green-500 text-white"
                  }`}
                >
                  PO:{" "}
                  {ticket.workStage?.poNumber === "N/A"
                    ? "Pending"
                    : "Approved"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div className="flex items-center">
                <User className="mr-1 h-3 w-3" />
                <span>Agent: {ticket.workStage?.agentName || "N/A"}</span>
              </div>

              <div className="flex items-center">
                <Calendar className="mr-1 h-3 w-3" />
                <span>
                  {formatDateString(
                    ticket.workStage?.dateReceived || new Date().toISOString()
                  )}
                </span>
              </div>
            </div>
          </TooltipProvider>
        </div>

        <div className="flex flex-wrap gap-2 mt-3">
      
          <Badge variant="outline" className="text-xs">
            JCR: {ticket.workStage?.jcrStatus ? "Done" : "Pending"}
          </Badge>
            <Badge variant="secondary" className="text-xs">
              Quotation: ₹{ticket?.workStage?.quoteAmount.toLocaleString() || 0}
            </Badge>
         
            <Badge variant="secondary" className="text-xs">
              Expense: ₹
              {ticket?.expenses?.reduce((total:any, exp:any) => total + (Number(exp.amount) || 0), 0)
                .toLocaleString()}
            </Badge>
        
        </div>

        <div className="flex justify-between items-center mt-3">
          <div className="flex items-center">
            <Avatar className="h-6 w-6 mr-2">
              <AvatarImage
                src={ticket?.assignee?.avatar}
                alt={ticket?.assignee?.name}
              />
              <AvatarFallback className="text-sm">
                {ticket?.assignee?.name
                  .split(" ")
                  .map((n: any) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">
              {ticket?.assignee?.name || "N/A"}
            </span>
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
                  {formatDateString(ticket.dueDate || new Date().toISOString())}
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
        </div>
      </CardContent>
      <CardFooter className="p-3 flex justify-end">
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
          <ArrowUpRight className="mr-1 h-3 w-3" />
          Details
        </Button>
      </CardFooter>
    </Card>
  );
}
