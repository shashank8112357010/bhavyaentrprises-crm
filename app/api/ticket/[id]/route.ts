import { NextRequest, NextResponse } from "next/server";

import { prismaWithReconnect as prisma } from "@/lib/prisma";
import {
  updateTicketSchema,
  createWorkStageSchema,
  updateTicketStatusSchema,
} from "@/lib/validations/ticketSchema";
import { TicketStatus } from "@prisma/client";
import { createTicketStatusChangeNotification } from "@/lib/services/notification-helpers";

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;


export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
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
      // Will aggregate document links here

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
      const assigneeExists = await prisma.user.findUnique({
        where: { id: validatedData.data.assigneeId },
        select: { id: true, role: true },
      });

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

function toPublicUrl(filePath: string) {
  // Adjust this to match your actual public folder structure
  const publicIndex = filePath.indexOf('/public/');
  if (publicIndex !== -1) {
    return filePath.substring(publicIndex + '/public'.length); // includes the leading slash
  }
  return filePath; // fallback, but ideally never hit
}


export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
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
      return NextResponse.json(
        { message: "Ticket not found" },
        { status: 404 }
      );
    }
  
    // Aggregate all document links
    const documents: Array<{ type: string; label: string; url: string }> = [];
    // Quotation PDFs
    if (Array.isArray(ticket.Quotation)) {
      ticket.Quotation.forEach((q: any, idx: number) => {
        if (q.pdfUrl) {
          documents.push({
            type: "quotation",
            label: `Quotation PDF${ticket.Quotation.length > 1 ? ` #${idx + 1}` : ''}`,
            url: q.pdfUrl,
          });
        }
      });
    }
    // WorkStage PO/JCR files
    if (ticket.workStage) {
      if (ticket.workStage.poFilePath) {
        documents.push({
          type: "po",
          label: "PO Document",
          url: ticket.workStage.poFilePath,
        });
      }
      if (ticket.workStage.jcrFilePath) {
        documents.push({
          type: "jcr",
          label: "JCR Document",
          url: toPublicUrl(ticket.workStage.jcrFilePath),
        });
      }
     
    }
    // Expense PDFs
    if (Array.isArray(ticket.expenses)) {
      ticket.expenses.forEach((expense: any, idx: number) => {
        if (expense.pdfUrl) {
          documents.push({
            type: "expense",
            label: `Expense PDF${ticket.expenses.length > 1 ? ` #${idx + 1}` : ''}`,
            url: expense.pdfUrl,
          });
        } else if (expense.attachmentUrl) {
          documents.push({
            type: "expense",
            label: `Expense Attachment${ticket.expenses.length > 1 ? ` #${idx + 1}` : ''}`,
            url: expense.attachmentUrl,
          });
        }
      });
    }



    // Format the ticket object for frontend consumption
    const formattedTicket = {
      id: ticket.id,
      title: ticket.title || "N/A",
      ticketId: ticket.ticketId || "NA",
      client: ticket.client
        ? {
            id: ticket.client.id || "",
            name: ticket.client.name || "N/A",
            type: ticket.client.type || "N/A",
            contactPerson: ticket.client.contactPerson || "N/A",
            contactEmail : ticket.client.contactEmail,
            contactNumber : ticket.client.contactPhone,
            initials : ticket.client.initials,
            gstn : ticket.client.gstn

          }
        : { id: "", name: "N/A", type: "N/A", contactPerson: "N/A" },
      branch: ticket.branch || "N/A",
      priority: ticket.priority || "N/A",
      assignee: ticket.assignee
        ? {
            id: ticket.assignee.id,
            name: ticket.assignee.name,
            email: ticket.assignee.email,
            avatar: ticket.assignee.avatar,
            initials: ticket.assignee.initials,
            role: ticket.assignee.role,
          }
        : { id: "N/A", name: "N/A", email: "N/A", avatar: "N/A", initials: "N/A", role: "N/A" },
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
      Quotation: Array.isArray(ticket.Quotation)
        ? ticket.Quotation : [],
      dueDate: ticket.dueDate ?? "N/A",
      scheduledDate: ticket.scheduledDate ?? "N/A",
      completedDate: ticket.completedDate ?? "N/A",
      createdAt: ticket.createdAt || "N/A",
      description: ticket.description || "N/A",
      comments: Array.isArray(ticket.comments)
        ? ticket.comments.map((c: any) => ({
            id: c.id,
            content: c.content || "",
            createdAt: c.createdAt,
            user: c.user
              ? {
                  id: c.user.id,
                  name: c.user.name,
                  avatar: c.user.avatar,
                  initials: c.user.initials,
                }
              : null,
          }))
        : [],
      commentsCount: Array.isArray(ticket.comments) ? ticket.comments.length : 0,
      holdReason: ticket.holdReason || "N/A",
      status: ticket.status || "new",
      expenses: Array.isArray(ticket.expenses)
        ? ticket.expenses: [],
      due: ticket.due,
      paid: ticket.paid,
    };

    return NextResponse.json({ ticket: formattedTicket , documents });
  } catch (error) {
    console.error("Error fetching ticket:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
