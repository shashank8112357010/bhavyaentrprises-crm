// pages/api/tickets/create.ts
import { NextRequest, NextResponse } from "next/server";
import { createTicketSchema } from "@/lib/validations/ticketSchema";
import { prisma } from "@/lib/prisma";


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



    let serial = 1; // Default serial number if no tickets exist

    if (latestTicket && latestTicket.ticketId) {
      const idParts = latestTicket.ticketId.split("-");
      const firstPart = idParts[0]; // Should be something like BE25May0001
      const serialMatch = firstPart.match(/(\d{4})$/); // Matches the last 4 digits in the first part
      if (serialMatch && serialMatch[1]) {
        const latestSerial = parseInt(serialMatch[1]);
        if (!isNaN(latestSerial)) {
          serial = latestSerial + 1;
        }
      }
    }

    const currentMonth = new Date().toLocaleString("default", { month: "short" }); // e.g., "May"
    const yearShort = new Date().getFullYear().toString().slice(-2); // e.g., "25"
    const sanitizedClientName = client.name.replace(/\s+/g, "-").replace(/[^\w-]/g, "").toUpperCase();
    const newId = `BE${yearShort}${currentMonth}${serial.toString().padStart(4, "0")}-${sanitizedClientName}`;
    console.log(newId);
    
    

    // Create the ticket with the generated ID
    const { comments, ...rest } = validatedData;

    const ticket = await prisma.ticket.create({
      data: {
        ...rest,
        ticketId: newId,
        comments: comments?.length ? {
          create: comments.map((comment: { text: string; userId: string }) => ({
            text: comment.text,
            userId: comment.userId,
          })),
        } : undefined,
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
