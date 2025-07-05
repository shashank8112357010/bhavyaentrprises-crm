import { NextRequest, NextResponse } from "next/server";
import { prismaWithReconnect as prisma } from "@/lib/prisma";
import { createClientSchema } from "@/lib/validations/clientSchema";
import Papa from "papaparse";


// Helper function to generate initials
const generateInitials = (name: string): string => {
  if (!name) return "";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
};

// Helper for enum normalization
const normalizeEnumValue = (value: string, validEnumValues: string[]): string => {
  if (typeof value !== "string") return "";
  const upperValue = value.toUpperCase().trim();
  if (upperValue === "NON-BANKING FINANCIAL COMPANY") return "NBFC";
  if (upperValue === "ACTIVE") return "Active";
  if (upperValue === "INACTIVE") return "Inactive";
  const match = validEnumValues.find(v => v.toUpperCase() === upperValue);
  return match || value;
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file || (!file.name.endsWith(".csv") && file.type !== "text/csv")) {
      return NextResponse.json({ error: "Please upload a valid CSV file." }, { status: 400 });
    }

    const fileText = await file.text();

    let successCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    const importErrors: Array<{ row: number; name?: string; error: string | object }> = [];

    const results = Papa.parse(fileText, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
    });

    if (results.errors?.length) {
      results.errors.forEach((err : any )=> {
        importErrors.push({ row: err.row + 1, error: err.message });
      });
      errorCount += results.errors.length;
    }

    if (!results.data || results.data.length === 0) {
      return NextResponse.json({ error: "CSV file is empty or has only headers." }, { status: 400 });
    }

    const rows = results.data as Array<Record<string, string>>;

    let clientCounter = 1;
    const latestClient = await prisma.client.findFirst({
      where: { displayId: { not: null } },
      orderBy: { displayId: "desc" },
      select: { displayId: true },
    });

    if (latestClient?.displayId) {
      const match = latestClient.displayId.match(/CLIENT-(\d+)/);
      if (match) clientCounter = parseInt(match[1]) + 1;
    }

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowIndex = i + 2;

      const name = String(row.Name || "").trim();
      const totalBranchesStr = String(row.TotalBranches || "").trim();
      const contactPerson = String(row.ContactPerson || "").trim();
      const contactPhone = String(row.ContactPhone || "").trim();
      const lastServiceDateRaw = String(row.LastServiceDate || "").trim();

      // Hard validation for minimum required values
      if (!name || name.length < 3) {
        importErrors.push({ row: rowIndex, error: "Client Name is missing or too short." });
        errorCount++;
        continue;
      }

      const totalBranchesNum = Number(totalBranchesStr);
      if (
        totalBranchesStr === "" ||
        isNaN(totalBranchesNum) ||
        !Number.isInteger(totalBranchesNum) ||
        totalBranchesNum < 0
      ) {
        importErrors.push({
          row: rowIndex,
          name,
          error: `Invalid TotalBranches: '${row.TotalBranches}'. Must be a non-negative integer.`,
        });
        errorCount++;
        continue;
      }

      if (!contactPerson || contactPerson.length < 2) {
        importErrors.push({ row: rowIndex, name, error: "Contact Person is required." });
        errorCount++;
        continue;
      }

      if (!contactPhone || contactPhone.length < 5) {
        importErrors.push({ row: rowIndex, name, error: "Contact Phone is required." });
        errorCount++;
        continue;
      }

      if (!lastServiceDateRaw) {
        importErrors.push({ row: rowIndex, name, error: "Last Service Date is required." });
        errorCount++;
        continue;
      }

      const clientData = {
        name,
        type: normalizeEnumValue(String(row.Type || ""), ["Bank", "NBFC", "Insurance", "Corporate"]),
        totalBranches: totalBranchesNum,
        contactPerson,
        contactEmail: String(row.ContactEmail || "").trim() || undefined,
        contactPhone,
        contractStatus: normalizeEnumValue(String(row.ContractStatus || ""), ["Active", "Inactive"]),
        lastServiceDate: lastServiceDateRaw,
        gstn: String(row.GSTN || "").trim() || undefined,
        initials: String(row.Initials || generateInitials(name)).trim() || "",
        state: String(row.State || "chandigarh").trim() || "chandigarh",
      };

      const validationResult = createClientSchema.safeParse(clientData);

      if (!validationResult.success) {
        errorCount++;
        importErrors.push({
          row: rowIndex,
          name,
          error: validationResult.error.flatten().fieldErrors,
        });
        continue;
      }

      const validated = validationResult.data;
      const existingClient = await prisma.client.findFirst({
        where: { name: validated.name },
      });

      if (existingClient) {
        skippedCount++;
        continue;
      }

      const displayId = `CLIENT-${clientCounter.toString().padStart(4, "0")}`;
      clientCounter++;

      try {
        await prisma.client.create({
          data: {
            ...validated,
            lastServiceDate: new Date(validated.lastServiceDate),
            displayId,
          },
        });
        successCount++;
      } catch (err: any) {
        errorCount++;
        importErrors.push({
          row: rowIndex,
          name: validated.name,
          error: err.message || "Database error during insert.",
        });
      }
    }

    return NextResponse.json({
      message: "Import complete.",
      successCount,
      skippedCount,
      errorCount,
      errors: importErrors,
    });
  } catch (error: any) {
    return NextResponse.json({
      error: "Import failed.",
      details: error.message || error.toString(),
    }, { status: 500 });
  }
}
