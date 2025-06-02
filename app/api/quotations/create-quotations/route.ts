import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { quotationSchema } from "@/lib/validations/quotationSchema";
import { QuotationStatus } from "@prisma/client";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = quotationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.format() },
        { status: 400 }
      );
    }

    const {
      name,
      clientId,
      rateCardDetails,
      ticketId,
      status = QuotationStatus.DRAFT, // Default to DRAFT if not provided
    } = validation.data;

    // Placeholder for PDF Generation
    const pdfUrl = "/temp/quotation.pdf"; // Actual PDF generation will be handled later

    let subtotal = 0;
    let gst = 0;

    for (const item of rateCardDetails) {
      const rateCardItem = await prisma.rateCard.findUnique({
        where: { id: item.rateCardId },
      });

      if (!rateCardItem) {
        return NextResponse.json(
          { error: `RateCard with id ${item.rateCardId} not found` },
          { status: 400 }
        );
      }

      const itemTotal = item.quantity * rateCardItem.rate;
      subtotal += itemTotal;
      // Assuming gstType is a percentage like 18 or 28
      const itemGst = itemTotal * (item.gstType / 100);
      gst += itemGst;
    }

    const grandTotal = subtotal + gst;

    const quotation = await prisma.quotation.create({
      data: {
        name,
        clientId,
        pdfUrl,
        rateCardDetails: rateCardDetails as any, // Prisma expects JsonValue for Json fields
        ticketId,
        status,
        subtotal,
        gst,
        grandTotal,
      },
    });

    return NextResponse.json(quotation, { status: 201 });
  } catch (error) {
    console.error("Error creating quotation:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
