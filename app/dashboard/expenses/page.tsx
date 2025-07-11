"use client";

import { useState, useEffect, useCallback } from "react";
import ReactPaginate from "react-paginate";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Search, Download, MoreHorizontal, Receipt, Plus } from "lucide-react"; // Using Receipt for expenses
import { useDebounce } from "@/hooks/useDebounce";
import { Spinner } from "@/components/ui/spinner";
import { getAllExpenses } from "@/lib/services/expense"; // Service for expenses
import { NewExpenseDialog } from "@/components/finances/new-expense-dialog"; // Dialog for expenses
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Interfaces
interface ExpenseQuotationTicket {
  id: string;
  title: string;
}
interface ExpenseQuotation {
  id: string;
  name: string;
  ticket?: ExpenseQuotationTicket | null;
}

interface ExpenseItem {
  id: string;
  customId?: string;
  createdAt: string;
  displayId: string;
  description: string;
  category: string;
  requester: string;
  paymentType: string;
  amount: number;
  pdfUrl: string | null;
  screenshotUrl?: string | null;
  approvalName?: string | null;
  quotation: ExpenseQuotation | null;
  // If ticket can be directly on expense and not just via quotation:
  // ticket?: ExpenseQuotationTicket | null;
  ticket?: ExpenseQuotationTicket | null;
}

interface PaginatedExpensesResponse {
  expenses: ExpenseItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
  };
}

