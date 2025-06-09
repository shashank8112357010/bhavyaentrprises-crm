// app/api/notifications/test/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromToken(req);
    const userId = user.userId as string;

    // Create a test notification
    const testNotification = await prisma.notification.create({
      data: {
        userId: userId,
        type: "TICKET_ASSIGNED",
        title: "Test Notification",
        message: "This is a test notification to verify the system is working.",
        isRead: false,
      },
      include: {
        ticket: {
          select: {
            id: true,
            title: true,
            ticketId: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Test notification created successfully",
      notification: testNotification,
    });
  } catch (error: any) {
    console.error("Error creating test notification:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create test notification",
        message: error.message,
        details:
          error.code === "P2002"
            ? "Database constraint error"
            : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    // Check if notification table exists and is accessible
    const count = await prisma.notification.count();

    return NextResponse.json({
      success: true,
      message: "Notification system is accessible",
      notificationCount: count,
    });
  } catch (error: any) {
    console.error("Error checking notification system:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Notification system not accessible",
        message: error.message,
        suggestion:
          error.code === "P2021"
            ? "Run database migration: npx prisma migrate dev"
            : "Check database connection",
      },
      { status: 500 },
    );
  }
}
