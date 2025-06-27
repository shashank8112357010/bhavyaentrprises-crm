"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePdf = generatePdf;
// lib/pdfGenerator.ts
const pdf_lib_1 = require("pdf-lib");
async function generatePdf(data) {
    const pdfDoc = await pdf_lib_1.PDFDocument.create();
    const page = pdfDoc.addPage([600, 800]);
    page.drawText(`Quotation: ${data.name}`, {
        x: 50,
        y: 750,
        size: 24,
        color: (0, pdf_lib_1.rgb)(0, 0, 0),
    });
    page.drawText(`Client ID: ${data.clientId}`, {
        x: 50,
        y: 700,
        size: 12,
        color: (0, pdf_lib_1.rgb)(0, 0, 0),
    });
    page.drawText(`Sales Type: ${data.salesType}`, {
        x: 50,
        y: 680,
        size: 12,
        color: (0, pdf_lib_1.rgb)(0, 0, 0),
    });
    if (data.validUntil) {
        page.drawText(`Valid Until: ${data.validUntil}`, {
            x: 50,
            y: 660,
            size: 12,
            color: (0, pdf_lib_1.rgb)(0, 0, 0),
        });
    }
    let yPosition = 640;
    data.rateCardDetails.forEach((detail, index) => {
        page.drawText(`Item ${index + 1}:`, {
            x: 50,
            y: yPosition,
            size: 12,
            color: (0, pdf_lib_1.rgb)(0, 0, 0),
        });
        yPosition -= 20;
        page.drawText(`Rate Card ID: ${detail.rateCardId}`, {
            x: 70,
            y: yPosition,
            size: 10,
            color: (0, pdf_lib_1.rgb)(0, 0, 0),
        });
        yPosition -= 20;
        page.drawText(`Quantity: ${detail.quantity}`, {
            x: 70,
            y: yPosition,
            size: 10,
            color: (0, pdf_lib_1.rgb)(0, 0, 0),
        });
        yPosition -= 20;
        page.drawText(`GST Percentage: ${detail.gstPercentage}%`, {
            x: 70,
            y: yPosition,
            size: 10,
            color: (0, pdf_lib_1.rgb)(0, 0, 0),
        });
        yPosition -= 20;
    });
    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
}
