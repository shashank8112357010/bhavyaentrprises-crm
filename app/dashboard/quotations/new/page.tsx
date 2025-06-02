"use client";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { FileText, Search, Plus, Trash2, Download, Send, Save, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import { getAllRateCards } from "@/lib/services/rate-card";
import { getAllClients } from "@/lib/services/client"; // Assuming you have a service for fetching clients
import { Client } from "@/components/clients/types";
import { RateCard } from "@prisma/client";
import { rateCardSchema } from "@/lib/validations/rateCardSchema";

// Form schemas
const quotationFormSchema = z.object({
  clientId: z.number().optional(),
  serialNumber: z.string().optional(),
  salesType: z.string().default("Interstate"),
  quotationNumber: z.string().min(1, "Quote number is required"),
  validUntil: z.string().optional(),
  admin: z.string().optional(),
  quoteBy: z.string().optional(),
  discount: z.string().default("0"),
});

interface QuotationItem {
  id?: number;
  sno: number;
  rateCard: RateCard;
  quantity: number;
  totalValue: number;
  isEditable?: boolean;
}

export default function Quotations() {
  const { toast } = useToast();
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientSearch, setClientSearch] = useState("");
  const [rateCardSearch, setRateCardSearch] = useState("");
  const [quotationItems, setQuotationItems] = useState<QuotationItem[]>([]);
  const [showClientSearch, setShowClientSearch] = useState(false);
  const [showRateCardSearch, setShowRateCardSearch] = useState(false);
  const [editableRows, setEditableRows] = useState<number[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [rateCards, setRateCards] = useState<RateCard[]>([]);

  // Form setup
  const form = useForm({
    resolver: zodResolver(quotationFormSchema),
    defaultValues: {
      serialNumber: "",
      salesType: "Interstate",
      quotationNumber: `Q${Date.now()}`,
      validUntil: "",
      admin: "",
      quoteBy: "",
      discount: "0",
    },
  });

  // Rate card form setup
  const rateCardForm = useForm({
    resolver: zodResolver(rateCardSchema),
    defaultValues: {
      productDescription: "",
      rcSno: "",
      make: "",
      whereInUse: "",
      unit: "",
      unitPrice: "",
      bankName: "Bhavya Enterprises",
      isActive: true,
    },
  });

  // Fetch clients
  useEffect(() => {
    const fetchClients = async () => {
      if (clientSearch.length > 0) {
        try {
          const response = await getAllClients({ searchQuery: clientSearch });
          // console.log(responseclients);
          
          setClients(response.clients);
        } catch (error) {
          toast({
            title: "Error",
            description: "Failed to fetch clients",
            variant: "destructive",
          });
        }
      }
    };

    fetchClients();
  }, [clientSearch]);

  // Fetch rate cards
  useEffect(() => {
    const fetchRateCards = async () => {
      if (rateCardSearch.length > 0) {
        try {
          const response = await getAllRateCards({ searchQuery: rateCardSearch });
          console.log(response);
          
          setRateCards(response.data);
        } catch (error) {
          toast({
            title: "Error",
            description: "Failed to fetch rate cards",
            variant: "destructive",
          });
        }
      }
    };

    fetchRateCards();
  }, [rateCardSearch]);

  // Calculations
  const subtotal = quotationItems.reduce((sum, item) => sum + item.totalValue, 0);
  const discountAmount = (subtotal * parseFloat(form.watch("discount") || "0")) / 100;
  const taxableValue = subtotal - discountAmount;
  const igst = taxableValue * 0.18; // 18% IGST
  const netGrossAmount = taxableValue + igst;

  // Add rate card to quotation
  const addRateCard = (rateCard: RateCard) => {
    const newItem: QuotationItem = {
      sno: quotationItems.length + 1,
      rateCard,
      quantity: 1,
      totalValue: parseFloat(rateCard.rate),
    };
    setQuotationItems([...quotationItems, newItem]);
    setRateCardSearch("");
    setShowRateCardSearch(false);
  };

  // Remove rate card from quotation
  const removeRateCard = (index: number) => {
    const updated = quotationItems.filter((_, i) => i !== index);
    // Update serial numbers
    const reNumbered = updated.map((item, i) => ({ ...item, sno: i + 1 }));
    setQuotationItems(reNumbered);
  };

  // Update quantity
  const updateQuantity = (index: number, quantity: number) => {
    if (quantity < 1) quantity = 1; // Ensure minimum quantity is 1
    const updated = [...quotationItems];
    updated[index].quantity = quantity;
    updated[index].totalValue = quantity * parseFloat(updated[index].rateCard?.rate);
    setQuotationItems(updated);
  };

  // Save quotation
  const saveQuotation = (status: "draft" | "sent" = "draft") => {
    const formData = form.getValues();
    const quotationData = {
      ...formData,
      clientId: selectedClient?.id,
      date: new Date().toISOString(),
      validUntil: formData.validUntil ? new Date(formData.validUntil).toISOString() : undefined,
      subtotal: subtotal.toString(),
      discount: formData.discount,
      taxableValue: taxableValue.toString(),
      igst: igst.toString(),
      netGrossAmount: netGrossAmount.toString(),
      status,
      items: quotationItems,
    };

    // Implement save quotation logic here
    toast({
      title: "Success",
      description: "Quotation saved successfully",
    });
  };

  // Export to PDF (placeholder)
  const exportToPDF = () => {
    toast({
      title: "Export to PDF",
      description: "PDF export functionality will be implemented",
    });
  };

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-xl font-bold mb-2">Bhavya Enterprises</h2>
              <p className="text-sm mb-1">
                Regd Office: SCO 393 2nd Floor, Sector 37-D, Chandigarh 160036
              </p>
              <p className="text-sm mb-1">
                B.O. : Plot No. 1025, Rani Sati Nagar, Nirman Nagar, Jaipur-302019
              </p>
              <p className="text-sm">
                Helpdesk No: +919988818489, +919815922428
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-1 space-y-6">
            {/* Client Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Client Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Client Search</Label>
                  <div className="relative">
                    <Input
                      placeholder="Type client name or code..."
                      value={clientSearch}
                      onChange={(e) => {
                        setClientSearch(e.target.value);
                        setShowClientSearch(true);
                      }}
                      onFocus={() => setShowClientSearch(true)}
                    />
                    {showClientSearch && clientSearch && clients.length > 0 && (
                      <div className="absolute z-10 w-full mt-1  border rounded-md shadow-lg max-h-48 overflow-y-auto">
                        {clients.map((client: Client) => (
                          <div
                            key={client.id}
                            className="p-2  cursor-pointer"
                            onClick={() => {
                              setSelectedClient(client);
                              setClientSearch(client.name);
                              setShowClientSearch(false);
                            }}
                          >
                            <div className="font-medium">{client.name}</div>
                            <div className="text-sm ">{client.code}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {selectedClient && (
                  <div className="p-3  rounded-lg">
                    <h4 className="font-medium text-blue-900">{selectedClient.name}</h4>
                    <p className="text-sm text-blue-700">{selectedClient.code}</p>
                    {selectedClient.email && (
                      <p className="text-sm text-blue-600">{selectedClient.email}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quotation Details */}
            <Card>
              <CardHeader>
                <CardTitle>Quotation Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Serial Number</Label>
                  <Input {...form.register("serialNumber")} />
                </div>

                <div>
                  <Label>Date</Label>
                  <Input
                    type="date"
                    defaultValue={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div>
                  <Label>Sales Type</Label>
                  <Select value={form.watch("salesType")} onValueChange={(value) => form.setValue("salesType", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Interstate">Interstate</SelectItem>
                      <SelectItem value="Intrastate">Intrastate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Quote Number</Label>
                  <Input {...form.register("quotationNumber")} />
                </div>

                <div>
                  <Label>Valid Until</Label>
                  <Input type="date" {...form.register("validUntil")} />
                </div>

                <div>
                  <Label>Admin</Label>
                  <Input {...form.register("admin")} />
                </div>

                <div>
                  <Label>Quote By</Label>
                  <Input {...form.register("quoteBy")} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Products & Services */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-blue-600" />
                    Rate Cards & Services
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-blue-600 border-blue-600"
                      onClick={() => setShowRateCardSearch(!showRateCardSearch)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Search Rate Cards
                    </Button>
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={() => {
                        const newItem: QuotationItem = {
                          sno: quotationItems.length + 1,
                          rateCard: {
                            id: `new-${Date.now()}`,
                            srNo: quotationItems.length + 1,
                            description: "Type to search",
                            unit: "Unit",
                            rate: "0",
                            bankName: "Bhavya Enterprises",
                            bankRcNo: "",
                            uploadedAt: new Date()
                          },
                          quantity: 1,
                          totalValue: 0,
                          isEditable: true
                        };
                        setQuotationItems([...quotationItems, newItem]);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Rate Card
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>

              {/* Search Interface */}
              {showRateCardSearch && (
                <div className="px-6 pb-4">
                  <div className="p-4 rounded-lg">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" />
                      <Input
                        placeholder="Type rate card name, code, or description..."
                        value={rateCardSearch}
                        onChange={(e) => setRateCardSearch(e.target.value)}
                        className="pl-10 border-0 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    {rateCardSearch && rateCards.length > 0 && (
                      <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
                        {rateCards.map((rateCard: any) => (
                          <div
                            key={rateCard.id}
                            className="p-3 rounded border cursor-pointer transition-colors"
                            onClick={() => addRateCard(rateCard)}
                          >
                            <div className="text-sm">{rateCard.description} {rateCard.srNo} • {rateCard.unit} • ₹{rateCard.rate} </div>
                          
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-gray-200">
                      <TableHead className="w-16 text-gray-600 text-sm">S.NO</TableHead>
                      <TableHead className="text-gray-600 text-sm">DESCRIPTION</TableHead>
                      <TableHead className="text-gray-600 text-sm">RC-SNO</TableHead>
                      <TableHead className="text-gray-600 text-sm">UNIT</TableHead>
                      <TableHead className="text-gray-600 text-sm">QTY</TableHead>
                      <TableHead className="text-gray-600 text-sm">UNIT PRICE</TableHead>
                      <TableHead className="text-gray-600 text-sm">TOTAL VALUE</TableHead>
                      <TableHead className="text-gray-600 text-sm">ACTION</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quotationItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-12">
                          <div className="flex flex-col items-center justify-center space-y-3">
                            <Package className="h-12 w-12 text-gray-300" />
                            <div className="text-gray-500 font-medium">No rate cards added yet</div>
                            <div className="text-sm text-gray-400">Add your first rate card</div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      quotationItems.map((item, index) => (
                        <TableRow key={index} className="border-b border-gray-100">
                          <TableCell className="font-medium">{item.sno}</TableCell>
                          <TableCell className="font-medium ">
                            {item.isEditable ? (
                              <Input
                                value={item.rateCard.description}
                                onChange={(e) => {
                                  const updated = [...quotationItems];
                                  updated[index].rateCard.description = e.target.value;
                                  setQuotationItems(updated);
                                }}
                                placeholder="Type to search"
                                className="border-none p-0 h-auto focus:ring-0"
                              />
                            ) : (
                              item.rateCard.description
                            )}
                          </TableCell>
                          <TableCell className="">
                            {item.isEditable ? (
                              <Input
                                value={item.rateCard.bankRcNo}
                                onChange={(e) => {
                                  const updated = [...quotationItems];
                                  updated[index].rateCard.bankRcNo = e.target.value;
                                  setQuotationItems(updated);
                                }}
                                placeholder=""
                                className="w-20 h-8 text-sm"
                              />
                            ) : (
                              item.rateCard.bankRcNo
                            )}
                          </TableCell>
                          <TableCell>
                            <Select value={item.rateCard.unit} disabled={!item.isEditable}>
                              <SelectTrigger className="w-20 h-8 text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Unit">Unit</SelectItem>
                                <SelectItem value="Piece">Piece</SelectItem>
                                <SelectItem value="Set">Set</SelectItem>
                                <SelectItem value="Meter">Meter</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={item.quantity.toString()}
                              onChange={(e) => {
                                const newQuantity = parseInt(e.target.value) || 1;
                                updateQuantity(index, newQuantity);
                              }}
                              className="w-16 h-8 text-center"
                              min="1"
                              step="1"
                            />
                          </TableCell>
                          <TableCell>
                            {item.isEditable ? (
                              <Input
                                type="number"
                                value={item.rateCard.rate}
                                onChange={(e) => {
                                  const updated = [...quotationItems];
                                  updated[index].rateCard.rate = e.target.value;
                                  updated[index].totalValue = item.quantity * parseFloat(e.target.value || "0");
                                  setQuotationItems(updated);
                                }}
                                placeholder="0"
                                className="w-20 h-8 text-sm"
                                step="0.01"
                              />
                            ) : (
                              `₹${item.rateCard.rate}`
                            )}
                          </TableCell>
                          <TableCell>₹{item.totalValue.toFixed(2)}</TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeRateCard(index)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Calculations & Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Calculations & Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Quotation Summary */}
                  <div>
                    <h4 className="font-medium mb-3">Quotation Summary</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Total Items:</span>
                        <span>{quotationItems.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Quantity:</span>
                        <span>{quotationItems.reduce((sum, item) => sum + item.quantity, 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>₹{subtotal.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="mt-4">
                      <Label>Total Value (In Words)</Label>
                      <div className="text-sm mt-1">
                        {subtotal === 0 ? "Zero Only" : `Rupees ${subtotal.toFixed(2)} Only`}
                      </div>
                    </div>
                  </div>

                  {/* Tax Calculations */}
                  <div className="p-4 rounded-lg">
                    <h4 className="font-medium mb-3">Tax Calculations</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>₹{subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Discount:</span>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            {...form.register("discount")}
                            className="w-16 h-6 text-xs"
                            min="0"
                            max="100"
                            step="0.1"
                          />
                          <span>%</span>
                          <span className="text-red-600">-₹{discountAmount.toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span>Taxable Value:</span>
                        <span>₹{taxableValue.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>IGST (18%):</span>
                        <span>₹{igst.toFixed(2)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-medium text-blue-600">
                        <span>Net Gross Amount:</span>
                        <span>₹{netGrossAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-center gap-4">
              <Button variant="outline" onClick={() => saveQuotation("draft")}>
                <Save className="h-4 w-4 mr-2" />
                Save Draft
              </Button>
              <Button
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => saveQuotation("sent")}
              >
                <Send className="h-4 w-4 mr-2" />
                Send Quotation
              </Button>
              <Button variant="outline" className="bg-green-50 text-green-700" onClick={exportToPDF}>
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
