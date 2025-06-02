import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma'; // Assuming @ refers to the project root based on common Next.js setup
import { rateCardSchema, RateCardSchemaType } from '@/lib/validations/rateCardSchema'; // Adjust path if schema exports type differently
import { ZodError } from 'zod';

export async function POST(request: Request) {
  try {
    const jsonPayload = await request.json();

    // Validate the request body against the schema
    const validatedData = rateCardSchema.parse(jsonPayload);

    // If validation passes, create the new rate card
    const newRateCard = await prisma.rateCard.create({
      data: validatedData,
    });

    return NextResponse.json(newRateCard, { status: 201 });

  } catch (error) {
    if (error instanceof ZodError) {
      // Return validation errors
      return NextResponse.json({ error: "Validation failed", details: error.errors }, { status: 400 });
    }

    if (error instanceof SyntaxError && error.message.includes("Unexpected end of JSON input")) {
        return NextResponse.json({ error: "Invalid JSON payload: Empty or malformed." }, { status: 400 });
    }

    console.error('[API_RATE_CARD_CREATE_ERROR]', error);
    // Return a generic server error
    return NextResponse.json({ error: "An unexpected error occurred.", details: (error as Error).message }, { status: 500 });
  }
}
