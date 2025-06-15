"use client";

import { useEffect, useState } from "react";
import {
  useTicketStore,
  type Ticket,
  type Status,
  type Comment,
} from "@/store/ticketStore";
import { useAgentStore } from "@/store/agentStore";
import { useClientStore } from "@/store/clientStore";
import { Building, Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  // DialogFooter, // No longer directly used if moved to child
} from "@/components/ui/dialog"; // Keep Dialog for potential direct uses if any remain
import KanbanBoard from "@/components/kanban/kanban-board";
// import NewTicketDialog from "@/components/tickets/new-ticket-dialog"; // Lazy load this
import { useToast } from "@/hooks/use-toast";
// import { exportTicketsToExcel } from "@/lib/services/ticket"; // Logic moved to ExportTicketsDialog
import { Label } from "@radix-ui/react-label"; // Keep if Label is used directly, else remove if only in dialogs
// import { Textarea } from "@/components/ui/textarea"; // Keep if Textarea is used directly, else remove
import { useAuthStore } from "@/store/authStore";
import React, { lazy, Suspense } from "react"; // Import lazy and Suspense

// Lazy load dialog components
const NewTicketDialog = lazy(() => import("@/components/tickets/new-ticket-dialog"));
const ExportTicketsDialog = lazy(() => import("@/components/kanban/dialogs/ExportTicketsDialog"));
const HoldReasonDialog = lazy(() => import("@/components/kanban/dialogs/HoldReasonDialog"));
const ApprovalDialog = lazy(() => import("@/components/kanban/dialogs/ApprovalDialog"));


// Types for filtered tickets
interface TicketsState {
  new: Ticket[];
  inProgress: Ticket[];
  onHold: Ticket[];
  completed: Ticket[];
  billing_pending: Ticket[];
  billing_completed: Ticket[];
}

interface DragEndResult {
  source: string;
  destination: string;
  ticketId: string;
}

interface ExportFilters {
  status?: Status;
  startDate: string;
  endDate: string;
}

