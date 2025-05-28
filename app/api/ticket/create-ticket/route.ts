// pages/api/tickets/create.ts
import { NextRequest, NextResponse } from "next/server";
import { createTicketSchema } from "@/lib/validations/ticketSchema";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = createTicketSchema.parse(body);

    const ticket = await prisma.ticket.create({
      data: validatedData,
    });

    // Increment counters on the assignee (agent)
    if (ticket.assigneeId) {
      await prisma.user.update({
        where: { id: ticket.assigneeId },
        data: {
          activeTickets: { increment: 1 },
          leadsAssigned: { increment: 1 },
        },
      });
    }

    return NextResponse.json({ ticket });
  } catch (error: any) {
    return NextResponse.json(
      { message: "Failed to create ticket", error: error.message },
      { status: 400 }
    );
  }
}
