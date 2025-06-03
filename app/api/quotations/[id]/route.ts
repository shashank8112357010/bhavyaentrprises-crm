// app/api/quotation/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";
import { z } from "zod";

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
  // Add other fields that can be updated here
});

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { role } = jwt.verify(token, process.env.JWT_SECRET!) as { role: string };
    if (role !== "ADMIN") return NextResponse.json({ message: "Need Admin Access" }, { status: 403 });

    const { id } = params;
    const body = await req.json();

    const validation = updateQuotationSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ message: "Invalid request data", errors: validation.error.errors }, { status: 400 });
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
          return NextResponse.json({ message: `Rate card with ID ${item.rateCardId} not found` }, { status: 404 });
        }
        const itemSubtotal = rateCard.rate * item.quantity;
        newSubtotal += itemSubtotal;
        newGst += itemSubtotal * (item.gstPercentage / 100);
      }
      newGrandTotal = newSubtotal + newGst;

      // Add calculated totals to the data to be updated
      updateData.subtotal = newSubtotal;
      updateData.gst = newGst;
      updateData.grandTotal = newGrandTotal;
    } else if (updateData.rateCardDetails && updateData.rateCardDetails.length === 0) {
      // Handle case where rateCardDetails is explicitly emptied
      updateData.subtotal = 0;
      updateData.gst = 0;
      updateData.grandTotal = 0;
    }


    // Fetch the existing quotation to compare totals if ticketId exists
    const existingQuotation = await prisma.quotation.findUnique({
      where: { id },
      select: { grandTotal: true, ticketId: true }
    });

    if (!existingQuotation) {
      return NextResponse.json({ message: "Quotation not found" }, { status: 404 });
    }

    const updatedQuotation = await prisma.quotation.update({
      where: { id },
      data: {
        ...updateData,
        ...(updateData.rateCardDetails && { rateCardDetails: updateData.rateCardDetails as any }), // Prisma needs 'any' for Json field
      },
    });

    // If grandTotal has changed and there's an associated ticket, update ticket.due
    if (updateData.grandTotal !== undefined && existingQuotation.ticketId && updatedQuotation.grandTotal !== existingQuotation.grandTotal) {
      const ticket = await prisma.ticket.findUnique({
        where: { id: existingQuotation.ticketId },
        select: { due: true }
      });

      if (ticket?.due !== null && ticket?.due !== undefined) {
        // Adjust due amount: old due - old grandTotal + new grandTotal
        const dueAdjustment = updatedQuotation.grandTotal - existingQuotation.grandTotal;
        const newTicketDue = Math.max(0, ticket.due + dueAdjustment);

        await prisma.ticket.update({
          where: { id: existingQuotation.ticketId },
          data: { due: newTicketDue }
        });
      }
    }

    return NextResponse.json(updatedQuotation);
  } catch (error) {
    console.error("[PUT_QUOTATION_ERROR]", error);
    if (error.code === 'P2025') { // Prisma error code for record not found during update
        return NextResponse.json({ message: "Quotation not found or related data missing" }, { status: 404 });
    }
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}


export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { role } = jwt.verify(token, process.env.JWT_SECRET!) as { role: string };
    if (role !== "ADMIN") return NextResponse.json({ message: "Need Admin Access" }, { status: 403 });

    const { id } = params;

    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: { expenses: true, ticket: true },
    });

    if (!quotation) {
      return NextResponse.json({ message: "Quotation not found" }, { status: 404 });
    }

    // Delete PDF file
    const pdfPath = path.join(process.cwd(), "public", quotation.pdfUrl);
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

    return NextResponse.json({ message: "Quotation and related data deleted successfully" });
  } catch (error) {
    console.error("[DELETE_QUOTATION_ERROR]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
