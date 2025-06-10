import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

export async function GET(req: NextRequest) {
  try {
    // Authentication check
    const token = req.cookies.get("token")?.value;
    if (!token) {
      console.log("[TICKETS_SELECTION] No token provided");
      return NextResponse.json(
        { error: "Unauthorized - No token provided" },
        { status: 401 },
      );
    }

    // Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
        role: string;
        userId: string;
      };
    } catch (jwtError) {
      console.log("[TICKETS_SELECTION] Invalid token:", jwtError);
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Role-based access control (Optional - adjust based on your requirements)
    const allowedRoles = ["ADMIN", "RM", "BACKEND", "ACCOUNTS"];
    if (!allowedRoles.includes(decoded.role)) {
      console.log("[TICKETS_SELECTION] Forbidden role:", decoded.role);
      return NextResponse.json(
        { error: "Forbidden - Insufficient permissions" },
        { status: 403 },
      );
    }

    console.log(
      "[TICKETS_SELECTION] Fetching tickets for user:",
      decoded.userId,
      "role:",
      decoded.role,
    );

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
