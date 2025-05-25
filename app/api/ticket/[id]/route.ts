// pages/api/tickets/[id]/update.ts
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "../../../../lib/prisma";
import {
  updateTicketSchema,
  addQuotationSchema,
  updateWorkStageSchema,
  createWorkStageSchema,
  updateTicketStatusSchema,
} from "../../../../lib/validations/ticketSchema";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();

    // Check if the request is for updating the ticket status
    if (body.status) {
      const validatedData = updateTicketStatusSchema.parse(body);
      const ticket = await prisma.ticket.update({
        where: { id: params.id },
        data: { status: validatedData.status },
      });
      return NextResponse.json({ ticket });
    }

    // Otherwise, handle it as a general ticket update
    const validatedData = updateTicketSchema.safeParse(body);
    if (validatedData.error) {
      const fieldErrors = validatedData.error.flatten().fieldErrors;
      const firstFieldKey = Object.keys(fieldErrors)[0];
      const firstErrorMessage =
        firstFieldKey &&
        fieldErrors[firstFieldKey as keyof typeof fieldErrors]?.[0];

      return NextResponse.json(
        { message: `${firstFieldKey}: ${firstErrorMessage}` },
        { status: 400 }
      );
    }
    const ticket = await prisma.ticket.update({
      where: { id: params.id },
      data: validatedData.data,
    });

    return NextResponse.json({ ticket });
  } catch (error: any) {
    return NextResponse.json(
      { message: "Failed to update ticket", error: error.message },
      { status: 400 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.ticket.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Ticket deleted successfully" });
  } catch (error: any) {
    return NextResponse.json(
      { message: "Failed to delete ticket", error: error.message },
      { status: 400 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const validatedData = createWorkStageSchema.safeParse(body);

    if (validatedData.error) {
      const fieldErrors = validatedData.error.flatten().fieldErrors;
      const firstFieldKey = Object.keys(fieldErrors)[0];
      const firstErrorMessage =
        firstFieldKey &&
        fieldErrors[firstFieldKey as keyof typeof fieldErrors]?.[0];

      return NextResponse.json(
        { message: `${firstFieldKey}: ${firstErrorMessage}` },
        { status: 400 }
      );
    }

    const workStage = await prisma.workStage.create({
      data: {
        ...validatedData.data,
        ticketId: params.id,
      },
    });

    return NextResponse.json({ workStage });
  } catch (error: any) {
    return NextResponse.json(
      { message: "Failed to add quotation", error: error.message },
      { status: 400 }
    );
  }
}
