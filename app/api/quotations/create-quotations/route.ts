// app/api/quotations/create-quotations/route.ts
import { NextRequest, NextResponse } from "next/server";
import { quotationSchema, CreateQuotationPayload } from "@/lib/validations/quotationSchema";
import { prisma } from "@/lib/prisma";
// import jwt from "jsonwebtoken"; // Auth check commented out for now
import { generateQuotationPdf, QuotationPdfParams } from "@/lib/pdf/generateQuotationPdf"; // Updated import
import { Client, Ticket } from "@prisma/client"; // Import full Client and Ticket types
import { writeFileSync, mkdirSync, existsSync } from "fs";
import path from "path";

// Helper function to generate the formatted quotation number
async function generateFormattedQuotationNumber(): Promise<string> {
  const today = new Date();
  const currentYear = today.getFullYear();
  const nextYear = (currentYear + 1).toString().slice(-2);
  const fiscalYear = today.getMonth() >= 3 ? `${currentYear.toString().slice(-2)}-${nextYear}` : `${(currentYear - 1).toString().slice(-2)}-${currentYear.toString().slice(-2)}`;
  const prefix = `BE/CH/${fiscalYear}/`;

  const latestQuotation = await prisma.quotation.findFirst({
    where: { quotationNumber: { startsWith: prefix } },
    orderBy: { quotationNumber: "desc" },
    select: { quotationNumber: true },
  });

  let serial = 1;
  if (latestQuotation) {
    const lastSerialStr = latestQuotation.quotationNumber.substring(prefix.length);
    serial = parseInt(lastSerialStr, 10) + 1;
  }
  return `${prefix}${serial.toString().padStart(3, "0")}`;
}

// Placeholder number-to-words function
function getAmountInWords(amount: number): string {
  // This should be replaced with a proper library in a real application
  // For example: import { ToWords } from 'to-words'; const toWords = new ToWords(); toWords.convert(amount);
  const fixedAmount = amount.toFixed(2);
  return `Rupees ${fixedAmount} Only`; // Basic placeholder
}


