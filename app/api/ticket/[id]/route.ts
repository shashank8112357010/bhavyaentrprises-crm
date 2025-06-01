// pages/api/tickets/[id]/update.ts
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "../../../../lib/prisma";
import {
  updateTicketSchema,
  createWorkStageSchema,
  updateTicketStatusSchema,
} from "../../../../lib/validations/ticketSchema";
import { TicketStatus } from "@prisma/client";



export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log("reaching");
    const body = await req.json();
    console.log("reaching");

    if (body.status) {
      const validatedData = updateTicketStatusSchema.parse(body);
      console.log(params);

      const existingTicket = await prisma.ticket.findUnique({
        where: { id: params.id },
        select: { status: true, assigneeId: true },
      });

      console.log(existingTicket, "existingTicket");

      if (!existingTicket) {
        return NextResponse.json(
          { message: "Ticket not found" },
          { status: 404 }
        );
      }
      if (body.holdReason) {
        await prisma.ticket.update({
          where: { id: params.id },
          data: { holdReason: body.holdReason },
        });
      }

      const ticket = await prisma.ticket.update({
        where: { id: params.id },
        data: { status: validatedData.status },
      });

      const wasCompleted = existingTicket.status === TicketStatus.completed;
      const nowCompleted = validatedData.status === TicketStatus.completed;

      if (existingTicket.assigneeId && wasCompleted !== nowCompleted) {
        await prisma.user.update({
          where: { id: existingTicket.assigneeId },
          data: {
            completedTickets: nowCompleted
              ? { increment: 1 }
              : { decrement: 1 },
            activeTickets: nowCompleted ? { decrement: 1 } : { increment: 1 },
          },
        });
      }

      return NextResponse.json({ ticket });
    }
    console.log(body);

    const validatedData = updateTicketSchema.safeParse(body);
    if (validatedData.error) {
      const fieldErrors = validatedData.error.flatten().fieldErrors;
      const firstFieldKey = Object.keys(fieldErrors)[0];
      const firstErrorMessage =
        firstFieldKey &&
        fieldErrors[firstFieldKey as keyof typeof fieldErrors]?.[0];

      return NextResponse.json(
        { message: `${firstFieldKey}: ${firstErrorMessage}` },
        { status: 400 }
      );
    }

    const ticket = await prisma.ticket.update({
      where: { id: params.id },
      data: validatedData.data as any,
    });

    return NextResponse.json({ ticket });
  } catch (error: any) {
    return NextResponse.json(
      { message: "Failed to update ticket", error: error.message },
      { status: 400 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const validatedData = createWorkStageSchema.safeParse(body);

    if (validatedData.error) {
      const fieldErrors = validatedData.error.flatten().fieldErrors;
      const firstFieldKey = Object.keys(fieldErrors)[0];
      const firstErrorMessage =
        firstFieldKey &&
        fieldErrors[firstFieldKey as keyof typeof fieldErrors]?.[0];

      return NextResponse.json(
        { message: `${firstFieldKey}: ${firstErrorMessage}` },
        { status: 400 }
      );
    }

    const workStage = await prisma.workStage.create({
      data: {
        ...validatedData.data,
        ticketId: params.id,
      },
    });

    return NextResponse.json({ workStage });
  } catch (error: any) {
    return NextResponse.json(
      { message: "Failed to add quotation", error: error.message },
      { status: 400 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log(params);
  
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: params.id },
      select: { assigneeId: true, status: true },
    });

    if (!ticket) {
      return NextResponse.json(
        { message: "Ticket not found" },
        { status: 404 }
      );
    }

    // Delete the ticket
    await prisma.ticket.delete({
      where: { id: params.id },
    });

    // Update user stats
    if (ticket.assigneeId) {
      const updates: any = {
        activeTickets: { decrement: 1 },
      };

      if (ticket.status === TicketStatus.completed) {
        updates.completedTickets = { decrement: 1 };
      }

      await prisma.user.update({
        where: { id: ticket.assigneeId },
        data: updates,
      });
    }

    return NextResponse.json({ message: "Ticket deleted successfully" });
  } catch (error: any) {
    return NextResponse.json(
      { message: "Failed to delete ticket", error: error.message },
      { status: 400 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Log the ID to ensure it's correctly captured
    console.log(`Fetching ticket with ID: ${id}`);

    // Fetch the ticket from the database
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        client: true,
        assignee: { // Assuming 'assignee' is the relation field to the User model
          select: { // Select specific fields from User to avoid exposing sensitive data
            id: true,
            name: true,
            email: true, // Optional: include if needed for display
            avatar: true,
            initials: true,
            role: true,
          }
        },
        workStage: true,
        Quotation: true, // Assuming 'Quotation' is the relation field for quotations
        expenses: true,  // Assuming 'expenses' is the relation field for expenses
        comments: {      // Include comments
          orderBy: {
            createdAt: 'asc' // Order comments by creation time
          },
          include: {
            user: { // Include user details for each comment
              select: {
                id: true,
                name: true,
                avatar: true,
                initials: true,
              }
            }
          }
        }
      },
    });

    if (!ticket) {
      console.log(`Ticket with ID ${id} not found`);
      return NextResponse.json(
        { message: "Ticket not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(ticket);
  } catch (error) {
    console.error("Error fetching ticket:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
