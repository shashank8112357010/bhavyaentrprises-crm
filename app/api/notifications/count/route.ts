// app/api/notifications/count/route.ts
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

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromToken(req);
    const userId = user.userId as string;

    // Get unread notification count
    const unreadCount = await prisma.notification.count({
      where: {
        userId: userId,
        isRead: false,
      },
    });

    return NextResponse.json({
      unreadCount,
    });
  } catch (error: any) {
    console.error("Error fetching notification count:", error);
    return NextResponse.json(
      { error: "Failed to fetch notification count", message: error.message },
      { status: 500 },
    );
  }
}
