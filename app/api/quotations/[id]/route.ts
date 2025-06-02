// app/api/quotation/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";
import { QuotationStatus, RateCard } from "@prisma/client"; // Import QuotationStatus
import { updateQuotationSchema } from "@/lib/validations/quotationSchema";
import { generateQuotationPdf } from "@/lib/actions/quotationToPdf"; // Assuming this path
import { calculateRateCardTotals } from "@/lib/utils"; // Assuming this utility for calculations

// Helper function to determine if PDF regeneration is needed
const needsPdfRegeneration = (payload: any, existingQuotation: any): boolean => {
  const pdfAffectingFields: string[] = [
    "name", "clientId", "rateCardDetails", "ticketId", 
    "status", "expiryDate", "currency", "notes", 
    // Calculated fields that depend on the above
    "subtotal", "gst", "grandTotal" 
  ];
  
  // Check if any of the direct payload fields are changing
  for (const field of pdfAffectingFields) {
    if (payload.hasOwnProperty(field) && payload[field] !== (existingQuotation as any)[field]) {
      // Special handling for rateCardDetails as it's an array of objects
      if (field === "rateCardDetails") {
        if (JSON.stringify(payload[field]) !== JSON.stringify(existingQuotation[field])) {
          return true;
        }
      } else {
        return true;
      }
    }
  }
  return false;
};


export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    // TODO: Enhance role check as needed, e.g. specific permissions for quotation editing
    const { role } = jwt.verify(token, process.env.JWT_SECRET!) as { role: string };
    if (!["ADMIN", "RM", "BACKEND"].includes(role)) { // Example roles that can edit
      return NextResponse.json({ message: "Forbidden: Insufficient permissions" }, { status: 403 });
    }

    const { id } = params;
    const body = await req.json();

    const validation = updateQuotationSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ message: "Invalid request data", errors: validation.error.errors }, { status: 400 });
    }

    const validatedData = validation.data;

    const existingQuotation = await prisma.quotation.findUnique({
      where: { id },
      include: { client: true, ticket: true, expenses: true }, // Include relations for PDF generation if needed
    });

    if (!existingQuotation) {
      return NextResponse.json({ message: "Quotation not found" }, { status: 404 });
    }

    let dataToUpdate: any = { ...validatedData };
    let newPdfUrl = existingQuotation.pdfUrl;

    // If rateCardDetails are being updated, recalculate totals
    if (validatedData.rateCardDetails) {
      const rateCards = await prisma.rateCard.findMany({
        where: {
          id: { in: validatedData.rateCardDetails.map(rcd => rcd.rateCardId) }
        }
      });
      const rateCardMap = new Map(rateCards.map(rc => [rc.id, rc]));

      const { subtotal, gst, grandTotal } = calculateRateCardTotals(validatedData.rateCardDetails, rateCardMap);
      dataToUpdate.subtotal = subtotal;
      dataToUpdate.gst = gst;
      dataToUpdate.grandTotal = grandTotal;
    }
    
    // Merge existing data with validated data for PDF generation and determining changes
    const mergedQuotationDataForPdf = { 
      ...existingQuotation, 
      ...dataToUpdate,
      // Ensure related objects are structured as expected by generateQuotationPdf
      // This might mean mapping IDs to full objects if generateQuotationPdf expects them
      client: validatedData.clientId ? await prisma.client.findUnique({ where: { id: validatedData.clientId }}) || existingQuotation.client : existingQuotation.client,
      // ticket: validatedData.ticketId ? await prisma.ticket.findUnique({ where: { id: validatedData.ticketId }}) || existingQuotation.ticket : existingQuotation.ticket,
      // rateCardDetails might need to be enriched with full rate card info if generateQuotationPdf needs it
    };


    // Determine if PDF needs regeneration
    // Check against the data that will be persisted (dataToUpdate) vs existingQuotation
    const pdfNeedsUpdate = needsPdfRegeneration(dataToUpdate, existingQuotation);

    if (pdfNeedsUpdate) {
      try {
        // Ensure all necessary data for PDF generation is correctly assembled
        // generateQuotationPdf might need more than just mergedQuotationDataForPdf if it fetches its own data
        const pdfBuffer = await generateQuotationPdf(mergedQuotationDataForPdf as any); // Cast as any for now
        
        // Save the PDF (example: overwriting existing based on a consistent naming scheme)
        // The pdfUrl should ideally not change, or if it does, the old one should be cleaned up.
        // For simplicity, assume generateQuotationPdf handles saving and returns a relative path or URL
        // For example, if pdfUrl is like '/quotations/QUOTE-XYZ.pdf'
        const pdfPath = path.join(process.cwd(), "public", existingQuotation.pdfUrl); // Use existing URL to overwrite
        fs.writeFileSync(pdfPath, pdfBuffer);
        newPdfUrl = existingQuotation.pdfUrl; // Assuming URL stays the same after overwrite
        // If generateQuotationPdf returns a new URL:
        // newPdfUrl = returnedPdfUrl; 
        // dataToUpdate.pdfUrl = newPdfUrl; // then update it in the database
        
        // For now, we assume pdfUrl does not change, and the file at that location is overwritten.
        dataToUpdate.pdfUrl = newPdfUrl;

      } catch (pdfError) {
        console.error("Error generating or saving PDF:", pdfError);
        // Decide if this should be a fatal error or if the quotation can be updated without PDF regeneration
        return NextResponse.json({ message: "Quotation updated, but failed to regenerate PDF." }, { status: 500 }); // Or handle as per requirements
      }
    } else {
       // If no PDF affecting fields changed, pdfUrl remains the same.
      if (validatedData.pdfUrl) { // If pdfUrl is part of schema and is being explicitly set (unlikely for auto-generated)
         dataToUpdate.pdfUrl = validatedData.pdfUrl;
      } else {
         dataToUpdate.pdfUrl = existingQuotation.pdfUrl;
      }
    }
    
    // Remove fields that should not be directly written or are relations
    if (dataToUpdate.clientId) {
        dataToUpdate.client = { connect: { id: dataToUpdate.clientId }};
        delete dataToUpdate.clientId;
    } else if (validatedData.clientId === null) { // Explicitly setting to null
        // This case might not be applicable if clientId is mandatory for a quotation
        // Or handle as disconnect if relation is optional
    }

    if (dataToUpdate.ticketId === null) { // If explicitly set to null
        dataToUpdate.ticket = { disconnect: true };
        delete dataToUpdate.ticketId;
    } else if (dataToUpdate.ticketId) {
        dataToUpdate.ticket = { connect: { id: dataToUpdate.ticketId }};
        delete dataToUpdate.ticketId;
    }


    const updatedQuotation = await prisma.quotation.update({
      where: { id },
      data: dataToUpdate,
      include: { client: true, ticket: true }, // Return updated quotation with relations
    });

    return NextResponse.json(updatedQuotation);

  } catch (error: any) {
    console.error("[PUT_QUOTATION_ERROR]", error);
    if (error.code === 'P2025') { // Prisma error code for record not found
        return NextResponse.json({ message: "Quotation not found or related record not found." }, { status: 404 });
    }
    return NextResponse.json({ message: "Internal server error", error: error.message }, { status: 500 });
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
