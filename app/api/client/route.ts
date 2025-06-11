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
    console.log("Received client data:", body);

    const parsed = createClientSchema.safeParse(body);

    if (!parsed.success) {
      console.error("Validation error:", parsed.error);
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
      console.log("Generated client display ID:", customDisplayId);
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

    console.log("Creating client with data:", clientCreateData);

    const client = await prisma.client.create({
      data: clientCreateData,
    });

    console.log("Client created successfully:", client);
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
    const ITEMS_PER_PAGE = 100;
    const { searchParams } = new URL(request.url);

    const pageParam = searchParams.get("page") || "1";
    const search = searchParams.get("search") || "";
    const type = searchParams.get("type") || "all";

    const pageNum = parseInt(pageParam, 10) || 1;

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

    const totalCount = await prisma.client.count({ where });

    const clientsWithTickets = await prisma.client.findMany({
      where,
      skip: (pageNum - 1) * ITEMS_PER_PAGE,
      take: ITEMS_PER_PAGE,
      orderBy: {
        name: "asc",
      },
      include: {
        tickets: {
          select: {
            id: true,
          },
        },
      },
    });

    // Map to attach ticket IDs as string array
    const clients = clientsWithTickets.map((client) => ({
      ...client,
      // ticketIds: client.tickets.map((ticket) => ticket.id),
      // tickets: undefined, // optionally remove full ticket objects
    }));

    return NextResponse.json({ clients, totalCount });
  } catch (error) {
    console.error("GET /api/clients error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
