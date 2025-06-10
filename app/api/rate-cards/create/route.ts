import { NextResponse } from "next/server";
import { inlineRateCardFormSchema } from "@/lib/validations/rateCardSchema";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const jsonPayload = await request.json();

    // Validate the request body against the schema
    const validatedData = inlineRateCardFormSchema.parse(jsonPayload);

    // Auto-generate serial number based on bank name and RC number
    let srNo = 1;

    // Find the latest rate card for the same bank name and RC number combination
    const latestRateCard = await prisma.rateCard.findFirst({
      where: {
        bankName: validatedData.bankName,
        bankRcNo: validatedData.bankRcNo,
      },
      orderBy: { srNo: "desc" },
      select: { srNo: true },
    });

    if (latestRateCard) {
      srNo = latestRateCard.srNo + 1;
    }

    // Create the new rate card with auto-generated serial number
    const newRateCard = await prisma.rateCard.create({
      data: {
        description: validatedData.description,
        unit: validatedData.unit,
        rate: validatedData.rate,
        bankName: validatedData.bankName,
        bankRcNo: validatedData.bankRcNo,
        srNo,
      },
    });

    return NextResponse.json(newRateCard, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      // Return validation errors
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 },
      );
    }

    if (
      error instanceof SyntaxError &&
      error.message.includes("Unexpected end of JSON input")
    ) {
      return NextResponse.json(
        { error: "Invalid JSON payload: Empty or malformed." },
        { status: 400 },
      );
    }

    console.error("[API_RATE_CARD_CREATE_ERROR]", error);
    // Return a generic server error
    return NextResponse.json(
      {
        error: "An unexpected error occurred.",
        details: (error as Error).message,
      },
      { status: 500 },
    );
  }
}
