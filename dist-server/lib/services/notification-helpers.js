"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNotificationInDB = createNotificationInDB;
exports.createTicketAssignmentNotification = createTicketAssignmentNotification;
exports.createTicketStatusChangeNotification = createTicketStatusChangeNotification;
exports.createTicketCommentNotification = createTicketCommentNotification;
exports.createWorkStageUpdateNotification = createWorkStageUpdateNotification;
exports.createDueDateApproachingNotification = createDueDateApproachingNotification;
exports.getTicketAssigneeInfo = getTicketAssigneeInfo;
// lib/services/notification-helpers.ts
const prisma_1 = require("@/lib/prisma");
// Server-side function to create notifications directly in database
async function createNotificationInDB(data) {
    try {
        const notification = await prisma_1.prisma.notification.create({
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
    }
    catch (error) {
        console.error("Error creating notification:", error);
        throw error;
    }
}
// Create notification for ticket assignment
async function createTicketAssignmentNotification(assigneeId, ticketId, ticketTitle, ticketDisplayId) {
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
async function createTicketStatusChangeNotification(assigneeId, ticketId, ticketTitle, ticketDisplayId, oldStatus, newStatus) {
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
async function createTicketCommentNotification(assigneeId, ticketId, ticketTitle, ticketDisplayId, commenterName, commenterId) {
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
async function createWorkStageUpdateNotification(assigneeId, ticketId, ticketTitle, ticketDisplayId) {
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
async function createDueDateApproachingNotification(assigneeId, ticketId, ticketTitle, ticketDisplayId) {
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
async function getTicketAssigneeInfo(ticketId) {
    const ticket = await prisma_1.prisma.ticket.findUnique({
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
