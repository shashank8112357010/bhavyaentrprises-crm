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
    const token = req.cookies.get("token")?.value;
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { role } = jwt.verify(token, process.env.JWT_SECRET!) as { role: string };
    if (role !== "ADMIN") return NextResponse.json({ message: "Need Admin Access" }, { status: 403 });

    const body = await req.json();
    const parsed = quotationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: "Invalid input", errors: parsed.error }, { status: 400 });
    }

    const { name, clientId, rateCardDetails, ticketId } = parsed.data;

    // Extract rateCardIds from rateCardDetails
    const rateCardIds = rateCardDetails.map((detail: { rateCardId: string }) => detail.rateCardId);

    // Fetch rate cards to get full details
    const rateCards = await prisma.rateCard.findMany({
      where: { id: { in: rateCardIds } },
    });

    if (rateCards.length !== rateCardIds.length) {
      return NextResponse.json({ message: "Some RateCard entries not found" }, { status: 404 });
    }

    // Compute totals
    const subtotal = rateCardDetails.reduce((sum, detail) => {
      const rateCard = rateCards.find(rc => rc.id === detail.rateCardId);
      return sum + (rateCard ? rateCard.rate * detail.quantity : 0);
    }, 0);

    const gst = subtotal * 0.18; // Assuming GST is 18%
    const grandTotal = subtotal + gst;

    // Generate new quotation ID
    const latest = await prisma.quotation.findFirst({
      orderBy: { createdAt: "desc" },
    });
    const serial = latest ? parseInt(latest.id.replace("QUOT", "")) + 1 : 1;
    const newId = `QUOT${serial.toString().padStart(2, "0")}`;
console.log(rateCards ,"rateCards");

    // Generate PDF buffer
    const pdfBuffer = await generateQuotationPdf({
      quotationId: newId,
      clientId,
      name,
      rateCards, // Pass rateCards instead of rateCardDetails
      subtotal,
      gst,
      rateCardDetails,
      grandTotal,
    });

    // Save PDF to disk
    const folderPath = path.join(process.cwd(), "public", "quotations");
    if (!existsSync(folderPath)) mkdirSync(folderPath, { recursive: true });

    const filename = `${newId}.pdf`;
    const filePath = path.join(folderPath, filename);
    writeFileSync(filePath, pdfBuffer);

    // Save in DB
    const quotation = await prisma.quotation.create({
      data: {
        id: newId,
        name,
        clientId,
        ticketId,
        pdfUrl: `/quotations/${filename}`,
        subtotal,
        gst,
        grandTotal,
        rateCardDetails : rateCardDetails as any, // Store the rate card details as JSON
      },
    });

    if (ticketId) {
      const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        select: { workStageId: true },
      });

      if (ticket?.workStageId) {
        // Update existing workStage
        await prisma.workStage.update({
          where: { id: ticket.workStageId },
          data: {
            quoteNo: newId,
            quoteTaxable: subtotal,
            quoteAmount: grandTotal,
          },
        });
      } else {
        // Create new workStage and link to ticket
        const newWorkStage = await prisma.workStage.create({
          data: {
            ticket: {
              connect: { id: ticketId },
            },
            stateName: "N/A",
            adminName: "N/A",
            clientName: "N/A",
            siteName: "N/A",
            quoteNo: newId,
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
          data: {
            workStageId: newWorkStage.id,
          },
        });
      }
    }

    return NextResponse.json({ message: "Quotation created", quotation });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
