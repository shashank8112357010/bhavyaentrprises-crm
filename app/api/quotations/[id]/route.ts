// app/api/quotation/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prismaWithReconnect as prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import fs from "fs";
import path from "path";
import { z } from "zod";
import { generateQuotationPdf } from "@/lib/pdf/generateQuotationHtml";

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;


// Define the schema for rateCardDetails item
const rateCardDetailItemSchema = z.object({
  rateCardId: z.string(),
  quantity: z.coerce.number().min(1), // Accept string or number
  gstPercentage: z.coerce.number().min(0).max(100), // Accept string or number
  totalValue: z.coerce.number().optional(), // Accept string or number
  srNo: z.coerce.number(), // Accept string or number
  description: z.string(),
  unit: z.string(),
  rate: z.coerce.number(), // Accept string or number
  bankName: z.string(),


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
  validUntil: z.union([z.string(), z.null()]).optional(), // Allow string, null, or undefined

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

    // Sanitize incoming data for robust backend validation
    if (typeof body.validUntil === 'string' && body.validUntil.trim() === '') {
      body.validUntil = null;
    }
    // Coerce number fields in root
    if (typeof body.subtotal === 'string') body.subtotal = Number(body.subtotal);
    if (typeof body.gst === 'string') body.gst = Number(body.gst);
    if (typeof body.grandTotal === 'string') body.grandTotal = Number(body.grandTotal);
    if (typeof body.expectedExpense === 'string') body.expectedExpense = Number(body.expectedExpense);
    // Coerce number fields in rateCardDetails
    if (Array.isArray(body.rateCardDetails)) {
      body.rateCardDetails = body.rateCardDetails.map((item:any) => ({
        ...item,
        quantity: typeof item.quantity === 'string' ? Number(item.quantity) : item.quantity,
        gstPercentage: typeof item.gstPercentage === 'string' ? Number(item.gstPercentage) : item.gstPercentage,
        totalValue: typeof item.totalValue === 'string' ? Number(item.totalValue) : item.totalValue,
        srNo: typeof item.srNo === 'string' ? Number(item.srNo) : item.srNo,
        rate: typeof item.rate === 'string' ? Number(item.rate) : item.rate,
      }));
    }
    const updateData = validation.data;
    // Ensure Prisma never receives an empty string for validUntil
    if (updateData.validUntil === "") {
      updateData.validUntil = null;
    }


    // Fetch the existing quotation (minimal data needed for pre-update logic)
    const existingQuotation = await prisma.quotation.findUnique({
      where: { id },
      select: {
        clientId: true,
        quoteNo: true,
        pdfUrl: true,
        grandTotal: true,
        ticketId: true,

      },
    });

    if (!existingQuotation) {
      return NextResponse.json(
        { message: "Quotation not found" },
        { status: 404 },
      );
    }


    // Otherwise, trust frontend payload for all totals and rateCardDetails fields (including description, unit, rate, etc)

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
                console.error(`Data integrity issue: Client ID ${existingQuotation.clientId} on quotation ${id} not found.`);
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

    // Respond immediately after DB update
    const responseQuotation = {
        ...updatedQuotationPrisma,
        client: clientForPdf // Add the client data to the response
    };

    // PDF generation and file write in background (non-blocking)
    (async () => {
      try {
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
            try { fs.unlinkSync(oldPdfPath); } catch (deleteError) { console.warn("Could not delete old PDF file:", deleteError); }
          }
        }
        const filePath = path.join(folderPath, newPdfFilename);
        writeFileSync(filePath, pdfBuffer);
      } catch (pdfError) {
        console.error("PDF generation or file write failed (background):", pdfError);
      }
    })();

    return NextResponse.json(responseQuotation);
  } catch (error: any) {
    console.error("[PUT_QUOTATION_ERROR]", error);
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
