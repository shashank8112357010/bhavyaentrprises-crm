"use client";

import { useState, useEffect, useCallback } from "react";
import Link from 'next/link';
import ReactPaginate from "react-paginate";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Added Tabs
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Search, Download, MoreHorizontal, FileText, Plus, FileEdit } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { Spinner } from "@/components/ui/spinner";
import { getAllQuotations } from "@/lib/services/quotations";
import { useToast } from "@/hooks/use-toast";
const BackendQuotationStatus =["DRAFT"  , "ACCEPTED" , "REJECTED" , "ARCHIVED"]
// Interfaces
interface QuotationClient {
  id: string;
  name: string;
}

interface QuotationTicket {
  id: string;
  title: string;
}



// Updated QuotationItem interface
interface QuotationItem {
  id: string;
  name: string; // This is the descriptive name/title of the quotation
  quotationNumber: string; // The formatted BE/CH/YY-YY/XXX number
  status: BackendQuotationStatus; // Use the enum for status
  createdAt: string;
  client: QuotationClient | null;
  ticket: QuotationTicket | null;
  subtotal: number; // Ensure these financial fields are available from backend
  igstAmount?: number; // Optional as old schema might not have it directly as 'gst'
  gst?: number; // Keep for compatibility if backend still sends this
  netGrossAmount: number; // Renamed from grandTotal for consistency
  pdfUrl: string;
  // customId?: string; // This can be removed if quotationNumber is the primary displayed ID
}

interface PaginatedQuotationsResponse {
  quotations: QuotationItem[];
  pagination : {
    total: number;
    page: number;
    limit: number;
  }
}

// Create an array of status values for Tabs, including "ALL"
const quotationStatusesForFilter = ["ALL", ...Object.values(BackendQuotationStatus)];

