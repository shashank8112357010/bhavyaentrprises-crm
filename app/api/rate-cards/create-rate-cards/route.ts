import { NextRequest, NextResponse } from "next/server";
import { parse } from "csv-parse/sync";
import { rateCardSchema } from "@/lib/validations/rateCardSchema";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

export async function POST(req: NextRequest) {
  console.log("bulk api");

  const token = req.cookies.get("token")?.value;
  if (!token)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { role } = jwt.verify(token, process.env.JWT_SECRET!) as {
    role: string;
  };
  if (role !== "ADMIN")
    return NextResponse.json({ message: "Need Admin Access" }, { status: 403 });

  const formData = await req.formData();
  const file = formData.get("file") as File;
  console.log(file);

  if (!file)
    return NextResponse.json(
      { message: "CSV file is required" },
      { status: 400 },
    );

  const text = await file.text();
  const records = parse(text, { columns: true, skip_empty_lines: true });
  console.log(records);

  let successCount = 0;
  let duplicateCount = 0;
  const createdEntries = [];

  // Process each record from CSV - use srNo from CSV directly
  for (const record of records) {
    try {
      const bankName = record.bankName || record.bank_name || "BE"; // fallback to BE
      const srNo = Number(record.srNo || record.sr_no || 1); // Use srNo from CSV

      const parsed = rateCardSchema.safeParse({
        description: record.description,
        unit: record.unit,
        rate: Number(record.rate),
        bankName: bankName,
        srNo: srNo,
      });

      if (!parsed.success) {
        console.log("Validation failed:", parsed.error);
        duplicateCount++;
        continue;
      }

      // Check if this exact combination already exists
      const exists = await prisma.rateCard.findFirst({
        where: {
          description: parsed.data.description,
          bankName: parsed.data.bankName,
          rate: parsed.data.rate,
          srNo: parsed.data.srNo,
        },
      });

      if (exists) {
        console.log("Duplicate found:", exists);
        duplicateCount++;
        continue;
      }

      const newEntry = await prisma.rateCard.create({
        data: {
          description: parsed.data.description,
          unit: parsed.data.unit,
          rate: parsed.data.rate,
          bankName: parsed.data.bankName,
          srNo: parsed.data.srNo,
        },
      });
      createdEntries.push(newEntry);
      successCount++;
    } catch (error) {
      console.log("Error creating entry:", error);
      duplicateCount++;
    }
  }

  return NextResponse.json({
    message: "Upload completed",
    successCount,
    duplicateCount,
    created: createdEntries,
  });
}
