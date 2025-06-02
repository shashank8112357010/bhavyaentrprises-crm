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

    // Check for file type
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
      header: true, // Uses the first row as keys
      skipEmptyLines: true,
      dynamicTyping: false, // All values are strings initially
    });

    if (results.errors && results.errors.length > 0) {
      results.errors.forEach((err:any) => {
        importErrors.push({
          row: err.row + 1, // PapaParse is 0-indexed for rows if header is true
          error: err.message,
        });
      });
      errorCount += results.errors.length;
    }

    if (!results.data || results.data.length === 0) {
      return NextResponse.json({ error: "CSV file is empty or contains only headers." }, { status: 400 });
    }

    const rows = results.data as Array<Record<string, string>>;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowIndex = i + 2; // CSV row number (1-based index + 1 for header)

      const name = String(row.Name || "").trim();
      if (!name) {
        importErrors.push({ row: rowIndex, name: "Unknown", error: "Client Name is required." });
        errorCount++;
        continue;
      }

      let totalBranchesNum: number;
      const totalBranchesStr = String(row.TotalBranches || "").trim();
      if (totalBranchesStr !== "") {
        totalBranchesNum = Number(totalBranchesStr);
        if (isNaN(totalBranchesNum) || !Number.isInteger(totalBranchesNum) || totalBranchesNum < 0) {
          importErrors.push({ row: rowIndex, name: name, error: `Invalid value for TotalBranches: '${row.TotalBranches}'. Must be a non-negative integer.` });
          errorCount++;
          continue;
        }
      } else {
        importErrors.push({ row: rowIndex, name: name, error: "TotalBranches is required and must be a non-negative integer." });
        errorCount++;
        continue;
      }

      const contactPerson = String(row.ContactPerson || "").trim();
      if (!contactPerson) {
        importErrors.push({ row: rowIndex, name: name, error: "Contact Person is required." });
        errorCount++;
        continue;
      }

      const contactPhone = String(row.ContactPhone || "").trim();
      if (!contactPhone) {
        importErrors.push({ row: rowIndex, name: name, error: "Contact Phone is required." });
        errorCount++;
        continue;
      }

      const lastServiceDate = String(row.LastServiceDate || "").trim();
      if (!lastServiceDate) {
          importErrors.push({ row: rowIndex, name: name, error: "Last Service Date is required." });
          errorCount++;
          continue;
      }


      const clientData = {
        name: name,
        type: normalizeEnumValue(String(row.Type || ""), ["Bank", "NBFC", "Insurance", "Corporate"]),
        totalBranches: totalBranchesNum,
        contactPerson: contactPerson,
        contactEmail: String(row.ContactEmail || "").trim() === "" ? undefined : String(row.ContactEmail).trim(),
        contactPhone: contactPhone,
        contractStatus: normalizeEnumValue(String(row.ContractStatus || ""), ["Active", "Inactive"]),
        lastServiceDate: lastServiceDate,
        gstn: String(row.GSTN || "").trim() === "" ? undefined : String(row.GSTN).trim(),
        initials: String(row.Initials || "").trim() === "" ? generateInitials(name) : String(row.Initials).trim(),
      };

      const validationResult = createClientSchema.safeParse(clientData);

      if (validationResult.success) {
        // Destructure validated data to ensure type safety with Prisma
        const { name: validatedName, ...dataToCreate } = validationResult.data;

        const existingClient = await prisma.client.findFirst({
          where: { name: validatedName },
        });

        if (existingClient) {
          skippedCount++;
          continue;
        }

        // Initials are now optional in schema, but we ensure they are set if not provided in CSV
        const finalInitials = dataToCreate.initials || generateInitials(validatedName);

        try {
          await prisma.client.create({
            data: {
              ...dataToCreate,
              name: validatedName,
              initials: finalInitials, // Use validated/generated initials
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
          name: name, // Use original name for error reporting if validation fails early
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
    console.error("Import Error:", error);
    let errorMessage = "An unexpected error occurred during import.";
    if (error.message) {
      errorMessage = error.message;
    }
    // Specific error messages can be refined here
    if (error instanceof TypeError && error.message.includes("formData.get is not a function")) {
        errorMessage = "Failed to parse form data. Ensure the request is correctly formatted.";
    }

    return NextResponse.json({ error: errorMessage, details: error.toString() }, { status: 500 });
  }
}
