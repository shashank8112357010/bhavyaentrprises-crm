import ejs from "ejs";
import puppeteer from "puppeteer";
import path from "path";
import fs from "fs";

// Define a structure for client details
interface ClientDetails {
  name: string;
  address?: string;
  gstin?: string;
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
}

// Define for ticket information
interface TicketInfo {
  id?: string;
  title?: string;
  // Add other ticket details if needed for PDF, e.g., ticketId (formatted)
  ticketId?: string;
}

// Define the structure for each item in the quotation for the PDF
interface PdfQuotationItem {
  sno: number;
  description: string; // productDescription or description from payload.items
  rcSno?: string;       // bankRcNo from RateCard or similar from payload.items
  unit: string;
  quantity: number;
  unitPrice: number;     // rate from RateCard or unitPrice from payload.items
  totalValue: number;
}

// Define the parameters for the PDF generation function
export interface QuotationPdfParams {
  quotationNumber: string; // Formatted BE/CH/YY-YY/XXX
  date: string;            // Formatted date string (e.g., "DD-MMM-YYYY")
  validUntil?: string;      // Formatted date string or "N/A"
  salesType: string;

  client: ClientDetails;
  ticket?: TicketInfo;

  items: PdfQuotationItem[];

  subtotal: number;
  discountPercentage?: number; // e.g., 10 for 10%
  discountAmount?: number;    // Calculated discount amount
  taxableValue: number;
  igstAmount: number;          // Calculated IGST amount
  igstRate?: number;          // e.g., 18 (for display like "IGST (18%)")
  netGrossAmount: number;
  netGrossAmountInWords: string; // Pre-formatted amount in words

  admin?: string;       // Prepared by / Admin (from quotationForm.admin)
  quoteBy?: string;     // Quoted by (from quotationForm.quoteBy)

  // Company details (can be hardcoded in EJS or passed if dynamic)
  companyName?: string;
  companyAddressLine1?: string;
  companyAddressLine2?: string; // Not used in previous template, but good to have
  companyCityStateZip?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyGstin?: string;
  companyBankName?: string;
  companyBankAccount?: string;
  companyBankIfsc?: string;
  companyBankBranch?: string;

  // Paths for static assets
  logoPath: string;       // e.g., path.resolve("./public/logo.png")
  upiQrPath?: string;    // Optional UPI QR code image path

  // Terms and conditions (can be a long string or an array of strings)
  termsAndConditions?: string[];
}

// Function to generate PDF from EJS template
export async function generateQuotationPdf(params: QuotationPdfParams): Promise<Buffer> {
  try {
    const templatePath = path.resolve(process.cwd(), "lib/pdf/templates/quotation.ejs");

    if (!fs.existsSync(templatePath)) {
      throw new Error(`EJS template not found at ${templatePath}`);
    }

    const fullParams = {
      ...params,
      companyName: params.companyName || "Bhavya Enterprises",
      companyAddressLine1: params.companyAddressLine1 || "123 Business Park, Main Street",
      companyCityStateZip: params.companyCityStateZip || "Cityville, State, Zip Code - 12345",
      companyPhone: params.companyPhone || "Phone: (123) 456-7890",
      companyEmail: params.companyEmail || "Email: info@bhavyaenterprises.com",
      companyGstin: params.companyGstin || "GSTIN: 27ABCDE1234F1Z5",
      termsAndConditions: params.termsAndConditions || [
        "Payment: 100% Advance.",
        "Validity: Prices are valid for 7 days.",
        "Warranty: As per manufacturer terms.",
      ],
      companyBankName: params.companyBankName || "Example Bank Ltd.",
      companyBankAccount: params.companyBankAccount || "A/C No: 123456789012",
      companyBankIfsc: params.companyBankIfsc || "IFSC: EXBK0001234",
      companyBankBranch: params.companyBankBranch || "Main Branch, Cityville",
      // Ensure logoPath is absolute or correctly resolved if relative
      logoPath: params.logoPath.startsWith('file://') ? params.logoPath : `file://${path.resolve(params.logoPath)}`,
      upiQrPath: params.upiQrPath ? (params.upiQrPath.startsWith('file://') ? params.upiQrPath : `file://${path.resolve(params.upiQrPath)}`) : undefined,
    };

    const htmlContent = await ejs.renderFile(templatePath, fullParams);

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    const page = await browser.newPage();

    await page.setContent(htmlContent, { waitUntil: "networkidle0" });

    // Add Tailwind CSS or any other global styles if needed by referencing a <link> or <style> in EJS
    // For example, if Tailwind is used via CDN in EJS, networkidle0 should wait for it.
    // If styles are inlined or embedded, it's simpler.

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "20mm", right: "10mm", bottom: "20mm", left: "10mm" },
    });

    await browser.close();
    return pdfBuffer;
  } catch (error: any) {
    console.error("Error generating PDF:", error);
    throw new Error(`Failed to generate PDF: ${error.message}`);
  }
}
