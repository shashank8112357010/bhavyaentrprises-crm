"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams } from "next/navigation";
import { getTicketById, addComment } from "@/lib/services/ticket";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/authStore";

import { Skeleton } from "@/components/ui/skeleton";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReassignTicketDialog from "@/components/tickets/reassign-ticket-dialog";
import EditTicketDialog from "@/components/tickets/edit-ticket-dialog";
import { DocumentSection } from "@/components/tickets/DocumentSection";
import { TicketOverview } from "@/components/tickets/TicketOverview";
import { TicketHeader } from "@/components/tickets/TicketHeader";
import { CommentSection } from "@/components/tickets/CommentSection";
import { FinancialOverview } from "@/components/tickets/FinancialOverview";

// Type definitions remain the same
const getCurrentUserIdFromAuth = (): string | null => {
  return localStorage.getItem("userId");
};

import type { Comment } from "@/types/comment";

interface Client {
  id: string;
  name: string;
  type?: string;
  contactPerson?: string;
  contactEmail?: string | null;
  gstn?: string | null;
  initials?: string;
}

interface Assignee {
  id: string;
  name: string | null;
  email: string | null;
  avatar: string | null;
  initials: string | null;
  role?: string;
}

interface WorkStage {
  id: string;
  stateName: string;
  adminName: string;
  clientName: string;
  siteName: string;
  quoteNo: string;
  dateReceived: string;
  quoteTaxable: number;
  quoteAmount: number;
  workStatus: string;
  approval: string;
  poStatus: boolean;
  poNumber: string;
  jcrStatus: boolean;
  agentName: string;
}

interface Quotation {
  id: string;
  name: string;
  pdfUrl: string;
  createdAt: string;
  ticketId: string | null;
  subtotal: number;
  gst: number;
  grandTotal: number;
  expectedExpense?: number;
}

interface Expense {
  id: string;
  customId: string;
  displayId: string;
  amount: number;
  description: string;
  category: string;
  requester: string;
  paymentType: string;
  createdAt: string;
  pdfUrl: string | null;
}

type Status =
  | "new"
  | "inProgress"
  | "onHold"
  | "completed"
  | "billing_pending"
  | "billing_completed";

interface TicketDocument {
  label: string;
  available: boolean;
  url?: string;
}

interface TicketData {
  id: string;
  ticketId: string;
  title: string;
  branch: string;
  priority: string;
  dueDate: string | null;
  scheduledDate: string | null;
  completedDate: string | null;
  createdAt: string;
  description: string;
  holdReason: string | null;
  status: Status | null;
  client: Client | null;
  assignee: Assignee | null;
  workStage: WorkStage | null;
  Quotation: Quotation[];
  expenses: Expense[];
  comments: Comment[];
  due?: number | null;
  paid?: boolean | null;
  documents?: TicketDocument[];
}

