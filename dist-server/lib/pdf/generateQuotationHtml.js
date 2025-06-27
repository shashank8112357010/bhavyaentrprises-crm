"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateQuotationPdf = generateQuotationPdf;
const puppeteer_1 = __importDefault(require("puppeteer"));
const ejs_1 = __importDefault(require("ejs"));
const path_1 = __importDefault(require("path"));
// Converts number to words
function numberToWords(num) {
    const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
    const teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    function convertHundreds(n) {
        let result = "";
        if (n >= 100) {
            result += ones[Math.floor(n / 100)] + " Hundred ";
            n %= 100;
        }
        if (n >= 20) {
            result += tens[Math.floor(n / 10)] + " ";
            n %= 10;
        }
        else if (n >= 10) {
            result += teens[n - 10] + " ";
            return result;
        }
        if (n > 0) {
            result += ones[n] + " ";
        }
        return result;
    }
    if (num === 0)
        return "Zero";
    const crores = Math.floor(num / 10000000);
    const lakhs = Math.floor((num % 10000000) / 100000);
    const thousands = Math.floor((num % 100000) / 1000);
    const hundreds = num % 1000;
    let result = "";
    if (crores > 0)
        result += convertHundreds(crores) + "Crore ";
    if (lakhs > 0)
        result += convertHundreds(lakhs) + "Lakh ";
    if (thousands > 0)
        result += convertHundreds(thousands) + "Thousand ";
    if (hundreds > 0)
        result += convertHundreds(hundreds);
    return result.trim();
}
function amountToWords(amount) {
    const rupees = Math.floor(amount);
    const paise = Math.round((amount - rupees) * 100);
    let result = numberToWords(rupees) + " Rupees";
    if (paise > 0)
        result += " and " + numberToWords(paise) + " Paise";
    return result + " Only";
}
async function generateQuotationPdf(params) {
    try {
        const templatePath = path_1.default.join(process.cwd(), "lib", "pdf", "templates", "quotation.ejs");
        const logoPath = `file://${path_1.default.join(process.cwd(), "public", "logo.png")}`;
        const upiQrPath = `file://${path_1.default.join(process.cwd(), "public", "upi.png")}`;
        const today = new Date();
        const oneWeekLater = new Date(today.getTime() + 7 * 86400000); // 7 days from now
        const templateData = {
            ...params,
            quotationId: params.quotationId || params.quoteNo || "PREVIEW",
            quoteNo: params.quoteNo || params.quotationId || "PREVIEW",
            date: today.toLocaleDateString("en-GB"),
            validUntil: oneWeekLater.toLocaleDateString("en-GB"),
            amountInWords: amountToWords(params.grandTotal || 0),
            rateCards: params.rateCards || [],
            name: params.name,
            rateCardDetails: params.rateCardDetails || [],
            logoPath,
            upiQrPath,
        };
        const html = await ejs_1.default.renderFile(templatePath, templateData);
        const browser = await puppeteer_1.default.launch({
            headless: true,
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });
        const page = await browser.newPage();
        // Set page title for the PDF metadata
        await page.setContent(html, { waitUntil: "networkidle0" });
        await page.evaluate((title) => {
            document.title = title;
        }, templateData.quotationId);
        const pdfBuffer = await page.pdf({
            format: "A4",
            printBackground: true,
            preferCSSPageSize: true,
            displayHeaderFooter: false,
            margin: {
                top: "20px",
                bottom: "20px",
                left: "15px",
                right: "15px",
            },
        });
        await browser.close();
        return Buffer.from(pdfBuffer);
    }
    catch (error) {
        console.error("Error in PDF generation:", error);
        throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
}
