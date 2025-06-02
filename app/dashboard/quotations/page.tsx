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
import { Search, Download, MoreHorizontal, FileText, Plus } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { Spinner } from "@/components/ui/spinner";
import { getAllQuotations } from "@/lib/services/quotations";
import { NewQuotationDialog } from "@/components/finances/new-quotation-dialog";
import { useToast } from "@/hooks/use-toast";

// Interfaces
interface QuotationClient {
  id: string;
  name: string;
}

interface QuotationTicket {
  id: string;
  title: string;
}

interface QuotationItem {
  id: string;
  name: string;
  createdAt: string;
  client: QuotationClient | null;
  ticket: QuotationTicket | null;
  subtotal: number;
  gst: number;
  grandTotal: number;
  pdfUrl: string;
  // Assuming 'customId' might be the human-readable quote number
  customId?: string;
}

interface PaginatedQuotationsResponse {
  quotations: QuotationItem[];
  total: number;
  page: number;
  limit: number;
}

export default function QuotationsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [quotations, setQuotations] = useState<QuotationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0); // 0-based for react-paginate
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const { toast } = useToast();

  const fetchQuotationsList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response: PaginatedQuotationsResponse = await getAllQuotations({
        page: page + 1, // API is 1-based
        limit: itemsPerPage,
        searchQuery: debouncedSearchQuery,
      });
      setQuotations(response.quotations || []);
      setTotalCount(response.total || 0);
    } catch (err: any) {
      console.error("Error fetching quotations:", err);
      setError(err.message || "Failed to fetch quotations.");
      toast({
        title: "Error",
        description: err.message || "Failed to fetch quotations.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [page, itemsPerPage, debouncedSearchQuery, toast]);

  useEffect(() => {
    fetchQuotationsList();
  }, [fetchQuotationsList]);

  const handlePageChange = (selectedItem: { selected: number }) => {
    setPage(selectedItem.selected);
  };

  const handleViewPdf = (url: string) => {
    window.open(url, "_blank");
  };

  const handleDownloadPdf = (url: string, name: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", name || "quotation.pdf");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSendMail = (quotationId: string) => {
    // Placeholder for mail sending logic
    alert(`Send mail for quotation ID: ${quotationId} - (Not implemented)`);
    console.log("Attempting to send mail for quotation ID:", quotationId);
  };

  const onQuotationCreated = () => {
    setPage(0); // Reset to first page
    fetchQuotationsList(); // Refetch data
    toast({
      title: "Success",
      description: "New quotation created. List updated.",
    });
  };

  const pageCount = Math.ceil(totalCount / itemsPerPage);
  const currentPageStart = totalCount > 0 ? page * itemsPerPage + 1 : 0;
  const currentPageEnd = Math.min((page + 1) * itemsPerPage, totalCount);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-8 pt-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Quotations</h2>
          <p className="text-muted-foreground">
            Manage and view all your quotations here.
          </p>
        </div>
        <div className="flex gap-2">
          <NewQuotationDialog onSuccess={onQuotationCreated} />
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
            placeholder="Search quotations by name, client, ticket..."
            className="pl-8 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quotation List</CardTitle>
          <CardDescription>
            Showing {currentPageStart} - {currentPageEnd} of {totalCount} quotations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && <div className="flex justify-center items-center py-10"><Spinner size="8" /></div>}
          {!loading && error && <p className="text-red-500 text-center py-10">{error}</p>}
          {!loading && !error && quotations.length === 0 && (
            <p className="text-muted-foreground text-center py-10">No quotations found.</p>
          )}
          {!loading && !error && quotations.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Quote ID</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Ticket</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                  <TableHead className="text-right">GST</TableHead>
                  <TableHead className="text-right">Grand Total</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotations.map((q) => (
                  <TableRow key={q.id}>
                    <TableCell>{new Date(q.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>{q.customId || q.id}</TableCell>
                    <TableCell className="font-medium max-w-xs truncate">{q.name}</TableCell>
                    <TableCell>{q.client?.name || "N/A"}</TableCell>
                    <TableCell>{q.ticket?.title || "N/A"}</TableCell>
                    <TableCell className="text-right">₹{q.subtotal?.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) || '0.00'}</TableCell>
                    <TableCell className="text-right">₹{q.gst?.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) || '0.00'}</TableCell>
                    <TableCell className="text-right">₹{q.grandTotal?.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) || '0.00'}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          {q.pdfUrl && (
                            <>
                              <DropdownMenuItem onClick={() => handleViewPdf(q.pdfUrl)}>
                                <FileText className="mr-2 h-4 w-4" /> View PDF
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDownloadPdf(q.pdfUrl, q.customId || q.name || `quotation-${q.id}.pdf`)}>
                                <Download className="mr-2 h-4 w-4" /> Download PDF
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleSendMail(q.id)}>
                            Send Mail
                          </DropdownMenuItem>
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
