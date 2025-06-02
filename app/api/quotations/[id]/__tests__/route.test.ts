import { PUT, DELETE } from "../route"; // Adjust path
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { generateQuotationPdf } from "@/lib/pdf/generateQuotationHtml"; // Mocked
import { NextRequest } from "next/server";
import { createRequest } from "node-mocks-http";
import fs from "fs"; // For mocking PDF deletion

jest.mock("@/lib/prisma");
jest.mock("jsonwebtoken");
jest.mock("@/lib/pdf/generateQuotationHtml");
jest.mock("fs");


describe("API /api/quotations/[id]", () => {
  let mockRequest: any;
  const quotationId = "quotId123";

  const mockExistingQuotation = {
    id: quotationId,
    name: "Original Quotation Name",
    clientId: "client1",
    rateCardDetails: [{ rateCardId: "rc1", quantity: 1, gstType: 18 }],
    subtotal: 100,
    gst: 18,
    grandTotal: 118,
    status: "DRAFT",
    currency: "INR",
    notes: "Original notes",
    pdfUrl: "/quotations/QUOT01.pdf",
    client: { id: "client1", name: "Original Client" },
    ticketId: "ticket1",
    serialNo: 1,
    expiryDate: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRateCardsData = [
    { id: "rc1", rate: 100, description: "Service A", unit: "hr" },
    { id: "rc2", rate: 200, description: "Service B", unit: "item" },
  ];


  beforeEach(() => {
    jest.clearAllMocks();
    (jwt.verify as jest.Mock).mockReturnValue({ role: "ADMIN", userId: "adminUser" });
    (prisma.rateCard.findMany as jest.Mock).mockResolvedValue(mockRateCardsData);
    (prisma.client.findUnique as jest.Mock).mockResolvedValue({ id: "client1", name: "Test Client"});
    (generateQuotationPdf as jest.Mock).mockResolvedValue(Buffer.from("new mock pdf"));
  });

  // --- PUT Tests ---
  describe("PUT /api/quotations/[id]", () => {
    it("should successfully update a quotation", async () => {
      const updatePayload = {
        name: "Updated Quotation Name",
        status: "SENT",
        notes: "Updated notes.",
      };
      (prisma.quotation.findUnique as jest.Mock).mockResolvedValue(mockExistingQuotation);
      (prisma.quotation.update as jest.Mock).mockResolvedValue({
        ...mockExistingQuotation,
        ...updatePayload,
      });

      mockRequest = createRequest({
        method: "PUT",
        url: `/api/quotations/${quotationId}`,
        cookies: { token: "admin-token" },
        json: () => Promise.resolve(updatePayload)
      });
      (mockRequest as any).json = jest.fn().mockResolvedValue(updatePayload);


      const response = await PUT(mockRequest as NextRequest, { params: { id: quotationId } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.name).toBe(updatePayload.name);
      expect(data.status).toBe(updatePayload.status);
      expect(data.notes).toBe(updatePayload.notes);
      expect(prisma.quotation.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: quotationId },
        data: expect.objectContaining(updatePayload),
      }));
      // PDF should not regenerate if only status/notes change (as per current needsPdfRegeneration logic)
      expect(generateQuotationPdf).not.toHaveBeenCalled(); 
    });

    it("should recalculate totals and regenerate PDF if rateCardDetails change", async () => {
      const updatePayload = {
        rateCardDetails: [{ rateCardId: "rc2", quantity: 2, gstType: 18 }], // New items, 200*2 = 400 subtotal
      };
      const expectedSubtotal = 400;
      const expectedGst = 400 * 0.18; // 72
      const expectedGrandTotal = expectedSubtotal + expectedGst; // 472

      (prisma.quotation.findUnique as jest.Mock).mockResolvedValue(mockExistingQuotation);
      (prisma.quotation.update as jest.Mock).mockResolvedValue({
        ...mockExistingQuotation,
        ...updatePayload,
        subtotal: expectedSubtotal,
        gst: expectedGst,
        grandTotal: expectedGrandTotal,
        pdfUrl: mockExistingQuotation.pdfUrl, // Assume URL doesn't change, file is overwritten
      });
      (fs.writeFileSync as jest.Mock).mockClear(); // Clear previous calls if any

      mockRequest = createRequest({
        method: "PUT",
        url: `/api/quotations/${quotationId}`,
        cookies: { token: "admin-token" },
        json: () => Promise.resolve(updatePayload)
      });
      (mockRequest as any).json = jest.fn().mockResolvedValue(updatePayload);

      const response = await PUT(mockRequest as NextRequest, { params: { id: quotationId } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.subtotal).toBe(expectedSubtotal);
      expect(data.gst).toBe(expectedGst);
      expect(data.grandTotal).toBe(expectedGrandTotal);
      expect(prisma.quotation.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          subtotal: expectedSubtotal,
          gst: expectedGst,
          grandTotal: expectedGrandTotal,
        }),
      }));
      expect(generateQuotationPdf).toHaveBeenCalled();
      expect(fs.writeFileSync).toHaveBeenCalledWith(expect.stringContaining(mockExistingQuotation.pdfUrl), expect.any(Buffer));
    });

    it("should return 404 if quotation to update is not found", async () => {
      (prisma.quotation.findUnique as jest.Mock).mockResolvedValue(null);
      mockRequest = createRequest({
        method: "PUT",
        url: `/api/quotations/${quotationId}`,
        cookies: { token: "admin-token" },
        json: () => Promise.resolve({ name: "Doesn't matter" })
      });
      (mockRequest as any).json = jest.fn().mockResolvedValue({ name: "Doesn't matter" });


      const response = await PUT(mockRequest as NextRequest, { params: { id: quotationId } });
      expect(response.status).toBe(404);
    });

    it("should return 400 for invalid update data", async () => {
      const invalidPayload = { name: "" }; // Name is required by update schema if provided
       (prisma.quotation.findUnique as jest.Mock).mockResolvedValue(mockExistingQuotation);
      mockRequest = createRequest({
        method: "PUT",
        url: `/api/quotations/${quotationId}`,
        cookies: { token: "admin-token" },
        json: () => Promise.resolve(invalidPayload)
      });
      (mockRequest as any).json = jest.fn().mockResolvedValue(invalidPayload);

      const response = await PUT(mockRequest as NextRequest, { params: { id: quotationId } });
      expect(response.status).toBe(400); // Assuming Zod validation error
    });
    
    it("should return 403 if user is not ADMIN/RM/BACKEND for PUT", async () => {
        (jwt.verify as jest.Mock).mockReturnValue({ role: "USER" });
        mockRequest = createRequest({ /* ... */ });
        (mockRequest as any).json = jest.fn().mockResolvedValue({ name: "Test" });
        (mockRequest as any).cookies = { get: jest.fn(() => "user-token") };


        const response = await PUT(mockRequest as NextRequest, { params: { id: quotationId } });
        expect(response.status).toBe(403);
    });
  });

  // --- DELETE Tests ---
  describe("DELETE /api/quotations/[id]", () => {
    it("should successfully delete a quotation", async () => {
      (prisma.quotation.findUnique as jest.Mock).mockResolvedValue(mockExistingQuotation);
      (prisma.expense.deleteMany as jest.Mock).mockResolvedValue({}); // Mock dependent deletions
      (prisma.ticket.findUnique as jest.Mock).mockResolvedValue({ due: 500 }); // For due amount update
      (prisma.ticket.update as jest.Mock).mockResolvedValue({});
      (prisma.quotation.delete as jest.Mock).mockResolvedValue(mockExistingQuotation);
      (fs.existsSync as jest.Mock).mockReturnValue(true); // PDF exists

      mockRequest = createRequest({
        method: "DELETE",
        url: `/api/quotations/${quotationId}`,
        cookies: { token: "admin-token" },
      });

      const response = await DELETE(mockRequest as NextRequest, { params: { id: quotationId } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe("Quotation and related data deleted successfully");
      expect(prisma.quotation.delete).toHaveBeenCalledWith({ where: { id: quotationId } });
      expect(fs.unlinkSync).toHaveBeenCalledWith(expect.stringContaining(mockExistingQuotation.pdfUrl));
    });

    it("should return 404 if quotation to delete is not found", async () => {
      (prisma.quotation.findUnique as jest.Mock).mockResolvedValue(null);
      mockRequest = createRequest({ /* ... */ });
      (mockRequest as any).cookies = { get: jest.fn(() => "admin-token") };


      const response = await DELETE(mockRequest as NextRequest, { params: { id: quotationId } });
      expect(response.status).toBe(404);
    });
    
    it("should return 403 if user is not ADMIN for DELETE", async () => {
        (jwt.verify as jest.Mock).mockReturnValue({ role: "USER" });
        mockRequest = createRequest({ /* ... */ });
        (mockRequest as any).cookies = { get: jest.fn(() => "user-token") };

        const response = await DELETE(mockRequest as NextRequest, { params: { id: quotationId } });
        expect(response.status).toBe(403);
    });
  });
});