export default function KanbanPage() {
  const {
    tickets,
    fetchTickets,
    updateTicketStatus,
    currentPage,
    hasMoreTickets,
    updateTicket,
    fetchTicketById,
  } = useTicketStore();
  const { agents, fetchAgents } = useAgentStore();
  const { clients, fetchClients } = useClientStore();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");

  // State for controlling dialog visibility
  const [isNewTicketDialogOpen, setIsNewTicketDialogOpen] = useState(false); // For NewTicketDialog if it needs explicit control from parent
  const [exportModalOpen, setExportModalOpen] = useState<boolean>(false);
  const [holdReasonModalOpen, setHoldReasonModalOpen] = useState<boolean>(false);
  const [approvalModalOpen, setApprovalModalOpen] = useState<boolean>(false);

  // State passed to dialogs
  const [ticketToHold, setTicketToHold] = useState<Ticket | null>(null);
  const [ticketToApprove, setTicketToApprove] = useState<Ticket | null>(null);
  // const [approverId, setApproverId] = useState(""); // Managed within ApprovalDialog
  // const [approvalNote, setApprovalNote] = useState(""); // Managed within ApprovalDialog
  // const [holdReasonText, setHoldReasonText] = useState<string>(""); // Managed within HoldReasonDialog
  // const [isLoadingHold, setLoadingHold] = useState<boolean>(false); // Managed within HoldReasonDialog


  // const [startDate, setStartDate] = useState<string>(""); // Not used
  // const [endDate, setEndDate] = useState<string>(""); // Not used

  const today = new Date().toISOString().split("T")[0]; // 'YYYY-MM-DD'
  const [startDateTicket, setStartDateTicket] = useState<string>(today);
  const [endDateTicket, setEndDateTicket] = useState<string>(today);
  const { user } = useAuthStore();


  useEffect(() => {
    const loadData = async () => {
      try {
        // Initial fetch with page 1 and limit 10, and other filters
        await fetchTickets({
          startDate: startDateTicket,
          endDate: endDateTicket,
          searchQuery: searchQuery,
          clientFilter: clientFilter === "all" ? undefined : clientFilter,
          assigneeFilter: assigneeFilter === "all" ? undefined : assigneeFilter,
          page: 1,
          limit: 10,
        });
        if (user) {
          await fetchAgents({}, user.role);
        }

        await fetchClients();
      } catch (error) {
        console.error("Error loading kanban data:", error);
        toast({
          title: "Error",
          description: "Failed to load data. Please try again.",
          variant: "destructive",
        });
      }
    };

    loadData();
  }, [
    fetchTickets,
    fetchAgents,
    fetchClients,
    startDateTicket,
    endDateTicket,
    searchQuery,
    clientFilter,
    assigneeFilter,
    user?.role,
    toast,
  ]);




// Handler for confirming approval - passed to ApprovalDialog
const handleApprovalConfirm = async (ticketId: string, approverIdLocal: string, approvalNoteLocal: string) => {
  // approverId and approvalNote are now local to this handler, passed from dialog
  if (!approverIdLocal.trim()) {
    toast({
      title: "Missing Accountant",
      description: "Please select the accountant guaranteeing this.",
      variant: "destructive",
    });
    return;
  }
  if (!ticketToApprove) return; // ticketToApprove is still state in KanbanPage

  try {
    await updateTicket({ // updateTicket is from useTicketStore
      id: ticketId, // Use ticketId passed from dialog
      approvedByAccountant: approverIdLocal,
      // any other fields related to approvalNote if needed by backend
      status: "completed", // Ensure status is updated
    });

    toast({ title: "Ticket Completed", description: "Ticket marked as completed." });
    setApprovalModalOpen(false); // Close dialog
    setTicketToApprove(null);   // Reset ticket to approve
  } catch (err: any) {
    toast({
      title: "Update Failed",
      description: err.message || "Could not complete the ticket.",
      variant: "destructive",
    });
  }
};

  const handleDragEnd = async (result: DragEndResult) => {
    const { source, destination, ticketId } = result;

    if (!source || !destination || source === destination) return;

    try {
      const ticket = await fetchTicketById(ticketId);
      if (!ticket) {
        toast({
          title: "Error",
          description: "Ticket not found.",
          variant: "destructive",
        });
        return;
      }

      const { workStage } = ticket;

      switch (destination) {
        case "inProgress":
          if (!workStage || workStage.quoteNo === "N/A") {
            toast({
              title: "Missing Quotation",
              description: "Please attach a quotation before proceeding.",
              variant: "destructive",
            });
            return;
          }
          break;

        case "onHold":
          setTicketToHold(ticket);
          setHoldReasonText(ticket.holdReason || "");
          setHoldReasonModalOpen(true);
          return;

          case "completed": {
            if (!workStage || workStage.quoteNo === "N/A") {
              toast({
                title: "Order Violation",
                description: "Attach a quotation before marking as completed.",
                variant: "destructive",
              });
              return;
            }
            if (!workStage.jcrStatus) {
              toast({
                title: "Missing JCR",
                description: "You cannot complete a ticket without JCR.",
                variant: "destructive",
              });
              return;
            }
            if (!workStage.poStatus) {
              // Show approval dialog
              setTicketToApprove(ticket);
              setApprovalModalOpen(true);
              return;
            }
            break;
          }
          
        case "billing_pending":
          if (ticket.status !== "completed") {
            toast({
              title: "Invalid Stage Transition",
              description: "You can only bill after completion.",
              variant: "destructive",
            });
            return;
          }
          break;

        case "billing_completed":
          if (ticket.status !== "billing_pending") {
            toast({
              title: "Invalid Billing Status",
              description: "Move to billing_pending before completing billing.",
              variant: "destructive",
            });
            return;
          }
          const dueAmount = ticket?.due ?? 0;
          const isPaid = ticket?.paid ?? false;
          if (!isPaid && dueAmount > 0) {
            toast({
              title: "Incomplete Payment",
              description: `Payment is pending. Due amount: ₹${dueAmount}. Please clear the full amount before completing billing.`,
              variant: "destructive",
            });
            return;
          }
          break;

        default:
          break;
      }

      await updateTicketStatus(ticketId, destination as Status);

      toast({
        title: "Status Updated",
        description: "Ticket status updated successfully.",
      });
    } catch (error: any) {
      console.error("Error updating ticket status:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update ticket status.",
        variant: "destructive",
      });
    }
  };

