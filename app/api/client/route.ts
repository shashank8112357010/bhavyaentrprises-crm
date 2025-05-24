import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import { createClientSchema } from "@/lib/validations/clientSchema";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = createClientSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const clientData = parsed.data;

    // Upsert client by id (or create new)
    const client = await prisma.client.create({
      data: clientData,
    });

    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const clients = await prisma.client.findMany({
      include: {
        tickets: {
          where: {
            status: {
              not: "completed",
            },
          },
          select: {
            id: true, // just to count, minimal data
          },
        },
      },
    });

    // Add activeTickets count to each client
    const clientsWithTicketCount = clients.map((client) => ({
      ...client,
      activeTickets: client.tickets.length,
    }));

    return new NextResponse(
      JSON.stringify({ clients: clientsWithTicketCount }),
      {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control":
            "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
          "Surrogate-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
