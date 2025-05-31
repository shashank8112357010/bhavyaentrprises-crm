// pages/api/tickets/create.ts
import { NextRequest, NextResponse } from "next/server";
import { createTicketSchema } from "@/lib/validations/ticketSchema";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = createTicketSchema.parse(body);

    // Fetch the latest ticket to determine the next serial number
    const latestTicket = await prisma.ticket.findFirst({
      orderBy: { createdAt: "desc" },
    });

    // Extract the client name
    const client = await prisma.client.findUnique({
      where: { id: validatedData.clientId },
    });

    if (!client) {
      throw new Error("Client not found");
    }

    // Generate the new ticket ID
    const currentMonth = new Date().toLocaleString('default', { month: 'short' });
    const yearShort = new Date().getFullYear().toString().substring(2);

    let serial = 1; // Default serial number if no tickets exist

    if (latestTicket) {
      // Extract the serial number from the latest ticket ID
      const latestIdParts = latestTicket.id.split('/');
      if (latestIdParts.length > 1) {
        const latestSerial = parseInt(latestIdParts[1]);
        if (!isNaN(latestSerial)) {
          serial = latestSerial + 1;
        }
      }
    }

    const newId = `BE-${currentMonth}-${yearShort}/${serial.toString().padStart(4, "0")}/${client.name}`;

    // Create the ticket with the generated ID
    const ticket = await prisma.ticket.create({
      data: {
        ...validatedData,
        id: newId,
      },
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
