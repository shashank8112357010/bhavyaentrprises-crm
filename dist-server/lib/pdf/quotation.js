"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePDF = generatePDF;
// lib/pdf/quotation.ts
const pdf_lib_1 = require("pdf-lib");
// Renamed function to generatePDF to match import attempts
async function generatePDF({ name, rateCards }) {
    const pdfDoc = await pdf_lib_1.PDFDocument.create();
    const page = pdfDoc.addPage();
    const font = await pdfDoc.embedFont(pdf_lib_1.StandardFonts.Helvetica);
    page.setFont(font);
    page.drawText(`Quotation for: ${name}`, { x: 50, y: 750, size: 16 });
    let y = 700;
    for (const rc of rateCards) {
        const line = `${rc.srNo}. ${rc.description} - ${rc.unit} - ₹${rc.rate} - ${rc.bankName}`;
        page.drawText(line, { x: 50, y, size: 12 });
        y -= 20;
    }
    return await pdfDoc.save();
}