// Handler for confirming hold - passed to HoldReasonDialog
const handleConfirmHoldCallback = async (ticketId: string, reason: string, originalStatus: Status) => {
  // isLoadingHold state is now managed within HoldReasonDialog
  // holdReasonText state is now managed within HoldReasonDialog

  if (!reason.trim()) { // reason is passed from dialog
    toast({
      title: "Hold Reason Required",
      description: "Please enter a reason to put the ticket on hold.",
      variant: "destructive",
    });
    // Potentially return a boolean or throw to let dialog know not to close
    return;
  }

  try {
    // Optimistic update in store (already part of updateTicketStatus)
    // await updateTicketStatus(ticketId, "onHold");

    // Update ticket with hold reason
    await updateTicket({ // updateTicket is from useTicketStore
      id: ticketId,
      holdReason: reason,
      status: "onHold",
    });

    toast({
      title: "Ticket Put On Hold",
      description: "Ticket status updated successfully.",
    });

    setHoldReasonModalOpen(false); // Close dialog
    setTicketToHold(null); // Reset ticket to hold
  } catch (err: any) {
    console.error("Error updating hold status:", err);
    // If there's an error, status should ideally be reverted by updateTicketStatus or handled there
    // For now, just show error. Reverting might be complex if optimistic update was deep.
    // await updateTicketStatus(ticketId, originalStatus); // Revert if necessary
    toast({
      title: "Failed to Update Ticket",
      description: err.message || "Unknown error occurred.",
      variant: "destructive",
    });
    // throw err; // Optionally rethrow to let dialog know operation failed
  }
};

// Handler for cancelling hold - passed to HoldReasonDialog
const handleCancelHoldCallback = () => {
  setHoldReasonModalOpen(false);
  setTicketToHold(null);
  // holdReasonText is managed within the dialog
};

