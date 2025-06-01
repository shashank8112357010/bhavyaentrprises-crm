import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClientSchema } from "@/lib/validations/clientSchema";
import * as xlsx from "xlsx";

const generateInitials = (name: string): string => {
  if (!name) return "";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    // Check for file type (optional, but good practice)
    if (
      file.type !== "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" &&
      file.type !== "application/vnd.ms-excel" && // for .xls
      !file.name.endsWith(".xlsx") &&
      !file.name.endsWith(".xls")
    ) {
      return NextResponse.json({ error: "Invalid file type. Please upload an Excel file (.xlsx or .xls)." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const workbook = xlsx.read(bytes, { type: "array", cellDates: true }); // cellDates: true to parse dates

    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const jsonData: any[] = xlsx.utils.sheet_to_json(worksheet, { header: 1 }); // header: 1 ensures first row is array of headers

    if (jsonData.length <= 1) {
      return NextResponse.json({ error: "Excel file is empty or contains only headers." }, { status: 400 });
    }

    const headers: string[] = jsonData[0].map((header: any) => String(header).trim());
    const rows = jsonData.slice(1);

    let successCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    const errors: any[] = [];

    for (let i = 0; i < rows.length; i++) {
      const rowDataArray = rows[i];
      // Skip empty rows
      if (rowDataArray.every((cell: any) => cell === null || String(cell).trim() === "")) {
        continue;
      }

      const rowObject: any = {};
      headers.forEach((header, index) => {
        rowObject[header] = rowDataArray[index];
      });

      // Data transformation and pre-validation
      let type = String(rowObject.Type || "").trim();
      if (type.toUpperCase() === "NON-BANKING FINANCIAL COMPANY") type = "NBFC";


      let contractStatus = String(rowObject.ContractStatus || "").trim();
      if (contractStatus.toUpperCase() === "ACTIVE") contractStatus = "Active";
      if (contractStatus.toUpperCase() === "INACTIVE") contractStatus = "Inactive";


      let lastServiceDate = rowObject.LastServiceDate;
      if (lastServiceDate instanceof Date) {
        // Format Date object to YYYY-MM-DD string
        const year = lastServiceDate.getFullYear();
        const month = ('0' + (lastServiceDate.getMonth() + 1)).slice(-2);
        const day = ('0' + lastServiceDate.getDate()).slice(-2);
        lastServiceDate = `${year}-${month}-${day}`;
      } else if (typeof lastServiceDate === 'number') { // Excel date serial number
         const date = xlsx.SSF.parse_date_code(lastServiceDate);
         if (date) {
            const year = date.y;
            const month = ('0' + date.m).slice(-2);
            const day = ('0' + date.d).slice(-2);
            lastServiceDate = `${year}-${month}-${day}`;
         } else {
            lastServiceDate = String(lastServiceDate); // Keep as string if parse fails
         }
      } else {
        lastServiceDate = String(lastServiceDate || "").trim();
      }


      const clientData = {
        name: String(rowObject.Name || "").trim(),
        type: type,
        totalBranches: Number(rowObject.TotalBranches),
        contactPerson: String(rowObject.ContactPerson || "").trim(),
        contactEmail: rowObject.ContactEmail ? String(rowObject.ContactEmail).trim() : null,
        contactPhone: String(rowObject.ContactPhone || "").trim(),
        contractStatus: contractStatus,
        lastServiceDate: lastServiceDate,
        GSTN: rowObject.GSTN ? String(rowObject.GSTN).trim() : null,
      };

      const validationResult = createClientSchema.safeParse(clientData);

      if (validationResult.success) {
        const { name, ...dataToCreate } = validationResult.data;

        // Check for existing client by name
        const existingClient = await prisma.client.findFirst({
          where: { name: name },
        });

        if (existingClient) {
          skippedCount++;
          continue;
        }

        const initials = generateInitials(name);
        try {
          await prisma.client.create({
            data: {
              ...dataToCreate,
              name,
              initials,
            },
          });
          successCount++;
        } catch (dbError: any) {
          errorCount++;
          errors.push({
            row: i + 2, // Excel row number (1-based index + 1 for header)
            name: clientData.name || `Row ${i + 2}`,
            errors: dbError.message || "Database error during client creation.",
          });
        }
      } else {
        errorCount++;
        errors.push({
          row: i + 2, // Excel row number
          name: clientData.name || `Row ${i + 2}`,
          errors: validationResult.error.flatten().fieldErrors,
        });
      }
    }

    return NextResponse.json({
      message: "Import process completed.",
      successCount,
      skippedCount,
      errorCount,
      errors,
    });
  } catch (error: any) {
    console.error("Import Error:", error);
    let errorMessage = "An unexpected error occurred during import.";
    if (error.message) {
        errorMessage = error.message;
    }
    // More specific error messages for known issues
    if (error instanceof TypeError && error.message.includes("Failed to parse URL from /api/client/import")) {
        errorMessage = "Internal server error: Invalid request configuration.";
    } else if (error.name === 'TypeError' && error.message.includes("formData.get is not a function")) {
        errorMessage = "Failed to parse form data. Ensure the request is correctly formatted.";
    } else if (error.name === 'Error' && error.message.includes("Unsupported file extension")) {
        errorMessage = "Invalid file type. Please upload an Excel file (.xlsx or .xls).";
    }

    return NextResponse.json({ error: errorMessage, details: error.toString() }, { status: 500 });
  }
}
