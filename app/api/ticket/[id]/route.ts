import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  updateTicketSchema,
  createWorkStageSchema,
  updateTicketStatusSchema,
} from "@/lib/validations/ticketSchema";
import { TicketStatus } from "@prisma/client";
import { createTicketStatusChangeNotification } from "@/lib/services/notification-helpers";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();

    console.log(body , "Request body for ticket update");
    

    // Handle status updates
    if (body.status) {
      const validatedData = updateTicketStatusSchema.parse(body);

      const existingTicket = await prisma.ticket.findUnique({
        where: { id: params.id },
        select: { status: true, assigneeId: true, title: true, ticketId: true },
      });

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

      if (
        existingTicket.assigneeId &&
        existingTicket.status !== validatedData.status
      ) {
        try {
          await createTicketStatusChangeNotification(
            existingTicket.assigneeId,
            params.id,
            existingTicket.title || "Unknown Ticket",
            existingTicket.ticketId || "Unknown ID",
            existingTicket.status,
            validatedData.status
          );
        } catch (notificationError) {
          console.error(
            "Failed to create status change notification:",
            notificationError
          );
        }
      }

      return NextResponse.json({ ticket });
    }

    // Handle non-status updates
    const validatedData = updateTicketSchema.safeParse(body);
    console.log(validatedData , "validatedData");
    
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

    // ✅ Fix: Only validate if a non-empty assigneeId exists
    if (
      validatedData.data.assigneeId &&
      validatedData.data.assigneeId.trim() !== ""
    ) {
      console.log( validatedData.data , "reaching here to validate assigneeId");
      
      const assigneeExists = await prisma.user.findUnique({
        where: { id: validatedData.data.assigneeId },
        select: { id: true, role: true },
      });

      console.log(assigneeExists , "Assignee exists check");
      
      if (!assigneeExists) {
        return NextResponse.json(
          { message: "Assignee not found. Please select a valid assignee." },
          { status: 400 }
        );
      }

      const validRoles = ["ADMIN", "BACKEND", "RM", "MST", "ACCOUNTS"];
      if (!validRoles.includes(assigneeExists.role)) {
        return NextResponse.json(
          {
            message: "Selected user cannot be assigned to tickets.",
          },
          { status: 400 }
        );
      }
    }

    const ticket = await prisma.ticket.update({
      where: { id: params.id },
      data: {
        ...validatedData.data,
        ...(body.approvedByAccountant && {
          approvedByAccountant: body.approvedByAccountant,
        }),
        ...(body.approvalNote && { approvalNote: body.approvalNote }),
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            avatar: true,
            initials: true,
          },
        },
        client: {
          select: {
            id: true,
            name: true,
            type: true,
            contactPerson: true,
          },
        },
        workStage: {
          select: {
            quoteNo: true,
            quoteTaxable: true,
            quoteAmount: true,
            dateReceived: true,
            agentName: true,
            stateName: true,
            adminName: true,
            clientName: true,
            siteName: true,
            approval: true,
            poStatus: true,
            poNumber: true,
            jcrStatus: true,
            poFilePath: true,
            jcrFilePath: true,
          },
        },
        expenses: {
          select: {
            id: true,
            amount: true,
            category: true,
            createdAt: true,
            pdfUrl: true,
          },
        },
        _count: {
          select: { comments: true },
        },
      },
    });

    const formattedTicket = {
      id: ticket.id,
      title: ticket.title || "N/A",
      ticketId: ticket.ticketId || "NA",
      client: {
        id: ticket.client?.id || "",
        name: ticket.client?.name || "N/A",
        type: ticket.client?.type || "N/A",
        contactPerson: ticket.client?.contactPerson || "N/A",
      },
      branch: ticket.branch || "N/A",
      priority: ticket.priority || "N/A",
      assignee: ticket.assignee
        ? {
            id: ticket.assignee.id,
            name: ticket.assignee.name,
            avatar: ticket.assignee.avatar,
            initials: ticket.assignee.initials,
          }
        : { id: "N/A", name: "N/A", avatar: "N/A", initials: "N/A" },
      workStage: ticket.workStage
        ? {
            quoteNo: ticket.workStage.quoteNo || "N/A",
            quoteTaxable: ticket.workStage.quoteTaxable ?? "N/A",
            quoteAmount: ticket.workStage.quoteAmount ?? "N/A",
            dateReceived: ticket.workStage.dateReceived || "N/A",
            agentName: ticket.workStage.agentName || "N/A",
            stateName: ticket.workStage.stateName || "N/A",
            adminName: ticket.workStage.adminName || "N/A",
            clientName: ticket.workStage.clientName || "N/A",
            siteName: ticket.workStage.siteName || "N/A",
            approval: ticket.workStage.approval || "N/A",
            poStatus: ticket.workStage.poStatus || false,
            poNumber: ticket.workStage.poNumber || "N/A",
            jcrStatus: ticket.workStage.jcrStatus || false,
            poFilePath: ticket.workStage.poFilePath || "",
            jcrFilePath: ticket.workStage.jcrFilePath || "",
          }
        : undefined,
      dueDate: ticket.dueDate ?? "N/A",
      scheduledDate: ticket.scheduledDate ?? "N/A",
      completedDate: ticket.completedDate ?? "N/A",
      createdAt: ticket.createdAt || "N/A",
      description: ticket.description || "N/A",
      comments: ticket._count?.comments || 0,
      holdReason: ticket.holdReason || "N/A",
      status: ticket.status || "new",
      expenses: ticket.expenses?.length
        ? ticket.expenses.map((expense: any) => ({
            id: expense.id,
            amount: expense.amount,
            category: expense.category,
            createdAt: expense.createdAt,
            attachmentUrl: expense.attachmentUrl,
          }))
        : [],
      due: ticket.due,
      paid: ticket.paid,
    };

    return NextResponse.json({ ticket: formattedTicket });
  } catch (error: any) {
    return NextResponse.json(
      { message: "Failed to update ticket", error: error.message },
      { status: 400 }
    );
  }
}


export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
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
        { status: 400 },
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
      { status: 400 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
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
        { status: 404 },
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
      { status: 400 },
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
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
        assignee: {
          // Assuming 'assignee' is the relation field to the User model
          select: {
            // Select specific fields from User to avoid exposing sensitive data
            id: true,
            name: true,
            email: true, // Optional: include if needed for display
            avatar: true,
            initials: true,
            role: true,
          },
        },
        workStage: true,
        Quotation: true, // Assuming 'Quotation' is the relation field for quotations
        expenses: true, // Assuming 'expenses' is the relation field for expenses
        comments: {
          // Include comments
          orderBy: {
            createdAt: "asc", // Order comments by creation time
          },
          include: {
            user: {
              // Include user details for each comment
              select: {
                id: true,
                name: true,
                avatar: true,
                initials: true,
              },
            },
          },
        },
      },
    });

    if (!ticket) {
      console.log(`Ticket with ID ${id} not found`);
      return NextResponse.json(
        { message: "Ticket not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(ticket);
  } catch (error) {
    console.error("Error fetching ticket:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
