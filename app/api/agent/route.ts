import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma"; // Added Prisma import for types
import { Prisma } from "@prisma/client";

// GET /api/agents
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const all = searchParams.get("all") === "true";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const search = searchParams.get("search") || "";

    const skip = (page - 1) * limit;

    let where: Prisma.UserWhereInput = {
      role: { in: ["BACKEND", "RM", "MST", "ACCOUNTS"] },
    };

    if (search) {
      where = {
        ...where,
        AND: [
          // Ensures role filter is always applied
          {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
              { id: { contains: search, mode: "insensitive" } },
              { specialization: { contains: search, mode: "insensitive" } },
              // Add other fields you want to search by, e.g., mobile, department
              { mobile: { contains: search, mode: "insensitive" } },
              { department: { contains: search, mode: "insensitive" } },
            ],
          },
        ],
      };
    }

    let users, total;
    if (all) {
      users = await prisma.user.findMany({
        where,
        orderBy: { joinedDate: "desc" },
      });
      total = users.length;
    } else {
      total = await prisma.user.count({ where });
      users = await prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { joinedDate: "desc" },
      });
    }

    const modifiedAgents = users.map((agent) => ({
      id: agent.displayId || agent.id, // Show displayId if available, otherwise UUID
      originalId: agent.id, // Keep original UUID for database operations
      name: agent.name,
      email: agent.email,
      mobile: agent.mobile,
      role: agent.role, // This is the agent's role from the DB
      userId: agent.id, // Also keep userId for compatibility
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

    return NextResponse.json({
      data: modifiedAgents,
      total,
      page,
      limit,
    });
  } catch (error) {
    console.error("Failed to fetch agents:", error); // Log the actual error
    return NextResponse.json(
      { message: "Failed to fetch agents" },
      { status: 500 },
    );
  }
}
