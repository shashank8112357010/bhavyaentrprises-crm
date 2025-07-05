import { NextRequest, NextResponse } from "next/server";
import { parse } from "csv-parse/sync";
import { rateCardSchema } from "@/lib/validations/rateCardSchema";
import { prismaWithReconnect as prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {



  const formData = await req.formData();
  const file = formData.get("file") as File;

  if (!file)
    return NextResponse.json(
      { message: "CSV file is required" },
      { status: 400 }
    );

  const text = await file.text();
  const records = parse(text, { columns: true, skip_empty_lines: true });

  let successCount = 0;
  let duplicateCount = 0;
  const createdEntries = [];

  // Process each record from CSV - use srNo from CSV directly
  for (const record of records) {
    try {
      const bankName = record.bankName 
      const srNo = Number(record.srNo || record.sr_no || 1); // Use srNo from CSV

      const parsed = rateCardSchema.safeParse({
        description: record.description,
        unit: record.unit,
        rate: Number(record.rate),
        bankName: bankName,
        srNo: srNo,
      });

      
      if (!parsed.success) {
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
        duplicateCount++;
        continue;
      }

      const newEntry = await prisma.rateCard.create({
        data: {
          description: parsed.data.description,
          unit: parsed.data.unit,
          rate: parsed.data.rate,
          bankName: parsed.data.bankName,
          srNo: parsed.data.srNo ? parsed.data.srNo : 1,
        },
      });
      createdEntries.push(newEntry);
      successCount++;
    } catch (error) {
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
