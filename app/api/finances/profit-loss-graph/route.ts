import { prismaWithReconnect as prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { startOfMonth, endOfMonth, startOfYear, endOfYear, eachMonthOfInterval, eachDayOfInterval, format } from "date-fns";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("mode") || "year"; // 'year' or 'month'
    const now = new Date();
    let labels: string[] = [];
    let data: number[] = [];

    if (mode === "year") {
      // Month-wise for current year
      const yearStart = startOfYear(now);
      const yearEnd = endOfYear(now);
      const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });
      labels = months.map((d) => format(d, "MMM"));
      for (let i = 0; i < months.length; i++) {
        const start = months[i];
        const end = i < months.length - 1 ? months[i + 1] : endOfMonth(months[i]);
        const quotations = await prisma.quotation.findMany({
          where: { createdAt: { gte: start, lt: end } },
          select: { grandTotal: true },
        });
        const expenses = await prisma.expense.findMany({
          where: { createdAt: { gte: start, lt: end } },
          select: { amount: true },
        });
        const totalQuotation = quotations.reduce((sum, q) => sum + (q.grandTotal || 0), 0);
        const totalExpense = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
        data.push(Math.round(totalQuotation - totalExpense));
      }
    } else {
      // Day-wise for current month
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);
      const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
      labels = days.map((d) => format(d, "d MMM"));
      for (let i = 0; i < days.length; i++) {
        const start = days[i];
        const end = i < days.length - 1 ? days[i + 1] : monthEnd;
        const quotations = await prisma.quotation.findMany({
          where: { createdAt: { gte: start, lt: end } },
          select: { grandTotal: true },
        });
        const expenses = await prisma.expense.findMany({
          where: { createdAt: { gte: start, lt: end } },
          select: { amount: true },
        });
        const totalQuotation = quotations.reduce((sum, q) => sum + (q.grandTotal || 0), 0);
        const totalExpense = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
        data.push(Math.round(totalQuotation - totalExpense));
      }
    }
    return NextResponse.json({ labels, data });
  } catch (error) {
    console.error("[PROFIT-LOSS-GRAPH-ERROR]", error);
    return NextResponse.json({ error: "Failed to fetch profit/loss graph data." }, { status: 500 });
  }
}
