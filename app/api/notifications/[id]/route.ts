// app/api/notifications/[id]/route.ts
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

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await getUserFromToken(req);
    const userId = user.userId as string;
    const notificationId = params.id;

    const body = await req.json();
    const { isRead } = body;

    // Find the notification and ensure it belongs to the current user
    const existingNotification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId: userId,
      },
    });

    if (!existingNotification) {
      return NextResponse.json(
        { error: "Notification not found or access denied" },
        { status: 404 },
      );
    }

    // Update the notification
    const updatedNotification = await prisma.notification.update({
      where: {
        id: notificationId,
      },
      data: {
        isRead: isRead !== undefined ? isRead : existingNotification.isRead,
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

    return NextResponse.json(updatedNotification);
  } catch (error: any) {
    console.error("Error updating notification:", error);
    return NextResponse.json(
      { error: "Failed to update notification", message: error.message },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await getUserFromToken(req);
    const userId = user.userId as string;
    const notificationId = params.id;

    // Find the notification and ensure it belongs to the current user
    const existingNotification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId: userId,
      },
    });

    if (!existingNotification) {
      return NextResponse.json(
        { error: "Notification not found or access denied" },
        { status: 404 },
      );
    }

    // Delete the notification
    await prisma.notification.delete({
      where: {
        id: notificationId,
      },
    });

    return NextResponse.json({ message: "Notification deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting notification:", error);
    return NextResponse.json(
      { error: "Failed to delete notification", message: error.message },
      { status: 500 },
    );
  }
}
