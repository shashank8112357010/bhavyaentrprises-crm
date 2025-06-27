import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { renderFile } from "ejs";
import { join } from "path";
import puppeteer from "puppeteer";

const jcrPdfSchema = z.object({
  name: z.string(),
  jcrNo: z.string(),
  date: z.string(),
  quotationId: z.string().optional(), // Accept quotationId optionally
  jcrItems: z.array(
    z.object({
      description: z.string(),
      quantity: z.number(),
      remarks: z.string().optional(),
      category: z.string().optional(),
    })
  ).optional(), // jcrItems can be omitted if quotationId is present
});

export async function POST(req: NextRequest) {
  try {
   
    
    const body = await req.json();
    const parsed = jcrPdfSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid input", errors: parsed.error.flatten() },
        { status: 400 }
      );
    }

    let data = parsed.data;
    let clientDetails: { name: string; contactPerson?: string; contactEmail?: string; contactPhone?: string; gstn?: string } = { name: data.name };

    // If quotationId is provided, fetch quotation and use its items and client details
    if (data.quotationId) {
      // Dynamically import prisma to avoid SSR issues
      const { prisma } = await import("@/lib/prisma");
      const quotation = await prisma.quotation.findUnique({
        where: { id: data.quotationId },
        include: { client: true } // Include full client object
      });
      if (!quotation) {
        return NextResponse.json(
          { message: "Quotation not found" },
          { status: 404 }
        );
      }
      if (quotation.client) {
        clientDetails = {
          name: quotation.client.name,
          contactPerson: quotation.client.contactPerson,
          contactEmail: quotation.client.contactEmail || undefined,
          contactPhone: quotation.client.contactPhone,
          gstn: quotation.client.gstn || undefined,
        };
      } else {
        // Fallback if client is somehow not associated, though schema implies it should be
        clientDetails.name = data.name; // Use name from input if client relation is missing
      }

      // Parse rateCardDetails from JSON if present
      let rateCardDetailsArr: any[] = [];
      if (quotation.rateCardDetails) {
        if (typeof quotation.rateCardDetails === 'string') {
          try {
            rateCardDetailsArr = JSON.parse(quotation.rateCardDetails);
          } catch {
            rateCardDetailsArr = [];
          }
        } else if (Array.isArray(quotation.rateCardDetails)) {
          rateCardDetailsArr = quotation.rateCardDetails;
        } else {
          rateCardDetailsArr = [];
        }
      }

      
      // Fetch full RateCard details if quotationId is present
      // Define RateCard type for TypeScript
      type RateCard = { id: string; description?: string; unit?: string };
      type JcrItem = { description: string; quantity: number; remarks?: string; category?: string };
      let jcrItems: JcrItem[] = [];
      if (rateCardDetailsArr.length > 0) {
        // Fetch all needed rate cards in one query
        const rateCardIds = rateCardDetailsArr.map((item: any) => item.rateCardId).filter(Boolean);
        const rateCards: RateCard[] = await prisma.rateCard.findMany({
          where: { id: { in: rateCardIds } }
        });
        jcrItems = rateCardDetailsArr.map((item: any) => {
          const rc: RateCard | undefined = rateCards.find(rc => rc.id === item.rateCardId);
          return {
            description: (rc && rc.description) || item.description || item.name || '',
            quantity: item.quantity || 0,
            remarks: item.remarks || '',
            category: (rc && rc.unit) || item.category || '',
          };
        });
      }
      data.jcrItems = jcrItems;
    }

    if (!data.jcrItems || data.jcrItems.length === 0) {
      return NextResponse.json(
        { message: "No items to export in JCR." },
        { status: 400 }
      );
    }

    // Ensure the 'data' object that will be passed as 'jcr' to the template includes the client details.
    // The 'name' field in 'data' from parsed.data can serve as a fallback if client object is not fully populated.
    (data as any).client = clientDetails;


    const templatePath = join(process.cwd(), "lib/pdf/templates/jcr.ejs");
    const html = await renderFile(templatePath, { jcr: data });

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });
    await browser.close();

    const fileName = `${data.jcrNo.replace(/\//g, "-")}_jcr.pdf`;
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=\"${fileName}\"`,
      },
    });
  } catch (error) {
    console.error("Error generating JCR PDF:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
