// pages/api/tickets/create.ts
import { NextRequest, NextResponse } from "next/server";
import { createTicketSchema } from "@/lib/validations/ticketSchema";
import { prismaWithReconnect as prisma } from "@/lib/prisma";
import { createTicketAssignmentNotification } from "@/lib/services/notification-helpers";
import { sendTicketAssignmentEmail } from "@/lib/services/email-notification";

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await req.json();
    const validatedData = createTicketSchema.parse(body);

    // Batch all initial validations and data fetching in parallel
    const [assigneeExists, client, latestTicket] = await Promise.all([
      validatedData.assigneeId
        ? prisma.user.findUnique({ where: { id: validatedData.assigneeId } })
        : Promise.resolve(null),
      prisma.client.findUnique({ where: { id: validatedData.clientId } }),
      prisma.ticket.findFirst({
        orderBy: { createdAt: "desc" },
        select: { ticketId: true }, // Only select what we need
      }),
    ]);

    // Validate assignee if provided
    if (validatedData.assigneeId && !assigneeExists) {
      return NextResponse.json(
        { message: "Assignee not found. Please select a valid assignee." },
        { status: 400 },
      );
    }

    // Validate client
    if (!client) {
      return NextResponse.json(
        { message: "Client not found. Please select a valid client." },
        { status: 400 },
      );
    }

    // Generate ticket ID
    let serial = 1;
    if (latestTicket?.ticketId) {
      const idParts = latestTicket.ticketId.split("-");
      const firstPart = idParts[1];
      const serialMatch = firstPart?.match(/(\d{4})$/);
      if (serialMatch?.[1]) {
        const latestSerial = parseInt(serialMatch[1], 10);
        if (!isNaN(latestSerial)) {
          serial = latestSerial + 1;
        }
      }
    }

    const currentMonth = new Date().toLocaleString("default", {
      month: "short",
    });
    const yearShort = new Date().getFullYear().toString().slice(-2);
    const sanitizedClientName = client.name
      .replace(/\s+/g, "-")
      .replace(/[^\w-]/g, "")
      .toUpperCase();

    const newId = `T-BE${yearShort}${currentMonth}${serial.toString().padStart(4, "0")}-${sanitizedClientName}`;

    // Create ticket and update assignee counters in a transaction for data consistency
    const { comments, ...ticketData } = validatedData;

    const result = await prisma.$transaction(async (prisma) => {
      // Create the ticket
      const ticket = await prisma.ticket.create({
        data: {
          ...ticketData,
          ticketId: newId,
          comments: comments?.length
            ? {
                create: comments.map(
                  (comment: { text: string; userId: string }) => ({
                    text: comment.text,
                    userId: comment.userId,
                  }),
                ),
              }
            : undefined,
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

      // Update assignee counters if assignee exists
      if (ticket.assigneeId) {
        await prisma.user.update({
          where: { id: ticket.assigneeId },
          data: {
            activeTickets: { increment: 1 },
            leadsAssigned: { increment: 1 },
          },
        });
      }

      return ticket;
    });


    // Format the ticket response to match the expected structure
    const formattedTicket = {
      id: result.id,
      title: result.title || "N/A",
      ticketId: result.ticketId || "NA",
      client: {
        id: result.client?.id || "",
        name: result.client?.name || "N/A",
        type: result.client?.type || "N/A",
        contactPerson: result.client?.contactPerson || "N/A",
      },
      branch: result.branch || "N/A",
      priority: result.priority || "N/A",
      assignee: result.assignee
        ? {
            id: result.assignee.id,
            name: result.assignee.name,
            avatar: result.assignee.avatar,
            initials: result.assignee.initials,
          }
        : { id: "N/A", name: "N/A", avatar: "N/A", initials: "N/A" },
      workStage: result.workStage
        ? {
            quoteNo: result.workStage.quoteNo || "N/A",
            quoteTaxable: result.workStage.quoteTaxable ?? "N/A",
            quoteAmount: result.workStage.quoteAmount ?? "N/A",
            dateReceived: result.workStage.dateReceived || "N/A",
            agentName: result.workStage.agentName || "N/A",
            stateName: result.workStage.stateName || "N/A",
            adminName: result.workStage.adminName || "N/A",
            clientName: result.workStage.clientName || "N/A",
            siteName: result.workStage.siteName || "N/A",
            approval: result.workStage.approval || "N/A",
            poStatus: result.workStage.poStatus || false,
            poNumber: result.workStage.poNumber || "N/A",
            jcrStatus: result.workStage.jcrStatus || false,
            poFilePath: result.workStage.poFilePath || "",
            jcrFilePath: result.workStage.jcrFilePath || "",
          }
        : undefined,
      dueDate: result.dueDate ?? "N/A",
      scheduledDate: result.scheduledDate ?? "N/A",
      completedDate: result.completedDate ?? "N/A",
      createdAt: result.createdAt || "N/A",
      description: result.description || "N/A",
      comments: result._count?.comments || 0,
      holdReason: result.holdReason || "N/A",
      status: result.status || "new",
      expenses: result.expenses?.length
        ? result.expenses.map((expense: any) => ({
            id: expense.id,
            amount: expense.amount,
            category: expense.category,
            createdAt: expense.createdAt,
            attachmentUrl: expense.attachmentUrl,
          }))
        : [],
      due: result.due,
      paid: result.paid,
    };

    // Send response immediately without waiting for notifications/emails
    const response = NextResponse.json({ ticket: formattedTicket });

    // Handle notifications and email asynchronously (fire and forget)
    if (result.assigneeId) {
      // Don't await these - let them run in background
      setImmediate(async () => {
        try {
          // Create notification
          await createTicketAssignmentNotification(
            result.assigneeId!,
            result.id,
            result.title,
            result.ticketId,
          );
        } catch (notificationError) {
          console.error(
            "Failed to create assignment notification:",
            notificationError,
          );
        }

        try {
          // Send email notification
          const assignee = await prisma.user.findUnique({
            where: { id: result.assigneeId! },
            select: { name: true, email: true },
          });

          if (assignee?.email) {
            await sendTicketAssignmentEmail(
              assignee.email,
              assignee.name || "Agent",
              result.title,
              result.ticketId,
              client.name,
              validatedData.priority,
              validatedData.dueDate,
            );
          }
        } catch (emailError) {
          console.error("Failed to send assignment email:", emailError);
        }
      });
    }


    return response;
  } catch (error: any) {
    console.error("Ticket creation error:", error);

    return NextResponse.json(
      { message: "Failed to create ticket", error: error.message },
      { status: 400 },
    );
  }
}
