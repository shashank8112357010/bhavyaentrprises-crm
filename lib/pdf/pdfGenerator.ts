// lib/pdfGenerator.ts
import { PDFDocument, rgb } from 'pdf-lib';

interface RateCardDetail {
  rateCardId: string;
  quantity: number;
  gstType: number;
}

interface QuotationData {
  name: string;
  clientId: string;
  rateCardDetails: RateCardDetail[];
  salesType: string;
  validUntil?: string;
}

export async function generatePdf(data: QuotationData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([600, 800]);

  page.drawText(`Quotation: ${data.name}`, {
    x: 50,
    y: 750,
    size: 24,
    color: rgb(0, 0, 0),
  });

  page.drawText(`Client ID: ${data.clientId}`, {
    x: 50,
    y: 700,
    size: 12,
    color: rgb(0, 0, 0),
  });

  page.drawText(`Sales Type: ${data.salesType}`, {
    x: 50,
    y: 680,
    size: 12,
    color: rgb(0, 0, 0),
  });

  if (data.validUntil) {
    page.drawText(`Valid Until: ${data.validUntil}`, {
      x: 50,
      y: 660,
      size: 12,
      color: rgb(0, 0, 0),
    });
  }

  let yPosition = 640;
  data.rateCardDetails.forEach((detail, index) => {
    page.drawText(`Item ${index + 1}:`, {
      x: 50,
      y: yPosition,
      size: 12,
      color: rgb(0, 0, 0),
    });
    yPosition -= 20;
    page.drawText(`Rate Card ID: ${detail.rateCardId}`, {
      x: 70,
      y: yPosition,
      size: 10,
      color: rgb(0, 0, 0),
    });
    yPosition -= 20;
    page.drawText(`Quantity: ${detail.quantity}`, {
      x: 70,
      y: yPosition,
      size: 10,
      color: rgb(0, 0, 0),
    });
    yPosition -= 20;
    page.drawText(`GST Type: ${detail.gstType}`, {
      x: 70,
      y: yPosition,
      size: 10,
      color: rgb(0, 0, 0),
    });
    yPosition -= 20;
  });

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}
