import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    // Get a test user to see what the database structure looks like
    const user = await prisma.user.findFirst({
      where: {
        role: {
          in: ["ADMIN", "BACKEND", "RM", "MST", "ACCOUNTS"],
        },
      },
    });

    if (!user) {
      return NextResponse.json({
        message: "No users found in database",
        userCount: await prisma.user.count(),
      });
    }

    // Return user structure (without password)
    const { password, ...userWithoutPassword } = user;

    return NextResponse.json({
      message: "Database connection successful",
      sampleUser: userWithoutPassword,
      totalUsers: await prisma.user.count(),
    });
  } catch (error) {
    console.error("Test login error:", error);
    return NextResponse.json(
      {
        message: "Database connection failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { message: "Email is required for test" },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const { password, ...userWithoutPassword } = user;

    const initials =
      user.name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase() ||
      user.email?.substring(0, 2).toUpperCase() ||
      "NA";

    const userResponse = {
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      initials,
    };

    return NextResponse.json({
      message: "User found successfully",
      user: userResponse,
      fullUserStructure: userWithoutPassword,
    });
  } catch (error) {
    console.error("Test user lookup error:", error);
    return NextResponse.json(
      {
        message: "User lookup failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
