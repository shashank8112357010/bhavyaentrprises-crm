import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import Busboy from "busboy";

// ✅ FIX: Use runtime config instead of deprecated `config.api.bodyParser`
export const runtime = "nodejs"; // Optional: 'edge' or 'nodejs'
// Optional: can be added if you want dynamic rendering
// export const dynamic = "force-dynamic";

const getField = (val: any): string => {
  if (Array.isArray(val)) return val[0] || "";
  if (typeof val === "string") return val;
  return "";
};

const expenseSchema = z.object({
  amount: z.number().positive(),
  description: z.string().min(1),
  category: z.enum(["LABOR", "TRANSPORT", "MATERIAL", "OTHER"]),
  quotationId: z.string().min(1),
  ticketId: z.string().optional(),
  requester: z.string().min(1),
  paymentType: z.enum(["VCASH", "REST", "ONLINE"]),
});

async function parseFormData(
  req: NextRequest
): Promise<{ fields: Record<string, any>; filePath: string }> {
  return new Promise((resolve, reject) => {
    const busboy = Busboy({
      headers: Object.fromEntries(req.headers.entries()),
    });

    const fields: Record<string, any> = {};
    let savedFilePath = "";

    const allowedMimeTypes = ["application/pdf", "image/png", "image/jpeg"];
    const uploadDir = path.join(process.cwd(), "public", "expenses");
    fs.mkdirSync(uploadDir, { recursive: true });

    busboy.on("file", (name, file, info) => {
      const { filename, mimeType } = info;

      if (!allowedMimeTypes.includes(mimeType)) {
        reject(new Error("Only PDF, PNG, and JPEG files are allowed"));
        return;
      }

      const ext = path.extname(filename) || ".file";
      const tempFileName = `${Date.now()}-${randomUUID()}${ext}`;
      savedFilePath = path.join(uploadDir, tempFileName);

      const writeStream = fs.createWriteStream(savedFilePath);
      file.pipe(writeStream);

      writeStream.on("error", (err) => reject(err));
    });

    busboy.on("field", (name, value) => {
      fields[name] = value;
    });

    busboy.on("finish", () => {
      if (!savedFilePath) {
        reject(new Error("No file uploaded"));
        return;
      }
      resolve({ fields, filePath: savedFilePath });
    });

    busboy.on("error", reject);

    const reader = req.body?.getReader();
    if (!reader) return reject(new Error("Unable to read body stream"));

    const pump = async () => {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          busboy.end();
          break;
        }
        if (value) busboy.write(Buffer.from(value));
      }
    };

    pump().catch(reject);
  });
}

export async function POST(req: NextRequest) {
  try {
    const { fields, filePath } = await parseFormData(req);

    const formData = JSON.parse(getField(fields.data));

    const normalizedFields = {
      amount: Number(formData.amount),
      description: formData.description,
      category: formData.category,
      quotationId: formData.quotationId,
      ticketId: formData.ticketId,
      requester: formData.requester,
      paymentType: formData.paymentType,
    };

    const parsed = expenseSchema.safeParse(normalizedFields);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid data", errors: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const {
      amount,
      description,
      category,
      quotationId,
      requester,
      paymentType,
    } = parsed.data;

    const quotation = await prisma.quotation.findUnique({
      where: { id: quotationId },
      select: { id: true, ticketId: true },
    });

    if (!quotation) {
      return NextResponse.json(
        { message: "Quotation not found" },
        { status: 404 }
      );
    }

    const finalTicketId = quotation.ticketId || null;

    const latestExpense = await prisma.expense.findFirst({
      where: { quotationId },
      orderBy: { createdAt: "desc" },
    });

    let serial = 1;
    if (latestExpense) {
      const prefix = `EXPENSE${quotationId}`;
      if (latestExpense.id.startsWith(prefix)) {
        const lastSerialStr = latestExpense.id.slice(prefix.length);
        const lastSerial = parseInt(lastSerialStr);
        if (!isNaN(lastSerial)) serial = lastSerial + 1;
      }
    }

    const expenseId = `EXPENSE${quotationId}${serial
      .toString()
      .padStart(2, "0")}`;

    const finalFilename = `${expenseId}${path.extname(filePath)}`;
    const finalPath = path.join(
      process.cwd(),
      "public",
      "expenses",
      finalFilename
    );

    fs.renameSync(filePath, finalPath);

    const expense = await prisma.expense.create({
      data: {
        id: expenseId,
        customId: expenseId,
        amount,
        description,
        category,
        requester,
        paymentType,
        quotationId,
        ticketId: finalTicketId,
        pdfUrl: `/expenses/${finalFilename}`,
      },
    });

    return NextResponse.json({ message: "Expense created", expense });
  } catch (error) {
    console.error("Expense creation failed:", error);
    return NextResponse.json(
      {
        message: "Internal server error",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