export default function ExpensesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0); // 0-based for react-paginate
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const { toast } = useToast();

  const fetchExpensesList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getAllExpenses({
        page: page + 1, // API is 1-based
        limit: itemsPerPage,
        searchQuery: debouncedSearchQuery,
      });
      console.log(response);
      
      
      setExpenses((response as any).data.expenses || []);
      setTotalCount((response as any).data.pagination.total || 0);
    } catch (err: any) {
      console.error("Error fetching expenses:", err);
      setError(err.message || "Failed to fetch expenses.");
      toast({
        title: "Error",
        description: err.message || "Failed to fetch expenses.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [page, itemsPerPage, debouncedSearchQuery, toast]);

  useEffect(() => {
    fetchExpensesList();
  }, [fetchExpensesList]);

  const handlePageChange = (selectedItem: { selected: number }) => {
    setPage(selectedItem.selected);
  };

  const handleViewPdf = (url: string | null) => {
    if (url) {
      window.open(url, "_blank");
    } else {
      toast({
        title: "Info",
        description: "No PDF available for this expense.",
      });
    }
  };

  const handleDownloadPdf = (url: string | null, name: string) => {
    if (url) {
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", name || "expense.pdf");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      toast({ title: "Info", description: "No PDF available for download." });
    }
  };

  const onExpenseCreated = () => {
    setPage(0); // Reset to first page
    fetchExpensesList(); // Refetch data
    toast({
      title: "Success",
      description: "New expense created. List updated.",
    });
  };

  const pageCount = Math.ceil(totalCount / itemsPerPage);
  const currentPageStart = totalCount > 0 ? page * itemsPerPage + 1 : 0;
  const currentPageEnd = Math.min((page + 1) * itemsPerPage, totalCount);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-8 pt-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Expenses</h2>
          <p className="text-muted-foreground">
            Track and manage all your expenses here.
          </p>
        </div>
        <div className="flex gap-2">
          {/*
            NewExpenseDialog may need ticketId and ticketQuotations if it's context-specific.
            For a general expenses page, these might not be passed,
            allowing expense creation independent of a specific ticket.
            The dialog should handle cases where these props are undefined.
          */}
          <NewExpenseDialog onSuccess={onExpenseCreated} />
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search expenses by description, category, requester..."
            className="pl-8 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Expense List</CardTitle>
          {/* <CardDescription>
            Showing {currentPageStart} - {currentPageEnd} of {totalCount} expenses.
          </CardDescription> */}
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="flex justify-center items-center py-10">
              <Spinner size="8" />
            </div>
          )}
          {!loading && error && (
            <p className="text-red-500 text-center py-10">{error}</p>
          )}
          {!loading && !error && expenses.length === 0 && (
            <p className="text-muted-foreground text-center py-10">
              No expenses found.
            </p>
          )}
          {!loading && !error && expenses.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Requester</TableHead>
                  <TableHead>Payment Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Quotation</TableHead>
                  <TableHead>Ticket</TableHead>
                  <TableHead>Approval</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((exp) => (
                  <TableRow key={exp.id}>
                    <TableCell>
                      {new Date(exp.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{exp.displayId}</TableCell>
                    <TableCell className="font-medium max-w-xs truncate">
                      {exp.description}
                    </TableCell>
                    <TableCell>{exp.category}</TableCell>
                    <TableCell>{exp.requester}</TableCell>
                    <TableCell>{exp.paymentType}</TableCell>
                    <TableCell className="text-right">
                      ₹
                      {exp.amount?.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }) || "0.00"}
                    </TableCell>
                    <TableCell>{exp.quotation?.name || "N/A"}</TableCell>
                    <TableCell>
                      {exp?.ticket?.title.slice(0, 20) || "N/A"}
                    </TableCell>
                    <TableCell>
                      {exp.paymentType === "ONLINE"
                        ? exp.screenshotUrl
                          ? "Screenshot"
                          : "N/A"
                        : exp.approvalName || "N/A"}
                    </TableCell>
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
                          {exp.pdfUrl && (
                            <>
                              <DropdownMenuItem
                                onClick={() => handleViewPdf(exp.pdfUrl)}
                              >
                                <Receipt className="mr-2 h-4 w-4" /> View
                                Receipt
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleDownloadPdf(
                                    exp.pdfUrl,
                                    exp.customId ||
                                      exp.description ||
                                      `expense-${exp.id}.pdf`,
                                  )
                                }
                              >
                                <Download className="mr-2 h-4 w-4" /> Download
                                Receipt
                              </DropdownMenuItem>
                            </>
                          )}
                          {(exp as any).screenshotUrl && (
                            <>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleViewPdf((exp as any).screenshotUrl)
                                }
                              >
                                <Receipt className="mr-2 h-4 w-4" /> View
                                Screenshot
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleDownloadPdf(
                                    (exp as any).screenshotUrl,
                                    `screenshot-${exp.customId || exp.id}.jpg`,
                                  )
                                }
                              >
                                <Download className="mr-2 h-4 w-4" /> Download
                                Screenshot
                              </DropdownMenuItem>
                            </>
                          )}
                          {!exp.pdfUrl && !(exp as any).screenshotUrl && (
                            <DropdownMenuItem disabled>
                              <Receipt className="mr-2 h-4 w-4" /> No files
                              available
                            </DropdownMenuItem>
                          )}
                          {/* Add other actions like Edit/Delete if needed */}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="mt-4 flex flex-col items-center gap-4 md:flex-row md:justify-between">
        <div className="text-sm text-muted-foreground mb-2 md:mb-0">
          Showing {currentPageStart} to {currentPageEnd} of {totalCount} entries
        </div>
        {totalCount > itemsPerPage && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">Rows:</span>
            <Select
              value={itemsPerPage.toString()}
              onValueChange={(value) => {
                setItemsPerPage(Number(value));
                setPage(0); // Reset to first page
              }}
            >
              <SelectTrigger className="w-[75px] h-9">
                <SelectValue placeholder={itemsPerPage} />
              </SelectTrigger>
              <SelectContent>
                {[5, 10, 15].map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <ReactPaginate
              previousLabel={"← Previous"}
              nextLabel={"Next →"}
              breakLabel={"..."}
              pageCount={pageCount}
              marginPagesDisplayed={1}
              pageRangeDisplayed={2}
              onPageChange={handlePageChange}
              containerClassName={
                "flex items-center space-x-1 text-sm select-none"
              }
              pageLinkClassName={
                "px-3 py-1.5 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
              }
              previousLinkClassName={
                "px-3 py-1.5 border border-gray-300 rounded-l-md cursor-pointer hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
              }
              nextLinkClassName={
                "px-3 py-1.5 border border-gray-300 rounded-r-md cursor-pointer hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
              }
              activeLinkClassName={
                "bg-blue-600 text-white border-blue-600 dark:bg-blue-500 dark:border-blue-500"
              }
              disabledLinkClassName={"opacity-50 cursor-not-allowed"}
              forcePage={page}
            />
          </div>
        )}
      </div>
    </div>
  );
}
