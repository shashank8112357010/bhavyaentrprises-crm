import { NextRequest, NextResponse } from "next/server";
import { prismaWithReconnect as prisma } from "@/lib/prisma";
import { getQuotationById } from "@/lib/services/quotations";
import { getTicketById } from "@/lib/services/ticket";
import { renderFile } from "ejs";
import puppeteer from "puppeteer";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const { quotationId } = await req.json();
    if (!quotationId) {
      return NextResponse.json({ error: "Missing quotationId" }, { status: 400 });
    }

    // Fetch quotation and related ticket
    const quotation: any = await getQuotationById(quotationId);
    if (!quotation) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
    }
    const ticket = quotation.ticketId ? await getTicketById(quotation.ticketId) : null;

    // Parse rateCardDetails as JSON if needed
    let rateCardItems: any[] = [];
    if (quotation.rateCardDetails) {
      if (typeof quotation.rateCardDetails === 'string') {
        try {
          rateCardItems = JSON.parse(quotation.rateCardDetails);
        } catch {
          rateCardItems = [];
        }
      } else if (Array.isArray(quotation.rateCardDetails)) {
        rateCardItems = quotation.rateCardDetails;
      }
    }


    // Fetch full RateCard details for all rateCardIds
    const rateCardIds = rateCardItems.map((item: any) => item.rateCardId).filter(Boolean);
    let rateCardDetailsMap: Record<string, any> = {};
    if (rateCardIds.length > 0) {
      const rateCards = await prisma.rateCard.findMany({
        where: { id: { in: rateCardIds } },
      });
      rateCardDetailsMap = rateCards.reduce((acc: any, rc: any) => {
        acc[rc.id] = rc;
        return acc;
      }, {});
    }
    

    // Map data to JCR format with merged RC details
    const jcrData = {
      jcrNo: quotation.quoteNo,
      client: quotation.client ? {
        name: quotation.client.name,
        contactPerson: quotation.client.contactPerson,
        contactEmail: quotation.client.contactEmail,
        contactPhone: quotation.client.contactPhone,
        gstn: quotation.client.gstn,
      } : { name: "Client N/A" }, // Fallback if client somehow not populated
      date: quotation.createdAt,
      jcrItems: (rateCardItems || []).map((item: any, idx: number) => {
        const rcDetail = rateCardDetailsMap[item.rateCardId] || {};
        return {
          srNo: idx + 1,
          description: rcDetail.description || '',
          quantity: item.quantity,
          remarks: item.remarks || rcDetail.remarks || '',
          category: rcDetail.category || '',
          unit: rcDetail.unit || '',
          rate: rcDetail.rate || '',
          bankName: rcDetail.bankName || '',
          gstPercentage: item.gstPercentage || rcDetail.gstPercentage || '',
        };
      }),
      ticketTitle: (ticket as any)?.title || "",
    };


    // Render EJS template
    const templatePath = path.join(process.cwd(), "lib/pdf/templates/jcr.ejs");
    const html = await renderFile(templatePath, { jcr: jcrData });

    // Generate PDF with Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });
    await browser.close();

    // Sanitize filename
    const filename = `JCR-${jcrData.jcrNo.replace(/\//g, "-")}.pdf`;

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=\"${filename}\"`,
      },
    });
  } catch (error: any) {
    console.error("JCR PDF export error:", error);
    return NextResponse.json({ error: error.message || "Failed to export JCR PDF" }, { status: 500 });
  }
}
