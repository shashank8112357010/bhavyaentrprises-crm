"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import ReactPaginate from "react-paginate";
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
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Download,
  MoreHorizontal,
  FileText,
  Plus,
  FileEdit,
} from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { Spinner } from "@/components/ui/spinner";
import { useQuotationStore } from "@/store/quotationStore";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/authStore";

// Interfaces
interface QuotationClient {
  id: string;
  name: string;
}

interface QuotationTicket {
  id: string;
  title: string;
  ticketId: string;
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
  quoteNo: string; // Reverted from formattedId back to quoteNo
}

interface PaginatedQuotationsResponse {
  quotations: QuotationItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
  };
}

export default function QuotationsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0); // 0-based for react-paginate
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const { toast } = useToast();
  const { user } = useAuthStore();

  // Use Zustand store - must be called before any conditional logic
  const { quotations, loading, error, totalQuotations, fetchQuotations } =
    useQuotationStore();

  const fetchQuotationsList = useCallback(async () => {
    try {
      await fetchQuotations({
        page: page + 1, // API is 1-based
        limit: itemsPerPage,
        searchQuery: debouncedSearchQuery,
      });
    } catch (err: any) {
      console.error("Error fetching quotations:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to fetch quotations.",
        variant: "destructive",
      });
    }
  }, [page, itemsPerPage, debouncedSearchQuery, fetchQuotations, toast]);

  useEffect(() => {
    fetchQuotationsList();
  }, [fetchQuotationsList]);

  // Role-based access control - only ADMIN users can access quotations
  if (user?.role !== "ADMIN") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">
              Only administrators can access quotations.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

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

  const handleSendMail = async (quotationId: string) => {
    try {
      // Find the quotation to get details
      const quotation = quotations.find((q) => q.id === quotationId);
      if (!quotation) {
        toast({
          title: "Error",
          description: "Quotation not found.",
          variant: "destructive",
        });
        return;
      }

      // For now, we'll create a mailto link with the quotation details
      // In a real implementation, this would call an API to send the email
      const subject = `Quotation ${quotation.quoteNo} from Bhavya Enterprises`;
      const body = `Dear ${quotation.client?.name || "Valued Client"},

Please find attached the quotation ${quotation.quoteNo} for your review.

Quotation Details:
- Quotation Number: ${quotation.quoteNo}
- Date: ${new Date(quotation.createdAt).toLocaleDateString()}
- Subtotal: ₹${quotation.subtotal?.toLocaleString() || "0.00"}
- GST: ₹${quotation.gst?.toLocaleString() || "0.00"}
- Grand Total: ₹${quotation.grandTotal?.toLocaleString() || "0.00"}

You can view the quotation PDF at: ${quotation.pdfUrl}

Thank you for your business.

Best regards,
Bhavya Enterprises Team`;

      const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.location.href = mailtoLink;

      toast({
        title: "Email Client Opened",
        description:
          "Your default email client has been opened with the quotation details.",
      });
    } catch (error: any) {
      console.error("Error preparing email:", error);
      toast({
        title: "Error",
        description: "Failed to prepare email. Please try again.",
        variant: "destructive",
      });
    }
  };

  // const onQuotationCreated = () => { // Removed as navigation to new page handles creation
  //   setPage(0); // Reset to first page
  //   fetchQuotationsList(); // Refetch data
  //   toast({
  //     title: "Success",
  //     description: "New quotation created. List updated.",
  //   });
  // };

  const pageCount = Math.ceil(totalQuotations / itemsPerPage);
  const currentPageStart = totalQuotations > 0 ? page * itemsPerPage + 1 : 0;
  const currentPageEnd = Math.min((page + 1) * itemsPerPage, totalQuotations);

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
          <Link href="/dashboard/quotations/new" passHref>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create New Quotation
            </Button>
          </Link>
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
            Showing {currentPageStart} - {currentPageEnd} of {totalQuotations}{" "}
            quotations.
          </CardDescription>
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
          {!loading && !error && quotations.length === 0 && (
            <p className="text-muted-foreground text-center py-10">
              No quotations found.
            </p>
          )}
          {!loading && !error && quotations.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Quotation No.</TableHead> {/* Changed Label */}
                  {/* <TableHead>Description</TableHead> */}
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
                    <TableCell>
                      {new Date(q.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{q.quoteNo}</TableCell> {/* Use quoteNo */}
                    {/* <TableCell className="font-medium max-w-xs truncate">{q.name}</TableCell> */}
                    <TableCell>{q.client?.name || "N/A"}</TableCell>
                    <TableCell>
                      {q.ticket && q.ticket.id ? (
                        <Link
                          href={`/dashboard/ticket/${q.ticket.id}`}
                          className="hover:underline"
                        >
                          {q.ticket.ticketId || q.ticket.title || "N/A"}
                        </Link>
                      ) : (
                        q.ticket?.ticketId || q.ticket?.title || "N/A"
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      ₹
                      {q.subtotal?.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }) || "0.00"}
                    </TableCell>
                    <TableCell className="text-right">
                      ₹
                      {q.gst?.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }) || "0.00"}
                    </TableCell>
                    <TableCell className="text-right">
                      ₹
                      {q.grandTotal?.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }) || "0.00"}
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
                          {q.pdfUrl && (
                            <>
                              <DropdownMenuItem
                                onClick={() => handleViewPdf(q.pdfUrl)}
                              >
                                <FileText className="mr-2 h-4 w-4" /> View PDF
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleDownloadPdf(
                                    q.pdfUrl,
                                    q.quoteNo ||
                                      q.name ||
                                      `quotation-${q.id}.pdf`,
                                  )
                                }
                              >
                                <Download className="mr-2 h-4 w-4" /> Download
                                PDF
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuSeparator />
                          <Link
                            href={`/dashboard/quotations/${q.id}/edit`}
                            passHref
                          >
                            <DropdownMenuItem>
                              <FileEdit className="mr-2 h-4 w-4" /> Edit
                              Quotation
                            </DropdownMenuItem>
                          </Link>
                          <DropdownMenuItem
                            onClick={() => handleSendMail(q.id)}
                          >
                            <FileText className="mr-2 h-4 w-4" /> Send Mail
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

      {/* Pagination */}
      <div className="mt-4 flex flex-col items-center gap-4 md:flex-row md:justify-between">
        <div className="text-sm text-muted-foreground mb-2 md:mb-0">
          Showing {currentPageStart} to {currentPageEnd} of {totalQuotations}{" "}
          entries
        </div>
        {totalQuotations > itemsPerPage && (
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
