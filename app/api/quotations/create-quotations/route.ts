// app/api/quotation/route.ts
import { NextRequest, NextResponse } from "next/server";
import { quotationSchema } from "@/lib/validations/quotationSchema";
import { prisma } from "@/lib/prisma";
import { generateQuotationPdf } from "@/lib/pdf/generateQuotationHtml";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import path from "path";

export async function POST(req: NextRequest) {

  try {
    const body = await req.json();
    // Sanitize validUntil: if empty string or undefined, set to null
    if (typeof body.validUntil === 'string' && body.validUntil.trim() === '') {
      body.validUntil = new Date().toISOString();
    }
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
      client, // <-- Accept client object from frontend
      rateCardDetails,
      ticketId,
      salesType,
      expectedExpense,
      subtotal,
      gst,
      grandTotal,
    } = parsed.data;

    // Backend check for required fields
    if (!name || !clientId || !client || !Array.isArray(rateCardDetails) || rateCardDetails.length === 0) {
      return NextResponse.json({
        message: "Missing required fields: name, clientId, client, and rateCardDetails (non-empty) are required."
      }, { status: 400 });
    }

    // If all totals are provided, use them. Otherwise, calculate from rateCardDetails.
    let calculatedSubtotal = subtotal;
    let calculatedGst = gst;
    let calculatedGrandTotal = grandTotal;
    if (subtotal == null || gst == null || grandTotal == null) {
      calculatedSubtotal = rateCardDetails.reduce((sum, item) => sum + ((item.totalValue ?? 0)), 0);
      // If totalValue not sent, fallback to quantity * rate (if present)
      if (calculatedSubtotal === 0) {
        calculatedSubtotal = rateCardDetails.reduce((sum, item) => sum + ((item.quantity ?? 0) * (item.rate ?? 0)), 0);
      }
      calculatedGst = rateCardDetails.reduce((sum, item) => {
        const itemTotal = (item.totalValue ?? ((item.quantity ?? 0) * (item.rate ?? 0)));
        return sum + (itemTotal * (item.gstPercentage ?? 0) / 100);
      }, 0);
      calculatedGrandTotal = calculatedSubtotal - (parsed.data.discount ? (calculatedSubtotal * parseFloat(parsed.data.discount) / 100) : 0) + calculatedGst;
    }

    // Use the completedRateCardDetails for PDF and DB
    const newSequentialId = parsed.data.quotationNumber || `Q-${Date.now()}`;

    // Save quotation in DB first
    console.time('DB Save');
    const filename = `${newSequentialId.replace(/\//g, "-")}.pdf`;
    const quotation = await prisma.quotation.create({
      data: {
        displayId: newSequentialId,
        quoteNo: newSequentialId,
        name,
        clientId,
        ticketId: ticketId || null,
        pdfUrl: `/quotations/${filename}`,
        subtotal: calculatedSubtotal,
        gst: calculatedGst,
        grandTotal: calculatedGrandTotal,
        salesType,
        expectedExpense: expectedExpense || 0,
        rateCardDetails: rateCardDetails,
      },
    });
    console.timeEnd('DB Save');

    // Respond immediately after DB save
    const response = NextResponse.json({
      message: "Quotation created successfully",
      quotation: {
        ...quotation,
        client: { name: client.name },
      },
    });

    // PDF generation and file write in background
    (async () => {
      try {
        console.time('PDF Generation (async)');
        const pdfBuffer = await generateQuotationPdf({
          quotationId: newSequentialId,
          client: client,
          name,
          subtotal,
          gst,
          rateCardDetails,
          grandTotal,
          expectedExpense: expectedExpense || 0,
          quoteNo: newSequentialId,
          validUntil: parsed.data.validUntil ? new Date(parsed.data.validUntil).toISOString() : undefined,
        });
        console.timeEnd('PDF Generation (async)');
        console.time('File Write (async)');
        const folderPath = path.join(process.cwd(), "public", "quotations");
        if (!existsSync(folderPath)) mkdirSync(folderPath, { recursive: true });
        const filePath = path.join(folderPath, filename);
        writeFileSync(filePath, pdfBuffer);
        console.timeEnd('File Write (async)');
      } catch (pdfError) {
        console.error("PDF generation or file write failed (background):", pdfError);
      }
    })();

    // Ticket work stage update in background
    if (ticketId) {
      (async () => {
        try {
          const ticket = await prisma.ticket.findUnique({
            where: { id: ticketId },
            select: { workStageId: true },
          });

          if (ticket?.workStageId) {
            await prisma.workStage.update({
              where: { id: ticket.workStageId },
              data: {
                quoteNo: newSequentialId,
                quoteTaxable: subtotal,
                quoteAmount: grandTotal,
                ticket: { connect: { id: ticketId } },
                stateName: "N/A",
                adminName: client.contactPerson,
                clientName: client.name,
                siteName: "N/A",
                dateReceived: new Date(),
                workStatus: "N/A",
                approval: "N/A",
                poStatus: false,
                poNumber: "N/A",
                jcrStatus: false,
                agentName: "N/A",
              },
            });
          } else {
            const newWorkStage = await prisma.workStage.create({
              data: {
                ticket: { connect: { id: ticketId } },
                stateName: "N/A",
                adminName: client.contactPerson,
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
            await prisma.ticket.update({
              where: { id: ticketId },
              data: { workStageId: newWorkStage.id },
            });
          }
        } catch (workStageError) {
          console.error("Error updating work stage (background):", workStageError);
        }
      })();
    }

    // Return response immediately
    return response;
    } catch (pdfError: any) {
      console.error("PDF generation error:", pdfError);
      return NextResponse.json(
        { message: "Failed to generate PDF", error: pdfError.message },
        { status: 500 }
      );
    }
  
  finally {
    // Always disconnect Prisma client after request to avoid resource leaks
    try {
      await prisma.$disconnect();
    } catch (disconnectError) {
      console.error("Error disconnecting Prisma client:", disconnectError);
    }
  }
}
