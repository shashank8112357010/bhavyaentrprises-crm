"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { getTicketById, addComment } from "@/lib/services/ticket"; // Import services
import { useToast } from "@/hooks/use-toast"; // Import useToast
import { useAuthStore } from "@/store/authStore"; // Import auth store

// UI Imports
import { Button } from "@/components/ui/button"; // Already here
import { Textarea } from "@/components/ui/textarea"; // Import Textarea
import { Label } from "@/components/ui/label"; // Import Label
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Building,
  Calendar,
  FileText,
  Receipt,
  User,
  MessageSquare, // For comments/timeline
  Edit, // For edit button
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton
import { NewExpenseDialog } from "@/components/finances/new-expense-dialog";
import Link from "next/link";
import ReassignTicketDialog from "@/components/tickets/reassign-ticket-dialog";
import EditTicketDialog from "@/components/tickets/edit-ticket-dialog";

// Placeholder for ticket store or service - replace with actual later
// import { useTicketStore } from "@/store/ticketStore";

// TODO: Implement this function based on your authentication setup
// This function should parse your JWT token / session cookie
// and return the authenticated user's ID.
const getCurrentUserIdFromAuth = (): string | null => {
  return localStorage.getItem("userId");
};

// Type for User details within a Comment
interface CommentUser {
  id: string;
  name: string | null;
  avatar: string | null;
  initials: string | null;
}

// Type for Comment
interface Comment {
  id: string;
  text: string;
  createdAt: string; // Assuming ISO string date
  userId: string;
  user: CommentUser;
  // ticketId is implicitly known
}

// Type for Client
interface Client {
  id: string;
  name: string;
  // Add other relevant client fields: e.g., type, contactPerson, contactEmail, gstn
  type?: string;
  contactPerson?: string;
  contactEmail?: string | null;
  gstn?: string | null;
  initials?: string; // from schema
}

// Type for Assignee (User)
interface Assignee {
  id: string;
  name: string | null;
  email: string | null; // Included based on API update
  avatar: string | null;
  initials: string | null;
  role?: string; // Included based on API update
  // Add other relevant user fields if needed
}

// Type for WorkStage
interface WorkStage {
  id: string;
  stateName: string;
  adminName: string;
  clientName: string;
  siteName: string;
  quoteNo: string;
  dateReceived: string; // Assuming ISO string date
  quoteTaxable: number;
  quoteAmount: number;
  workStatus: string;
  approval: string;
  poStatus: boolean;
  poNumber: string;
  jcrStatus: boolean; // In schema it was string, but boolean makes more sense
  agentName: string;
  // ticketId is implicitly known
}

// Type for Quotation
interface Quotation {
  id: string;
  name: string;
  pdfUrl: string;
  // clientId is implicitly known via ticket
  createdAt: string; // Assuming ISO string date
  // rateCardDetails: any; // This was Json?, define more strictly if possible or needed for UI
  ticketId: string | null;
  subtotal: number;
  gst: number;
  grandTotal: number;
  expectedExpense?: number; // Add expected expense field
  // Add other relevant quotation fields
}

// Type for Expense
interface Expense {
  id: string;
  customId: string;
  amount: number;
  description: string;
  category: string; // Assuming enum converted to string (e.g., LABOR, TRANSPORT)
  requester: string;
  paymentType: string; // Assuming enum converted to string (e.g., VCASH, ONLINE)
  // quotationId: string | null; // Not directly needed if always accessed via ticket
  // ticketId: string | null; // Implicitly known
  createdAt: string; // Assuming ISO string date
  pdfUrl: string | null;
  // Add other relevant expense fields
}

// Status type to match the one used in the ticket store
type Status =
  | "new"
  | "inProgress"
  | "onHold"
  | "completed"
  | "billing_pending"
  | "billing_completed";

// Updated TicketData type
interface TicketData {
  id: string;
  ticketId: string; // The human-readable ticket ID like "BE/OCT/001"
  title: string;
  branch: string;
  priority: string;
  dueDate: string | null; // Assuming ISO string date
  scheduledDate: string | null; // Assuming ISO string date
  completedDate: string | null; // Assuming ISO string date
  createdAt: string; // Assuming ISO string date
  description: string;
  holdReason: string | null;
  // comments: number; // This was the old field, now it's an array of Comment objects
  status: Status | null; // Fixed to match Status type
  // Relations
  client: Client | null;
  assignee: Assignee | null;
  workStage: WorkStage | null;
  Quotation: Quotation[]; // Array of Quotations
  expenses: Expense[]; // Array of Expenses
  comments: Comment[]; // Array of Comments
  // Prisma schema also has due: Int? and paid: Boolean?
  due?: number | null;
  paid?: boolean | null;
}

