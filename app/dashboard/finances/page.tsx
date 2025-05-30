"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NewExpenseDialog } from "@/components/finances/new-expense-dialog";
import { NewQuotationDialog } from "@/components/finances/new-quotation-dialog";
import { Search, Download, Filter, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { getAllQuotations } from "@/lib/services/quotations";
import { getAllExpenses } from "@/lib/services/expense";
import { useToast } from "@/hooks/use-toast";

export default function FinancesPage() {
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [quotations, setQuotations] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loadingExpenses, setLoadingExpenses] = useState(false);
  const [expensesError, setExpensesError] = useState<string | null>(null);

  // Fetch Quotations
  const fetchQuotations = async () => {
    try {
      const data = await getAllQuotations({
        searchQuery,
        page: 1,
        limit: 100,
      });
      setQuotations(data.quotations);
    } catch (error: any) {
      toast({
        title: "Error fetching quotations",
        description: error?.message || "Something went wrong",
        variant: "destructive",
      });
    }
  };

  // Fetch Expenses
  const fetchExpenses = async () => {
    setLoadingExpenses(true);
    setExpensesError(null);
    try {
      const data = await getAllExpenses({
        searchQuery,
        page: 1,
        limit: 100,
      });
      setExpenses(data.expenses);
    } catch (error: any) {
      setExpensesError(error.message || "Failed to fetch expenses.");
      toast({
        title: "Error fetching expenses",
        description: error?.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoadingExpenses(false);
    }
  };

  useEffect(() => {
    fetchQuotations();
    fetchExpenses();
  }, [searchQuery]);

  // Handlers for PDF, mail, etc.
  const handleViewPdf = (url: string) => {
    window.open(url, "_blank");
  };

  const handleDownloadPdf = (url: string, name: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = name || "document.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSendMail = (quotationId: string) => {
    alert(`Send mail to client for quotation id: ${quotationId}`);
    // Implement mail sending API call here
  };

  const totalGrandTotal = quotations.reduce(
    (acc, q) => acc + q.grandTotal,
    0
  );

  const formattedTotal = totalGrandTotal.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
  });

  const totalExpenses = expenses.reduce(
    (acc, e) => acc + (e.amount || 0),
    0
  );
  const formattedTotalExpenses = totalExpenses.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
  });

  const profit = totalGrandTotal - totalExpenses;
  const profitMargin =
    totalGrandTotal > 0 ? (profit / totalGrandTotal) * 100 : 0;
  const formattedProfitMargin = profitMargin.toFixed(1);

  const handleDeleteExpense = (expenseId: string) => {
    if (confirm("Are you sure you want to delete this expense?")) {
      // TODO: call deleteExpense API here, then:
      setExpenses((prev) => prev.filter((e) => e.id !== expenseId));
      toast({
        title: "Expense deleted",
        description: "The expense was deleted successfully.",
      });
    }
  };

  // Toast + refresh handler for NewQuotationDialog
  const onQuotationCreated = () => {
    toast({
      title: "Success",
      description: "Quotation created successfully!",
    });
    fetchQuotations();
  };

  // Toast + refresh handler for NewExpenseDialog
  const onExpenseCreated = () => {
    toast({
      title: "Success",
      description: "Expense created successfully!",
    });
    fetchExpenses();
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header & Buttons */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Financial Management
          </h1>
          <p className="text-muted-foreground">
            Manage quotations and expenses
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Pass onSuccess callbacks to dialogs */}
          <NewQuotationDialog onSuccess={onQuotationCreated} />
          <NewExpenseDialog onSuccess={onExpenseCreated} />
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-auto">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
          type="search"
            placeholder="Search transactions..."
            className="w-full md:w-[300px] pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="quotations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="quotations">Quotations</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="summary">Financial Summary</TabsTrigger>
        </TabsList>

        {/* Quotations Tab */}
        <TabsContent value="quotations">
          <Card>
            <CardHeader>
              <CardTitle>Quotations</CardTitle>
              <CardDescription>List of all quotations</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Quote No.</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Ticket</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>GST Amount</TableHead>
                    <TableHead>Sub Total</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quotations.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center text-muted-foreground"
                      >
                        No quotations found.
                      </TableCell>
                    </TableRow>
                  )}

                  {quotations.map((q) => (
                    <TableRow key={q.id}>
                      <TableCell>{q.createdAt?.split("T")[0] || "N/A"}</TableCell>
                      <TableCell>{q.id || "N/A"}</TableCell>
                      <TableCell>{q.client?.name || "N/A"}</TableCell>
                      <TableCell>{q.ticket?.title || "N/A"}</TableCell>
                      <TableCell>{q.subtotal ? `₹${q.subtotal.toLocaleString()}` : "N/A"}</TableCell>
                      <TableCell>{q.gst ? `₹${q.gst.toLocaleString()}` : "N/A"}</TableCell>
                      <TableCell>{q.grandTotal ? `₹${q.grandTotal.toLocaleString()}` : "N/A"}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleViewPdf(q.pdfUrl)}>
                              View Quotation
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownloadPdf(q.pdfUrl, q.name)}>
                              Download Quotation
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleSendMail(q.id)}>
                              Send Mail to Client
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Expenses Tab */}
        <TabsContent value="expenses">
          <Card>
            <CardHeader>
              <CardTitle>Expenses</CardTitle>
              <CardDescription>Track all expenses</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingExpenses && <p>Loading expenses...</p>}
              {expensesError && (
                <p className="text-red-600">Error: {expensesError}</p>
              )}
              {!loadingExpenses && expenses.length === 0 && (
                <p className="text-muted-foreground">No expenses found.</p>
              )}
              {!loadingExpenses && expenses.length > 0 && (
                <>
                  <div className="mb-4 font-semibold text-lg">
                    Total Expenses: {formattedTotalExpenses}
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Expense Type</TableHead>
                        <TableHead>Requester</TableHead>
                        <TableHead>Payment Type</TableHead>
                        <TableHead>Quotation</TableHead>
                        <TableHead>Ticket</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expenses.map((e) => (
                        <TableRow key={e.id}>
                          <TableCell>{e.createdAt?.split("T")[0] || "N/A"}</TableCell>
                          <TableCell>{e.description || "N/A"}</TableCell>
                          <TableCell>{e.category || "N/A"}</TableCell>
                          <TableCell>{e.requester || "N/A"}</TableCell>
                          <TableCell>{e.paymentType || "N/A"}</TableCell>
                          <TableCell>{e.quotation?.name || "N/A"}</TableCell>
                          <TableCell>{e.ticket?.title || "N/A"}</TableCell>
                          <TableCell>{e.amount ? `₹${e.amount.toLocaleString()}` : "N/A"}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => window.open(e.pdfUrl, "_blank")}>
                                  View Expense
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDownloadPdf(e.pdfUrl, e.description || "expense.pdf")}>
                                  Download Expense
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleDeleteExpense(e.id)}>
                                  Delete Expense
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Summary Tab */}
        <TabsContent value="summary">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Quotations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formattedTotal}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formattedTotalExpenses}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Profit</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₹{profit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formattedProfitMargin}%</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
