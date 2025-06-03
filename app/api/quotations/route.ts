// app/api/quotations/route.ts
import { NextRequest, NextResponse } from "next/server";
import { quotationSchema, CreateQuotationPayload } from "@/lib/validations/quotationSchema";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { generateQuotationPdf } from "@/lib/pdf/generateQuotationHtml";
import { RateCard, Prisma, QuotationStatus } from "@prisma/client"; // Import Prisma, QuotationStatus
import { writeFileSync, mkdirSync, existsSync } from "fs";
import path from "path";


// Helper function to generate the formatted quotation number (from create-quotations)
async function generateFormattedQuotationNumber(): Promise<string> {
  const today = new Date();
  const currentYear = today.getFullYear();
  const nextYear = (currentYear + 1).toString().slice(-2);
  const fiscalYear = today.getMonth() >= 3 ? `${currentYear.toString().slice(-2)}-${nextYear}` : `${(currentYear - 1).toString().slice(-2)}-${currentYear.toString().slice(-2)}`;
  const prefix = `BE/CH/${fiscalYear}/`;
  const latestQuotation = await prisma.quotation.findFirst({
    where: { quotationNumber: { startsWith: prefix } },
    orderBy: { quotationNumber: "desc" },
    select: { quotationNumber: true },
  });
  let serial = 1;
  if (latestQuotation) {
    const lastSerialStr = latestQuotation.quotationNumber.substring(prefix.length);
    serial = parseInt(lastSerialStr, 10) + 1;
  }
  return `${prefix}${serial.toString().padStart(3, "0")}`;
}

// POST handler from create-quotations/route.ts (already updated in previous step)
export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;
    // TODO: Re-enable auth check
    // if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    // const { role } = jwt.verify(token, process.env.JWT_SECRET!) as { role: string };
    // if (role !== "ADMIN") return NextResponse.json({ message: "Need Admin Access" }, { status: 403 });

    const body = await req.json();
    const parsed = quotationSchema.safeParse(body);

    if (!parsed.success) {
      console.error("Validation Errors:", parsed.error.errors);
      return NextResponse.json({ message: "Invalid input", errors: parsed.error.flatten() }, { status: 400 });
    }

    const data: CreateQuotationPayload = parsed.data;

    const latestInternal = await prisma.quotation.findFirst({
      orderBy: { createdAt: "desc" },
      select: { id: true }
    });
    const internalSerial = latestInternal ? parseInt(latestInternal.id.replace("QUOT", ""), 10) + 1 : 1;
    const newInternalId = `QUOT${internalSerial.toString().padStart(2, "0")}`;

    const newFormattedQuotationNumber = await generateFormattedQuotationNumber();

    // PDF generation is disabled for now.
    const filename = `${newInternalId}_placeholder.pdf`;
    const filePath = `/quotations/${filename}`; // Placeholder

    const quotation = await prisma.quotation.create({
      data: {
        id: newInternalId,
        quotationNumber: newFormattedQuotationNumber,
        name: data.name,
        clientId: data.clientId,
        ticketId: data.ticketId,
        pdfUrl: filePath,
        items: data.items as any,
        status: data.status,
        salesType: data.salesType,
        validUntil: data.validUntil ? new Date(data.validUntil) : null,
        admin: data.admin,
        quoteBy: data.quoteBy,
        discountPercentage: data.discountPercentage,
        discountAmount: data.discountAmount,
        subtotal: data.subtotal,
        taxableValue: data.taxableValue,
        igstAmount: data.igstAmount,
        netGrossAmount: data.netGrossAmount,
      },
    });

    if (data.ticketId) {
      const ticket = await prisma.ticket.findUnique({
        where: { id: data.ticketId },
        include: { client: true, workStage: true },
      });

      if (ticket) {
        const workStageData = {
          quoteNo: newFormattedQuotationNumber,
          quoteTaxable: data.taxableValue,
          quoteAmount: data.netGrossAmount,
          stateName: ticket.workStage?.stateName || "N/A",
          adminName: ticket.workStage?.adminName || "N/A",
          clientName: ticket.client.name,
          siteName: ticket.workStage?.siteName || "N/A",
          dateReceived: ticket.workStage?.dateReceived || new Date(),
          workStatus: ticket.workStage?.workStatus || "Pending",
          approval: ticket.workStage?.approval || "Pending",
          poStatus: ticket.workStage?.poStatus || false,
          poNumber: ticket.workStage?.poNumber || "N/A",
          jcrStatus: ticket.workStage?.jcrStatus || false,
          agentName: ticket.workStage?.agentName || "N/A",
        };

        if (ticket.workStageId) {
          await prisma.workStage.update({
            where: { id: ticket.workStageId },
            data: workStageData,
          });
        } else {
          const newWorkStage = await prisma.workStage.create({
            data: { ...workStageData, ticket: { connect: { id: data.ticketId } } },
          });
          await prisma.ticket.update({
            where: { id: data.ticketId },
            data: { workStageId: newWorkStage.id },
          });
        }
      }
    }
    return NextResponse.json({ message: "Quotation created successfully", quotation }, { status: 201 });
  } catch (error: any) {
    console.error("Error in POST /api/quotations/create-quotations:", error);
    return NextResponse.json({ message: "Internal server error", error: error.message }, { status: 500 });
  }
}


export async function GET(req: NextRequest) { // Changed req type to NextRequest
  try {
    const { searchParams } = new URL(req.url); // req.url is available on NextRequest
    const page = searchParams.get("page") || "1";
    const limit = searchParams.get("limit") || "10";
    const search = searchParams.get("search") || "";
    const statusParam = searchParams.get("status") || ""; // New filter for status

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    const whereConditions: Prisma.QuotationWhereInput[] = [];

    if (search) {
      whereConditions.push({
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { quotationNumber: { contains: search, mode: "insensitive" } },
          { client: { name: { contains: search, mode: "insensitive" } } },
          { ticket: { ticketId: { contains: search, mode: "insensitive" } } }, // Search by formatted ticketId
          { ticket: { title: { contains: search, mode: "insensitive" } } },
        ],
      });
    }

    if (statusParam) {
      // Validate statusParam against QuotationStatus enum values
      const isValidStatus = Object.values(QuotationStatus).includes(statusParam as QuotationStatus);
      if (isValidStatus) {
        whereConditions.push({
          status: statusParam as QuotationStatus,
        });
      } else {
        // Optionally handle invalid status parameter, e.g., ignore or return error
        console.warn(`Invalid status filter: ${statusParam}. Ignoring filter.`);
      }
    }

    const whereClause: Prisma.QuotationWhereInput = whereConditions.length > 0 ? { AND: whereConditions } : {};

    const total = await prisma.quotation.count({ where: whereClause });

    const quotations = await prisma.quotation.findMany({
      where: whereClause,
      include: {
        client: { select: { id: true, name: true } },
        ticket: { select: { id: true, title: true, ticketId: true } }, // Added ticketId
      },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
      orderBy: { createdAt: "desc" }, // Default sort, can be made configurable
    });

    return NextResponse.json({
      quotations,
      pagination: { page: pageNum, limit: limitNum, total },
    });
  } catch (error: any) { // Added type for error
    console.error("Error fetching quotations:", error);
    return NextResponse.json(
      { message: "Failed to fetch quotations.", error: error.message }, // Consistent error structure
      { status: 500 }
    );
  }
}