// Client-side filtering is removed as it's now handled by the backend via fetchTickets.
  // The tickets from the store (which are passed to KanbanBoard) are already paginated and filtered
  // according to the view determined by user role and selected filters (search, client, assignee, dates).
  const filteredTickets: TicketsState = tickets;
  

 
  

  const ticketStatuses: Status[] = [
    "new",
    "inProgress",
    "onHold",
    "completed",
    ...(user?.role === "ADMIN" || user?.role === "ACCOUNTS"
      ? (["billing_pending", "billing_completed"] as const)
      : []),
  ];

  // handleExportTickets is now part of ExportTicketsDialog component.

  const clearFilters = () => {
    setStartDateTicket(today);
    setEndDateTicket(today);
    setSearchQuery("");
    setClientFilter("all");
    setAssigneeFilter("all");
  };

  const accountants = agents.filter((agent) => agent.role === "ACCOUNTS");

  const handleLoadMore = () => {
    fetchTickets({
      searchQuery: searchQuery,
      clientFilter: clientFilter === "all" ? undefined : clientFilter,
      assigneeFilter: assigneeFilter === "all" ? undefined : assigneeFilter,
      startDate: startDateTicket,
      endDate: endDateTicket,
      page: currentPage + 1,
      limit: 10, // Assuming a default limit of 10
    });
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kanban Board</h1>
          <p className="text-muted-foreground">
            Manage and track maintenance requests
          </p>
        </div>
        {/* Button to open NewTicketDialog, dialog itself is lazy loaded */}
        <Button onClick={() => setIsNewTicketDialogOpen(true)}>Create Ticket</Button>
      </div>

      <div className="flex flex-col md:flex-row gap-2 items-center justify-between">
        <div className="relative w-full md:w-auto">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tickets..."
            className="w-full md:w-[300px] pl-8"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              // fetchTickets will be called by useEffect due to searchQuery dependency change
            }}
          />
        </div>
        {(user?.role === "ADMIN" || user?.role === "ACCOUNTS") && (
          <>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Select value={clientFilter} onValueChange={(value) => {
                setClientFilter(value);
                // fetchTickets will be called by useEffect due to clientFilter dependency change
              }}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <div className="flex items-center">
                    <Building className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Filter by client" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Clients</SelectItem>
                  {clients.map((client: any) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={assigneeFilter} onValueChange={(value) => {
                setAssigneeFilter(value);
                // fetchTickets will be called by useEffect due to assigneeFilter dependency change
              }}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <div className="flex items-center capitalize">
                    <User className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Filter by assignee" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Assignees</SelectItem>
                  {agents.map((agent: any) => (
                    <SelectItem
                      className="capitalize"
                      key={agent.id}
                      value={agent.originalId}
                    >
                      {agent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-2 items-center justify-between">
        <div className="flex items-center gap-2">
          <Label className="text-muted-foreground">From:</Label>
          <Input
            type="date"
            className="cursor-pointer"
            value={startDateTicket}
            onChange={(e) => {
              setStartDateTicket(e.target.value);
              // fetchTickets will be called by useEffect due to startDateTicket dependency change
            }}
          />
          <Label className="text-muted-foreground">To:</Label>
          <Input
            className="cursor-pointer"
            type="date"
            value={endDateTicket}
            onChange={(e) => {
              setEndDateTicket(e.target.value);
              // fetchTickets will be called by useEffect due to endDateTicket dependency change
            }}
          />

          <Button variant="secondary" onClick={clearFilters}>
            Clear Filters
          </Button>
          <Button variant="secondary" onClick={() => setExportModalOpen(true)}>
            Export Tickets
          </Button>
        </div>
      </div>

      <KanbanBoard tickets={filteredTickets} onDragEnd={handleDragEnd} />

      {hasMoreTickets && (
        <div className="flex justify-center mt-4">
          <Button onClick={handleLoadMore} variant="secondary">
            Load More
          </Button>
        </div>
      )}

      {/* Suspense for lazy-loaded dialogs */}
      <Suspense fallback={<div>Loading Dialog...</div>}>
        {isNewTicketDialogOpen && <NewTicketDialog open={isNewTicketDialogOpen} onOpenChange={setIsNewTicketDialogOpen} />}

        {exportModalOpen && (
          <ExportTicketsDialog
            open={exportModalOpen}
            onOpenChange={setExportModalOpen}
            ticketStatuses={ticketStatuses}
            startDateTicket={startDateTicket}
            endDateTicket={endDateTicket}
          />
        )}

        {holdReasonModalOpen && ticketToHold && (
          <HoldReasonDialog
            open={holdReasonModalOpen}
            onOpenChange={setHoldReasonModalOpen}
            ticketToHold={ticketToHold}
            onConfirmHold={handleConfirmHoldCallback}
            onCancelHold={handleCancelHoldCallback}
          />
        )}

        {approvalModalOpen && ticketToApprove && (
          <ApprovalDialog
            open={approvalModalOpen}
            onOpenChange={setApprovalModalOpen}
            ticketToApprove={ticketToApprove}
            accountants={accountants}
            onConfirmApproval={handleApprovalConfirm}
          />
        )}
      </Suspense>
    </div>
  );
}
