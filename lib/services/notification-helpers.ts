// lib/services/notification-helpers.ts
import { prisma } from "@/lib/prisma";
import type { NotificationType } from "@/lib/services/notification";

interface CreateNotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  ticketId?: string;
  actionUrl?: string;
}

// Server-side function to create notifications directly in database
export async function createNotificationInDB(data: CreateNotificationData) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        ticketId: data.ticketId || null,
        actionUrl: data.actionUrl || null,
      },
      include: {
        ticket: {
          select: {
            id: true,
            title: true,
            ticketId: true,
          },
        },
      },
    });

    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
}

// Create notification for ticket assignment
export async function createTicketAssignmentNotification(
  assigneeId: string,
  ticketId: string,
  ticketTitle: string,
  ticketDisplayId: string,
) {
  return createNotificationInDB({
    userId: assigneeId,
    type: "TICKET_ASSIGNED",
    title: "New Ticket Assigned",
    message: `You have been assigned to ticket "${ticketTitle}" (${ticketDisplayId})`,
    ticketId,
    actionUrl: `/dashboard/ticket/${ticketId}`,
  });
}

// Create notification for ticket status change
export async function createTicketStatusChangeNotification(
  assigneeId: string,
  ticketId: string,
  ticketTitle: string,
  ticketDisplayId: string,
  oldStatus: string,
  newStatus: string,
) {
  return createNotificationInDB({
    userId: assigneeId,
    type: "TICKET_STATUS_CHANGED",
    title: "Ticket Status Updated",
    message: `Ticket "${ticketTitle}" (${ticketDisplayId}) status changed from ${oldStatus} to ${newStatus}`,
    ticketId,
    actionUrl: `/dashboard/ticket/${ticketId}`,
  });
}

// Create notification for new comment
export async function createTicketCommentNotification(
  assigneeId: string,
  ticketId: string,
  ticketTitle: string,
  ticketDisplayId: string,
  commenterName: string,
  commenterId: string,
) {
  // Don't notify the commenter about their own comment
  if (assigneeId === commenterId) {
    return;
  }

  return createNotificationInDB({
    userId: assigneeId,
    type: "TICKET_COMMENTED",
    title: "New Comment on Ticket",
    message: `${commenterName} commented on ticket "${ticketTitle}" (${ticketDisplayId})`,
    ticketId,
    actionUrl: `/dashboard/ticket/${ticketId}`,
  });
}

// Create notification for work stage update
export async function createWorkStageUpdateNotification(
  assigneeId: string,
  ticketId: string,
  ticketTitle: string,
  ticketDisplayId: string,
) {
  return createNotificationInDB({
    userId: assigneeId,
    type: "WORK_STAGE_UPDATED",
    title: "Work Stage Updated",
    message: `Work stage updated for ticket "${ticketTitle}" (${ticketDisplayId})`,
    ticketId,
    actionUrl: `/dashboard/ticket/${ticketId}`,
  });
}

// Create notification for approaching due date
export async function createDueDateApproachingNotification(
  assigneeId: string,
  ticketId: string,
  ticketTitle: string,
  ticketDisplayId: string,
) {
  return createNotificationInDB({
    userId: assigneeId,
    type: "TICKET_DUE_DATE_APPROACHING",
    title: "Ticket Due Date Approaching",
    message: `Ticket "${ticketTitle}" (${ticketDisplayId}) is due soon`,
    ticketId,
    actionUrl: `/dashboard/ticket/${ticketId}`,
  });
}

// Helper function to get ticket assignee info
export async function getTicketAssigneeInfo(ticketId: string) {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: {
      id: true,
      title: true,
      ticketId: true,
      assigneeId: true,
      assignee: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return ticket;
}
