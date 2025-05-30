import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import { createClientSchema } from "@/lib/validations/clientSchema";
const ITEMS_PER_PAGE = 10;
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = createClientSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const clientData = parsed.data;

    // Upsert client by id (or create new)
    const client = await prisma.client.create({
      data: clientData,
    });

    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}


export async function GET(request: NextRequest) {
  try {
    const ITEMS_PER_PAGE = 5
    const { searchParams } = new URL(request.url);

    const pageParam = searchParams.get("page") || "1";
    const search = searchParams.get("search") || "";
    const type = searchParams.get("type") || "all";

    const pageNum = parseInt(pageParam, 10) || 1;

    const where: any = {};

    if (search) {
      where.OR = [
        { id: { contains: search, mode: "insensitive" } },
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
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
