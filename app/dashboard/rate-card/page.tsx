"use client";

import { useState, useEffect } from "react";
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
} from "@/components/ui/select"; // Added Select imports
import { useDebounce } from "@/hooks/useDebounce";

import { Search, Download, Trash2 } from "lucide-react"; // Removed Filter as it's commented out
import { UploadRateCardDialog } from "@/components/rate-card/UploadRateCardDialog";
import { getAllRateCards, deleteRateCard } from "@/lib/services/rate-card";
import { Spinner } from "@/components/ui/spinner"; // Added Spinner for loading state

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

export default function RateCardPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [rateCards, setRateCards] = useState<RateCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const [page, setPage] = useState(0); // zero-based for ReactPaginate
  const [itemsPerPage, setItemsPerPage] = useState(5); // Replaced const limit
  const [totalCount, setTotalCount] = useState(0);

  // Function to fetch rate cards, can be called by useEffect or after delete
  async function fetchRateCards() {
    setLoading(true);
    try {
      const response: PaginatedResponse = await getAllRateCards({
        page: page + 1, // API is 1-based
        limit: itemsPerPage, // Use state variable
        searchQuery: debouncedSearchQuery,
      });

      setRateCards(response.data);
      setTotalCount(response.total);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to load rate cards");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRateCards();
  }, [page, debouncedSearchQuery, itemsPerPage]); // Added itemsPerPage to dependency array

  const handlePageChange = (selectedItem: { selected: number }) => {
    setPage(selectedItem.selected);
  };

  const handleDelete = async (rateCardId: string) => {
    if (window.confirm("Are you sure you want to delete this rate card?")) {
      try {
        await deleteRateCard(rateCardId);
        // alert("Rate card deleted successfully!"); // Replace with toast in real app
        // Refresh the list
        fetchRateCards();
        // If the current page becomes empty after deletion, go to the previous page
        if (rateCards.length === 1 && page > 0) {
          setPage(page - 1);
        }
      } catch (error: any) {
        console.error("Failed to delete rate card:", error);
        alert(`Error: ${error.message || "Failed to delete rate card."}`); // Replace with toast
      }
    }
  };

  const pageCount = itemsPerPage > 0 ? Math.ceil(totalCount / itemsPerPage) : 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Rate Cards</h1>
        <div className="flex items-center gap-2">
          <UploadRateCardDialog
            onUploadSuccess={() => {
              setPage(0); /* fetchRateCards will be triggered by useEffect */
            }}
          />
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
            placeholder="Search by description, bank name, RC no..."
            className="w-full md:w-[300px] pl-8"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(0);
            }}
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
            <p className="text-destructive text-center py-10">{error}</p>
          )}

          {!loading && !error && totalCount === 0 && (
            <p className="text-center py-10 text-muted-foreground">
              {searchQuery
                ? "No rate cards found matching your search."
                : "No rate cards found."}
            </p>
          )}

          {!loading && !error && totalCount > 0 && (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sr No.</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Bank Name</TableHead>
                    <TableHead>Bank RC Number</TableHead>
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
                      <TableCell>{rc.bankRcNo}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(rc.id)}
                          aria-label="Delete rate card"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
        </CardContent>
      </Card>

      {/* Standardized Pagination Controls Area */}
      {!loading && !error && totalCount > 0 && (
        <div className="mt-4 flex flex-col items-center gap-4 md:flex-row md:justify-between">
          <div className="text-sm text-muted-foreground mb-2 md:mb-0">
            {totalCount > 0
              ? `Showing ${page * itemsPerPage + 1} - ${Math.min((page + 1) * itemsPerPage, totalCount)} of ${totalCount} rate cards`
              : // This part might be redundant if the table itself shows "No rate cards found"
                // For consistency:
                searchQuery
                ? "No rate cards found matching your search."
                : "No rate cards found."}
          </div>

          {totalCount > itemsPerPage && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">Rows:</span>
              <Select
                value={String(itemsPerPage)}
                onValueChange={(value) => {
                  setItemsPerPage(Number(value));
                  setPage(0);
                }}
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
                  "px-3 py-1.5 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
                }
                activeLinkClassName={
                  "bg-blue-600 text-white border-blue-600 dark:bg-blue-500 dark:border-blue-500"
                }
                previousLinkClassName={
                  "px-3 py-1.5 border border-gray-300 rounded-l-md cursor-pointer hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
                }
                nextLinkClassName={
                  "px-3 py-1.5 border border-gray-300 rounded-r-md cursor-pointer hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
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
