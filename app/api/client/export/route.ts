import { NextResponse } from "next/server";

import ExcelJS from "exceljs";
import { prisma } from "@/lib/prisma";



export async function GET() {
  try {
    const clients = await prisma.client.findMany();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Clients");

    // Define headers
    worksheet.columns = [
      { header: "ID", key: "id", width: 10 },
      { header: "Name", key: "name", width: 20 },
      { header: "Type", key: "type", width: 20 },
      { header: "Total Branches", key: "totalBranches", width: 18 },
      { header: "Contact Person", key: "contactPerson", width: 20 },
      { header: "Contact Email", key: "contactEmail", width: 25 },
      { header: "Contact Phone", key: "contactPhone", width: 18 },
      { header: "Contract Status", key: "contractStatus", width: 15 },
      { header: "Last Service Date", key: "lastServiceDate", width: 20 },
      { header: "Initials", key: "initials", width: 10 },
      { header: "GSTN", key: "gstn", width: 20 },
    ];

    // Populate data rows
    clients.forEach((client) => {
      worksheet.addRow({
        id: client.id,
        name: client.name,
        type: client.type,
        totalBranches: client.totalBranches,
        contactPerson: client.contactPerson,
        contactEmail: client.contactEmail,
        contactPhone: client.contactPhone,
        contractStatus: client.contractStatus,
        lastServiceDate: client.lastServiceDate,
        initials: client.initials,
        gstn: client.gstn,
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Disposition": "attachment; filename=clients.xlsx",
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
  } catch (error) {
    console.error("[CLIENT_EXPORT_ERROR]", error);
    return NextResponse.json({ error: "Failed to export clients" }, { status: 500 });
  }
}
