import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { generateQuotationPdf } from "@/lib/pdf/generateQuotationHtml";

const previewPdfSchema = z.object({
  name: z.string(),
  clientId: z.string(),
  ticketId: z.string().optional(),
  salesType: z.string(),
  date: z.string(),
  quotationNumber: z.string(),
  validUntil: z.string().optional(),
  expectedExpense: z.number().optional(),
  discount: z.string().optional(),
  serialNumber: z.string().optional(),
  rateCardDetails: z
    .array(
      z.object({
        rateCardId: z.string(),
        quantity: z.number().min(1),
        gstPercentage: z.number().min(0),
        totalValue: z.number().optional(),
      }),
    )
    .min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const parsed = previewPdfSchema.safeParse(body);

    if (!parsed.success) {
      console.error("Preview PDF validation failed:", parsed.error);
      return NextResponse.json(
        { message: "Invalid input", errors: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const {
      name,
      clientId,
      ticketId,
      salesType,
      date,
      quotationNumber,
      validUntil,
      expectedExpense,
      discount,
      serialNumber,
      rateCardDetails,
    } = parsed.data;

    // Fetch client data
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      // Select all necessary client fields for the PDF
      select: {
        name: true,
        contactPerson: true,
        contactEmail: true,
        contactPhone: true,
        gstn: true,
      },
    });

    if (!client) {
      return NextResponse.json(
        { message: "Client not found" },
        { status: 404 },
      );
    }

    const rateCardIds = rateCardDetails.map((detail) => detail.rateCardId);
    const dbRateCards = await prisma.rateCard.findMany({
      where: { id: { in: rateCardIds } },
    });

    if (dbRateCards.length !== rateCardIds.length) {
      const foundDbIds = dbRateCards.map((rc:any) => rc.id);
      const missingIds = rateCardIds.filter((id) => !foundDbIds.includes(id));
      console.error(
        "Some RateCard entries not found for PDF preview:",
        missingIds,
      );
      return NextResponse.json(
        { message: `RateCard entries not found: ${missingIds.join(", ")}` },
        { status: 404 },
      );
    }

    // Calculate totals
    const subtotal = rateCardDetails.reduce((sum, detail) => {
      const rateCard = dbRateCards.find((rc:any) => rc.id === detail.rateCardId);
      return sum + (rateCard ? rateCard.rate * detail.quantity : 0);
    }, 0);

    const discountAmount = discount
      ? (subtotal * parseFloat(discount)) / 100
      : 0;
    const afterDiscount = subtotal - discountAmount;
    const gst = rateCardDetails.reduce((sum, detail) => {
      const rateCard = dbRateCards.find((rc:any) => rc.id === detail.rateCardId);
      const itemTotal = rateCard ? rateCard.rate * detail.quantity : 0;
      return sum + (itemTotal * detail.gstPercentage) / 100;
    }, 0);
    const grandTotal = afterDiscount + gst;

    const rateCardsMap = new Map(dbRateCards.map((rc:any) => [rc.id, rc]));

    const hydratedRateCardsForPdf = rateCardDetails.map((detail) => {
      const baseRateCard = rateCardsMap.get(detail.rateCardId);
      if (!baseRateCard) {
        throw new Error(
          `Rate card with ID ${detail.rateCardId} not found after initial fetch.`,
        );
      }
      return {
        ...baseRateCard,
        rate: Number(2),
      };
    });

    const pdfBuffer = await generateQuotationPdf({
      quotationId: quotationNumber,
      client: client, // Pass the full client object
      name, // This is the quotation name
      subtotal,
      gst,
      grandTotal,
      rateCardDetails,
      expectedExpense: expectedExpense || 0,
      quoteNo: quotationNumber,
      validUntil,
    });

    // Sanitize filename for download
    const sanitizedQuotationNumber = quotationNumber.replace(/\//g, "-");

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${sanitizedQuotationNumber}_preview.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error generating PDF preview:", error);
    let errorMessage = "Internal server error";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
