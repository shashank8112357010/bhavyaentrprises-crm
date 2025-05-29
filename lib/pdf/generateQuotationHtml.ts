// lib/pdf/generateQuotationHtml.ts
import puppeteer from "puppeteer";
import ejs from "ejs";
import path from "path";

interface RateCardEntry {
  srNo: number;
  description: string;
  unit: string;
  rate: number;
  bankName: string;
  bankRcNo: string;
}

interface QuotationPdfParams {
  quotationId: string;
  clientId: string;
  name: string;
  rateCards: RateCardEntry[];
  subtotal: number;
  gst: number;
  grandTotal: number;
}

export async function generateQuotationPdf(
  params: QuotationPdfParams
): Promise<Buffer> {
  const templatePath = path.join(
    process.cwd(),
    "lib",
    "pdf",
    "templates",
    "quotation.ejs"
  );

  const html = await ejs.renderFile(templatePath, {
    ...params,
    date: new Date().toLocaleDateString("en-GB"),
    validUntil: new Date(
      Date.now() + 60 * 60 * 24 * 60 * 1000
    ).toLocaleDateString("en-GB"),
  });

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"], // 🚨 THIS FIXES THE CRASH
  });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });

  const pdfUint8Array = await page.pdf({ format: "A4", printBackground: true });
  await browser.close();

  return Buffer.from(pdfUint8Array); // ✅ Convert Uint8Array to Buffer
}
