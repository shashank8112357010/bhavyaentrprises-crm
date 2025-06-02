// lib/pdf/quotation.ts
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

// Renamed function to generatePDF to match import attempts
export async function generatePDF({ name, rateCards }: { name: string, rateCards: any[] }) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
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
