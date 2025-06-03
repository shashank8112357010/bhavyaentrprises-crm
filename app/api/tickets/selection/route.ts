import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

export async function GET(req: NextRequest) {
  try {
    // Optional: Add authentication/authorization if needed
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // You might want to verify the token and check roles, e.g.,
    // const { role } = jwt.verify(token, process.env.JWT_SECRET!) as { role: string };
    // if (role !== 'ADMIN' && role !== 'RM' && role !== 'BACKEND') { // Example roles
    //   return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    // }

    const tickets = await prisma.ticket.findMany({
      select: {
        id: true,       // UUID
        title: true,
        ticketId: true, // Human-readable/sequential ID
      },
      orderBy: {
        createdAt: 'desc', // Or ticketId if it's sortable numerically
      },
    });

    return NextResponse.json(tickets);
  } catch (error) {
    console.error('[GET_TICKETS_FOR_SELECTION_ERROR]', error);
    if (error instanceof jwt.JsonWebTokenError) {
        return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
