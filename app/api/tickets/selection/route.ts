import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

export async function GET(req: NextRequest) {
  try {


    // Fetch tickets from database
    const tickets = await prisma.ticket.findMany({
      select: {
        id: true, // UUID
        title: true,
        ticketId: true, // Human-readable/sequential ID
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log("[TICKETS_SELECTION] Found tickets count:", tickets.length);

    return NextResponse.json({
      tickets,
      count: tickets.length,
    });
  } catch (error) {
    console.error("[GET_TICKETS_FOR_SELECTION_ERROR]", error);

    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Database or other errors
    return NextResponse.json(
      {
        error: "Internal server error",
        details:
          process.env.NODE_ENV === "development"
            ? (error as Error).message
            : undefined,
      },
      { status: 500 },
    );
  }
}
