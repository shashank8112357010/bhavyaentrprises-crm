// app/api/quotations/preview-pdf/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma"; // For fetching rate card/client details if needed
import { generateQuotationPdf } from "@/lib/pdf/generateQuotationHtml"; // Actual PDF generator
// May need to adjust imports based on actual file structure for PDF generation utils

// Define a schema for the expected request body (payload for PDF generation)
// This should mirror the data needed by `generateQuotationPdf` and collected from the frontend form.
const previewPdfSchema = z.object({
  quotationId: z.string(), // Or a temporary ID like "PREVIEW-123"
  clientName: z.string(),
  clientId: z.string(), // May or may not be used by PDF if clientName is enough
  name: z.string(), // Quotation title/description
  rateCardDetails: z.array(
    z.object({
      rateCardId: z.string(),
      quantity: z.number().min(1),
      gstType: z.number().min(0), // Assuming gstType is a percentage like 18
      // Add other fields if they are directly passed and used by generateQuotationPdf
      // If not, they might be fetched based on rateCardId
    })
  ).min(1),
  subtotal: z.number(),
  gst: z.number(),
  grandTotal: z.number(),
  // Add any other fields that `generateQuotationPdf` requires,
  // e.g., discountAmount, taxableValue, specific dates if not current date.
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = previewPdfSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ message: "Invalid input", errors: parsed.error.errors }, { status: 400 });
    }

    const {
      quotationId, // This will be a temporary ID for display in PDF, e.g., "DRAFT QUOTATION" or the current form's quote no.
      clientName,
      clientId,
      name, // Quotation title
      rateCardDetails, // Array of items with quantity, gstType
      subtotal,
      gst,
      grandTotal,
    } = parsed.data;

    // Fetch full rate card details from DB for each item in rateCardDetails
    // `generateQuotationPdf` expects full RateCardEntry objects.
    const rateCardIds = rateCardDetails.map(detail => detail.rateCardId);
    const dbRateCards = await prisma.rateCard.findMany({
      where: { id: { in: rateCardIds } },
    });

    if (dbRateCards.length !== rateCardIds.length) {
      // Identify missing rate cards for a more specific error
      const foundDbIds = dbRateCards.map(rc => rc.id);
      const missingIds = rateCardIds.filter(id => !foundDbIds.includes(id));
      console.error("Some RateCard entries not found for PDF preview:", missingIds);
      return NextResponse.json({ message: `RateCard entries not found: ${missingIds.join(", ")}` }, { status: 404 });
    }

    // Map dbRateCards to a dictionary for easy lookup
    const rateCardsMap = new Map(dbRateCards.map(rc => [rc.id, rc]));

    // Prepare the rateCards array for generateQuotationPdf
    // It needs to match RateCardEntry[] including quantity and potentially calculated fields per item
    const hydratedRateCardsForPdf = rateCardDetails.map(detail => {
      const baseRateCard = rateCardsMap.get(detail.rateCardId);
      if (!baseRateCard) {
        // This should ideally not happen if the check above is thorough
        throw new Error(`Rate card with ID ${detail.rateCardId} not found after initial fetch.`);
      }
      return {
        ...baseRateCard, // Spread all fields from the DB rate card
        rate: Number(baseRateCard.rate), // Ensure rate is a number
        // generateQuotationPdf might expect quantity to be part of each rate card object
        // or it might use the separate rateCardDetails array. Adjust as per generateQuotationPdf's needs.
        // For now, assuming generateQuotationPdf will cross-reference rateCards with rateCardDetails using IDs.
      };
    });

    const pdfBuffer = await generateQuotationPdf({
      quotationId, // The temporary ID for display
      clientName,
      clientId,
      name,
      rateCards: hydratedRateCardsForPdf, // Pass the full rate card objects
      subtotal,
      gst,
      grandTotal,
      rateCardDetails, // Pass the original rateCardDetails with quantity and gstType
    });

    // Return PDF as a blob
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
