import puppeteer from "puppeteer";
import ejs from "ejs";
import path from "path";

interface RateCardEntry {
  id: string;
  srNo: number;
  description: string;
  unit: string;
  rate: number;
  bankName: string;
  bankRcNo: string;
}
interface RateCardDetail {
  rateCardId: string;
  quantity: number;
  gstType: number;
}
interface QuotationPdfParams {
  quotationId: string;
  clientId: string;
  name: string;
  rateCards: RateCardEntry[];
  subtotal: number;
  gst: number;
  grandTotal: number;
  rateCardDetails: RateCardDetail[]; // ✅ Fixed
}

export async function generateQuotationPdf(
  params: QuotationPdfParams
): Promise<Buffer> {
  const templatePath = path.join(process.cwd(), "lib", "pdf", "templates", "quotation.ejs");
  const logoPath = `file://${path.join(process.cwd(), "public", "logo.png")}`;
  const upiQrPath = `file://${path.join(process.cwd(), "public", "upi.png")}`;

  const html = await ejs.renderFile(templatePath, {
    ...params,
    date: new Date().toLocaleDateString("en-GB"),
    validUntil: new Date(Date.now() + 60 * 60 * 24 * 60 * 1000).toLocaleDateString("en-GB"),
    logoPath,
    upiQrPath,
  });

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });

  const pdfUint8Array = await page.pdf({ format: "A4", printBackground: true });
  await browser.close();

  return Buffer.from(pdfUint8Array);
}
