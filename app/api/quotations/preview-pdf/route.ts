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
      return NextResponse.json(
        { message: "Invalid input", errors: parsed.error.errors },
        { status: 400 },
      );
    }

    const {
      quotationId,
      clientName,
      clientId,
      name,
      rateCardDetails,
      subtotal,
      gst,
      grandTotal,
    } = parsed.data;

    const rateCardIds = rateCardDetails.map((detail) => detail.rateCardId);
    const dbRateCards = await prisma.rateCard.findMany({
      where: { id: { in: rateCardIds } },
    });

    if (dbRateCards.length !== rateCardIds.length) {
      const foundDbIds = dbRateCards.map((rc) => rc.id);
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

    const rateCardsMap = new Map(dbRateCards.map((rc) => [rc.id, rc]));

    const hydratedRateCardsForPdf = rateCardDetails.map((detail) => {
      const baseRateCard = rateCardsMap.get(detail.rateCardId);
      if (!baseRateCard) {
        throw new Error(
          `Rate card with ID ${detail.rateCardId} not found after initial fetch.`,
        );
      }
      return {
        ...baseRateCard,
        rate: Number(baseRateCard.rate),
      };
    });

    const pdfBuffer = await generateQuotationPdf({
      quotationId,
      clientName,
      clientId,
      name,
      rateCards: hydratedRateCardsForPdf,
      subtotal,
      gst,
      grandTotal,
      rateCardDetails,
    });

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${quotationId}_preview.pdf"`,
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
