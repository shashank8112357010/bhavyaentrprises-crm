"use client";

import { useState, useEffect, useCallback } from "react";
import ReactPaginate from "react-paginate";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDebounce } from "@/hooks/useDebounce";
import { Search, Download, Trash2 } from "lucide-react";
import { UploadRateCardDialog } from "@/components/rate-card/UploadRateCardDialog";
import { getAllRateCards, deleteRateCard } from "@/lib/services/rate-card";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/hooks/use-toast";

interface RateCard {
  srNo: number;
  description: string;
  unit: string;
  rate: number;
  bankName: string;
  id: string;
}

interface PaginatedResponse {
  data: RateCard[];
  total: number;
  page: number;
  limit: number;
}

interface GetRateCardsParams {
  page: number;
  limit: number;
  searchQuery: string;
}

export default function RateCardPage() {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [rateCards, setRateCards] = useState<RateCard[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const { toast } = useToast();

  const [page, setPage] = useState<number>(0); // zero-based for ReactPaginate
  const [itemsPerPage, setItemsPerPage] = useState<number>(5);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Function to fetch rate cards, can be called by useEffect or after delete
  const fetchRateCards = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const params: GetRateCardsParams = {
        page: page + 1, // API is 1-based
        limit: itemsPerPage,
        searchQuery: debouncedSearchQuery,
      };

      const response = await getAllRateCards(params);

      setRateCards((response.data as RateCard[]) || []);
      setTotalCount(response.total || 0);
    } catch (err: any) {
      const errorMessage = err.message || "Failed to load rate cards";
      setError(errorMessage);
      console.error("Error fetching rate cards:", err);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearchQuery, itemsPerPage]);

  useEffect(() => {
    fetchRateCards();
  }, [fetchRateCards]);

  const handlePageChange = (selectedItem: { selected: number }): void => {
    setPage(selectedItem.selected);
  };

  const handleDelete = async (rateCardId: string): Promise<void> => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this rate card?",
    );

    if (!confirmDelete) return;

    try {
      await deleteRateCard(rateCardId);

      toast({
        title: "Success",
        description: "Rate card deleted successfully!",
      });

      // Refresh the list
      await fetchRateCards();

      // If the current page becomes empty after deletion, go to the previous page
      if (rateCards.length === 1 && page > 0) {
        setPage(page - 1);
      }
    } catch (error: any) {
      const errorMessage = error.message || "Failed to delete rate card.";
      console.error("Failed to delete rate card:", error);

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleUploadSuccess = async (): Promise<void> => {
    setPage(0);
    await fetchRateCards(); // Immediately refresh the data
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchQuery(e.target.value);
    setPage(0); // Reset to first page when searching
  };

  const handleItemsPerPageChange = (value: string): void => {
    setItemsPerPage(Number(value));
    setPage(0); // Reset to first page when changing items per page
  };

  const pageCount = itemsPerPage > 0 ? Math.ceil(totalCount / itemsPerPage) : 0;
  const currentPageStart = totalCount > 0 ? page * itemsPerPage + 1 : 0;
  const currentPageEnd = Math.min((page + 1) * itemsPerPage, totalCount);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Rate Cards</h1>
        <div className="flex items-center gap-2">
          <UploadRateCardDialog onUploadSuccess={handleUploadSuccess} />
          <a href="/sample_rate_card.csv" download>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Download Sample
            </Button>
          </a>
        </div>
      </div>

      <div className="px-3 py-2 text-sm text-muted-foreground bg-muted rounded-md border">
        If you&apos;re unsure about the format, please download the sample
        before uploading your rate card.
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-auto">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by description, bank name..."
            className="w-full md:w-[300px] pl-8"
            value={searchQuery}
            onChange={handleSearchChange}
            disabled={loading}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rate Cards</CardTitle>
          <CardDescription>List of all uploaded rate cards</CardDescription>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="flex justify-center items-center py-10">
              <Spinner size="8" />
            </div>
          )}

          {error && (
            <div className="text-center py-10">
              <p className="text-destructive mb-4">{error}</p>
              <Button onClick={fetchRateCards} variant="outline">
                Try Again
              </Button>
            </div>
          )}

          {!loading && !error && totalCount === 0 && (
            <p className="text-center py-10 text-muted-foreground">
              {searchQuery
                ? "No rate cards found matching your search."
                : "No rate cards found."}
            </p>
          )}

          {!loading && !error && totalCount > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sr No.</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Bank Name</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rateCards.map((rc) => (
                  <TableRow key={rc.id}>
                    <TableCell>{rc.srNo}</TableCell>
                    <TableCell>{rc.description}</TableCell>
                    <TableCell>{rc.unit}</TableCell>
                    <TableCell>₹{rc.rate.toLocaleString()}</TableCell>
                    <TableCell>{rc.bankName}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(rc.id)}
                        aria-label={`Delete rate card ${rc.description}`}
                        className="hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination Controls */}
      {!loading && !error && totalCount > 0 && (
        <div className="mt-4 flex flex-col items-center gap-4 md:flex-row md:justify-between">
          <div className="text-sm text-muted-foreground mb-2 md:mb-0">
            {totalCount > 0
              ? `Showing ${currentPageStart} - ${currentPageEnd} of ${totalCount} rate cards`
              : searchQuery
                ? "No rate cards found matching your search."
                : "No rate cards found."}
          </div>

          {totalCount > itemsPerPage && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">Rows:</span>
              <Select
                value={String(itemsPerPage)}
                onValueChange={handleItemsPerPageChange}
              >
                <SelectTrigger className="w-[75px] h-9">
                  <SelectValue placeholder={String(itemsPerPage)} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="15">15</SelectItem>
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
                  "px-3 py-1.5 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700 transition-colors"
                }
                activeLinkClassName={
                  "bg-blue-600 text-white border-blue-600 dark:bg-blue-500 dark:border-blue-500"
                }
                previousLinkClassName={
                  "px-3 py-1.5 border border-gray-300 rounded-l-md cursor-pointer hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700 transition-colors"
                }
                nextLinkClassName={
                  "px-3 py-1.5 border border-gray-300 rounded-r-md cursor-pointer hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700 transition-colors"
                }
                disabledLinkClassName={"opacity-50 cursor-not-allowed"}
                forcePage={page}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
