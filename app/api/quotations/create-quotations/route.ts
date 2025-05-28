// app/api/quotation/route.ts
import { NextRequest, NextResponse } from "next/server";
import { quotationSchema } from "@/lib/validations/quotationSchema";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { generateQuotationPdf } from "@/lib/pdf/generateQuotationHtml";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { role } = jwt.verify(token, process.env.JWT_SECRET!) as { role: string };
    if (role !== "ADMIN") return NextResponse.json({ message: "Need Admin Access" }, { status: 403 });

    const body = await req.json();
    const parsed = quotationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: "Invalid input", errors: parsed.error }, { status: 400 });
    }

    const { name, clientId, rateCardIds, ticketId } = parsed.data;

    const rateCards = await prisma.rateCard.findMany({ where: { id: { in: rateCardIds } } });
    if (rateCards.length !== rateCardIds.length) {
      return NextResponse.json({ message: "Some RateCard entries not found" }, { status: 404 });
    }

    // Compute totals
    const subtotal = rateCards.reduce((sum, r) => sum + r.rate, 0);
    const gst = subtotal * 0.18;
    const grandTotal = subtotal + gst;

    // Generate new quotation ID
    const latest = await prisma.quotation.findFirst({
      orderBy: { createdAt: "desc" },
    });
    const serial = latest ? parseInt(latest.id.replace("QUOT", "")) + 1 : 1;
    const newId = `QUOT${serial.toString().padStart(2, "0")}`;

    // Generate PDF buffer
    const pdfBuffer = await generateQuotationPdf({
      quotationId: newId,
      clientId,
      name,
      rateCards,
      subtotal,
      gst,
      grandTotal,
    });

    // Save PDF to disk
    const folderPath = path.join(process.cwd(), "public", "quotations");
    if (!existsSync(folderPath)) mkdirSync(folderPath, { recursive: true });

    const filename = `${newId}.pdf`;
    const filePath = path.join(folderPath, filename);
    writeFileSync(filePath, pdfBuffer);

    // Save in DB
    const quotation = await prisma.quotation.create({
      data: {
        id: newId,
        name,
        clientId,
        ticketId,
        pdfUrl: `/quotations/${filename}`,
        subtotal,
        gst,
        grandTotal,
      },
    });

    return NextResponse.json({ message: "Quotation created", quotation });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
