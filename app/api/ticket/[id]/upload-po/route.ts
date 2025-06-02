// app/api/ticket/[id]/upload-po/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import fs from "fs/promises";
import path from "path";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const ticketId = params.id;

  if (!ticketId) {
    return NextResponse.json(
      { message: "Ticket ID is required" },
      { status: 400 }
    );
  }

  try {
    const data = await req.formData();
    const file: File | null = data.get("poFile") as unknown as File;

    if (!file) {
      return NextResponse.json(
        { message: "PO file is required" },
        { status: 400 }
      );
    }

    // Ensure the ticket and its associated workStage exist
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { workStage: true },
    });

    if (!ticket) {
      return NextResponse.json(
        { message: "Ticket not found" },
        { status: 404 }
      );
    }

    if (!ticket.workStage) {
      return NextResponse.json(
        { message: "WorkStage not found for this ticket" },
        { status: 404 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Define the path for saving the file
    const uploadDir = path.join(process.cwd(), "public", "uploads", "po", ticketId);
    const filePath = path.join(uploadDir, file.name);

    // Create directory if it doesn't exist
    await fs.mkdir(uploadDir, { recursive: true });

    // Save the file
    await fs.writeFile(filePath, buffer);

    // Update the WorkStage record
    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        workStage: {
          update: {
            poFilePath: filePath, // Ensure this field is correctly defined in your schema
            poStatus: true,
          },
        },
      },
      include: { workStage: true },
    });

    return NextResponse.json({
      message: "PO file uploaded successfully",
      filePath,
      ticket: updatedTicket,
    });
  } catch (error: any) {
    console.error("Error uploading PO file:", error);
    let errorMessage = "Failed to upload PO file";
    let statusCode = 500;

    if (error.code === 'P2025') { // Prisma error code for record not found during update
      errorMessage = "Ticket or WorkStage not found during update.";
      statusCode = 404;
    } else if (error instanceof TypeError && error.message.includes("Failed to parse URL")) {
      errorMessage = "Invalid file data in form.";
      statusCode = 400;
    }

    return NextResponse.json(
      { message: errorMessage, error: error.message || String(error) },
      { status: statusCode }
    );
  }
}
