import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

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
    // and end of the week (which is 'now' for "this week so far")
    const dayOfWeek = now.getDay(); // 0 (Sunday) to 6 (Saturday)
    const diffToSunday = dayOfWeek; // Number of days to subtract to get to the previous Sunday
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToSunday, 0, 0, 0, 0);


    // 1. Open Tickets Count: Not 'completed' or 'billing_completed'
    const openTicketsCount = await prisma.ticket.count({
      where: {
        NOT: {
          status: {
            in: ['completed', 'billing_completed', 'closed', 'cancelled'], // Added closed & cancelled as not "open"
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
        // Optionally, filter out completed/cancelled tickets if they shouldn't be counted
        // NOT: {
        //   status: { in: ['completed', 'billing_completed', 'closed', 'cancelled'] }
        // }
      },
    });

    // 3. Client Updates Needed Count: 'onHold' OR ('inProgress' AND updatedAt < threeDaysAgo)
    const clientUpdatesNeededCount = await prisma.ticket.count({
      where: {
        OR: [
          { status: 'onHold' },
          {
            status: 'inProgress',
            updatedAt: {
              lt: threeDaysAgo,
            },
          },
        ],
      },
    });

    // 4. Completed This Week Count: 'completed' or 'billing_completed' AND completedDate is this week
    const completedThisWeekCount = await prisma.ticket.count({
      where: {
        status: {
          in: ['completed', 'billing_completed'],
        },
        completedDate: {
          gte: startOfWeek,
          lte: now, // up to the current moment this week
        },
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
