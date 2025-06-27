// app/api/quotation/route.ts
import { NextRequest, NextResponse } from "next/server";
import { quotationSchema } from "@/lib/validations/quotationSchema";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { generateQuotationPdf } from "@/lib/pdf/generateQuotationHtml";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const parsed = quotationSchema.safeParse(body);
    if (!parsed.success) {
      console.error("Quotation validation failed:", parsed.error);
      return NextResponse.json(
        { message: "Invalid input", errors: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const {
      name,
      clientId,
      rateCardDetails,
      ticketId,
      salesType,
      expectedExpense,
    } = parsed.data;

    // Check if quotation for this ticketId already exists
    if (ticketId) {
      const existingQuotation = await prisma.quotation.findFirst({
        where: { ticketId: ticketId },
      });
      if (existingQuotation) {
        return NextResponse.json(
          { message: "A quotation for this ticket already exists." },
          { status: 409 }
        );
      }
    }

    // Extract rateCardIds from rateCardDetails
    const rateCardIds = rateCardDetails.map(
      (detail: { rateCardId: string }) => detail.rateCardId
    );


    // Fetch rate cards to get full details
    const rateCards = await prisma.rateCard.findMany({
      where: { id: { in: rateCardIds } },
    });



    if (rateCards.length !== rateCardIds.length) {
      const foundIds = rateCards.map((rc) => rc.id);
      const missingIds = rateCardIds.filter((id) => !foundIds.includes(id));
      console.error("Missing rate card IDs:", missingIds);

      return NextResponse.json(
        {
          message: "Some RateCard entries not found",
          missingIds: missingIds,
          requestedIds: rateCardIds,
          foundIds: foundIds,
        },
        { status: 404 }
      );
    }

    // Compute totals
    const subtotal = rateCardDetails.reduce((sum, detail) => {
      const rateCard = rateCards.find((rc) => rc.id === detail.rateCardId);
      return sum + (rateCard ? rateCard.rate * detail.quantity : 0);
    }, 0);

    const gst = subtotal * 0.18; // Assuming GST is 18%
    const grandTotal = subtotal + gst;


    // Generate new displayId (e.g., BE/January/0001)
    const currentDate = new Date();
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const currentMonth = monthNames[currentDate.getMonth()];

    const latestQuotation = await prisma.quotation.findFirst({
      where: { displayId: { not: null } },
      orderBy: { createdAt: "desc" },
      select: { displayId: true },
    });

    let serial = 1;
    const prefix = `BE/${currentMonth}/`;
    if (latestQuotation && latestQuotation.displayId) {
      // Check if the latest quotation is from current month
      if (latestQuotation.displayId.startsWith(prefix)) {
        const numericPartMatch = latestQuotation.displayId
          .substring(prefix.length)
          .match(/^\d+/);
        if (numericPartMatch) {
          serial = parseInt(numericPartMatch[0], 10) + 1;
        }
      }
      // If it's from a different month, start from 1
    }
    const newDisplayId = `${prefix}${serial.toString().padStart(4, "0")}`;

    // Keep the original quoteNo logic for backward compatibility
    const newSequentialId = newDisplayId;


    // Fetch client name for PDF
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { name: true },
    });
    if (!client) {
      return NextResponse.json(
        { message: "Client not found" },
        { status: 404 }
      );
    }


    // Generate PDF buffer
    try {
      const pdfBuffer = await generateQuotationPdf({
        quotationId: newSequentialId,
        clientName: client.name,
        clientId,
        name,
        rateCards,
        subtotal,
        gst,
        rateCardDetails,
        grandTotal,
        expectedExpense: expectedExpense || 0,
        quoteNo: newSequentialId,
        validUntil: parsed.data.validUntil,
      });


      // Save PDF to disk
      const folderPath = path.join(process.cwd(), "public", "quotations");
      if (!existsSync(folderPath)) mkdirSync(folderPath, { recursive: true });

      // PDF filename should use the newSequentialId (human-readable)
      const filename = `${newSequentialId.replace(/\//g, "-")}.pdf`;
      const filePath = path.join(folderPath, filename);
      writeFileSync(filePath, pdfBuffer);


      // Save in DB
      const quotation = await prisma.quotation.create({
        data: {
          displayId: newDisplayId,
          quoteNo: newSequentialId,
          name,
          clientId,
          ticketId: ticketId || null,
          pdfUrl: `/quotations/${filename}`,
          subtotal,
          gst,
          grandTotal,
          salesType,
          expectedExpense: expectedExpense || 0,
          rateCardDetails: rateCardDetails as any,
        },
      });


      // Update ticket work stage if ticketId is provided
      if (ticketId) {
        try {
          const ticket = await prisma.ticket.findUnique({
            where: { id: ticketId },
            select: { workStageId: true },
          });

          if (ticket?.workStageId) {
            // Update existing workStage
            await prisma.workStage.update({
              where: { id: ticket.workStageId },
              data: {
                quoteNo: newSequentialId,
                quoteTaxable: subtotal,
                quoteAmount: grandTotal,
              },
            });
          } else {
            // Create new workStage and link to ticket
            const newWorkStage = await prisma.workStage.create({
              data: {
                ticket: { connect: { id: ticketId } },
                stateName: "N/A",
                adminName: "N/A",
                clientName: client.name,
                siteName: "N/A",
                quoteNo: newSequentialId,
                dateReceived: new Date(),
                quoteTaxable: subtotal,
                quoteAmount: grandTotal,
                workStatus: "N/A",
                approval: "N/A",
                poStatus: false,
                poNumber: "N/A",
                jcrStatus: false,
                agentName: "N/A",
              },
            });

            // Link the new WorkStage to the ticket
            await prisma.ticket.update({
              where: { id: ticketId },
              data: { workStageId: newWorkStage.id },
            });
          }
        } catch (workStageError) {
          console.error("Error updating work stage:", workStageError);
          // Don't fail the quotation creation if work stage update fails
        }
      }

      return NextResponse.json({
        message: "Quotation created successfully",
        quotation: {
          ...quotation,
          client: { name: client.name },
        },
      });
    } catch (pdfError: any) {
      console.error("PDF generation error:", pdfError);
      return NextResponse.json(
        { message: "Failed to generate PDF", error: pdfError.message },
        { status: 500 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      {
        message: "Failed to create quotation",
        error: error.message,
        details: error.code || "Unknown error",
      },
      { status: 500 }
    );
  }
}
