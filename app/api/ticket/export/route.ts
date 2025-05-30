import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import ExcelJS from "exceljs";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const status = url.searchParams.get("status") || undefined;
    const startDateStr = url.searchParams.get("startDate");
    const endDateStr = url.searchParams.get("endDate");

    if (!startDateStr || !endDateStr) {
      return NextResponse.json({ message: "startDate and endDate are required" }, { status: 400 });
    }

    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    const whereConditions: any = {
      AND: [
        {
          OR: [
            {
              scheduledDate: {
                gte: startDate,
                lte: endDate,
              },
            },
            {
              dueDate: {
                gte: startDate,
                lte: endDate,
              },
            },
          ],
        },
      ],
    };

    if (status) {
      whereConditions.AND.push({ status });
    }

    const tickets = await prisma.ticket.findMany({
      where: whereConditions,
      include: {
        assignee: { select: { name: true } },
        client: { select: { name: true } },
      },
    });

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Tickets");

    // Define columns
    worksheet.columns = [
      { header: "ID", key: "id", width: 36 },
      { header: "Title", key: "title", width: 30 },
      { header: "Client", key: "client", width: 25 },
      { header: "Assignee", key: "assignee", width: 25 },
      { header: "Status", key: "status", width: 20 },
      { header: "Scheduled Date", key: "scheduledDate", width: 20 },
      { header: "Due Date", key: "dueDate", width: 20 },
      { header: "Priority", key: "priority", width: 15 },
      { header: "Created At", key: "createdAt", width: 20 },
    ];

    // Add rows
    tickets.forEach((ticket) => {
      worksheet.addRow({
        id: ticket.id,
        title: ticket.title,
        client: ticket.client?.name || "N/A",
        assignee: ticket.assignee?.name || "N/A",
        status: ticket.status,
        scheduledDate: ticket.scheduledDate ? ticket.scheduledDate.toISOString().split("T")[0] : "",
        dueDate: ticket.dueDate ? ticket.dueDate.toISOString().split("T")[0] : "",
        priority: ticket.priority,
        createdAt: ticket.createdAt.toISOString().split("T")[0],
      });
    });

    // Write to buffer
    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="tickets_${status || "all"}_${startDateStr}_${endDateStr}.xlsx"`,
      },
    });
  } catch (error: any) {
    console.error("Export tickets error:", error);
    return NextResponse.json({ message: "Failed to export tickets", error: error.message }, { status: 500 });
  }
}
