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
}
interface RateCardDetail {
  rateCardId: string;
  quantity: number;
  gstPercentage: number; // Changed from gstType to gstPercentage
}
interface QuotationPdfParams {
  quotationId: string;
  clientId: string;
  name: string;
  rateCards: RateCardEntry[];
  subtotal: number;
  clientName: string;
  gst: number;
  grandTotal: number;
  rateCardDetails: RateCardDetail[];
  expectedExpense?: number;
  quoteNo?: string;
  validUntil?: string;
}

// Function to convert number to words
function numberToWords(num: number): string {
  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
  ];
  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];
  const teens = [
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];

  function convertHundreds(n: number): string {
    let result = "";

    if (n >= 100) {
      result += ones[Math.floor(n / 100)] + " Hundred ";
      n %= 100;
    }

    if (n >= 20) {
      result += tens[Math.floor(n / 10)] + " ";
      n %= 10;
    } else if (n >= 10) {
      result += teens[n - 10] + " ";
      return result;
    }

    if (n > 0) {
      result += ones[n] + " ";
    }

    return result;
  }

  if (num === 0) return "Zero";

  const crores = Math.floor(num / 10000000);
  const lakhs = Math.floor((num % 10000000) / 100000);
  const thousands = Math.floor((num % 100000) / 1000);
  const hundreds = num % 1000;

  let result = "";

  if (crores > 0) {
    result += convertHundreds(crores) + "Crore ";
  }

  if (lakhs > 0) {
    result += convertHundreds(lakhs) + "Lakh ";
  }

  if (thousands > 0) {
    result += convertHundreds(thousands) + "Thousand ";
  }

  if (hundreds > 0) {
    result += convertHundreds(hundreds);
  }

  return result.trim();
}

function amountToWords(amount: number): string {
  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);

  let result = numberToWords(rupees) + " Rupees";

  if (paise > 0) {
    result += " and " + numberToWords(paise) + " Paise";
  }

  return result + " Only";
}

export async function generateQuotationPdf(
  params: QuotationPdfParams,
): Promise<Buffer> {
  try {
    console.log("Generating PDF with params:", JSON.stringify(params, null, 2));

    const templatePath = path.join(
      process.cwd(),
      "lib",
      "pdf",
      "templates",
      "quotation.ejs",
    );
    const logoPath = `file://${path.join(process.cwd(), "public", "logo.png")}`;
    const upiQrPath = `file://${path.join(process.cwd(), "public", "upi.png")}`;

    // Ensure all required fields have default values
    const templateData = {
      ...params,
      quotationId: params.quotationId || params.quoteNo || "PREVIEW",
      quoteNo: params.quoteNo || params.quotationId || "PREVIEW",
      date: new Date().toLocaleDateString("en-GB"),
      validUntil:
        params.validUntil ||
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(
          "en-GB",
        ),
      amountInWords: amountToWords(params.grandTotal || 0),
      rateCards: params.rateCards || [],
      rateCardDetails: params.rateCardDetails || [],
      logoPath,
      upiQrPath,
    };

    console.log("Template data prepared for PDF generation");

    const html = await ejs.renderFile(templatePath, templateData);

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfUint8Array = await page.pdf({
      format: "A4",
      printBackground: true,
    });
    await browser.close();

    return Buffer.from(pdfUint8Array);
  } catch (error) {
    console.error("Error in PDF generation:", error);
    throw new Error(`PDF generation failed: ${error.message}`);
  }
}
