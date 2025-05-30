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
        client: {
          select: {
            id: true,
            name: true,
            type: true,
            contactPerson: true,
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
        Quotation: {
          select: {
            id: true,
            pdfUrl: true,
            createdAt: true,
          },
        },
      },
    });

    const transformedTickets = tickets.map((ticket: any) => ({
      id: ticket.id,
      title: ticket.title || "N/A",
      client: {
        id: ticket.client.id,
        name: ticket.client.name,
        type: ticket.client.type,
        contactPerson: ticket.client.contactPerson,
      },
      branch: ticket.branch || "N/A",
      priority: ticket.priority || "N/A",
      assignee: ticket.assignee
        ? {
            name: ticket.assignee.name,
            avatar: ticket.assignee.avatar,
            initials: ticket.assignee.initials,
          }
        : { name: "N/A", avatar: "N/A", initials: "N/A" },
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
      expenses: ticket.expenses.length
      ? ticket.expenses.map((expense: any) => ({
          id: expense.id,
          amount: expense.amount,
          category: expense.category,
          createdAt: expense.createdAt,
          attachmentUrl: expense.attachmentUrl,
        }))
      : [],
      due : ticket.due,
      paid : ticket.paid,
      quotations: ticket.Quotation.map((q:any) => ({
        id: q.id,
        fileUrl: q.fileUrl,
        createdAt: q.createdAt,
        version: q.version,
      })),
    }));

    return NextResponse.json({ tickets: transformedTickets });
  } catch (error: any) {
    console.error("Error fetching tickets:", error);
    return NextResponse.json(
      { message: "Failed to fetch tickets", error: error.message },
      { status: 400 }
    );
  }
}
