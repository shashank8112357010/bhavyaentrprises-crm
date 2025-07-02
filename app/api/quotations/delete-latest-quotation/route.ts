import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// DELETE /api/quotations/delete-latest-quotation?ticketId=<ticketId>
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const ticketId = searchParams.get("ticketId");
    if (!ticketId) {
      return NextResponse.json(
        { message: "ticketId is required as a query parameter" },
        { status: 400 }
      );
    }

    // Find the latest quotation for the ticket
    const latestQuotation = await prisma.quotation.findFirst({
      where: { ticketId },
      orderBy: { createdAt: "desc" },
    });

    if (!latestQuotation) {
      return NextResponse.json(
        { message: "No quotation found for this ticket" },
        { status: 404 }
      );
    }

    // Delete the quotation
    await prisma.quotation.delete({ where: { id: latestQuotation.id } });

    return NextResponse.json({ message: "Latest quotation deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting latest quotation:", error);
    return NextResponse.json(
      { message: "Failed to delete latest quotation", error: error.message },
      { status: 500 }
    );
  } finally {
    try {
      await prisma.$disconnect();
    } catch (disconnectError) {
      console.error("Error disconnecting Prisma client:", disconnectError);
    }
  }
}
