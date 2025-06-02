import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { TicketStatus } from '@prisma/client'; // Import the TicketStatus enum

export async function GET() {
  try {
    // Get current date and time components
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // For "Client Updates Needed": date 3 days ago
    const threeDaysAgo = new Date(now);
    threeDaysAgo.setDate(now.getDate() - 3);

    // For "Completed This Week": determine start of the week (assuming Sunday is the first day)
    const dayOfWeek = now.getDay(); // 0 (Sunday) to 6 (Saturday)
    const diffToSunday = dayOfWeek; // Number of days to subtract to get to the previous Sunday
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToSunday, 0, 0, 0, 0);

    // 1. Open Tickets Count: Not 'completed', 'billing_completed', 'closed', or 'cancelled'
    const openTicketsCount = await prisma.ticket.count({
      where: {
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
        scheduledDate: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    });

    // 3. Client Updates Needed Count: 'onHold' OR ('inProgress' AND updatedAt < threeDaysAgo)
    const clientUpdatesNeededCount = await prisma.ticket.count({
      where: {
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

    return NextResponse.json({
      openTicketsCount,
      scheduledTodayCount,
      clientUpdatesNeededCount,
      completedThisWeekCount,
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching ticket counts:', error);
    return NextResponse.json({ message: 'Internal server error while fetching ticket counts.' }, { status: 500 });
  }
}
