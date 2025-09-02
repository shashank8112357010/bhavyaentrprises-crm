import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import {
  createClientSchema,
  updateClientSchema,
} from "@/lib/validations/clientSchema";
const ITEMS_PER_PAGE = 10;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = createClientSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const clientData = parsed.data;

    // Generate custom client display ID
    let customDisplayId;
    try {
      const latestClient = await prisma.client.findFirst({
        where: { displayId: { not: null } },
        orderBy: { displayId: "desc" },
        select: { displayId: true },
      });

      let clientNumber = 1;
      if (latestClient && latestClient.displayId) {
        // Extract number from existing client displayId (format: CLIENT-0001)
        const idMatch = latestClient.displayId.match(/CLIENT-(\d+)$/);
        if (idMatch) {
          clientNumber = parseInt(idMatch[1]) + 1;
        }
      }

      customDisplayId = `CLIENT-${clientNumber.toString().padStart(4, "0")}`;
    } catch (idError) {
      console.error("Error generating client display ID:", idError);
      // Don't fail the entire request, but log the error
      // The client will be created without a display ID, which can be fixed later
    }

    // Ensure we have a display ID, if not generate a fallback
    if (!customDisplayId) {
      // Fallback: generate based on timestamp
      const timestamp = Date.now();
      const fallbackNumber = timestamp.toString().slice(-4);
      customDisplayId = `CLIENT-${fallbackNumber}`;
      console.warn("Using fallback display ID:", customDisplayId);
    }

    // Create client data
    const clientCreateData = {
      ...clientData,
      displayId: customDisplayId,
      initials:
        clientData.initials ||
        clientData.name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase(),
    };


    const client = await prisma.client.create({
      data: clientCreateData,
    });

    return NextResponse.json(client, { status: 201 });
  } catch (error: any) {
    console.error("Client creation error:", error);
    return NextResponse.json(
      {
        error: "Failed to create client",
        message: error.message,
        details: error.code || "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Optimized pagination - reduce default from 100 to 20, max 50
    const pageParam = searchParams.get("page") || "1";
    const limitParam = searchParams.get("limit") || "20";
    const search = searchParams.get("search") || "";
    const type = searchParams.get("type") || "all";

    const pageNum = Math.max(1, parseInt(pageParam, 10) || 1);
    const limit = Math.min(parseInt(limitParam, 10) || 20, 50); // Max 50 items per page

    const where: any = {};

    if (search) {
      where.OR = [
        { id: { contains: search, mode: "insensitive" } },
        { displayId: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
        { contactPerson: { contains: search, mode: "insensitive" } },
      ];
    }

    if (type !== "all") {
      where.type = type;
    }

    // Execute count and data queries in parallel for performance
    const [totalCount, clientsWithTickets] = await Promise.all([
      prisma.client.count({ where }),
      prisma.client.findMany({
        where,
        skip: (pageNum - 1) * limit,
        take: limit,
        orderBy: [
          { name: "asc" },
          { id: "asc" } // Stable sort
        ],
        include: {
          tickets: {
            select: {
              id: true,
              status: true, // Add status for better insight
            },
          },
        },
      }),
    ]);

    // Map clients with optimized ticket data
    const clients = clientsWithTickets.map((client) => ({
      ...client,
      activeTicketsCount: client.tickets.filter(t => 
        !["completed", "billing_completed"].includes(t.status)
      ).length,
      totalTicketsCount: client.tickets.length,
      // Remove full ticket objects to reduce payload
      tickets: undefined
    }));

    // Enhanced pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    
    return NextResponse.json({ 
      clients,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalCount,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
        limit
      }
    });
  } catch (error) {
    console.error("GET /api/clients error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
