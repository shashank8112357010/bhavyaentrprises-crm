import puppeteer, { Browser } from "puppeteer"; // Import Browser type
import ejs from "ejs";
import path from "path";


interface RateCardDetail {
  rateCardId: string;
  quantity: number;
  gstPercentage: number;
}
interface ClientData { // Define a type for the client object
  name: string;
  contactPerson?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  gstn?: string | null;
}

interface QuotationPdfParams {
  quotationId: string;
  client: ClientData | null; // Allow client to be null
  name: string;
  subtotal: number;

  gst: number;
  grandTotal: number;
  rateCardDetails: RateCardDetail[];
  expectedExpense?: number;
  quoteNo?: string;
  validUntil?: string;
  // validUpto?: string; // This seemed redundant with validUntil
}

// Global variable to cache the browser instance
let browserInstance: Browser | null = null;

async function getBrowserInstance(): Promise<Browser> {
  if (browserInstance && browserInstance.isConnected()) {
    try {
      await browserInstance.version(); // Quick check if browser is still responsive
    } catch (e) {
      console.warn("Cached browser instance seems unresponsive, attempting to close and relaunch.", e);
      try {
        if (browserInstance) await browserInstance.close();
      } catch (closeError) {
        console.error("Error closing unresponsive browser instance:", closeError);
      }
      browserInstance = null; // Force relaunch
    }
  }

  if (!browserInstance) {
   
    try {
      // Launch Puppeteer browser only once and reuse (singleton pattern)
      browserInstance = await puppeteer.launch({
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--no-first-run",
          "--no-zygote",
          "--single-process",
          "--disable-gpu"
        ],
      });
      browserInstance.on('disconnected', () => {
        console.log('Browser instance disconnected event received.');
        browserInstance = null; // Clear instance on disconnect
      });
      console.log("New browser instance launched successfully.");
    } catch (launchError) {
        console.error("Failed to launch browser:", launchError);
        browserInstance = null; // Ensure no broken instance is cached
        throw launchError;
    }
  }
  return browserInstance;
}


// Converts number to words
function numberToWords(num: number): string {
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];

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
      return result.trim(); // Return early for teens
    }
    if (n > 0) {
      result += ones[n] + " ";
    }
    return result.trim();
  }

  if (num === 0) return "Zero";
  let numStr = "";
  const crores = Math.floor(num / 10000000);
  num %= 10000000;
  const lakhs = Math.floor(num / 100000);
  num %= 100000;
  const thousands = Math.floor(num / 1000);
  num %= 1000;
  const hundreds = num;

  if (crores > 0) numStr += convertHundreds(crores) + " Crore ";
  if (lakhs > 0) numStr += convertHundreds(lakhs) + " Lakh ";
  if (thousands > 0) numStr += convertHundreds(thousands) + " Thousand ";
  if (hundreds > 0) numStr += convertHundreds(hundreds);

  return numStr.trim();
}

function amountToWords(amount: number): string {
  if (amount == null || isNaN(amount)) return "Invalid Amount";
  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);
  let result = numberToWords(rupees) + " Rupees";
  if (paise > 0) {
    result += " and " + numberToWords(paise) + " Paise";
  }
  return result + " Only";
}

export async function generateQuotationPdf(params: QuotationPdfParams): Promise<Buffer> {
  let page;
  try {
    const templatePath = path.join(process.cwd(), "lib", "pdf", "templates", "quotation.ejs");
    // Preload local images as base64 to avoid network/disk fetches during PDF gen
    const fs = require('fs');
    const logoFile = path.join(process.cwd(), "public", "logo.png");
    const upiQrFile = path.join(process.cwd(), "public", "upi.png");
    let logoBase64 = null, upiQrBase64 = null;
    try {
      logoBase64 = fs.readFileSync(logoFile, { encoding: 'base64' });
    } catch (e) { logoBase64 = null; }
    try {
      upiQrBase64 = fs.readFileSync(upiQrFile, { encoding: 'base64' });
    } catch (e) { upiQrBase64 = null; }
    const logoPath = logoBase64 ? `data:image/png;base64,${logoBase64}` : '';
    const upiQrPath = upiQrBase64 ? `data:image/png;base64,${upiQrBase64}` : '';


    const today = new Date();
    let validUntilDateStr = new Date(today.getTime() + 7 * 86400000).toLocaleDateString("en-GB"); // Default: one week
    if (params.validUntil) {
        const validUntilDate = new Date(params.validUntil);
        if (!isNaN(validUntilDate.getTime())) {
            validUntilDateStr = validUntilDate.toLocaleDateString("en-GB");
        }
    }

    const templateData = {
      ...params,
      client: params.client,
      clientName: params.client?.name || "N/A",
      quotationId: params.quotationId || params.quoteNo || "PREVIEW",
      quoteNo: params.quoteNo || params.quotationId || "PREVIEW",
      date: today.toLocaleDateString("en-GB"),
      validUntil: validUntilDateStr,
      amountInWords: amountToWords(params.grandTotal || 0),
      name: params.name,
      rateCardDetails: params.rateCardDetails || [],
      // Use inlined base64 for images to avoid network/disk fetches
      logoPath,
      upiQrPath,
    };

    const html = await ejs.renderFile(templatePath, templateData);
    const browser = await getBrowserInstance();

    page = await browser.newPage();
    await page.setCacheEnabled(false); // Try disabling cache for the page

    await page.setContent(html, { waitUntil: "domcontentloaded", timeout: 30000 }); // Faster since no network resources

    await page.evaluate((title) => {
      if (document && document.title != null) { // Check if document and document.title exist
         document.title = title;
      }
    }, templateData.quotationId);

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      displayHeaderFooter: false,
      timeout: 30000, // Added timeout
      margin: {
        top: "20px",
        bottom: "20px",
        left: "15px",
        right: "15px",
      },
    });

    return Buffer.from(pdfBuffer); // Convert Uint8Array to Buffer

  } catch (error: any) {
    console.error("Error in PDF generation:", error.message, error.stack);
    // If error is related to browser launch/connection, try to close and nullify browserInstance
    if (error.message.includes("Protocol error") ||
        error.message.includes("Target closed") ||
        error.message.includes("Browser.newPage") ||
        error.message.includes("puppeteer.launch")) {
        if (browserInstance) {
            console.log("Attempting to close potentially problematic browser instance due to error.");
            try { await browserInstance.close(); } catch (closeErr: any) {
              console.error("Error closing browser instance during error handling:", closeErr.message);
            }
            browserInstance = null;
        }
    }
    throw new Error(`PDF generation failed: ${error.message}`);
  } finally {
    if (page) {
      try {
        await page.close();
      } catch (pageCloseError: any) {
        console.error("Error closing page:", pageCloseError.message);
      }
    }
    // DO NOT call browser.close() here if we are caching the instance
  }
}
