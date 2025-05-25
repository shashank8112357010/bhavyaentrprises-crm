// pages/api/tickets/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const tickets = await prisma.ticket.findMany();

    return NextResponse.json({ tickets });
  } catch (error: any) {
    return NextResponse.json(
      { message: "Failed to fetch tickets", error: error.message },
      { status: 400 }
    );
  }
}