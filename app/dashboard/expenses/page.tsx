"use client";

import { useState, useEffect, useCallback } from "react";
import ReactPaginate from "react-paginate";
import {
  Button,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui"; // Assuming ui/index.ts exports all these
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Search, Download, MoreHorizontal, Receipt, Plus } from "lucide-react"; // Using Receipt for expenses
import { useDebounce } from "@/hooks/useDebounce";
import { Spinner } from "@/components/ui/spinner";
import { getAllExpenses } from "@/lib/services/expense"; // Service for expenses
import { NewExpenseDialog } from "@/components/finances/new-expense-dialog"; // Dialog for expenses
import { useToast } from "@/hooks/use-toast";

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
  description: string;
  category: string;
  requester: string;
  paymentType: string;
  amount: number;
  pdfUrl: string | null;
  quotation: ExpenseQuotation | null;
  // If ticket can be directly on expense and not just via quotation:
  // ticket?: ExpenseQuotationTicket | null;
}

interface PaginatedExpensesResponse {
  expenses: ExpenseItem[];
  total: number;
  page: number;
  limit: number;
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
      const response: PaginatedExpensesResponse = await getAllExpenses({
        page: page + 1, // API is 1-based
        limit: itemsPerPage,
        searchQuery: debouncedSearchQuery,
      });
      setExpenses(response.expenses || []);
      setTotalCount(response.total || 0);
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
      toast({ title: "Info", description: "No PDF available for this expense." });
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
            Export (Placeholder)
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
          <CardDescription>
            Showing {currentPageStart} - {currentPageEnd} of {totalCount} expenses.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && <div className="flex justify-center items-center py-10"><Spinner size="8" /></div>}
          {!loading && error && <p className="text-red-500 text-center py-10">{error}</p>}
          {!loading && !error && expenses.length === 0 && (
            <p className="text-muted-foreground text-center py-10">No expenses found.</p>
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
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((exp) => (
                  <TableRow key={exp.id}>
                    <TableCell>{new Date(exp.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>{exp.customId || exp.id}</TableCell>
                    <TableCell className="font-medium max-w-xs truncate">{exp.description}</TableCell>
                    <TableCell>{exp.category}</TableCell>
                    <TableCell>{exp.requester}</TableCell>
                    <TableCell>{exp.paymentType}</TableCell>
                    <TableCell className="text-right">₹{exp.amount?.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) || '0.00'}</TableCell>
                    <TableCell>{exp.quotation?.name || "N/A"}</TableCell>
                    <TableCell>{exp.quotation?.ticket?.title || "N/A"}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          {exp.pdfUrl && (
                            <>
                              <DropdownMenuItem onClick={() => handleViewPdf(exp.pdfUrl)}>
                                <Receipt className="mr-2 h-4 w-4" /> View PDF
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDownloadPdf(exp.pdfUrl, exp.customId || exp.description || `expense-${exp.id}.pdf`)}>
                                <Download className="mr-2 h-4 w-4" /> Download PDF
                              </DropdownMenuItem>
                            </>
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

      {pageCount > 1 && (
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mt-4">
          <div className="text-sm text-muted-foreground">
            Showing {currentPageStart} to {currentPageEnd} of {totalCount} entries
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={itemsPerPage.toString()}
              onValueChange={(value) => {
                setItemsPerPage(Number(value));
                setPage(0); // Reset to first page
              }}
            >
              <SelectTrigger className="w-[80px]">
                <SelectValue placeholder={`${itemsPerPage} rows`} />
              </SelectTrigger>
              <SelectContent>
                {[5, 10, 20, 50, 100].map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size} rows
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <ReactPaginate
              previousLabel={"Previous"}
              nextLabel={"Next"}
              breakLabel={"..."}
              pageCount={pageCount}
              marginPagesDisplayed={2}
              pageRangeDisplayed={5}
              onPageChange={handlePageChange}
              containerClassName={"flex items-center gap-1"}
              pageClassName={"h-9 w-9 flex items-center justify-center rounded-md text-sm"}
              pageLinkClassName={"h-full w-full flex items-center justify-center"}
              previousClassName={"h-9 px-3 flex items-center justify-center rounded-md text-sm border border-input bg-background hover:bg-accent hover:text-accent-foreground"}
              nextClassName={"h-9 px-3 flex items-center justify-center rounded-md text-sm border border-input bg-background hover:bg-accent hover:text-accent-foreground"}
              breakClassName={"h-9 w-9 flex items-center justify-center rounded-md text-sm"}
              activeClassName={"bg-primary text-primary-foreground"}
              disabledClassName={"opacity-50 cursor-not-allowed"}
              forcePage={page}
            />
          </div>
        </div>
      )}
    </div>
  );
}
