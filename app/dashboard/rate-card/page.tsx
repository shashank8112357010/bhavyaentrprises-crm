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
import { useDebounce } from "@/hooks/useDebounce"; // Adjust path if needed


import { Search, Download, Filter } from "lucide-react";
import { UploadRateCardDialog } from "@/components/rate-card/UploadRateCardDialog";
import { getAllRateCards } from "@/lib/services/rate-card";

interface RateCard {
  srNo: number;
  description: string;
  unit: string;
  rate: number;
  bankName: string;
  bankRcNo: string;
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


  // Pagination state
  const [page, setPage] = useState(0); // zero-based for ReactPaginate
  const limit = 5;
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    async function fetchRateCards() {
      setLoading(true);
      try {
        const response: PaginatedResponse = await getAllRateCards({
          page: page + 1,
          limit,
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
    fetchRateCards();
  }, [page, debouncedSearchQuery]);
  

  // Handle page change event from ReactPaginate
  const handlePageChange = (selectedItem: { selected: number }) => {
    setPage(selectedItem.selected);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight">
          Rate Cards
        </h1>
        <div className="flex items-center gap-2">
          <UploadRateCardDialog />
          {/* Download sample CSV placed in /public */}
          <a href="/sample_rate_card.csv" download>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Download Sample
            </Button>
          </a>
        </div>
      </div>

      {/* Helper note */}
      <div className="px-3 py-2 text-sm text-muted-foreground bg-muted rounded-md border">
        If you&apos;re unsure about the format, please download the sample
        before uploading your rate card.
      </div>

      {/* Search & filter */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-auto">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search rate cards..."
            className="w-full md:w-[300px] pl-8"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(0); // reset to first page on search change
            }}
            disabled={loading}
          />
        </div>
        {/* <Button variant="outline" size="icon" disabled={loading}>
          <Filter className="h-4 w-4" />
        </Button> */}
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Rate Cards</CardTitle>
          <CardDescription>List of all uploaded rate cards</CardDescription>
        </CardHeader>
        <CardContent>
          {loading && <p>Loading rate cards...</p>}
          {error && <p className="text-destructive">{error}</p>}

          {!loading && !error && rateCards.length === 0 && (
            <p>No rate cards found.</p>
          )}

          {!loading && !error && rateCards.length > 0 && (
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
                    <TableRow key={rc.srNo + rc.bankRcNo}>
                      <TableCell>{rc.srNo}</TableCell>
                      <TableCell>{rc.description}</TableCell>
                      <TableCell>{rc.unit}</TableCell>
                      <TableCell>₹{rc.rate.toLocaleString()}</TableCell>
                      <TableCell>{rc.bankName}</TableCell>
                      <TableCell>{rc.bankRcNo}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination controls */}
              <div className="mt-4 flex justify-end">
                <ReactPaginate
                  previousLabel={"← Previous"}
                  nextLabel={"Next →"}
                  breakLabel={"..."}
                  pageCount={Math.ceil(totalCount / limit)}
                  marginPagesDisplayed={2}
                  pageRangeDisplayed={3}
                  onPageChange={handlePageChange}
                  containerClassName={"pagination"}
                  activeClassName={"active"}
                  forcePage={page}
                  disabledClassName={"disabled"}
                  pageClassName={"page-item"}
                  pageLinkClassName={"page-link"}
                  previousClassName={"page-item"}
                  previousLinkClassName={"page-link"}
                  nextClassName={"page-item"}
                  nextLinkClassName={"page-link"}
                  breakClassName={"page-item"}
                  breakLinkClassName={"page-link"}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
