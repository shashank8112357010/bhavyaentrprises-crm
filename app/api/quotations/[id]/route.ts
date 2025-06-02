// app/api/quotation/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";
import { quotationSchema } from "@/lib/validations/quotationSchema";
import { QuotationStatus } from "@prisma/client"; // Ensure QuotationStatus is imported

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET!) as { role: string };
    if (decodedToken.role !== "ADMIN") {
      return NextResponse.json({ message: "Need Admin Access to update quotations" }, { status: 403 });
    }

    const { id } = params;

    const existingQuotation = await prisma.quotation.findUnique({
      where: { id },
    });

    if (!existingQuotation) {
      return NextResponse.json({ message: "Quotation not found" }, { status: 404 });
    }

    const body = await req.json();
    const validation = quotationSchema.partial().safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.format() }, { status: 400 });
    }

    const updateData: any = { ...validation.data }; // Use 'any' for flexibility, or define a specific update type

    // Handle PDF Regeneration & Recalculate Totals
    let pdfUrlNeedsUpdate = false;

    if (updateData.rateCardDetails) {
      // Only recalculate and update PDF if rateCardDetails actually changed
      if (JSON.stringify(updateData.rateCardDetails) !== JSON.stringify(existingQuotation.rateCardDetails)) {
        pdfUrlNeedsUpdate = true;
        updateData.pdfUrl = `/temp/updated_quotation_${id}.pdf`; // New placeholder PDF URL

        let subtotal = 0;
        let gst = 0;
        for (const item of updateData.rateCardDetails) {
          const rateCardItem = await prisma.rateCard.findUnique({
            where: { id: item.rateCardId },
          });

          if (!rateCardItem) {
            return NextResponse.json(
              { error: `RateCard with id ${item.rateCardId} not found for recalculation` },
              { status: 400 }
            );
          }
          const itemTotal = item.quantity * rateCardItem.rate;
          subtotal += itemTotal;
          const itemGst = itemTotal * (item.gstType / 100); // gstType is percentage e.g. 18
          gst += itemGst;
        }
        updateData.subtotal = subtotal;
        updateData.gst = gst;
        updateData.grandTotal = subtotal + gst;
      }
      // Prisma expects JsonValue for Json fields, ensure it's correctly typed
      updateData.rateCardDetails = updateData.rateCardDetails as any;
    } else if (updateData.rateCardDetails === null) { // Handling explicit null to clear details
        pdfUrlNeedsUpdate = true;
        updateData.pdfUrl = `/temp/updated_quotation_${id}_cleared.pdf`;
        updateData.subtotal = 0;
        updateData.gst = 0;
        updateData.grandTotal = 0;
        updateData.rateCardDetails =  prisma.JsonNull; // Use Prisma.JsonNull to clear JSON field
    }


    // Adjust ticket.due if grandTotal changed
    if (updateData.grandTotal !== undefined && updateData.grandTotal !== existingQuotation.grandTotal && existingQuotation.ticketId) {
      const ticket = await prisma.ticket.findUnique({
        where: { id: existingQuotation.ticketId },
        select: { due: true },
      });

      if (ticket?.due != null) {
        const dueChange = updateData.grandTotal - existingQuotation.grandTotal;
        const updatedDue = Math.max(ticket.due + dueChange, 0);
        await prisma.ticket.update({
          where: { id: existingQuotation.ticketId },
          data: { due: updatedDue },
        });
      }
    }

    // If other PDF-critical fields change (e.g. client, name), you might want to set pdfUrlNeedsUpdate = true
    // For example: if (updateData.clientId && updateData.clientId !== existingQuotation.clientId) pdfUrlNeedsUpdate = true;
    // if (pdfUrlNeedsUpdate && !updateData.pdfUrl) { // If not already set by rateCardDetails change
    //   updateData.pdfUrl = `/temp/updated_quotation_${id}_generic.pdf`;
    // }


    const updatedQuotation = await prisma.quotation.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updatedQuotation, { status: 200 });
  } catch (error: any) {
    console.error("[PUT_QUOTATION_ERROR]", error);
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        return NextResponse.json({ message: "Invalid or expired token" }, { status: 401 });
    }
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}


export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET!) as { role: string };
    if (decodedToken.role !== "ADMIN") {
        return NextResponse.json({ message: "Need Admin Access to delete quotations" }, { status: 403 });
    }

    const { id } = params;

    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: { expenses: true, ticket: true }, // Include relations for cleanup
    });

    if (!quotation) {
      return NextResponse.json({ message: "Quotation not found" }, { status: 404 });
    }

    // Delete PDF file from filesystem
    if (quotation.pdfUrl) { // Check if pdfUrl is not null or empty
        const pdfPath = path.join(process.cwd(), "public", quotation.pdfUrl);
        // Check if file exists before attempting to delete
        if (fs.existsSync(pdfPath)) {
            try {
                fs.unlinkSync(pdfPath);
            } catch (fileError) {
                console.error("[DELETE_PDF_FILE_ERROR]", fileError);
                // Optionally, decide if this error should halt the process or just be logged
            }
        }
    }


    // Delete related expenses
    await prisma.expense.deleteMany({
      where: { quotationId: id },
    });

    // Subtract grandTotal from ticket.due if applicable
    if (quotation.ticketId && quotation.grandTotal > 0) { // only adjust if there was a grand total
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

    return NextResponse.json({ message: "Quotation and related data deleted successfully" });
  } catch (error: any) {
    console.error("[DELETE_QUOTATION_ERROR]", error);
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        return NextResponse.json({ message: "Invalid or expired token" }, { status: 401 });
    }
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