export async function POST(req: NextRequest) {
  try {
    // const token = req.cookies.get("token")?.value;
    // if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    // const { role } = jwt.verify(token, process.env.JWT_SECRET!) as { role: string };
    // if (role !== "ADMIN") return NextResponse.json({ message: "Need Admin Access" }, { status: 403 });

    const body = await req.json();
    const parsed = quotationSchema.safeParse(body);

    if (!parsed.success) {
      console.error("Validation Errors:", parsed.error.errors);
      return NextResponse.json({ message: "Invalid input", errors: parsed.error.flatten() }, { status: 400 });
    }

    const data: CreateQuotationPayload = parsed.data;

    const latestInternal = await prisma.quotation.findFirst({
      orderBy: { createdAt: "desc" },
      select: { id: true }
    });
    const internalSerial = latestInternal ? parseInt(latestInternal.id.replace("QUOT", ""), 10) + 1 : 1;
    const newInternalId = `QUOT${internalSerial.toString().padStart(2, "0")}`; // Used for internal DB ID if needed, not for PDF filename

    const newFormattedQuotationNumber = await generateFormattedQuotationNumber();

    // --- PDF Generation ---
    // 1. Fetch full client details
    const clientData = await prisma.client.findUnique({ where: { id: data.clientId } });
    if (!clientData) {
      return NextResponse.json({ message: "Client not found for PDF generation." }, { status: 404 });
    }

    // 2. Fetch ticket details if ticketId is present
    let ticketData: Ticket | null = null;
    if (data.ticketId) {
      ticketData = await prisma.ticket.findUnique({ where: { id: data.ticketId } });
    }

    // 3. Prepare items for PDF
    const pdfItems = data.items.map((item, index) => ({
      sno: item.sno || index + 1,
      description: item.productDescription || item.description,
      rcSno: item.rateCardId, // Assuming rateCardId can serve as rcSno or fetch more details if needed
      unit: item.unit,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalValue: item.totalValue,
    }));

    // 4. Construct QuotationPdfParams
    const pdfParams: QuotationPdfParams = {
      quotationNumber: newFormattedQuotationNumber,
      date: new Date(data.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }), // Format date
      validUntil: data.validUntil ? new Date(data.validUntil).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : "N/A",
      salesType: data.salesType,
      client: {
        name: clientData.name,
        address: `${clientData.contactPerson} \n ${clientData.contactPhone}`, // Example: combine fields for address
        gstin: clientData.gstn || "N/A",
        contactPerson: clientData.contactPerson,
        contactPhone: clientData.contactPhone,
        contactEmail: clientData.contactEmail || undefined,
      },
      ticket: ticketData ? { id: ticketData.id, title: ticketData.title, ticketId: ticketData.ticketId } : undefined,
      items: pdfItems,
      subtotal: data.subtotal,
      discountPercentage: data.discountPercentage,
      discountAmount: data.discountAmount,
      taxableValue: data.taxableValue,
      igstAmount: data.igstAmount,
      igstRate: 18, // Assuming a fixed 18% IGST rate for now
      netGrossAmount: data.netGrossAmount,
      netGrossAmountInWords: getAmountInWords(data.netGrossAmount),
      admin: data.admin,
      quoteBy: data.quoteBy,
      logoPath: path.resolve("./public/logo.png"), // Ensure logo.png is in public folder
      // company details can be passed or rely on defaults in generateQuotationPdf
    };

    let pdfFilePath = `/quotations/${newFormattedQuotationNumber.replace(/\//g, '_')}.pdf`; // Default/error path

    try {
        const pdfBuffer = await generateQuotationPdf(pdfParams);
        const folderPath = path.join(process.cwd(), "public", "quotations");
        if (!existsSync(folderPath)) {
          mkdirSync(folderPath, { recursive: true });
        }
        // Use formatted quotation number for filename for uniqueness and user-friendliness
        const pdfFilename = `${newFormattedQuotationNumber.replace(/\//g, '_')}.pdf`;
        const absoluteFilePath = path.join(folderPath, pdfFilename);
        writeFileSync(absoluteFilePath, pdfBuffer);
        pdfFilePath = `/quotations/${pdfFilename}`; // Relative path for DB
        console.log(`PDF generated and saved to ${absoluteFilePath}`);
    } catch (pdfError: any) {
        console.error("Error generating or saving PDF:", pdfError);
        // Decide if saving quotation should proceed without PDF or return error
        // For now, we'll save quotation with a note that PDF failed, or use a placeholder path.
        // Or, return an error immediately:
        // return NextResponse.json({ message: "Failed to generate PDF.", error: pdfError.message }, { status: 500 });
        pdfFilePath = "/quotations/PDF_GENERATION_FAILED.pdf"; // Fallback PDF path
    }


    // Save Quotation in DB
    const quotation = await prisma.quotation.create({
      data: {
        id: newInternalId, // Still using internal QUOTXX for DB primary key
        quotationNumber: newFormattedQuotationNumber,
        name: data.name, // This is the quotation title/description
        clientId: data.clientId,
        ticketId: data.ticketId,
        pdfUrl: pdfFilePath, // Use the actual path or fallback
        items: data.items as any, // Prisma expects Json
        status: data.status,
        salesType: data.salesType,
        validUntil: data.validUntil ? new Date(data.validUntil) : null,
        admin: data.admin,
        quoteBy: data.quoteBy,
        serialNumber: data.serialNumber, // Make sure this is included if it's a separate field
        discountPercentage: data.discountPercentage,
        discountAmount: data.discountAmount,
        subtotal: data.subtotal,
        taxableValue: data.taxableValue,
        igstAmount: data.igstAmount,
        netGrossAmount: data.netGrossAmount,
      },
    });

    // Update WorkStage if ticketId is present
    if (data.ticketId && ticketData) { // Ensure ticketData was fetched
      const workStageData = {
        quoteNo: newFormattedQuotationNumber,
        quoteTaxable: data.taxableValue,
        quoteAmount: data.netGrossAmount,
        stateName: ticketData.workStage?.stateName || "N/A",
        adminName: ticketData.workStage?.adminName || data.admin || "N/A",
        clientName: clientData.name,
        siteName: ticketData.workStage?.siteName || "N/A",
        dateReceived: ticketData.workStage?.dateReceived || new Date(),
        workStatus: ticketData.workStage?.workStatus || "Pending",
        approval: ticketData.workStage?.approval || "Pending",
        poStatus: ticketData.workStage?.poStatus || false,
        poNumber: ticketData.workStage?.poNumber || "N/A",
        jcrStatus: ticketData.workStage?.jcrStatus || false,
        agentName: ticketData.workStage?.agentName || data.quoteBy || "N/A",
      };

      if (ticketData.workStageId) {
        await prisma.workStage.update({
          where: { id: ticketData.workStageId },
          data: workStageData,
        });
      } else {
        const newWorkStage = await prisma.workStage.create({
          data: { ...workStageData, ticket: { connect: { id: data.ticketId } } },
        });
        await prisma.ticket.update({
          where: { id: data.ticketId },
          data: { workStageId: newWorkStage.id },
        });
      }
    }

    return NextResponse.json({ message: "Quotation created successfully", quotation }, { status: 201 });
  } catch (error: any) {
    console.error("Error in POST /api/quotations/create-quotations:", error);
    return NextResponse.json({ message: "Internal server error", error: error.message }, { status: 500 });
  }
}
