"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams } from "next/navigation";
import { getTicketById, addComment } from "@/lib/services/ticket";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/authStore";

// UI Imports
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import {
  Building,
  Calendar,
  FileText,
  Receipt,
  User,
  MessageSquare,
  Edit,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NewExpenseDialog } from "@/components/finances/new-expense-dialog";
import ReassignTicketDialog from "@/components/tickets/reassign-ticket-dialog";
import EditTicketDialog from "@/components/tickets/edit-ticket-dialog";

// Type definitions remain the same
const getCurrentUserIdFromAuth = (): string | null => {
  return localStorage.getItem("userId");
};

interface CommentUser {
  id: string;
  name: string | null;
  avatar: string | null;
  initials: string | null;
}

interface Comment {
  id: string;
  text: string;
  createdAt: string;
  userId: string;
  user: CommentUser;
}

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
  amount: number;
  description: string;
  category: string;
  requester: string;
  paymentType: string;
  createdAt: string;
  pdfUrl: string | null;
}

type Status = "new" | "inProgress" | "onHold" | "completed" | "billing_pending" | "billing_completed";

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

  const isAdminOrAccounts = user?.role === "ADMIN" || user?.role === "ACCOUNTS";

  const loadTicketData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTicketById(ticketId);
      if (data) {
        setTicket(data);
      } else {
        setError("Ticket not found.");
      }
    } catch (err: any) {
      console.error("Error fetching ticket:", err);
      setError(err.message || "An error occurred while fetching ticket details.");
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

  const handleAddComment = async () => {
    const currentUserId = getCurrentUserIdFromAuth();

    if (!currentUserId) {
      toast({
        title: "Error Adding Comment",
        description: "Could not identify current user. Please ensure you are logged in.",
        variant: "destructive",
      });
      setIsSubmittingComment(false);
      return;
    }

    if (!newCommentText.trim() || !ticketId) {
      toast({
        title: "Error",
        description: "Comment text is required.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmittingComment(true);
    try {
      const addedComment: Comment = await addComment(ticketId, newCommentText, currentUserId);

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
  }, [ticketId, loadTicketData]);

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
    <div className="space-y-4 mt-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center">
            <FileText className="h-4 w-4 mr-2" />
            Documents
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">JCR Document</span>
              {ticket.workStage?.jcrStatus ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Add JCR download logic here
                    window.open(`/api/ticket/${ticketId}/jcr-pdf`, '_blank');
                  }}
                >
                  Download JCR
                </Button>
              ) : (
                <span className="text-gray-500">JCR not available</span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Quotation</span>
              {ticket.Quotation && ticket.Quotation.length > 0 ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Add quotation download logic here
                    window.open(`/api/quotations/${ticket.Quotation[0].id}/preview-pdf`, '_blank');
                  }}
                >
                  Download Quotation
                </Button>
              ) : (
                <span className="text-gray-500">Quotation not available</span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">PO Document</span>
              {ticket.workStage?.poStatus ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Add PO download logic here
                    window.open(`/api/ticket/${ticketId}/upload-po`, '_blank');
                  }}
                >
                  Download PO
                </Button>
              ) : (
                <span className="text-gray-500">PO not available</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

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
          <p className="text-sm whitespace-pre-wrap">{ticket.description}</p>
        </CardContent>
      </Card>

      {/* Tabs state */}
      {/** @ts-ignore-next-line: state is below for clarity */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="financials">Financials</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>
        <TabsContent value="financials" className="space-y-4 mt-4">
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
                ticket.Quotation?.map((q) => ({
                  id: q.id,
                  name: q.name,
                  client: {
                    name: ticket.client?.name || "N/A",
                    id: ticket.client?.id || "",
                  },
                  ticket: {
                    id: ticket.id,
                    title: ticket.title,
                  },
                  displayId: q.id || "",
                })) || []
              }
            />
          </div>
        )}

        {ticket.Quotation && ticket.Quotation.length > 0 ? (
          ticket.Quotation.map((quotation) => (
            <Card key={quotation.id}>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Quotation: {quotation.name}
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

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Profit Analysis</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {(() => {
              const totalExpenses =
                ticket.expenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0;
              const quotationAmount = ticket.Quotation?.[0]?.grandTotal || 0;
              const expectedExpense =
                ticket.Quotation?.[0]?.expectedExpense || 0;

              const expectedProfit = expectedExpense - totalExpenses;
              const actualProfit = quotationAmount - totalExpenses;
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
                        className={`font-medium ${
                          expectedProfit >= 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        ₹{expectedProfit.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Actual Profit:</span>
                      <span
                        className={`font-medium ${
                          actualProfit >= 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        ₹{actualProfit.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Profit Margin:</span>
                      <span
                        className={`font-medium ${
                          profitMargin >= 0 ? "text-green-600" : "text-red-600"
                        }`}
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
            <CardTitle className="text-sm font-medium">Other Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="justify-start w-full"
              disabled={!ticket.workStage?.poNumber}
              onClick={() => alert(`PO Number: ${ticket.workStage?.poNumber}`)}
            >
              <FileText className="mr-2 h-4 w-4" />
              View Purchase Order (Details:{" "}
              {ticket.workStage?.poNumber || "N/A"})
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

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
                        {comment.user?.initials || comment.user?.name?.charAt(0) || "U"}
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

      {isAdminOrAccounts && (
        <>
          <ReassignTicketDialog
            open={reassignDialogOpen}
            onOpenChange={setReassignDialogOpen}
            ticketId={ticket.id}
            currentAssignee={currentAssignee}
            onReassignSuccess={loadTicketData}
          />

          <EditTicketDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            ticket={ticket}
            onEditSuccess={loadTicketData}
          />
        </>
      )}
    </Tabs>
    </div>
  );
}
