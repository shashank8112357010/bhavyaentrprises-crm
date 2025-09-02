import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { startOfMonth, endOfMonth, startOfYear, endOfYear, eachMonthOfInterval, eachDayOfInterval, format } from "date-fns";

// Force dynamic export for the route handler
export const dynamic = 'force-dynamic';

// Optimized aggregation function to group data by time periods
async function getAggregatedData(startDate: Date, endDate: Date) {
  const [quotationData, expenseData] = await Promise.all([
    prisma.quotation.findMany({
      where: { 
        createdAt: { gte: startDate, lte: endDate }
      },
      select: { 
        createdAt: true, 
        grandTotal: true 
      },
      orderBy: { createdAt: 'asc' }
    }),
    prisma.expense.findMany({
      where: { 
        createdAt: { gte: startDate, lte: endDate }
      },
      select: { 
        createdAt: true, 
        amount: true 
      },
      orderBy: { createdAt: 'asc' }
    })
  ]);

  return { quotationData, expenseData };
}

// Helper function to group data by time period
function groupDataByPeriod(data: Array<{createdAt: Date, value: number}>, periods: Date[], isDaily: boolean) {
  const groupedData: number[] = new Array(periods.length).fill(0);
  
  data.forEach(item => {
    const itemDate = new Date(item.createdAt);
    let periodIndex = -1;
    
    if (isDaily) {
      // For daily grouping, find the exact day
      periodIndex = periods.findIndex(period => 
        itemDate.getDate() === period.getDate() &&
        itemDate.getMonth() === period.getMonth() &&
        itemDate.getFullYear() === period.getFullYear()
      );
    } else {
      // For monthly grouping, find the correct month
      periodIndex = periods.findIndex(period => 
        itemDate.getMonth() === period.getMonth() &&
        itemDate.getFullYear() === period.getFullYear()
      );
    }
    
    if (periodIndex !== -1) {
      groupedData[periodIndex] += item.value || 0;
    }
  });
  
  return groupedData;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("mode") || "year"; // 'year' or 'month'
    const now = new Date();
    let labels: string[] = [];
    let data: number[] = [];

    if (mode === "year") {
      // Month-wise for current year - OPTIMIZED: Only 2 DB queries instead of 24
      const yearStart = startOfYear(now);
      const yearEnd = endOfYear(now);
      const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });
      labels = months.map((d) => format(d, "MMM"));

      // Single aggregated query for all months
      const { quotationData, expenseData } = await getAggregatedData(yearStart, yearEnd);
      
      // Transform data for quotations and expenses
      const quotationsByMonth = groupDataByPeriod(
        quotationData.map(q => ({ createdAt: q.createdAt, value: q.grandTotal || 0 })), 
        months, 
        false
      );
      const expensesByMonth = groupDataByPeriod(
        expenseData.map(e => ({ createdAt: e.createdAt, value: e.amount || 0 })), 
        months, 
        false
      );

      // Calculate profit for each month
      data = quotationsByMonth.map((quotationTotal, index) => 
        Math.round(quotationTotal - expensesByMonth[index])
      );

    } else {
      // Day-wise for current month - OPTIMIZED: Only 2 DB queries instead of 60+
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);
      const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
      labels = days.map((d) => format(d, "d MMM"));

      // Single aggregated query for all days
      const { quotationData, expenseData } = await getAggregatedData(monthStart, monthEnd);
      
      // Transform data for quotations and expenses
      const quotationsByDay = groupDataByPeriod(
        quotationData.map(q => ({ createdAt: q.createdAt, value: q.grandTotal || 0 })), 
        days, 
        true
      );
      const expensesByDay = groupDataByPeriod(
        expenseData.map(e => ({ createdAt: e.createdAt, value: e.amount || 0 })), 
        days, 
        true
      );

      // Calculate profit for each day
      data = quotationsByDay.map((quotationTotal, index) => 
        Math.round(quotationTotal - expensesByDay[index])
      );
    }

    return NextResponse.json({ labels, data });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch profit/loss graph data." }, { status: 500 });
  }
}
