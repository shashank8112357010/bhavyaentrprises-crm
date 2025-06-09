// pages/api/tickets/create.ts
import { NextRequest, NextResponse } from "next/server";
import { createTicketSchema } from "@/lib/validations/ticketSchema";
import { prisma } from "@/lib/prisma";
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

    console.log(`Ticket creation (core): ${Date.now() - startTime}ms`);

    // Send response immediately without waiting for notifications/emails
    const response = NextResponse.json({ ticket: { ...result, comments: [] } });

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
          console.log("Notification created successfully");
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
            console.log("Assignment email sent successfully");
          }
        } catch (emailError) {
          console.error("Failed to send assignment email:", emailError);
        }
      });
    }

    console.log(
      `Total ticket creation response time: ${Date.now() - startTime}ms`,
    );
    return response;
  } catch (error: any) {
    console.error("Ticket creation error:", error);
    console.log(`Failed ticket creation time: ${Date.now() - startTime}ms`);

    return NextResponse.json(
      { message: "Failed to create ticket", error: error.message },
      { status: 400 },
    );
  }
}
