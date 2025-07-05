import { prismaWithReconnect as prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { TicketStatus } from "@prisma/client";
import { verifyToken } from "@/lib/services/auth";

export async function GET(request: NextRequest) {
  try {
    // Verify user authentication
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    const userRole = payload.role;
    const userId = payload.userId;

    // Get current date and time components
    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0,
      0,
    );
    const todayEnd = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
      999,
    );

    // For "Client Updates Needed": date 3 days ago
    const threeDaysAgo = new Date(now);
    threeDaysAgo.setDate(now.getDate() - 3);

    // For "Completed This Week": determine start of the week (assuming Sunday is the first day)
    const dayOfWeek = now.getDay(); // 0 (Sunday) to 6 (Saturday)
    const diffToSunday = dayOfWeek; // Number of days to subtract to get to the previous Sunday
    const startOfWeek = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - diffToSunday,
      0,
      0,
      0,
      0,
    );

    // Base filter for role-based access
    const roleBasedFilter =
      userRole === "ADMIN" || userRole === "ACCOUNTS"
        ? {} // Admin and Accounts see all tickets
        : { assigneeId: userId }; // Agents see only their assigned tickets

    // 1. Open Tickets Count: Not 'completed', 'billing_completed', 'closed', or 'cancelled'
    const openTicketsCount = await prisma.ticket.count({
      where: {
        ...roleBasedFilter,
        NOT: {
          status: {
            in: [TicketStatus.completed, TicketStatus.billing_completed],
          },
        },
      },
    });

    // 2. Scheduled Today Count: scheduledDate is today
    const scheduledTodayCount = await prisma.ticket.count({
      where: {
        ...roleBasedFilter,
        scheduledDate: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    });

    // 3. Client Updates Needed Count: 'onHold' OR ('inProgress' AND updatedAt < threeDaysAgo)
    const clientUpdatesNeededCount = await prisma.ticket.count({
      where: {
        ...roleBasedFilter,
        OR: [
          { status: TicketStatus.onHold },
          {
            status: TicketStatus.inProgress,
            completedDate: {
              lt: threeDaysAgo,
            },
          },
        ],
      },
    });

    // 4. Completed This Week Count: 'completed' or 'billing_completed' AND completedDate is this week
    const completedThisWeekCount = await prisma.ticket.count({
      where: {
        ...roleBasedFilter,
        OR: [
          {
            status: TicketStatus.completed,
            completedDate: {
              gte: startOfWeek,
              lte: now,
            },
          },
          {
            status: TicketStatus.billing_completed,
            completedDate: {
              gte: startOfWeek,
              lte: now,
            },
          },
        ],
      },
    });

    return NextResponse.json(
      {
        openTicketsCount,
        scheduledTodayCount,
        clientUpdatesNeededCount,
        completedThisWeekCount,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching ticket counts:", error);
    return NextResponse.json(
      {
        message: "Internal server error while fetching ticket counts.",
      },
      { status: 500 },
    );
  }
}
