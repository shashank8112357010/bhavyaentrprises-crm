import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const tickets = await prisma.ticket.findMany({
      include: {
        assignee: {
          select: {
            name: true,
            avatar: true,
            initials: true,
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
          },
        },
      },
    });

    const transformedTickets = tickets.map((ticket) => ({
      id: ticket.id,
      title: ticket.title || "N/A",
      client: ticket.clientId || "N/A",
      branch: ticket.branch || "N/A",
      priority: ticket.priority || "N/A",
      assignee: ticket.assignee
        ? {
            name: ticket.assignee.name || "N/A",
            avatar: ticket.assignee.avatar || "N/A",
            initials: ticket.assignee.initials || "N/A",
          }
        : {
            name: "N/A",
            avatar: "N/A",
            initials: "N/A",
          },
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
            poStatus: ticket.workStage.poStatus || "N/A",
            poNumber: ticket.workStage.poNumber || "N/A",
            jcrStatus: ticket.workStage.jcrStatus || "N/A",
          }
        : undefined,
      dueDate: ticket.dueDate ?? "N/A",
      scheduledDate: ticket.scheduledDate ?? "N/A",
      completedDate: ticket.completedDate ?? "N/A",
      createdAt: ticket.createdAt || "N/A",
      description: ticket.description || "N/A",
      comments: ticket.comments ?? 0,
      holdReason: ticket.holdReason || "N/A",
      status: ticket.status || "N/A",
    }));

    return NextResponse.json({ tickets: transformedTickets });
  } catch (error: any) {
    return NextResponse.json(
      { message: "Failed to fetch tickets", error: error.message },
      { status: 400 }
    );
  }
}
