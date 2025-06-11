import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClientSchema } from "@/lib/validations/clientSchema";
import Papa from "papaparse";

// Helper function to generate initials from a name string
const generateInitials = (name: string): string => {
  if (!name) return "";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
};

// Helper function to normalize enum values, converting to uppercase and mapping specific cases
const normalizeEnumValue = (value: string, validEnumValues: string[]): string => {
  if (typeof value !== 'string') return "";
  const upperValue = value.toUpperCase().trim();
  if (upperValue === "NON-BANKING FINANCIAL COMPANY") return "NBFC";
  if (upperValue === "ACTIVE") return "Active";
  if (upperValue === "INACTIVE") return "Inactive";
  // Add other specific mappings if needed
  if (validEnumValues.map(v => v.toUpperCase()).includes(upperValue)) {
    // Return the original casing if it matches a valid enum value (e.g. "Bank" vs "BANK")
    const originalCaseMatch = validEnumValues.find(v => v.toUpperCase() === upperValue);
    if (originalCaseMatch) return originalCaseMatch;
  }
  return value; // Return original value if no specific mapping or direct match
};


export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload a CSV file (.csv)." },
        { status: 400 }
      );
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
      results.errors.forEach((err: any) => {
        importErrors.push({
          row: err.row + 1,
          error: err.message,
        });
      });
      errorCount += results.errors.length;
    }

    if (!results.data || results.data.length === 0) {
      return NextResponse.json({ error: "CSV file is empty or contains only headers." }, { status: 400 });
    }

    const rows = results.data as Array<Record<string, string>>;

    // Track display ID counter during this import
    let clientCounter = 1;
    const latestClient = await prisma.client.findFirst({
      where: { displayId: { not: null } },
      orderBy: { displayId: "desc" },
      select: { displayId: true },
    });

    if (latestClient?.displayId) {
      const idMatch = latestClient.displayId.match(/CLIENT-(\d+)$/);
      if (idMatch) {
        clientCounter = parseInt(idMatch[1]) + 1;
      }
    }

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowIndex = i + 2;

      const name = String(row.Name || "").trim();
      if (!name) {
        importErrors.push({ row: rowIndex, name: "Unknown", error: "Client Name is required." });
        errorCount++;
        continue;
      }

      const totalBranchesStr = String(row.TotalBranches || "").trim();
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
          error: `Invalid value for TotalBranches: '${row.TotalBranches}'. Must be a non-negative integer.`,
        });
        errorCount++;
        continue;
      }

      const contactPerson = String(row.ContactPerson || "").trim();
      if (!contactPerson) {
        importErrors.push({ row: rowIndex, name, error: "Contact Person is required." });
        errorCount++;
        continue;
      }

      const contactPhone = String(row.ContactPhone || "").trim();
      if (!contactPhone) {
        importErrors.push({ row: rowIndex, name, error: "Contact Phone is required." });
        errorCount++;
        continue;
      }

      const lastServiceDateRaw = String(row.LastServiceDate || "").trim();
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
        lastServiceDate: lastServiceDateRaw, // pass string for schema
        gstn: String(row.GSTN || "").trim() || undefined,
        initials: String(row.Initials || "").trim() || generateInitials(name),
      };

      const validationResult = createClientSchema.safeParse(clientData);

      if (validationResult.success) {
        const { name: validatedName, ...dataToCreate } = validationResult.data;

        const existingClient = await prisma.client.findFirst({
          where: { name: validatedName },
        });

        if (existingClient) {
          skippedCount++;
          continue;
        }

        const finalInitials = dataToCreate.initials || generateInitials(validatedName);

        let displayId = `CLIENT-${clientCounter.toString().padStart(4, "0")}`;
        clientCounter++; // increment for next row

        try {
          await prisma.client.create({
            data: {
              ...dataToCreate,
              name: validatedName,
              initials: finalInitials,
              lastServiceDate: new Date(dataToCreate.lastServiceDate),
              displayId,
            },
          });
          successCount++;
        } catch (dbError: any) {
          errorCount++;
          importErrors.push({
            row: rowIndex,
            name: validatedName,
            error: dbError.message || "Database error during client creation.",
          });
        }
      } else {
        errorCount++;
        importErrors.push({
          row: rowIndex,
          name,
          error: validationResult.error.flatten().fieldErrors,
        });
      }
    }

    return NextResponse.json({
      message: "Import process completed.",
      successCount,
      skippedCount,
      errorCount,
      errors: importErrors,
    });
  } catch (error: any) {
    console.error("Client import error:", error);
    let errorMessage = "An unexpected error occurred during import.";

    if (error instanceof TypeError && error.message.includes("formData.get is not a function")) {
      errorMessage = "Failed to parse form data. Ensure the request is correctly formatted.";
    } else if (error.message) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: error.toString(),
      },
      { status: 500 }
    );
  }
}

