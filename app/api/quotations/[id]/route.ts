// app/api/quotations/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { quotationSchema } from "@/lib/validations/quotationSchema";
import { z } from "zod";
import path from "path";
import { existsSync, unlinkSync }_DEACTIVATED_ from "fs"; // Deactivated fs for now

// Define a schema for updates (all fields optional for PATCH/PUT)
const updateQuotationSchema = quotationSchema.partial();

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    // TODO: Add auth checks if necessary

    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, name: true, gstn: true, contactPhone: true } }, // Added more client details
        ticket: { select: { id: true, title: true, ticketId: true } }, // Added ticketId
      },
    });

    if (!quotation) {
      return NextResponse.json({ message: "Quotation not found" }, { status: 404 });
    }
    return NextResponse.json(quotation);
  } catch (error: any) {
    console.error("Error fetching quotation:", error);
    return NextResponse.json({ message: "Internal server error", error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    // TODO: Add auth checks (e.g., verify JWT, check role)

    const body = await req.json();
    const parsed = updateQuotationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ message: "Invalid input", errors: parsed.error.flatten() }, { status: 400 });
    }

    const data = parsed.data;

    // Note: Financial recalculation logic would go here if items or discountPercentage change.
    // For this iteration, we assume the frontend sends pre-calculated values.
    // Example:
    // if (data.items || data.discountPercentage !== undefined) {
    //   const subtotal = data.items?.reduce((acc, item) => acc + item.totalValue, 0) || 0;
    //   const discountAmount = (subtotal * (data.discountPercentage || 0)) / 100;
    //   const taxableValue = subtotal - discountAmount;
    //   const igstAmount = taxableValue * 0.18; // Example: 18% IGST
    //   const netGrossAmount = taxableValue + igstAmount;
    //   data.subtotal = subtotal;
    //   data.discountAmount = discountAmount;
    //   data.taxableValue = taxableValue;
    //   data.igstAmount = igstAmount;
    //   data.netGrossAmount = netGrossAmount;
    // }

    // Handle date conversions and null values
    let validUntilDate: Date | null | undefined = undefined;
    if (data.validUntil === null || data.validUntil === "") {
      validUntilDate = null;
    } else if (data.validUntil) {
      validUntilDate = new Date(data.validUntil);
    }


    const updatedQuotation = await prisma.quotation.update({
      where: { id },
      data: {
        ...data,
        validUntil: validUntilDate,
        items: data.items ? data.items as any : undefined, // Prisma expects Json for items
        // Ensure other date fields are handled if they are part of `data` and need conversion
        // For example, if `date` field from schema is part of update:
        // date: data.date ? new Date(data.date) : undefined,
      },
    });

    // Update WorkStage if ticketId or financial details changed
    if (data.ticketId && (data.taxableValue !== undefined || data.netGrossAmount !== undefined)) {
      const ticket = await prisma.ticket.findUnique({
        where: { id: data.ticketId },
        include: { client: true, workStage: true },
      });

      if (ticket) {
        // Fetch current quotation data if only partial financial data is sent
        const currentQuotationForWorkstage = data.taxableValue === undefined || data.netGrossAmount === undefined ?
            await prisma.quotation.findUnique({ where: {id}}) :
            updatedQuotation;

        const workStageData = {
          quoteNo: updatedQuotation.quotationNumber, // Use existing quotationNumber
          quoteTaxable: data.taxableValue ?? currentQuotationForWorkstage?.taxableValue,
          quoteAmount: data.netGrossAmount ?? currentQuotationForWorkstage?.netGrossAmount,
          stateName: ticket.workStage?.stateName || "N/A",
          adminName: ticket.workStage?.adminName || "N/A",
          clientName: ticket.client.name,
          siteName: ticket.workStage?.siteName || "N/A",
          dateReceived: ticket.workStage?.dateReceived || new Date(),
          workStatus: ticket.workStage?.workStatus || "Pending",
          approval: ticket.workStage?.approval || "Pending",
          poStatus: ticket.workStage?.poStatus || false,
          poNumber: ticket.workStage?.poNumber || "N/A",
          jcrStatus: ticket.workStage?.jcrStatus || false,
          agentName: ticket.workStage?.agentName || "N/A",
        };

        if (ticket.workStageId) {
          await prisma.workStage.update({
            where: { id: ticket.workStageId },
            data: workStageData,
          });
        } else {
          // If ticketId was changed to a new ticket that doesn't have a workstage
          const newWorkStage = await prisma.workStage.create({
            data: {
              ...workStageData,
              ticket: { connect: { id: data.ticketId } },
            },
          });
          await prisma.ticket.update({
            where: { id: data.ticketId },
            data: { workStageId: newWorkStage.id },
          });
        }
      }
    }


    return NextResponse.json({ message: "Quotation updated successfully", quotation: updatedQuotation });
  } catch (error: any) {
    console.error("Error updating quotation:", error);
    // ZodError is already caught by parsed.success, but this is a fallback.
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Invalid input for update", errors: error.errors }, { status: 400 });
    }
    return NextResponse.json({ message: "Internal server error", error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    // TODO: Add auth checks

    // Optional: Delete associated PDF file from filesystem
    // const quotation = await prisma.quotation.findUnique({ where: { id }, select: { pdfUrl: true } });
    // if (quotation?.pdfUrl) {
    //   const filePath = path.join(process.cwd(), "public", quotation.pdfUrl);
    //   if (existsSync(filePath) && quotation.pdfUrl.endsWith(".pdf")) { // Basic check
    //     unlinkSync(filePath);
    //   }
    // }

    await prisma.quotation.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Quotation deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting quotation:", error);
    // Handle Prisma errors, e.g., P2025 (Record to delete does not exist)
    if (error.code === 'P2025') {
        return NextResponse.json({ message: "Quotation not found or already deleted" }, { status: 404 });
    }
    return NextResponse.json({ message: "Internal server error", error: error.message }, { status: 500 });
  }
}
