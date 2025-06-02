import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = searchParams.get("page") || "1";
    const limit = searchParams.get("limit") || "10";
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status"); // Get status from query params

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    let whereClause: Prisma.QuotationWhereInput = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { client: { name: { contains: search, mode: "insensitive" } } },
            { ticket: { title: { contains: search, mode: "insensitive" } } },
          ],
        }
      : {};

    // If status is provided and not "All", add it to the where clause
    if (status && status !== "All") {
      // Ensure 'status' is a valid QuotationStatus enum value.
      // Prisma will validate if the string corresponds to an enum value.
      // If not, it would throw an error, which should be caught by the try-catch.
      // It's good practice to validate against known enum values if possible before querying.
      whereClause = {
        ...whereClause,
        status: status as any, // Cast to any if QuotationStatus enum isn't directly imported/checked here
      };
    }

    const total = await prisma.quotation.count({ where: whereClause });

    const quotations = await prisma.quotation.findMany({
      where: whereClause,
      include: {
        client: { select: { id: true, name: true } },
        ticket: { select: { id: true, title: true } },
      },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      quotations,
      pagination: { page: pageNum, limit: limitNum, total },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch quotations." },
      { status: 500 }
    );
  }
}
