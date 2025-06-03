// app/api/quotations/preview-pdf/route.ts
import { NextRequest, NextResponse } from "next/server";
import { quotationSchema, CreateQuotationPayload } from "@/lib/validations/quotationSchema"; // Use existing schema
import { prisma } from "@/lib/prisma";
import { generateQuotationPdf, QuotationPdfParams } from "@/lib/pdf/generateQuotationPdf";
import { Client, Ticket } from "@prisma/client";
import path from "path";

// Placeholder number-to-words function (same as in create-quotations)
function getAmountInWords(amount: number): string {
  const fixedAmount = amount.toFixed(2);
  return `Rupees ${fixedAmount} Only`; // Basic placeholder
}

// Helper to generate a temporary quotation number for preview if needed
// For previews, we might not want to consume a real sequence number.
// Using a passed 'name' or a generic preview string.
function getPreviewQuotationNumber(payloadName: string): string {
    return `PREVIEW - ${payloadName.substring(0, 20)}`; // Or simply "Quotation Preview"
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // Validate the payload; using quotationSchema for structure consistency
    const parsed = quotationSchema.safeParse(body);

    if (!parsed.success) {
      console.error("Validation Errors for PDF Preview:", parsed.error.errors);
      return NextResponse.json({ message: "Invalid input for PDF preview", errors: parsed.error.flatten() }, { status: 400 });
    }

    const data: CreateQuotationPayload = parsed.data;

    // 1. Fetch full client details
    const clientData = await prisma.client.findUnique({ where: { id: data.clientId } });
    if (!clientData) {
      return NextResponse.json({ message: "Client not found for PDF preview." }, { status: 404 });
    }

    // 2. Fetch ticket details if ticketId is present
    let ticketData: Ticket | null = null;
    if (data.ticketId) {
      ticketData = await prisma.ticket.findUnique({ where: { id: data.ticketId } });
    }

    // 3. Prepare items for PDF
    const pdfItems = data.items.map((item, index) => ({
      sno: item.sno || index + 1,
      description: item.productDescription || item.description,
      rcSno: item.rateCardId,
      unit: item.unit,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalValue: item.totalValue,
    }));

    // 4. Construct QuotationPdfParams
    const pdfParams: QuotationPdfParams = {
      // For preview, use a placeholder or the descriptive name instead of a formatted number
      quotationNumber: getPreviewQuotationNumber(data.name),
      date: new Date(data.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      validUntil: data.validUntil ? new Date(data.validUntil).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : "N/A",
      salesType: data.salesType,
      client: {
        name: clientData.name,
        address: `${clientData.contactPerson} \n ${clientData.contactPhone}`,
        gstin: clientData.gstn || "N/A",
        contactPerson: clientData.contactPerson,
        contactPhone: clientData.contactPhone,
        contactEmail: clientData.contactEmail || undefined,
      },
      ticket: ticketData ? { id: ticketData.id, title: ticketData.title, ticketId: ticketData.ticketId } : undefined,
      items: pdfItems,
      subtotal: data.subtotal,
      discountPercentage: data.discountPercentage,
      discountAmount: data.discountAmount,
      taxableValue: data.taxableValue,
      igstAmount: data.igstAmount,
      igstRate: 18, // Assuming 18%
      netGrossAmount: data.netGrossAmount,
      netGrossAmountInWords: getAmountInWords(data.netGrossAmount),
      admin: data.admin,
      quoteBy: data.quoteBy,
      logoPath: path.resolve("./public/logo.png"), // Ensure logo.png is in public folder
      // Company details can rely on defaults in generateQuotationPdf
    };

    // Generate PDF buffer
    const pdfBuffer = await generateQuotationPdf(pdfParams);

    // Return PDF as a response
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="quotation_preview_${Date.now()}.pdf"`,
      },
    });

  } catch (error: any) {
    console.error("Error in POST /api/quotations/preview-pdf:", error);
    // Check if it's a Zod validation error from parsing, though caught earlier
    if (error.name === 'ZodError') {
        return NextResponse.json({ message: "Invalid input for PDF preview", errors: error.errors }, { status: 400 });
    }
    return NextResponse.json({ message: "Internal server error generating PDF preview.", error: error.message }, { status: 500 });
  }
}
