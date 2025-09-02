import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    
    // Pagination for large datasets
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 200); // Max 200 for selections
    const skip = (page - 1) * limit;
    
    // Optional search parameter for filtering
    const search = url.searchParams.get("search");
    
    // Build where conditions
    const whereConditions: any = {};
    if (search) {
      whereConditions.OR = [
        {
          title: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          ticketId: {
            contains: search,
            mode: 'insensitive'
          }
        }
      ];
    }

    // Fetch tickets with pagination and search
    const [tickets, totalCount] = await Promise.all([
      prisma.ticket.findMany({
        where: whereConditions,
        skip,
        take: limit,
        select: {
          id: true, // UUID
          title: true,
          ticketId: true, // Human-readable/sequential ID
          status: true, // Add status for better UI
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.ticket.count({
        where: whereConditions,
      }),
    ]);

    return NextResponse.json({
      tickets,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNextPage: page < Math.ceil(totalCount / limit),
        hasPrevPage: page > 1,
        limit
      }
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
