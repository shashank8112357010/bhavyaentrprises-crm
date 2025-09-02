import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";

export const dynamic = 'force-dynamic';

function getDateRange(range: string) {
  const now = new Date();
  switch (range) {
    case "today":
      return { start: startOfDay(now), end: endOfDay(now) };
    case "week":
      return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
    case "month":
      return { start: startOfMonth(now), end: endOfMonth(now) };
    default:
      return { start: startOfDay(now), end: endOfDay(now) };
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") || "today";
    const { start, end } = getDateRange(range);

    // Total Quotation Amount (grandTotal)
    const quotations = await prisma.quotation.findMany({
      where: {
        createdAt: { gte: start, lte: end },
      },
      select: {
        grandTotal: true,
        expectedExpense: true,
      },
    });
    const totalQuotation = quotations.reduce((sum, q) => sum + (q.grandTotal || 0), 0);
    const totalExpectedExpense = quotations.reduce((sum, q) => sum + (q.expectedExpense || 0), 0);

    // Total Expenses
    const expenses = await prisma.expense.findMany({
      where: {
        createdAt: { gte: start, lte: end },
      },
      select: {
        amount: true,
      },
    });
    const totalExpense = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

    // Profit/Loss
    const profitLoss = totalQuotation - totalExpense;

    return NextResponse.json({
      totalQuotation,
      totalExpense,
      totalExpectedExpense,
      profitLoss,
      range,
      start,
      end,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch financial summary." }, { status: 500 });
  }
}
