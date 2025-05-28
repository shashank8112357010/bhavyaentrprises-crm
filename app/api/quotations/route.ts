import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = searchParams.get("page") || "1";
    const limit = searchParams.get("limit") || "10";
    const search = searchParams.get("search") || "";

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    const whereClause: Prisma.QuotationWhereInput = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { client: { name: { contains: search, mode: "insensitive" } } },
            { ticket: { title: { contains: search, mode: "insensitive" } } },
          ],
        }
      : {};

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
