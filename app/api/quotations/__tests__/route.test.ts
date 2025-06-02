import { GET } from "../route"; // Adjust path based on actual file structure
import { prisma } from "@/lib/prisma"; // Mocked prisma
import { NextRequest } from "next/server";
import { createRequest } from "node-mocks-http"; // Example, use your preferred mocking library

jest.mock("@/lib/prisma");
// jest.mock("jsonwebtoken"); // Not strictly needed for this GET route if no auth

describe("API GET /api/quotations", () => {
  let mockRequest: any;

  beforeEach(() => {
    jest.clearAllMocks(); // Clear mock calls between tests
  });

  it("should fetch quotations without filters", async () => {
    const mockQuotations = [{ id: "1", name: "Test Quote 1" }, { id: "2", name: "Test Quote 2" }];
    (prisma.quotation.findMany as jest.Mock).mockResolvedValue(mockQuotations);
    (prisma.quotation.count as jest.Mock).mockResolvedValue(mockQuotations.length);

    mockRequest = createRequest({
      method: "GET",
      url: "/api/quotations?page=1&limit=10",
    });
    
    const response = await GET(mockRequest as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.quotations).toEqual(mockQuotations);
    expect(data.pagination.total).toBe(mockQuotations.length);
    expect(prisma.quotation.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {},
      skip: 0,
      take: 10,
    }));
  });

  it("should filter quotations by status", async () => {
    const mockQuotations = [{ id: "1", name: "Draft Quote", status: "DRAFT" }];
    (prisma.quotation.findMany as jest.Mock).mockResolvedValue(mockQuotations);
    (prisma.quotation.count as jest.Mock).mockResolvedValue(mockQuotations.length);

    mockRequest = createRequest({
      method: "GET",
      url: "/api/quotations?page=1&limit=10&status=DRAFT",
    });

    const response = await GET(mockRequest as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.quotations).toEqual(mockQuotations);
    expect(prisma.quotation.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { status: "DRAFT" },
    }));
  });

  it("should not filter by status if status is 'All'", async () => {
    (prisma.quotation.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.quotation.count as jest.Mock).mockResolvedValue(0);
    
    mockRequest = createRequest({
      method: "GET",
      url: "/api/quotations?page=1&limit=10&status=All",
    });

    await GET(mockRequest as NextRequest);
    expect(prisma.quotation.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {}, // Empty where clause for status
    }));
  });

  it("should filter quotations by search query", async () => {
    const mockQuotations = [{ id: "1", name: "Searchable Quote" }];
    (prisma.quotation.findMany as jest.Mock).mockResolvedValue(mockQuotations);
    (prisma.quotation.count as jest.Mock).mockResolvedValue(mockQuotations.length);

    mockRequest = createRequest({
      method: "GET",
      url: "/api/quotations?page=1&limit=10&search=Searchable",
    });
    
    const response = await GET(mockRequest as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.quotations).toEqual(mockQuotations);
    expect(prisma.quotation.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        OR: [
          { name: { contains: "Searchable", mode: "insensitive" } },
          { client: { name: { contains: "Searchable", mode: "insensitive" } } },
          { ticket: { title: { contains: "Searchable", mode: "insensitive" } } },
        ],
      },
    }));
  });

  it("should handle pagination correctly", async () => {
    (prisma.quotation.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.quotation.count as jest.Mock).mockResolvedValue(25); // Assume 25 total items

    mockRequest = createRequest({
      method: "GET",
      url: "/api/quotations?page=2&limit=5",
    });

    const response = await GET(mockRequest as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.pagination.page).toBe(2);
    expect(data.pagination.limit).toBe(5);
    expect(data.pagination.total).toBe(25);
    expect(prisma.quotation.findMany).toHaveBeenCalledWith(expect.objectContaining({
      skip: 5, // (page 2 - 1) * limit 5
      take: 5,
    }));
  });

  it("should return 500 on server error", async () => {
    (prisma.quotation.findMany as jest.Mock).mockRejectedValue(new Error("Database error"));
    
    mockRequest = createRequest({
        method: "GET",
        url: "/api/quotations?page=1&limit=10",
    });

    const response = await GET(mockRequest as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to fetch quotations.");
  });
});