export default function TicketDetailsPage() {
  const params = useParams();
  const ticketId = params.id as string; // Or params.id?.toString()
  const { user } = useAuthStore(); // Get current user from auth store

  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Check if user has admin privileges (can create quotations and expenses)
  const isAdminOrAccounts = user?.role === "ADMIN" || user?.role === "ACCOUNTS";

  const loadTicketData = async () => {
    // Ensure loadTicketData is defined before it's used in useEffect or passed as prop
    setLoading(true);
    setError(null);
    try {
      const data = await getTicketById(ticketId); // Use the actual service
      if (data) {
        setTicket(data);
      } else {
        setError("Ticket not found.");
      }
    } catch (err: any) {
      console.error("Error fetching ticket:", err);
      setError(
        err.message || "An error occurred while fetching ticket details.",
      );
    } finally {
      setLoading(false);
    }
  };

  // State for new comment
  const [newCommentText, setNewCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // State for reassign dialog
  const [reassignDialogOpen, setReassignDialogOpen] = useState(false);

  // State for edit dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Memoize currentAssignee to prevent object recreation on every render
  const currentAssignee = useMemo(() => {
    if (ticket?.assignee) {
      return {
        id: ticket.assignee.id || "",
        name: ticket.assignee.name || "Unknown",
      };
    }
    return undefined;
  }, [ticket?.assignee]);

  const handleAddComment = async () => {
    const currentUserId = getCurrentUserIdFromAuth();

    if (!currentUserId) {
      toast({
        title: "Error Adding Comment",
        description:
          "Could not identify current user. Please ensure you are logged in.",
        variant: "destructive",
      });
      setIsSubmittingComment(false); // Ensure button is re-enabled
      return;
    }

    if (!newCommentText.trim() || !ticketId) {
      // currentUserId is now checked above
      toast({
        title: "Error",
        description: "Comment text is required.", // Simplified message
        variant: "destructive",
      });
      return;
    }

    setIsSubmittingComment(true);
    try {
      // The addComment service should return the newly created comment,
      // ideally with user details populated as defined in Comment and CommentUser types.
      const addedComment: Comment = await addComment(
        ticketId,
        newCommentText,
        currentUserId,
      );

      setTicket((prevTicket) => {
        if (!prevTicket) return null;
        // Optimistically update the comments list
        const updatedComments = [...(prevTicket.comments || []), addedComment];
        return { ...prevTicket, comments: updatedComments };
      });

      setNewCommentText(""); // Clear the textarea
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
      loadTicketData(); // Call the defined loadTicketData
    }
  }, [ticketId ]); // Removed loadTicketData from dependency array as it's stable now

  // The old placeholder fetchTicketById and its associated useEffect have been removed.
  // The new useEffect uses getTicketById directly.

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

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header Section */}
      <div className="flex items-center justify-between space-y-2">
        <div>
          <Badge variant="outline" className="text-sm">
            {ticket.ticketId}
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight mt-1">
            {ticket.title}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {/* Only show Edit button for admin roles */}
          {isAdminOrAccounts && (
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(true)}
              className="flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              Edit
            </Button>
          )}
          {/* Only show Reassign button for admin roles */}
          {isAdminOrAccounts && (
            <Button
              variant="outline"
              onClick={() => setReassignDialogOpen(true)}
              className="flex items-center gap-2"
            >
              <User className="h-4 w-4" />
              Reassign
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="details" className="mt-4">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="financials">Financials</TabsTrigger>
          <TabsTrigger value="timeline">Timeline & Comments</TabsTrigger>
        </TabsList>

        {/* Details Tab Content */}
        <TabsContent value="details" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center">
                  <Building className="h-4 w-4 mr-2" />
                  Client Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>
                  <strong>Client:</strong> {ticket.client?.name || "N/A"}
                </p>
                <p>
                  <strong>Branch:</strong> {ticket.branch}
                </p>
                {ticket.workStage?.clientName && (
                  <p>
                    <strong>Contact:</strong> {ticket.workStage.clientName}
                  </p>
                )}
                {ticket.client?.contactEmail && (
                  <p>
                    <strong>Email:</strong> {ticket.client.contactEmail}
                  </p>
                )}
                {ticket.client?.gstn && (
                  <p>
                    <strong>GSTN:</strong> {ticket.client.gstn}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  Assignment & Scheduling
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={ticket.assignee?.avatar || undefined} />
                    <AvatarFallback>
                      {ticket.assignee?.initials || "N/A"}
                    </AvatarFallback>
                  </Avatar>
                  <span>
                    Assigned to: {ticket.assignee?.name || "Unassigned"}
                  </span>
                </div>
                <p>
                  <strong>Priority:</strong>{" "}
                  <Badge
                    variant={
                      ticket.priority?.toLowerCase() === "high"
                        ? "destructive"
                        : ticket.priority?.toLowerCase() === "medium"
                          ? "secondary"
                          : "outline"
                    }
                  >
                    {ticket.priority || "N/A"}
                  </Badge>
                </p>
                <p>
                  <strong>Status:</strong>{" "}
                  <Badge variant="default">{ticket.status || "N/A"}</Badge>
                </p>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>
                    Due Date:{" "}
                    {ticket.dueDate
                      ? new Date(ticket.dueDate).toLocaleDateString()
                      : "N/A"}
                  </span>
                </div>
                {ticket.scheduledDate && (
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>
                      Scheduled:{" "}
                      {new Date(ticket.scheduledDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {ticket.completedDate && (
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>
                      Completed:{" "}
                      {new Date(ticket.completedDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {ticket.holdReason && (
                  <p className="text-sm text-orange-600">
                    <strong>On Hold:</strong> {ticket.holdReason}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {ticket.workStage && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Work Stage Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <p>
                  <strong>State:</strong> {ticket.workStage.stateName}
                </p>
                <p>
                  <strong>Admin:</strong> {ticket.workStage.adminName}
                </p>
                <p>
                  <strong>Site:</strong> {ticket.workStage.siteName}
                </p>
                <p>
                  <strong>Work Status:</strong> {ticket.workStage.workStatus}
                </p>
                <p>
                  <strong>Approval:</strong> {ticket.workStage.approval}
                </p>
                {ticket.workStage.quoteNo && (
                  <p>
                    <strong>Quote No:</strong> {ticket.workStage.quoteNo}
                  </p>
                )}
                {ticket.workStage.poNumber && (
                  <p>
                    <strong>PO No:</strong> {ticket.workStage.poNumber} (Status:{" "}
                    {ticket.workStage.poStatus ? "Received" : "Pending"})
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">
                {ticket.description}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Financials Tab Content */}
        <TabsContent value="financials" className="space-y-4 mt-4">
          {/* Only show create buttons for admin roles */}
          {isAdminOrAccounts && (
            <div className="mb-4 flex gap-2 flex-wrap">
              <Link
                href={`/dashboard/quotations/new?ticketId=${ticket.id}&clientId=${ticket.client?.id}`}
              >
                <Button className="flex items-center gap-2">
                  <Receipt className="h-4 w-4" />
                  Create Quotation
                </Button>
              </Link>
              <NewExpenseDialog
                onSuccess={loadTicketData}
                ticketId={ticket.id}
                ticketQuotations={
                  ticket.Quotation?.map((q: any) => ({
                    id: q.id,
                    name: q.name,
                    client: {
                      name: q?.client?.name || "N/A",
                      id: q?.client?.id || "",
                    }, // Ensure that `client` is included in the mapping
                  })) || []
                }
              />
            </div>
          )}

          {/* Show quotations - read-only for agent roles */}
          {ticket.Quotation && ticket.Quotation.length > 0 ? (
            ticket.Quotation.map((quotation) => (
              <Card key={quotation.id}>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">
                    Quotation: {quotation.name}{" "}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    <div>Amount:</div>
                    <div className="text-right font-medium">
                      ₹{quotation.subtotal?.toFixed(2) || "0.00"}
                    </div>
                    <div>GST:</div>
                    <div className="text-right font-medium">
                      ₹{quotation.gst?.toFixed(2) || "0.00"}
                    </div>
                    <div className="border-t mt-1 pt-1">Total:</div>
                    <div className="text-right font-bold border-t mt-1 pt-1">
                      ₹{quotation.grandTotal?.toFixed(2) || "0.00"}
                    </div>
                  </div>
                  {quotation.pdfUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => window.open(quotation.pdfUrl, "_blank")}
                    >
                      <Receipt className="mr-2 h-4 w-4" /> View Quotation PDF
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Quotation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  No quotation details available.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Show expenses - read-only for agent roles */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Expenses</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              {ticket.expenses && ticket.expenses.length > 0 ? (
                <>
                  {ticket.expenses.map((expense) => (
                    <div
                      key={expense.id}
                      className="flex justify-between py-1 border-b last:border-none"
                    >
                      <div>
                        <p>
                          {expense.description} ({expense.category})
                        </p>
                        <p className="text-xs text-muted-foreground">
                          ID: {expense.customId} | By: {expense.requester}
                        </p>
                      </div>
                      <span className="font-medium">
                        ₹{expense.amount.toFixed(2)}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between border-t pt-2 mt-2">
                    <span className="font-medium">Total Expenses:</span>
                    <span className="font-bold">
                      ₹
                      {ticket.expenses
                        .reduce((sum, exp) => sum + exp.amount, 0)
                        .toFixed(2)}
                    </span>
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground">
                  No expenses recorded for this ticket.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Profit Analysis - show to all users */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Profit Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              {(() => {
                const totalExpenses =
                  ticket.expenses?.reduce((sum, exp) => sum + exp.amount, 0) ||
                  0;
                const quotationAmount = ticket.Quotation?.[0]?.grandTotal || 0;
                const expectedExpense =
                  ticket.Quotation?.[0]?.expectedExpense || 0;

                // Expected profit = expected expense - total expense
                const expectedProfit = expectedExpense - totalExpenses;

                // Profit = quotation amount - total expense
                const actualProfit = quotationAmount - totalExpenses;

                // Profit margin calculation
                const profitMargin =
                  quotationAmount > 0
                    ? (actualProfit / quotationAmount) * 100
                    : 0;

                return (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Expected Expense:</span>
                      <span>₹{expectedExpense.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Expenses:</span>
                      <span>₹{totalExpenses.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Quotation Amount:</span>
                      <span>₹{quotationAmount.toFixed(2)}</span>
                    </div>
                    <div className="border-t pt-2 mt-2 space-y-1">
                      <div className="flex justify-between">
                        <span className="font-medium">Expected Profit:</span>
                        <span
                          className={`font-medium ${expectedProfit >= 0 ? "text-green-600" : "text-red-600"}`}
                        >
                          ₹{expectedProfit.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Actual Profit:</span>
                        <span
                          className={`font-medium ${actualProfit >= 0 ? "text-green-600" : "text-red-600"}`}
                        >
                          ₹{actualProfit.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Profit Margin:</span>
                        <span
                          className={`font-medium ${profitMargin >= 0 ? "text-green-600" : "text-red-600"}`}
                        >
                          {profitMargin.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Other Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="justify-start w-full"
                disabled={!ticket.workStage?.poNumber}
                onClick={() =>
                  alert(`PO Number: ${ticket.workStage?.poNumber}`)
                }
              >
                <FileText className="mr-2 h-4 w-4" />
                View Purchase Order (Details:{" "}
                {ticket.workStage?.poNumber || "N/A"})
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Timeline Tab Content */}
        <TabsContent value="timeline" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center">
                <MessageSquare className="h-4 w-4 mr-2" />
                Activity Timeline & Comments
              </CardTitle>
            </CardHeader>
            <CardContent>
              {ticket.comments && ticket.comments.length > 0 ? (
                <div className="space-y-4">
                  {ticket.comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={comment.user?.avatar || undefined} />
                        <AvatarFallback>
                          {comment.user?.initials ||
                            comment.user?.name?.charAt(0) ||
                            "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {comment.user?.name || "Unknown User"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(comment.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {comment.text}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No comments or activity recorded yet.
                </p>
              )}

              {/* Add Comment Form - available to all users */}
              <div className="mt-6 pt-4 border-t">
                <h4 className="text-lg font-semibold mb-3">Add New Comment</h4>
                <div className="grid gap-2 mb-2">
                  <Label htmlFor="newComment" className="sr-only">
                    Your Comment
                  </Label>
                  <Textarea
                    id="newComment"
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    placeholder="Type your comment here..."
                    rows={3}
                    disabled={isSubmittingComment}
                  />
                </div>
                <Button
                  onClick={handleAddComment}
                  disabled={isSubmittingComment || !newCommentText.trim()}
                  size="sm"
                >
                  {isSubmittingComment ? "Submitting..." : "Add Comment"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Only show dialogs for admin roles */}
      {isAdminOrAccounts && (
        <>
          {/* Reassign Ticket Dialog */}
          <ReassignTicketDialog
            open={reassignDialogOpen}
            onOpenChange={setReassignDialogOpen}
            ticketId={ticket.id}
            currentAssignee={currentAssignee}
            onReassignSuccess={loadTicketData}
          />

          {/* Edit Ticket Dialog */}
          <EditTicketDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            ticket={ticket}
            onEditSuccess={loadTicketData}
          />
        </>
      )}
    </div>
  );
}
