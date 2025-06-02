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
      return NextResponse.json({ message: "Invalid input", errors: parsed.error.flatten() }, { status: 400 });
    }

    // All validated data, including new fields
    const { 
      name, clientId, rateCardDetails, ticketId, 
      status, expiryDate, currency, notes,
      // subTotal: clientSubTotal, gst: clientGst, grandTotal: clientGrandTotal // Optional client-sent totals
    } = parsed.data;

    // Extract rateCardIds from rateCardDetails
    const rateCardIds = rateCardDetails.map((detail) => detail.rateCardId);

    // Fetch rate cards to get full details
    const rateCards = await prisma.rateCard.findMany({
      where: { id: { in: rateCardIds } },
    });

    if (rateCards.length !== rateCardIds.length) {
      return NextResponse.json({ message: "Some RateCard entries not found" }, { status: 404 });
    }

    // Compute totals based on fetched rate cards and gstType from rateCardDetails
    let calculatedSubtotal = 0;
    let calculatedTotalGst = 0;

    for (const detail of rateCardDetails) {
      const rateCard = rateCards.find(rc => rc.id === detail.rateCardId);
      if (rateCard) {
        const itemSubtotal = rateCard.rate * detail.quantity;
        calculatedSubtotal += itemSubtotal;
        // Use gstType from detail (e.g., 18 for 18%, 28 for 28%)
        const itemGst = itemSubtotal * (detail.gstType / 100);
        calculatedTotalGst += itemGst;
      }
    }
    const calculatedGrandTotal = calculatedSubtotal + calculatedTotalGst;

    // Generate new quotation ID and Serial Number
    const latestQuotation = await prisma.quotation.findFirst({
      orderBy: { serialNo: "desc" }, // Assuming serialNo is an auto-incrementing or sequential number
      select: { serialNo: true }
    });
    const nextSerialNo = latestQuotation && latestQuotation.serialNo ? latestQuotation.serialNo + 1 : 1;
    // The quoteNo (ID like QUOTXXX) should be unique. Using a timestamp part or a more robust unique ID generation is better.
    // For now, keeping similar logic to existing but using nextSerialNo for display if needed.
    // The primary ID `id` for the quotation will still be `newId` based on the old logic for QUOTXXX format.
    const latestIdRecord = await prisma.quotation.findFirst({
        orderBy: { createdAt: "desc" }, // Assuming QUOTxxx is based on creation order for the serial part
        select: { id: true }
    });
    const serialForId = latestIdRecord ? parseInt(latestIdRecord.id.replace("QUOT", "")) + 1 : 1;
    const newQuotationId = `QUOT${serialForId.toString().padStart(2, "0")}`;

    // Data for PDF generation
    const pdfData = {
      quotationId: newQuotationId,
      quotationName: name, // Quotation's own name/title
      client, // Pass the fetched client object
      rateCardsFull: rateCards, // Full rate card objects
      rateCardDetails, // Original details with quantity and gstType
      subTotal: calculatedSubtotal,
      gst: calculatedTotalGst,
      grandTotal: calculatedGrandTotal,
      currency: currency || "INR", // Pass currency to PDF
      notes, // Pass notes to PDF
      expiryDate, // Pass expiryDate to PDF
      // status, // Status might not be needed directly in PDF content, but can be passed
    };
    // console.log(rateCards ,"rateCards for PDF"); // Already have rateCards which is rateCardsFull

    const pdfBuffer = await generateQuotationPdf(pdfData);

    const folderPath = path.join(process.cwd(), "public", "quotations");
    if (!existsSync(folderPath)) mkdirSync(folderPath, { recursive: true });

    const filename = `${newId}.pdf`;
    const filePath = path.join(folderPath, filename);
    writeFileSync(filePath, pdfBuffer);

    // Save in DB
    const quotation = await prisma.quotation.create({
      data: {
        id: newQuotationId, // This is the QUOTXXX formatted ID
        name,
        serialNo: nextSerialNo, // Store the numerical serial number
        clientId,
        ticketId,
        status: status || "DRAFT",
        expiryDate,
        currency: currency || "INR",
        notes,
        pdfUrl: `/quotations/${filename}`,
        subtotal: calculatedSubtotal,
        gst: calculatedTotalGst,
        grandTotal: calculatedGrandTotal,
        rateCardDetails: rateCardDetails as any, 
      },
    });

    // Fetch client details for WorkStage and potentially PDF if needed (though PDF now gets client object)
    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client) {
        // This should ideally not happen if clientID is validated by schema foreign key constraint
        return NextResponse.json({ message: "Client not found after validation." }, { status: 404 });
    }


    if (ticketId) {
      const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        select: { workStageId: true, client: { select: { name: true }} }, // Also fetch client name via ticket if needed
      });

      const workStageClientName = ticket?.client?.name || client.name; // Prioritize client name from ticket if available

      if (ticket?.workStageId) {
        await prisma.workStage.update({
          where: { id: ticket.workStageId },
          data: {
            quoteNo: newQuotationId,
            quoteTaxable: calculatedSubtotal,
            quoteAmount: calculatedGrandTotal,
          },
        });
      } else {
        const newWorkStage = await prisma.workStage.create({
          data: {
            ticket: { connect: { id: ticketId } },
            stateName: "N/A", // Default or map from quotation status if appropriate
            adminName: "System", // Or based on logged-in user if available
            clientName: workStageClientName, 
            siteName: "N/A", // This might need to come from ticket or client details
            quoteNo: newQuotationId,
            dateReceived: new Date(),
            quoteTaxable: calculatedSubtotal,
            quoteAmount: calculatedGrandTotal,
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
