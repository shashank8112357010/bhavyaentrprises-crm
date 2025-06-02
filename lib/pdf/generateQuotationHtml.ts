import puppeteer from "puppeteer";
import ejs from "ejs";
import path from "path";

interface RateCardEntry { // Assuming this is the full RateCard model structure from Prisma
  id: string;
  srNo?: number; // Optional as it might not be used in PDF directly beyond sorting/display
  description: string;
  unit: string;
  rate: number;
  // bankName?: string; // Not typically shown on quotation PDF to client
  // bankRcNo?: string; // Not typically shown
}

interface RateCardDetail { // This comes from the quotation's rateCardDetails field
  rateCardId: string;
  quantity: number;
  gstType: number; // This is the GST rate, e.g., 18 for 18%
}

interface ClientPdfParams { // Information about the client for the PDF
  name: string;
  address?: string; // Assuming client model has address
  gstin?: string;   // Assuming client model has GSTIN
  // Add other client fields as needed for the PDF
}

interface QuotationPdfParams {
  quotationId: string; // QUOTXXX
  quotationName: string; // The overall name/title of the quotation
  client: ClientPdfParams; // Client object
  rateCardsFull: RateCardEntry[]; // Array of FULL rate card objects used in this quotation
  rateCardDetails: RateCardDetail[]; // Details like quantity, gstType for each rate card item
  subTotal: number; // Overall subtotal (sum of itemSubtotals)
  gst: number;      // Overall GST amount (sum of itemGstAmounts)
  grandTotal: number; // Overall grand total
  currency: string;
  notes?: string;
  expiryDate?: Date | string;
  quotationDate: Date | string; // The actual date of the quotation
  // status?: string; // Optional: if status needs to be displayed
}

// This is the structure for each line item passed to the EJS template
interface EjsLineItem {
  srNo: number;
  description: string;
  unit: string;
  quantity: number;
  rate: number;
  gstRate: number; // e.g., 18
  itemSubtotal: number; // rate * quantity
  itemGstAmount: number; // itemSubtotal * (gstRate / 100)
  itemGrandTotal: number; // itemSubtotal + itemGstAmount
}


export async function generateQuotationPdf(
  params: QuotationPdfParams
): Promise<Buffer> {
  const templatePath = path.join(process.cwd(), "lib", "pdf", "templates", "quotation.ejs");
  const logoPath = `file://${path.join(process.cwd(), "public", "logo.png")}`;
  const upiQrPath = `file://${path.join(process.cwd(), "public", "upi.png")}`;

  // Prepare line items for EJS template
  const items: EjsLineItem[] = params.rateCardDetails.map((detail, index) => {
    const rateCard = params.rateCardsFull.find(rc => rc.id === detail.rateCardId);
    if (!rateCard) {
      // This case should ideally be prevented by validation before calling generateQuotationPdf
      throw new Error(`Rate card with ID ${detail.rateCardId} not found in rateCardsFull array.`);
    }
    const itemSubtotal = rateCard.rate * detail.quantity;
    const itemGstAmount = itemSubtotal * (detail.gstType / 100);
    const itemGrandTotal = itemSubtotal + itemGstAmount;

    return {
      srNo: index + 1, // Or use rateCard.srNo if available and preferred
      description: rateCard.description,
      unit: rateCard.unit,
      quantity: detail.quantity,
      rate: rateCard.rate,
      gstRate: detail.gstType,
      itemSubtotal,
      itemGstAmount,
      itemGrandTotal,
    };
  });

  const ejsData = {
    ...params,
    items, // Pass the processed items array
    quotationDate: new Date(params.quotationDate).toLocaleDateString("en-GB"),
    expiryDate: params.expiryDate ? new Date(params.expiryDate).toLocaleDateString("en-GB") : null,
    // Remove rateCardsFull and rateCardDetails from top level if `items` replaces their direct use in EJS
    // For now, keeping them in case EJS still uses them for other small parts, but `items` should be primary for the table
    logoPath,
    upiQrPath,
  };
  // delete ejsData.rateCardsFull; // Optional: clean up if not used directly in EJS
  // delete ejsData.rateCardDetails; // Optional: clean up

  const html = await ejs.renderFile(templatePath, ejsData);

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
