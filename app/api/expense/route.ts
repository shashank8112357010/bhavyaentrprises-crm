import { prismaWithReconnect as prisma } from "@/lib/prisma";
import { ExpenseCategory, Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = searchParams.get("page") || "1";
    const limit = searchParams.get("limit") || "10";
    const search = searchParams.get("search") || "";

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    const whereClause: Prisma.ExpenseWhereInput = search
      ? {
          OR: [
            { description: { contains: search, mode: "insensitive" } },
            { requester: { contains: search, mode: "insensitive" } },
            { category: { equals: search.toUpperCase() as ExpenseCategory } },
            {
              quotation: {
                client: {
                  name: { contains: search, mode: "insensitive" },
                },
              },
            },
            {
              ticket: {
                title: { contains: search, mode: "insensitive" },
              },
            },
          ],
        }
      : {};

    const total = await prisma.expense.count({ where: whereClause });

    const expenses = await prisma.expense.findMany({
      where: whereClause,
      include: {
        quotation: {
          select: {
            id: true,
            name: true,
            client: { select: { id: true, name: true } },
          },
        },
        ticket: {
          select: { id: true, title: true },
        },
      },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
      orderBy: { createdAt: "desc" },
    });
    console.log(expenses ,"expenses");
    

    return NextResponse.json({
      expenses,
      pagination: { page: pageNum, limit: limitNum, total },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch expenses." },
      { status: 500 }
    );
  }
}
