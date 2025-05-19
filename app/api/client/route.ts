import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { createClientSchema } from "@/lib/validations/clientSchema";

const prisma = new PrismaClient();

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
    const client = await prisma.client.upsert({
      where: { id: clientData.id },
      update: clientData,
      create: clientData,
    });

    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
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

    return NextResponse.json({clients : clientsWithTicketCount});
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
