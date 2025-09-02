import puppeteer, { Browser } from "puppeteer"; // Import Browser type
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
  rateCards: RateCardEntry[];
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
      try {
        if (browserInstance) await browserInstance.close();
      } catch (closeError) {
        // Error closing unresponsive browser instance, ignore and continue
      }
      browserInstance = null; // Force relaunch
    }
  }

  if (!browserInstance) {
   
    try {
      browserInstance = await puppeteer.launch({
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage", // Often recommended for serverless/containerized environments
          "--disable-accelerated-2d-canvas",
          "--no-first-run",
          "--no-zygote",
          "--single-process", // May reduce memory usage in some environments, test impact
          "--disable-gpu"
        ],
      });
      browserInstance.on('disconnected', () => {
        browserInstance = null; // Clear instance on disconnect
      });
    } catch (launchError) {
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
    const logoPath = path.join(process.cwd(), "public", "bhavyalogo.png").replace(/\\/g, '/');
    const upiQrPath = path.join(process.cwd(), "public", "upi.png").replace(/\\/g, '/');

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
      rateCards: params.rateCards || [],
      name: params.name,
      rateCardDetails: params.rateCardDetails || [],
      logoPath: `file://${logoPath}`,
      upiQrPath: `file://${upiQrPath}`,
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
    };

    // Configure EJS options with a custom escape function
    const ejsOptions = {
      escape: (unsafe: string) => {
        if (unsafe === undefined || unsafe === null) return '';
        return String(unsafe)
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#039;");
      },
      // Add EJS options to control variable behavior
      strict: false,
      rmWhitespace: false,
      _with: false, // Don't use 'with' scope
      localsName: 'data', // Use 'data.' prefix for all variables
      async: false,
      debug: false,
      compileDebug: process.env.NODE_ENV !== 'production'
    };

    const html = await ejs.renderFile(templatePath, templateData, ejsOptions);
    const browser = await getBrowserInstance();

    page = await browser.newPage();
    await page.setCacheEnabled(false); // Try disabling cache for the page

    await page.setContent(html, { waitUntil: "networkidle0", timeout: 30000 }); // Added timeout

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
    // If error is related to browser launch/connection, try to close and nullify browserInstance
    if (error.message.includes("Protocol error") ||
        error.message.includes("Target closed") ||
        error.message.includes("Browser.newPage") ||
        error.message.includes("puppeteer.launch")) {
        if (browserInstance) {
            try { await browserInstance.close(); } catch (closeErr: any) {
              // Ignore browser close errors during error handling
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
        // Ignore page close errors
      }
    }
    // DO NOT call browser.close() here if we are caching the instance
  }
}
