import { POST } from "../route"; // Adjust path
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { generateQuotationPdf } from "@/lib/pdf/generateQuotationHtml"; // Mocked
import { NextRequest } from "next/server";
import { createRequest, createResponse } from "node-mocks-http";

jest.mock("@/lib/prisma");
jest.mock("jsonwebtoken");
jest.mock("@/lib/pdf/generateQuotationHtml");
jest.mock("fs"); // Mock fs if PDF saving is closely tested, though generateQuotationPdf mock covers it

describe("API POST /api/quotations/create-quotations", () => {
  let mockRequest: any;
  let mockResponse: any;

  const mockRateCardData = [
    { id: "rc1", description: "Service A", unit: "Hour", rate: 100, bankName: "N/A", bankRcNo: "N/A", srNo: 1 },
    { id: "rc2", description: "Service B", unit: "Item", rate: 50, bankName: "N/A", bankRcNo: "N/A", srNo: 2 },
  ];

  const mockClientData = { id: "client1", name: "Test Client", address: "123 Test St", gstin: "GSTIN123" };

  beforeEach(() => {
    jest.clearAllMocks();
    mockResponse = createResponse();
    (jwt.verify as jest.Mock).mockReturnValue({ role: "ADMIN", userId: "adminUser" }); // Default to ADMIN
    (prisma.rateCard.findMany as jest.Mock).mockResolvedValue(mockRateCardData);
    (prisma.client.findUnique as jest.Mock).mockResolvedValue(mockClientData);
    (prisma.quotation.findFirst as jest.Mock) // For serial number generation
        .mockResolvedValueOnce(null) // First call for serialNo (no existing quotations)
        .mockResolvedValueOnce(null); // Second call for QUOT ID generation (no existing quotations)
    (prisma.quotation.create as jest.Mock).mockImplementation(async (args) => ({
      ...args.data, // Return created data
      id: args.data.id || "QUOT01", // Ensure id is part of the response
      serialNo: args.data.serialNo || 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    (generateQuotationPdf as jest.Mock).mockResolvedValue(Buffer.from("mock pdf"));
  });

  const validQuotationPayload = {
    name: "New Test Quotation",
    clientId: "client1",
    rateCardDetails: [
      { rateCardId: "rc1", quantity: 2, gstType: 18 }, // 200 + 36 GST = 236
      { rateCardId: "rc2", quantity: 1, gstType: 28 }, // 50 + 14 GST = 64
    ], // Expected: subtotal 250, GST 50, grandTotal 300
    ticketId: "ticket1",
    status: "DRAFT",
    expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    currency: "USD",
    notes: "Test notes here",
  };

  it("should successfully create a quotation with all valid fields", async () => {
    mockRequest = createRequest({
      method: "POST",
      url: "/api/quotations/create-quotations",
      cookies: { token: "valid-admin-token" },
      json: () => Promise.resolve(validQuotationPayload), // node-mocks-http needs body directly or use next()
    });
    // For NextRequest, body needs to be a ReadableStream or use polyfills
    // Simpler: directly pass body to handler if using a helper, or mock req.json()
    (mockRequest as any).json = jest.fn().mockResolvedValue(validQuotationPayload);


    const response = await POST(mockRequest as NextRequest);
    const data = await response.json();
    
    expect(response.status).toBe(200); // Or 201 for Created
    expect(data.message).toBe("Quotation created");
    expect(data.quotation).toBeDefined();
    expect(data.quotation.name).toBe(validQuotationPayload.name);
    expect(data.quotation.status).toBe("DRAFT");
    expect(data.quotation.currency).toBe("USD");
    expect(data.quotation.notes).toBe("Test notes here");
    expect(new Date(data.quotation.expiryDate).toISOString().substring(0,10))
      .toBe(new Date(validQuotationPayload.expiryDate).toISOString().substring(0,10));

    // Verify totals are recalculated and used (matches expected values)
    expect(prisma.quotation.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        subtotal: 250, // 100*2 + 50*1
        gst: 50,       // (100*2*0.18) + (50*1*0.28) = 36 + 14 = 50
        grandTotal: 300,
      }),
    }));

    // Verify ID and serial number generation
    expect(prisma.quotation.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        id: expect.stringMatching(/^QUOT\d{2,}$/), // e.g. QUOT01
        serialNo: expect.any(Number), // e.g. 1
      }),
    }));
    
    expect(generateQuotationPdf).toHaveBeenCalled();
  });

  it("should return 400 for invalid input (e.g., missing required fields)", async () => {
    const invalidPayload = { ...validQuotationPayload, name: "" }; // Missing name
    (mockRequest as any).json = jest.fn().mockResolvedValue(invalidPayload);

    const response = await POST(mockRequest as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toBe("Invalid input");
    expect(data.errors).toBeDefined();
  });

  it("should return 401 if no token is provided", async () => {
    mockRequest = createRequest({
      method: "POST",
      url: "/api/quotations/create-quotations",
      json: () => Promise.resolve(validQuotationPayload),
    });
     (mockRequest as any).json = jest.fn().mockResolvedValue(validQuotationPayload);
     (mockRequest as any).cookies = { get: jest.fn().mockReturnValue(undefined) };


    const response = await POST(mockRequest as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.message).toBe("Unauthorized");
  });

  it("should return 403 if user is not ADMIN", async () => {
    (jwt.verify as jest.Mock).mockReturnValue({ role: "USER", userId: "testUser" });
    mockRequest = createRequest({
      method: "POST",
      url: "/api/quotations/create-quotations",
      cookies: { token: "valid-user-token" },
      json: () => Promise.resolve(validQuotationPayload),
    });
    (mockRequest as any).json = jest.fn().mockResolvedValue(validQuotationPayload);

    const response = await POST(mockRequest as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.message).toBe("Need Admin Access");
  });
  
  it("should correctly calculate totals based on rate card details and varying GST types", async () => {
    (mockRequest as any).json = jest.fn().mockResolvedValue(validQuotationPayload);
    await POST(mockRequest as NextRequest);

    expect(prisma.quotation.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          subtotal: 250,       // (100 * 2) + (50 * 1)
          gst: 50,             // (200 * 0.18) + (50 * 0.28) = 36 + 14 = 50
          grandTotal: 300,
        }),
      })
    );
  });

   it("should default status to DRAFT and currency to INR if not provided", async () => {
    const payloadMinimal = { 
        name: "Minimal Quotation",
        clientId: "client1",
        rateCardDetails: [{ rateCardId: "rc1", quantity: 1, gstType: 18 }],
     };
    (mockRequest as any).json = jest.fn().mockResolvedValue(payloadMinimal);

    await POST(mockRequest as NextRequest);

    expect(prisma.quotation.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "DRAFT",
          currency: "INR",
        }),
      })
    );
  });

  it("should return 404 if a rate card ID in details is not found", async () => {
    const payloadWithInvalidRateCard = {
      ...validQuotationPayload,
      rateCardDetails: [{ rateCardId: "invalidRC", quantity: 1, gstType: 18 }],
    };
    (prisma.rateCard.findMany as jest.Mock).mockResolvedValue([]); // No rate cards found
    (mockRequest as any).json = jest.fn().mockResolvedValue(payloadWithInvalidRateCard);

    const response = await POST(mockRequest as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.message).toBe("Some RateCard entries not found");
  });

});
