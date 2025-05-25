import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

// GET /api/agents
export async function GET(req: NextRequest) {
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
    const agents = await prisma.user.findMany({
      where: {
        role: {
          in: ["BACKEND", "RM", "MST", "ACCOUNTS"], // Filter by agent roles
        },
      },
    });

    const modified = agents.map((agent) => ({
      id: agent.id,
      name: agent.name,
      email: agent.email,
      mobile: agent.mobile,
      role: agent.role,
      userId: agent.id,
      department: agent.department || "",
      specialization: agent.specialization || "",
      status: agent.status,
      leads: {
        assigned: agent.leadsAssigned,
        active: agent.leadsActive,
        closed: agent.leadsClosed,
      },
      conversionRate: agent.conversionRate,
      performanceTrend: agent.performanceTrend,
      joinedDate: agent.joinedDate,
      avatar: agent.avatar,
      initials: agent.initials,
      activeTickets: agent.activeTickets,
      rating: agent.rating,
      completedTickets: agent.completedTickets,
    }));

    return NextResponse.json({ agents: modified });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch agents" },
      { status: 500 }
    );
  }
}
