import { NextRequest, NextResponse } from "next/server";
import { parse } from "csv-parse/sync";
import { rateCardSchema } from "@/lib/validations/rateCardSchema";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

export async function POST(req: NextRequest) {
  console.log("bulk api ");
  
  const token = req.cookies.get("token")?.value;
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { role } = jwt.verify(token, process.env.JWT_SECRET!) as { role: string };
  if (role !== "ADMIN") return NextResponse.json({ message: "Need Admin Access" }, { status: 403 });

  const formData = await req.formData();
  const file = formData.get("file") as File;
  console.log(file);
  
  if (!file) return NextResponse.json({ message: "CSV file is required" }, { status: 400 });

  const text = await file.text();
  const records = parse(text, { columns: true, skip_empty_lines: true });
  console.log(records);
  

  let successCount = 0;
  let duplicateCount = 0;
  const createdEntries = [];

  for (const record of records) {
    try {
      const parsed = rateCardSchema.safeParse({
        srNo: Number(record.srNo),
        description: record.description,
        unit: record.unit,
        rate: Number(record.rate),
        bankName: record.bankName,
        bankRcNo: record.bankRcNo,
      });

      if (!parsed.success) {
        duplicateCount++;
        continue;
      }

      const { srNo, bankName } = parsed.data;

      const exists = await prisma.rateCard.findFirst({
        where: {
          srNo,
          bankName,
        },
      });

      console.log(exists , "exists");
      
      if (exists) {
        duplicateCount++;
        continue;
      }

      const newEntry = await prisma.rateCard.create({ data: parsed.data });
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
