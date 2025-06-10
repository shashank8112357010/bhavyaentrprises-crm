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

  // Group records by bankName and bankRcNo combination to manage serial numbers properly
  const recordsByBankAndRc: { [key: string]: any[] } = {};
  for (const record of records) {
    const bankName = record.bankName || record.bank_name || "BE"; // fallback to BE
    const bankRcNo =
      record.bankRcNo || record.bank_rc_no || record.bankRCNo || "RC001"; // fallback to RC001
    const groupKey = `${bankName}-${bankRcNo}`;
    if (!recordsByBankAndRc[groupKey]) {
      recordsByBankAndRc[groupKey] = [];
    }
    recordsByBankAndRc[groupKey].push({ ...record, bankName, bankRcNo });
  }

  // Process each bank and RC combination's records
  for (const [groupKey, bankRecords] of Object.entries(recordsByBankAndRc)) {
    const [bankName, bankRcNo] = groupKey.split("-");

    // Get the latest serial number for this bank and RC combination
    const latestRateCard = await prisma.rateCard.findFirst({
      where: {
        bankName,
        bankRcNo,
      },
      orderBy: { srNo: "desc" },
      select: { srNo: true },
    });

    let currentSrNo = latestRateCard ? latestRateCard.srNo : 0;

    for (const record of bankRecords) {
      try {
        const parsed = rateCardSchema.safeParse({
          description: record.description,
          unit: record.unit,
          rate: Number(record.rate),
          bankName: record.bankName,
          bankRcNo: record.bankRcNo,
        });

        if (!parsed.success) {
          console.log("Validation failed:", parsed.error);
          duplicateCount++;
          continue;
        }

        // Auto-increment serial number for this bank
        currentSrNo++;

        // Check if this exact combination already exists
        const exists = await prisma.rateCard.findFirst({
          where: {
            description: parsed.data.description,
            bankName: parsed.data.bankName,
            bankRcNo: parsed.data.bankRcNo,
            rate: parsed.data.rate,
          },
        });

        if (exists) {
          console.log("Duplicate found:", exists);
          duplicateCount++;
          currentSrNo--; // Revert increment since we're not creating
          continue;
        }

        const newEntry = await prisma.rateCard.create({
          data: {
            ...parsed.data,
            srNo: currentSrNo,
          },
        });
        createdEntries.push(newEntry);
        successCount++;
      } catch (error) {
        console.log("Error creating entry:", error);
        duplicateCount++;
        currentSrNo--; // Revert increment since we're not creating
      }
    }
  }

  return NextResponse.json({
    message: "Upload completed",
    successCount,
    duplicateCount,
    created: createdEntries,
  });
}