export default function TicketDetailsPage() {
  const params = useParams();
  const ticketId = params.id as string;
  const { user } = useAuthStore();
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [newCommentText, setNewCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [reassignDialogOpen, setReassignDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const refreshTicketData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getTicketById(ticketId);
      setTicket(data.ticket || data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch ticket");
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  const [documents, setDocuments] = useState<TicketDocument[]>([]);
  // Tab state for Ticket Details

  const isAdminOrAccounts = user?.role === "ADMIN" || user?.role === "ACCOUNTS";

  const loadTicketData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTicketById(ticketId);
      if (data) {
        setTicket(data.ticket || []);
        setDocuments(data.documents || []);
      } else {
        setError("Ticket not found.");
      }
    } catch (err: any) {
      console.error("Error fetching ticket:", err);
      setError(
        err.message || "An error occurred while fetching ticket details."
      );
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  const currentAssignee = useMemo(() => {
    if (ticket?.assignee) {
      return {
        id: ticket.assignee.id || "",
        name: ticket.assignee.name || "Unknown",
      };
    }
    return undefined;
  }, [ticket?.assignee]);

  const handleAddComment = async (comment:string) => {
    const currentUserId = getCurrentUserIdFromAuth();

    if (!currentUserId) {
      toast({
        title: "Error Adding Comment",
        description:
          "Could not identify current user. Please ensure you are logged in.",
        variant: "destructive",
      });
      setIsSubmittingComment(false);
      return;
    }

    if (!comment.trim() || !ticketId) {
      toast({
        title: "Error",
        description: "Comment text is required.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmittingComment(true);
    try {
      const addedComment: Comment = await addComment(
        ticketId,
        comment,
        currentUserId
      );

      setTicket((prevTicket) => {
        if (!prevTicket) return null;
        const updatedComments = [...(prevTicket.comments || []), addedComment];
        return { ...prevTicket, comments: updatedComments };
      });

      setNewCommentText("");
      toast({
        title: "Success",
        description: "Comment added successfully.",
      });
    } catch (err: any) {
      console.error("Error adding comment:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to add comment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingComment(false);
    }
  };

  useEffect(() => {
    if (ticketId) {
      loadTicketData();
    }
  }, [ticketId]);

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <div>
            <Skeleton className="h-6 w-24 mb-2" />
            <Skeleton className="h-10 w-1/2" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>

        <div className="flex space-x-4 border-b">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-32" />
        </div>

        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg space-y-3">
              <Skeleton className="h-5 w-1/3 mb-2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </div>

            <div className="p-4 border rounded-lg space-y-3">
              <Skeleton className="h-5 w-1/3 mb-2" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>

          <div className="p-4 border rounded-lg space-y-3">
            <Skeleton className="h-5 w-1/4 mb-2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>

          <div className="p-4 border rounded-lg space-y-3">
            <Skeleton className="h-5 w-1/5 mb-2" />
            <Skeleton className="h-4 w-full mb-1" />
            <Skeleton className="h-4 w-full mb-1" />
            <Skeleton className="h-4 w-5/6 mb-1" />
            <Skeleton className="h-4 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  if (!ticket) {
    return <div className="p-4">No ticket data found.</div>;
  }

  // --- Handlers and mock data for new UI ---
  const handleEdit = () => setEditDialogOpen(true);
  const handleReassign = () => setReassignDialogOpen(true);
  const canEdit = isAdminOrAccounts;
  const mockDocuments = [
    {
      name: "JCR Document",
      available: true,
      downloadUrl: "/documents/jcr.pdf",
      viewUrl: "/documents/jcr.pdf",
    },
    {
      name: "Quotation PDF",
      available: true,
      downloadUrl: "/documents/quotation.pdf",
      viewUrl: "/documents/quotation.pdf",
    },
    {
      name: "Purchase Order",
      available: false,
    },
    {
      name: "Site Survey Report",
      available: true,
      downloadUrl: "/documents/survey.pdf",
    },
  ];
  const handleCreateQuotation = () => {
    // You can route to create quotation page or open a dialog
    window.open(
      `/dashboard/quotations/new?ticketId=${ticket.id}&clientId=${ticket.client?.id}`,
      "_blank"
    );
  };


  return (
    <div className="">
      <TicketHeader
        ticketId={ticket.ticketId}
        title={ticket.title}
        status={ticket?.status || ""}
        priority={ticket.priority}
        onEdit={handleEdit}
        onReassign={handleReassign}
        canEdit={canEdit}
      />

      <div className="max-w-8xl mx-auto p-6">
        {/* Overview Section */}
        <div className="mb-8">
          <TicketOverview
            client={
              ticket.client
                ? {
                    ...ticket.client,
                    name: ticket.client.name ?? "",
                    contactPerson: ticket.client.contactPerson ?? "",
                    contactEmail: ticket.client.contactEmail ?? "",
                    gstn: ticket.client.gstn ?? "",
                    initials: ticket.client.initials ?? "",
                  }
                : undefined
            }
            assignee={
              ticket.assignee
                ? {
                    ...ticket.assignee,
                    name: ticket.assignee.name ?? "",
                    email: ticket.assignee.email ?? "",
                    avatar: ticket.assignee.avatar ?? "",
                    initials: ticket.assignee.initials ?? "",
                  }
                : undefined
            }
            branch={ticket.branch || ""}
            priority={ticket.priority || ""}
            dueDate={ticket.dueDate || ""}
            scheduledDate={ticket.scheduledDate || ""}
            completedDate={ticket.completedDate || ""}
            createdAt={ticket.createdAt || ""}
            description={ticket.description || ""}
            holdReason={ticket.holdReason || ""}
          
          />
        </div>

        {/* Tabbed Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="financials">Financials</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CommentSection
                comments={ticket.comments ?? []}
                onAddComment={handleAddComment}
                isSubmitting={isSubmittingComment}
                
                
              />
              <DocumentSection documents={documents} />
            </div>
          </TabsContent>

          <TabsContent value="financials">
            <FinancialOverview
              quotations={ticket.Quotation}
              expenses={ticket.expenses}
              canManageFinancials={canEdit}
              onCreateQuotation={handleCreateQuotation}
             
            />
          </TabsContent>

          <TabsContent value="documents">
            <DocumentSection documents={documents} />
          </TabsContent>

          <TabsContent value="activity">
            <CommentSection
              comments={ticket.comments ?? []}
              onAddComment={handleAddComment}
              isSubmitting={isSubmittingComment}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Keep dialogs for edit/reassign if needed */}
      {isAdminOrAccounts && (
        <>
          <ReassignTicketDialog
            open={reassignDialogOpen}
            onOpenChange={setReassignDialogOpen}
            ticketId={ticket.id}
            currentAssignee={currentAssignee}
            onReassignSuccess={loadTicketData}
          />
          {ticket && (
            <EditTicketDialog
              ticket={ticket}
              open={editDialogOpen}
              onOpenChange={setEditDialogOpen}
              onEditSuccess={refreshTicketData}
            />
          )}
        </>
      )}
    </div>
  );
}
