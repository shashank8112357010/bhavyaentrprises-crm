// app/api/quotation/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import fs from "fs"; // Keep separate for unlinkSync if needed elsewhere
import path from "path";
import { z } from "zod";
import { generateQuotationPdf } from "@/lib/pdf/generateQuotationHtml";

// Define the schema for rateCardDetails item
const rateCardDetailItemSchema = z.object({
  rateCardId: z.string().uuid(),
  quantity: z.number().min(0),
  gstPercentage: z.number().min(0), // GST percentage (e.g., 18 for 18%)
});

// Define the schema for the quotation update request body
const updateQuotationSchema = z.object({
  name: z.string().optional(),
  clientId: z.string().uuid().optional(),
  rateCardDetails: z.array(rateCardDetailItemSchema).optional(),
  ticketId: z.string().uuid().optional().nullable(), // Allow string UUID, null, or undefined
  grandTotal: z.number().optional(), // Make optional since it's calculated
  gst: z.number().optional(), // Make optional since it's calculated
  subtotal: z.number().optional(), // Make optional since it's calculated
  expectedExpense: z.number().min(0).optional(), // Add expectedExpense field

  // Add other fields that can be updated here
});

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { role } = jwt.verify(token, process.env.JWT_SECRET!) as {
      role: string;
    };
    if (role !== "ADMIN")
      return NextResponse.json(
        { message: "Need Admin Access" },
        { status: 403 },
      );

    const { id } = params;
    const body = await req.json();

    const validation = updateQuotationSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { message: "Invalid request data", errors: validation.error.errors },
        { status: 400 },
      );
    }

    const updateData = validation.data;

    let newSubtotal = 0;
    let newGst = 0;
    let newGrandTotal = 0;

    // If rateCardDetails are being updated, recalculate totals
    if (updateData.rateCardDetails && updateData.rateCardDetails.length > 0) {
      for (const item of updateData.rateCardDetails) {
        const rateCard = await prisma.rateCard.findUnique({
          where: { id: item.rateCardId },
        });
        if (!rateCard) {
          return NextResponse.json(
            { message: `Rate card with ID ${item.rateCardId} not found` },
            { status: 404 },
          );
        }
        const itemSubtotal = rateCard.rate * item.quantity;
        newSubtotal += itemSubtotal;
        newGst += itemSubtotal * (item.gstPercentage / 100);
      }
      newGrandTotal = newSubtotal + newGst;

      // Use provided totals if available, otherwise use calculated ones
      updateData.subtotal = updateData.subtotal ?? newSubtotal;
      updateData.gst = updateData.gst ?? newGst;
      updateData.grandTotal = updateData.grandTotal ?? newGrandTotal;
    } else if (
      updateData.rateCardDetails &&
      updateData.rateCardDetails.length === 0
    ) {
      // Handle case where rateCardDetails is explicitly emptied
      updateData.subtotal = 0;
      updateData.gst = 0;
      updateData.grandTotal = 0;
    } else if (
      updateData.subtotal !== undefined ||
      updateData.gst !== undefined ||
      updateData.grandTotal !== undefined
    ) {
      // If totals are provided without rate card details, use them as is
      // This allows for direct total updates if needed
      newSubtotal = updateData.subtotal ?? 0;
      newGst = updateData.gst ?? 0;
      newGrandTotal = updateData.grandTotal ?? 0;
    }

    // Fetch the existing quotation to compare totals if ticketId exists and to get quoteNo for PDF naming
    const existingQuotationForUpdate = await prisma.quotation.findUnique({
      where: { id },
      // Select all fields needed for PDF generation and ticket due update, and the actual update
      // For simplicity, fetching the whole record if not too large, or specify necessary fields.
      // We need quoteNo for PDF naming.
      include: { client: { select: { name: true } } },
    });

    if (!existingQuotationForUpdate) {
      return NextResponse.json(
        { message: "Quotation not found" },
        { status: 404 },
      );
    }

    const { ticketId, ...restOfUpdateData } = updateData;

    const dataToUpdate: any = { ...restOfUpdateData };

    if (updateData.rateCardDetails) {
      dataToUpdate.rateCardDetails = updateData.rateCardDetails as any;
    }

    // Handle ticketId explicitly:
    // If ticketId is provided in the payload (even if null), include it in the update.
    // If ticketId is undefined in the payload, it means the client doesn't want to change it.
    if (updateData.hasOwnProperty("ticketId")) {
      dataToUpdate.ticketId = ticketId; // This will be null if client sent null, or a string UUID
    }

    // Determine if PDF regeneration is needed and set the new pdfUrl
    // PDF is regenerated if rateCardDetails, name, or other financial details affecting PDF are changed.
    // For simplicity, we regenerate it on any meaningful update that might alter PDF content.
    // The filename will be based on quoteNo.
    const newPdfFilename = `${existingQuotationForUpdate.quoteNo}.pdf`;
    dataToUpdate.pdfUrl = `/quotations/${newPdfFilename}`;

    const updatedQuotation = await prisma.quotation.update({
      where: { id },
      data: dataToUpdate,
      include: { client: { select: { name: true } } }, // Include client name for PDF generation
    });

    // If grandTotal has changed and there's an associated ticket, update ticket.due
    if (
      updateData.grandTotal !== undefined &&
      existingQuotationForUpdate.ticketId &&
      updatedQuotation.grandTotal !== existingQuotationForUpdate.grandTotal
    ) {
      const ticket = await prisma.ticket.findUnique({
        where: { id: existingQuotationForUpdate.ticketId },
        select: { due: true },
      });

      if (ticket?.due !== null && ticket?.due !== undefined) {
        const dueAdjustment =
          updatedQuotation.grandTotal - existingQuotationForUpdate.grandTotal;
        const newTicketDue = Math.max(0, ticket.due + dueAdjustment);

        await prisma.ticket.update({
          where: { id: existingQuotationForUpdate.ticketId },
          data: { due: newTicketDue },
        });
      }
    }

    // Regenerate PDF
    // Prepare fullRateCardsForPdf based on the *updated* quotation's rateCardDetails
    let fullRateCardsForPdf: any[] = [];
    if (
      updatedQuotation.rateCardDetails &&
      Array.isArray(updatedQuotation.rateCardDetails) &&
      updatedQuotation.rateCardDetails.length > 0
    ) {
      const rateCardIds = (
        updatedQuotation.rateCardDetails as Array<{ rateCardId: string }>
      ).map((detail) => detail.rateCardId);
      fullRateCardsForPdf = await prisma.rateCard.findMany({
        where: { id: { in: rateCardIds } },
      });
    }

    const pdfBuffer = await generateQuotationPdf({
      quotationId: updatedQuotation.quoteNo, // Use quoteNo for display in PDF
      clientName: updatedQuotation.client.name, // Client name from included relation
      clientId: updatedQuotation.clientId,
      name: updatedQuotation.name,
      rateCards: fullRateCardsForPdf,
      subtotal: updatedQuotation.subtotal,
      gst: updatedQuotation.gst,
      grandTotal: updatedQuotation.grandTotal,
      rateCardDetails: updatedQuotation.rateCardDetails as any[],
      expectedExpense: updatedQuotation.expectedExpense || 0,
      quoteNo: updatedQuotation.quoteNo,
      validUntil: updatedQuotation.validUntil?.toISOString(),
    });

    const folderPath = path.join(process.cwd(), "public", "quotations");
    if (!existsSync(folderPath)) {
      mkdirSync(folderPath, { recursive: true });
    }
    // newPdfFilename already defined based on quoteNo
    const filePath = path.join(folderPath, newPdfFilename);
    writeFileSync(filePath, pdfBuffer);

    // The updatedQuotation object already has the correct pdfUrl due to the earlier dataToUpdate.pdfUrl assignment

    return NextResponse.json(updatedQuotation);
  } catch (error: any) {
    console.error("[PUT_QUOTATION_ERROR]", error);
    if (error.code === "P2025") {
      // Prisma error code for record not found during update
      return NextResponse.json(
        { message: "Quotation not found or related data missing" },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    // Add role-based access control
    const token = req.cookies.get("token")?.value;
    if (!token)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { role } = jwt.verify(token, process.env.JWT_SECRET!) as {
      role: string;
    };
    if (role !== "ADMIN") {
      return NextResponse.json(
        { message: "Need Admin Access" },
        { status: 403 },
      );
    }

    const { id } = params;
    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: {
        client: true,
        // ticket: true, // Only include if ticket details are needed on the edit page directly
        // Otherwise, ticketId is usually sufficient and ticket details can be fetched separately if needed.
      },
    });

    if (!quotation) {
      return NextResponse.json(
        { message: "Quotation not found" },
        { status: 404 },
      );
    }
    return NextResponse.json(quotation);
  } catch (error) {
    console.error("[GET_QUOTATION_BY_ID_ERROR]", error);
    // if (error instanceof jwt.JsonWebTokenError) { // Uncomment if JWT verification is added
    //     return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    // }
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { role } = jwt.verify(token, process.env.JWT_SECRET!) as {
      role: string;
    };
    if (role !== "ADMIN")
      return NextResponse.json(
        { message: "Need Admin Access" },
        { status: 403 },
      );

    const { id } = params;

    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: { expenses: true, ticket: true },
    });

    if (!quotation) {
      return NextResponse.json(
        { message: "Quotation not found" },
        { status: 404 },
      );
    }

    // Delete PDF file
    const pdfPath = path.join(
      process.cwd(),
      "public",
      quotation?.pdfUrl ? quotation?.pdfUrl : "",
    );
    if (fs.existsSync(pdfPath)) {
      fs.unlinkSync(pdfPath);
    }

    // Delete related expenses
    await prisma.expense.deleteMany({
      where: { quotationId: id },
    });

    // Subtract grandTotal from ticket.due if applicable
    if (quotation.ticketId) {
      const ticket = await prisma.ticket.findUnique({
        where: { id: quotation.ticketId },
        select: { due: true },
      });

      if (ticket?.due != null) {
        const updatedDue = Math.max(ticket.due - quotation.grandTotal, 0);
        await prisma.ticket.update({
          where: { id: quotation.ticketId },
          data: { due: updatedDue },
        });
      }
    }

    // Finally, delete the quotation
    await prisma.quotation.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Quotation and related data deleted successfully",
    });
  } catch (error) {
    console.error("[DELETE_QUOTATION_ERROR]", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
