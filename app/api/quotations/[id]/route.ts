// app/api/quotation/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import fs from "fs";
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
  clientId: z.string().uuid().optional().nullable(), // Allow clientId to be null
  rateCardDetails: z.array(rateCardDetailItemSchema).optional(),
  ticketId: z.string().uuid().optional().nullable(), // Allow string UUID, null, or undefined
  grandTotal: z.number().optional(), // Make optional since it's calculated
  gst: z.number().optional(), // Make optional since it's calculated
  subtotal: z.number().optional(), // Make optional since it's calculated
  expectedExpense: z.number().min(0).optional(), // Add expectedExpense field
  validUntil: z.string().datetime().optional(), // Add validUntil field
  // Add other fields that can be updated here
});

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;
    const body = await req.json();

    const validation = updateQuotationSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { message: "Invalid request data", errors: validation.error.flatten() },
        { status: 400 },
      );
    }

    const updateData = validation.data;
    let newSubtotal = 0;
    let newGst = 0;
    let newGrandTotal = 0;

    // Fetch the existing quotation (minimal data needed for pre-update logic)
    const existingQuotation = await prisma.quotation.findUnique({
      where: { id },
      select: {
        clientId: true,
        quoteNo: true,
        pdfUrl: true,
        grandTotal: true,
        ticketId: true,
        // rateCardDetails are not strictly needed here if they are always recalculated or taken from payload
      },
    });

    if (!existingQuotation) {
      return NextResponse.json(
        { message: "Quotation not found" },
        { status: 404 },
      );
    }

    // If rateCardDetails are being updated, recalculate totals
    if (updateData.rateCardDetails && updateData.rateCardDetails.length > 0) {
      const rateCardIds = updateData.rateCardDetails.map(item => item.rateCardId);
      const uniqueRateCardIds = Array.from(new Set(rateCardIds));

      const fetchedRateCards = await prisma.rateCard.findMany({
        where: { id: { in: uniqueRateCardIds } },
      });

      const rateCardsMap = new Map(fetchedRateCards.map((rc: any) => [rc.id, rc]));

      for (const item of updateData.rateCardDetails) {
        const rateCard = rateCardsMap.get(item.rateCardId) as any;
        if (!rateCard) {
          return NextResponse.json(
            { message: `Rate card with ID ${item.rateCardId} not found in fetched batch.` },
            { status: 404 },
          );
        }
        const itemSubtotal = rateCard.rate * item.quantity;
        newSubtotal += itemSubtotal;
        newGst += itemSubtotal * (item.gstPercentage / 100); // Assuming gstPercentage is like 18 for 18%
      }
      newGrandTotal = newSubtotal + newGst;

      updateData.subtotal = newSubtotal;
      updateData.gst = newGst;
      updateData.grandTotal = newGrandTotal;
    } else if (
      updateData.rateCardDetails &&
      updateData.rateCardDetails.length === 0
    ) {
      updateData.subtotal = 0;
      updateData.gst = 0;
      updateData.grandTotal = 0;
    }
    // If totals are provided directly in payload and no rateCardDetails, those will be used.

    let clientForPdf: Awaited<ReturnType<typeof prisma.client.findUnique>> | null = null;

    // Determine the clientId that will be stored in the database for the quotation.
    // This depends on whether clientId is part of updateData.
    let finalClientIdForDbUpdate: string | null | undefined;

    if (updateData.hasOwnProperty('clientId')) {
        // Frontend explicitly sent clientId (could be an ID string or null)
        finalClientIdForDbUpdate = updateData.clientId;
        if (updateData.clientId) { // If it's an ID string, fetch the client for PDF
            const newClient = await prisma.client.findUnique({ where: { id: updateData.clientId } });
            if (!newClient) {
                return NextResponse.json({ message: `Client with ID ${updateData.clientId} not found` }, { status: 404 });
            }
            clientForPdf = newClient;
        } else { // clientId is null, so no client for PDF from this path
            clientForPdf = null;
        }
    } else {
        // clientId was NOT in updateData, so retain the existing client association
        finalClientIdForDbUpdate = existingQuotation.clientId;
        if (existingQuotation.clientId) { // If there was an existing client, fetch its full details for PDF
            const existingClientFull = await prisma.client.findUnique({ where: { id: existingQuotation.clientId } });
            if (!existingClientFull) {
                return NextResponse.json({ message: `Associated client data is missing.` }, { status: 500 });
            }
            clientForPdf = existingClientFull;
        }
    }

    // Prepare data for Prisma update, excluding fields handled separately or conditionally
    const { clientId, ticketId, ...restOfUpdateData } = updateData;
    const dataToUpdate: any = { ...restOfUpdateData };
    dataToUpdate.clientId = finalClientIdForDbUpdate; // Set the resolved clientId

    if (updateData.rateCardDetails) {
      dataToUpdate.rateCardDetails = updateData.rateCardDetails as any;
    }

    if (updateData.hasOwnProperty("ticketId")) {
      dataToUpdate.ticketId = updateData.ticketId;
    }

    const sanitizedQuoteNo = existingQuotation.quoteNo?.replace(/\//g, "-") || `quotation-${id}`;
    const newPdfFilename = `${sanitizedQuoteNo}.pdf`;
    dataToUpdate.pdfUrl = `/quotations/${newPdfFilename}`;

    const updatedQuotationPrisma = await prisma.quotation.update({
      where: { id },
      data: dataToUpdate,
    });

    // If grandTotal has changed and there's an associated ticket, update ticket.due
    if (
      existingQuotation.ticketId &&
      updatedQuotationPrisma.grandTotal !== existingQuotation.grandTotal
    ) {
      const ticket = await prisma.ticket.findUnique({
        where: { id: existingQuotation.ticketId },
        select: { due: true },
      });

      if (ticket?.due !== null && ticket?.due !== undefined) {
        const dueAdjustment =
          updatedQuotationPrisma.grandTotal - (existingQuotation.grandTotal || 0);
        const newTicketDue = Math.max(0, ticket.due + dueAdjustment);

        await prisma.ticket.update({
          where: { id: existingQuotation.ticketId },
          data: { due: newTicketDue },
        });
      }
    }

    // Regenerate PDF
    let fullRateCardsForPdf: any[] = [];
    if (
      updatedQuotationPrisma.rateCardDetails &&
      Array.isArray(updatedQuotationPrisma.rateCardDetails) &&
      updatedQuotationPrisma.rateCardDetails.length > 0
    ) {
      const rateCardIds = (
        updatedQuotationPrisma.rateCardDetails as Array<{ rateCardId: string }>
      ).map((detail) => detail.rateCardId);
      fullRateCardsForPdf = await prisma.rateCard.findMany({
        where: { id: { in: rateCardIds } },
      });
    }
    
    const pdfBuffer = await generateQuotationPdf({
      quotationId: updatedQuotationPrisma.quoteNo,
      client: clientForPdf, // Use the fully fetched client object (or null)
      name: updatedQuotationPrisma.name, // This is quotation name
      rateCards: fullRateCardsForPdf,
      subtotal: updatedQuotationPrisma.subtotal,
      gst: updatedQuotationPrisma.gst,
      grandTotal: updatedQuotationPrisma.grandTotal,
      rateCardDetails: updatedQuotationPrisma.rateCardDetails as any[],
      expectedExpense: updatedQuotationPrisma.expectedExpense || 0,
      quoteNo: updatedQuotationPrisma.quoteNo,
      validUntil: updatedQuotationPrisma.validUntil?.toISOString(),
    });

    const folderPath = path.join(process.cwd(), "public", "quotations");
    if (!existsSync(folderPath)) {
      mkdirSync(folderPath, { recursive: true });
    }

    if (existingQuotation.pdfUrl && existingQuotation.pdfUrl !== dataToUpdate.pdfUrl) {
      const oldPdfPath = path.join(process.cwd(), "public", existingQuotation.pdfUrl);
      if (fs.existsSync(oldPdfPath)) {
        try { fs.unlinkSync(oldPdfPath); } catch (deleteError) { /* Ignore deletion errors */ }
      }
    }

    const filePath = path.join(folderPath, newPdfFilename);
    writeFileSync(filePath, pdfBuffer);

    const responseQuotation = {
        ...updatedQuotationPrisma,
        client: clientForPdf // Add the client data to the response
    };

    return NextResponse.json(responseQuotation);
  } catch (error: any) {
    if (error.code === "P2025") {
      return NextResponse.json( { message: "Quotation not found or related data missing" }, { status: 404 });
    }
    // Add more specific error handling if needed
    return NextResponse.json( { message: "Internal server error", errorDetails: error.message }, { status: 500 });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {

    const { id } = params;
    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: {
        client: true,
        // Only include relation fields here. rateCardDetails is a scalar (JSON) field and should not be included.
        // ticket: true, // Uncomment if ticket details are needed
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
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
