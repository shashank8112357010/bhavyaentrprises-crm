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
  approvalName: z.string().optional(),
});

async function parseFormData(
  req: NextRequest,
): Promise<{
  fields: Record<string, any>;
  filePath: string;
  screenshotPath?: string;
}> {
  return new Promise((resolve, reject) => {
    const busboy = Busboy({
      headers: Object.fromEntries(req.headers.entries()),
    });

    const fields: Record<string, any> = {};
    let savedFilePath = "";
    let savedScreenshotPath = "";

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
      const filePath = path.join(uploadDir, tempFileName);

      if (name === "file") {
        // Main receipt/bill file
        savedFilePath = filePath;
      } else if (name === "screenshot") {
        // Screenshot file for online payments
        savedScreenshotPath = filePath;
      }

      const writeStream = fs.createWriteStream(filePath);
      file.pipe(writeStream);

      writeStream.on("error", (err) => reject(err));
    });

    busboy.on("field", (name, value) => {
      fields[name] = value;
    });

    busboy.on("finish", () => {
      if (!savedFilePath) {
        reject(new Error("No main file uploaded"));
        return;
      }
      resolve({
        fields,
        filePath: savedFilePath,
        screenshotPath: savedScreenshotPath || undefined,
      });
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
    const { fields, filePath, screenshotPath } = await parseFormData(req);

    const formData = JSON.parse(getField(fields.data));

    const normalizedFields = {
      amount: Number(formData.amount),
      description: formData.description,
      category: formData.category,
      quotationId: formData.quotationId,
      ticketId: formData.ticketId,
      requester: formData.requester,
      paymentType: formData.paymentType,
      approvalName: formData.approvalName,
    };

    const parsed = expenseSchema.safeParse(normalizedFields);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid data", errors: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const {
      amount,
      description,
      category,
      quotationId,
      requester,
      paymentType,
      approvalName,
    } = parsed.data;

    const quotation = await prisma.quotation.findUnique({
      where: { id: quotationId },
      select: { id: true, ticketId: true },
    });

    if (!quotation) {
      return NextResponse.json(
        { message: "Quotation not found" },
        { status: 404 },
      );
    }

    const finalTicketId = quotation.ticketId || null;

    // Generate new expense display ID (e.g., EXPENSE/January/0001)
    const currentDate = new Date();
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const currentMonth = monthNames[currentDate.getMonth()];

    const latestExpense = await prisma.expense.findFirst({
      where: { displayId: { not: null } },
      orderBy: { createdAt: "desc" },
    });

    let serial = 1;
    const prefix = `EXPENSE/${currentMonth}/`;
    if (latestExpense && latestExpense.displayId) {
      // Check if the latest expense is from current month
      if (latestExpense.displayId.startsWith(prefix)) {
        const numericPartMatch = latestExpense.displayId
          .substring(prefix.length)
          .match(/^\d+/);
        if (numericPartMatch) {
          serial = parseInt(numericPartMatch[0], 10) + 1;
        }
      }
      // If it's from a different month, start from 1
    }

    const expenseDisplayId = `${prefix}${serial.toString().padStart(4, "0")}`;

    // Create unique customId using UUID to avoid conflicts
    let expenseId: string;
    let attempts = 0;
    const maxAttempts = 5;
    
    do {
      expenseId = `EXPENSE${randomUUID().substring(0, 8)}`;
      attempts++;
      
      // Check if this customId already exists
      const existingExpense = await prisma.expense.findUnique({
        where: { customId: expenseId }
      });
      
      if (!existingExpense) break;
      
    } while (attempts < maxAttempts);
    
    if (attempts >= maxAttempts) {
      throw new Error('Unable to generate unique expense ID after multiple attempts');
    }

    const finalFilename = `${expenseId}${path.extname(filePath)}`;
    const finalPath = path.join(
      process.cwd(),
      "public",
      "expenses",
      finalFilename,
    );

    fs.renameSync(filePath, finalPath);

    // Handle screenshot file if provided
    let screenshotUrl = null;
    if (screenshotPath) {
      const screenshotFilename = `${expenseId}-screenshot${path.extname(screenshotPath)}`;
      const finalScreenshotPath = path.join(
        process.cwd(),
        "public",
        "expenses",
        screenshotFilename,
      );
      fs.renameSync(screenshotPath, finalScreenshotPath);
      screenshotUrl = `/expenses/${screenshotFilename}`;
    }

    console.log(`Creating expense with customId: ${expenseId}, displayId: ${expenseDisplayId}`);
    
    const expense = await prisma.expense.create({
      data: {
        displayId: expenseDisplayId,
        customId: expenseId,
        amount,
        description,
        category,
        requester,
        paymentType,
        quotationId,
        ticketId: finalTicketId,
        pdfUrl: `/expenses/${finalFilename}`,
        screenshotUrl,
        approvalName,
      },
    });

    console.log(`Successfully created expense with ID: ${expense.id}`);

    return NextResponse.json({ message: "Expense created", expense });
  } catch (error) {
    console.error("Expense creation failed:", error);
    return NextResponse.json(
      {
        message: "Internal server error",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
