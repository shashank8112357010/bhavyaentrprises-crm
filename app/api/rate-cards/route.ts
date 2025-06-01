import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "5", 10); // Changed default limit to 5
    const search = url.searchParams.get("search") || "";

    const skip = (page - 1) * limit;

    const where: Prisma.RateCardWhereInput = search
      ? {
          OR: [
            { description: { contains: search, mode: "insensitive" } },
            { bankName: { contains: search, mode: "insensitive" } },
            { bankRcNo: { contains: search, mode: "insensitive" } },
          ],
        }
      : {};

    const total = await prisma.rateCard.count({ where });

    const rateCards = await prisma.rateCard.findMany({
      where,
      orderBy: { uploadedAt: "asc" },
      skip,
      take: limit,
    });

    return NextResponse.json({
      data: rateCards,
      total,
      page,
      limit,
    });
  } catch (error) {
    console.error("Failed to fetch paginated rate cards", error);
    return NextResponse.json(
      { error: "Failed to fetch rate cards" },
      { status: 500 }
    );
  }
}