export default function QuotationsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>(""); // Empty string for "ALL"
  const [quotations, setQuotations] = useState<QuotationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const { toast } = useToast();

  const fetchQuotationsList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response: PaginatedQuotationsResponse = await getAllQuotations({
        page: page + 1,
        limit: itemsPerPage,
        searchQuery: debouncedSearchQuery,
        status: selectedStatus, // Pass selectedStatus
      });
      setQuotations(response.quotations || []);
      setTotalCount(response?.pagination.total || 0);
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
  }, [page, itemsPerPage, debouncedSearchQuery, selectedStatus, toast]); // Added selectedStatus

  useEffect(() => {
    fetchQuotationsList();
  }, [fetchQuotationsList]);

  const handlePageChange = (selectedItem: { selected: number }) => {
    setPage(selectedItem.selected);
  };

  const handleViewPdf = (url: string) => { window.open(url, "_blank"); };
  const handleDownloadPdf = (url: string, name: string) => { /* ... existing logic ... */
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", name || "quotation.pdf");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const handleSendMail = (quotationId: string) => { alert(`Send mail for quotation ID: ${quotationId} - (Not implemented)`); };

  const pageCount = Math.ceil(totalCount / itemsPerPage);
  const currentPageStart = totalCount > 0 ? page * itemsPerPage + 1 : 0;
  const currentPageEnd = Math.min((page + 1) * itemsPerPage, totalCount);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-8 pt-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Quotations</h2>
          <p className="text-muted-foreground">Manage and view all your quotations here.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/quotations/new" passHref>
            <Button><Plus className="mr-2 h-4 w-4" />Create New Quotation</Button>
          </Link>
          <Button variant="outline"><Download className="mr-2 h-4 w-4" />Export</Button>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full md:w-auto">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by number, name, client, ticket..."
            className="pl-8 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="w-full md:w-auto">
          <Tabs
            defaultValue="ALL"
            onValueChange={(value) => setSelectedStatus(value === "ALL" ? "" : value)}
          >
            <TabsList className="grid w-full grid-cols-3 md:grid-cols-6"> {/* Adjust grid-cols for more statuses */}
              {quotationStatusesForFilter.map(statusVal => (
                <TabsTrigger key={statusVal} value={statusVal}>
                  {statusVal.charAt(0).toUpperCase() + statusVal.slice(1).toLowerCase().replace("_", " ")}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quotation List</CardTitle>
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
                  <TableHead>Quote Number</TableHead> {/* Changed from Quote ID */}
                  <TableHead>Description/Name</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Ticket</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead> {/* Changed from Grand Total */}
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotations.map((q) => (
                  <TableRow key={q.id}>
                    <TableCell>{new Date(q.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="font-medium">{q.quotationNumber || q.id}</TableCell> {/* Display new quotationNumber */}
                    <TableCell className="max-w-xs truncate">{q.name}</TableCell>
                    <TableCell>{q.client?.name || "N/A"}</TableCell>
                    <TableCell>
                      {q.ticket && q.ticket.id ? (
                        <Link href={`/dashboard/ticket/${q.ticket.id}`} className="hover:underline text-blue-600">
                          {q.ticket.title || "View Ticket"}
                        </Link>
                      ) : ( q.ticket?.title || "N/A" )}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        q.status === BackendQuotationStatus.DRAFT ? 'bg-gray-200 text-gray-700' :
                        q.status === BackendQuotationStatus.SENT ? 'bg-blue-200 text-blue-700' :
                        q.status === BackendQuotationStatus.ACCEPTED ? 'bg-green-200 text-green-700' :
                        q.status === BackendQuotationStatus.REJECTED ? 'bg-red-200 text-red-700' :
                        q.status === BackendQuotationStatus.ARCHIVED ? 'bg-yellow-200 text-yellow-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {q.status.charAt(0).toUpperCase() + q.status.slice(1).toLowerCase().replace("_", " ")}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">₹{q.netGrossAmount?.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) || '0.00'}</TableCell>
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
                              <DropdownMenuItem onClick={() => handleViewPdf(q.pdfUrl)}><FileText className="mr-2 h-4 w-4" /> View PDF</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDownloadPdf(q.pdfUrl, q.quotationNumber || q.name || `quotation-${q.id}.pdf`)}><Download className="mr-2 h-4 w-4" /> Download PDF</DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuSeparator />
                          <Link href={`/dashboard/quotations/${q.id}/edit`} passHref>
                            <DropdownMenuItem><FileEdit className="mr-2 h-4 w-4" /> Edit Quotation</DropdownMenuItem>
                          </Link>
                          <DropdownMenuItem onClick={() => handleSendMail(q.id)}>Send Mail</DropdownMenuItem>
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
            <Select value={itemsPerPage.toString()} onValueChange={(value) => { setItemsPerPage(Number(value)); setPage(0); }}>
              <SelectTrigger className="w-[75px] h-9"><SelectValue placeholder={itemsPerPage} /></SelectTrigger>
              <SelectContent>{[5, 10, 15, 20].map((size) => (<SelectItem key={size} value={size.toString()}>{size}</SelectItem>))}</SelectContent>
            </Select>
            <ReactPaginate
              previousLabel={"← Previous"} nextLabel={"Next →"} breakLabel={"..."}
              pageCount={pageCount} marginPagesDisplayed={1} pageRangeDisplayed={2}
              onPageChange={handlePageChange}
              containerClassName={"flex items-center space-x-1 text-sm select-none"}
              pageLinkClassName={"px-3 py-1.5 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"}
              previousLinkClassName={"px-3 py-1.5 border border-gray-300 rounded-l-md cursor-pointer hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"}
              nextLinkClassName={"px-3 py-1.5 border border-gray-300 rounded-r-md cursor-pointer hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"}
              activeLinkClassName={"bg-blue-600 text-white border-blue-600 dark:bg-blue-500 dark:border-blue-500"}
              disabledLinkClassName={"opacity-50 cursor-not-allowed"}
              forcePage={page}
            />
          </div>
        )}
      </div>
    </div>
  );
}
