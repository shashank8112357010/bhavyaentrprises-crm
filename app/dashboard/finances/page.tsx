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
} from "@/components/ui/dropdown-menu"; // adjust import path if needed
import { getAllQuotations } from "@/lib/services/quotations";

export default function FinancesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [quotations, setQuotations] = useState([]);

  useEffect(() => {
    async function fetchQuotations() {
      try {
        const data = await getAllQuotations({
          searchQuery,
          page: 1,
          limit: 100,
        });
        setQuotations(data.quotations);
      } catch (error) {
        console.error("Error fetching quotations:", error);
      }
    }
    fetchQuotations();
  }, [searchQuery]);

  // Handler to view PDF in a new tab
  const handleViewPdf = (url: string) => {
    window.open(url, "_blank");
  };

  // Handler to download PDF
  const handleDownloadPdf = (url: string, name: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = name || "quotation.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handler to send mail (stub)
  const handleSendMail = (quotationId: string) => {
    alert(`Send mail to client for quotation id: ${quotationId}`);
    // Implement your mail sending API call here
  };

  const totalGrandTotal = quotations.reduce((acc, q:any) => acc + q.grandTotal, 0);

// Format as INR currency
const formattedTotal = totalGrandTotal.toLocaleString("en-IN", {
  style: "currency",
  currency: "INR",
});

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
          <NewQuotationDialog />
          <NewExpenseDialog />
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
                        colSpan={7}
                        className="text-center text-muted-foreground"
                      >
                        No quotations found.
                      </TableCell>
                    </TableRow>
                  )}

                  {quotations.map((q: any) => (
                    <TableRow key={q.id}>
                      <TableCell>
                        {q.createdAt ? q.createdAt.split("T")[0] : "N/A"}
                      </TableCell>
                      <TableCell>{q.id || "N/A"}</TableCell>
                      <TableCell>{q.client?.name || "N/A"}</TableCell>
                      <TableCell>{q.ticket?.title || "N/A"}</TableCell>
                      <TableCell>
                        {q.subtotal ? `₹${q?.subtotal.toLocaleString()}` : "N/A"}
                      </TableCell>
                      <TableCell>
                        {q.gst ? `₹${q?.gst.toLocaleString()}` : "N/A"}
                      </TableCell>
                      <TableCell>
                        {q.grandTotal ? `₹${q?.grandTotal.toLocaleString()}` : "N/A"}
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
                            <DropdownMenuItem
                              onClick={() => handleViewPdf(q.pdfUrl)}
                            >
                              View PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleDownloadPdf(q.pdfUrl, q.name)
                              }
                            >
                              Download PDF
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleSendMail(q.id)}
                            >
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
        <TabsContent value="expenses">
          <Card>
            <CardHeader>
              <CardTitle>Expenses</CardTitle>
              <CardDescription>Track all expenses</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Requester</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>2024-03-15</TableCell>
                    <TableCell>Materials for HDFC Bank repair</TableCell>
                    <TableCell>₹12,000</TableCell>
                    <TableCell>Rajesh Kumar</TableCell>
                    <TableCell>Materials</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Quotations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formattedTotal}</div>
                <p className="text-xs text-muted-foreground">
                  +20.1% from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Expenses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹0</div>
                <p className="text-xs text-muted-foreground">
                  +12.5% from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Profit Margin
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">24.5%</div>
                <p className="text-xs text-muted-foreground">
                  +2.4% from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Pending Payments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹45,000</div>
                <p className="text-xs text-muted-foreground">
                  4 invoices pending
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ... expenses and summary tabs unchanged ... */}
      </Tabs>
    </div>
  );
}
