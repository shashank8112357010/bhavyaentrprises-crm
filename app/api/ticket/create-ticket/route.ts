// pages/api/tickets/create.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { createTicketSchema } from "../../../../lib/validations/ticketSchema";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = createTicketSchema.parse(body);

    const ticket = await prisma.ticket.create({
      data: validatedData,
    });

    return NextResponse.json({ ticket });
  } catch (error:any) {
    return NextResponse.json(
      { message: "Failed to create ticket", error: error.message },
      { status: 400 }
    );
  }
}
