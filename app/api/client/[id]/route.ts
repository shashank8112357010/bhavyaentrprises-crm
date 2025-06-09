import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateClientSchema } from "@/lib/validations/clientSchema";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key",
);

async function getUserFromToken(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) {
      throw new Error("No token found");
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch (error) {
    throw new Error("Invalid token");
  }
}

// GET - Get single client
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const client = await prisma.client.findUnique({
      where: { id: params.id },
      include: {
        tickets: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    return NextResponse.json(client);
  } catch (error: any) {
    console.error("Error fetching client:", error);
    return NextResponse.json(
      { error: "Failed to fetch client", message: error.message },
      { status: 500 },
    );
  }
}

// PATCH - Update client (Admin only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await getUserFromToken(req);

    // Check if user is admin
    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized. Only admins can edit clients." },
        { status: 403 },
      );
    }

    const body = await req.json();
    console.log("Received update data:", body);

    const parsed = updateClientSchema.safeParse(body);

    if (!parsed.success) {
      console.error("Validation error:", parsed.error);
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    // Check if client exists
    const existingClient = await prisma.client.findUnique({
      where: { id: params.id },
    });

    if (!existingClient) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Update client
    const updateData = { ...parsed.data };

    // Update initials if name is being changed
    if (updateData.name) {
      updateData.initials = updateData.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase();
    }

    const updatedClient = await prisma.client.update({
      where: { id: params.id },
      data: updateData,
    });

    console.log("Client updated successfully:", updatedClient);
    return NextResponse.json(updatedClient);
  } catch (error: any) {
    console.error("Client update error:", error);
    return NextResponse.json(
      {
        error: "Failed to update client",
        message: error.message,
        details: error.code || "Unknown error",
      },
      { status: 500 },
    );
  }
}

// DELETE - Delete client (Admin only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await getUserFromToken(req);

    // Check if user is admin
    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized. Only admins can delete clients." },
        { status: 403 },
      );
    }

    // Check if client exists
    const existingClient = await prisma.client.findUnique({
      where: { id: params.id },
      include: {
        tickets: {
          select: { id: true },
        },
      },
    });

    if (!existingClient) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Check if client has tickets
    if (existingClient.tickets.length > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete client with existing tickets",
          message: `This client has ${existingClient.tickets.length} ticket(s). Please resolve or reassign them before deleting.`,
        },
        { status: 400 },
      );
    }

    // Delete client
    await prisma.client.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Client deleted successfully" });
  } catch (error: any) {
    console.error("Client deletion error:", error);
    return NextResponse.json(
      {
        error: "Failed to delete client",
        message: error.message,
        details: error.code || "Unknown error",
      },
      { status: 500 },
    );
  }
}
