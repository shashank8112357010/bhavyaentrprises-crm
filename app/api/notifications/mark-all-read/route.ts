// app/api/notifications/mark-all-read/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prismaWithReconnect as prisma } from "@/lib/prisma";
import { jwtVerify } from "jose";

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;


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

    // Update all unread notifications for the user
    const updateResult = await prisma.notification.updateMany({
      where: {
        userId: userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    return NextResponse.json({
      message: "All notifications marked as read",
      updatedCount: updateResult.count,
    });
  } catch (error: any) {
    console.error("Error marking all notifications as read:", error);
    return NextResponse.json(
      {
        error: "Failed to mark all notifications as read",
        message: error.message,
      },
      { status: 500 },
    );
  }
}
