import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "../../../../lib/prisma";

// GET /api/agents/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const token = req.cookies.get("token")?.value;

  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { role } = jwt.verify(token, process.env.JWT_SECRET!) as {
    role: string;
  };
  if (role !== "ADMIN") {
    return NextResponse.json({ message: "Need Admin Access" }, { status: 403 });
  }

  try {
    const agent = await prisma.user.findUnique({
      where: {
        id: params.id,
        role: {
          in: ["BACKEND", "RM", "MST", "ACCOUNTS"], // Ensure the user is an agent
        },
      },
    });

    if (!agent) {
      return NextResponse.json({ message: "Agent not found" }, { status: 404 });
    }

    return NextResponse.json({ agent });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch agent" },
      { status: 500 }
    );
  }
}

// DELETE /api/agents/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const token = req.cookies.get("token")?.value;

  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { role } = jwt.verify(token, process.env.JWT_SECRET!) as {
    role: string;
  };
  if (role !== "ADMIN") {
    return NextResponse.json({ message: "Need Admin Access" }, { status: 403 });
  }

  try {
    const agent = await prisma.user.findUnique({
      where: {
        id: params.id,
        role: {
          in: ["BACKEND", "RM", "MST", "ACCOUNTS"], // Ensure the user is an agent
        },
      },
    });

    if (!agent) {
      return NextResponse.json({ message: "Agent not found" }, { status: 404 });
    }

    await prisma.user.delete({
      where: {
        id: params.id,
      },
    });

    return NextResponse.json({ message: "Agent deleted successfully" });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to delete agent" },
      { status: 500 }
    );
  }
}


// PATCH /api/agents/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const token = req.cookies.get("token")?.value;

  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { role } = jwt.verify(token, process.env.JWT_SECRET!) as {
    role: string;
  };
  if (role !== "ADMIN") {
    return NextResponse.json({ message: "Need Admin Access" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { name, email, mobile, role} = body;

    const agent = await prisma.user.findUnique({
      where: {
        id: params.id,
        role: {
          in: ["BACKEND", "RM", "MST", "ACCOUNTS"], // Ensure the user is an agent
        },
      },
    });

    if (!agent) {
      return NextResponse.json({ message: "Agent not found" }, { status: 404 });
    }

    const updatedAgent = await prisma.user.update({
      where: {
        id: params.id,
      },
      data: {
        name,
        email,
        mobile,
        role,
       
      },
    });

    return NextResponse.json({ agent: updatedAgent });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to update agent" },
      { status: 500 }
    );
  }
}

