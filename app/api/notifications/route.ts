// app/api/notifications/route.ts
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

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromToken(req);
    const userId = user.userId as string;

    const url = new URL(req.url);
    const isReadParam = url.searchParams.get("isRead");
    const type = url.searchParams.get("type");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const offset = parseInt(url.searchParams.get("offset") || "0");

    // Build where clause
    const whereClause: any = {
      userId: userId,
    };

    if (isReadParam !== null) {
      whereClause.isRead = isReadParam === "true";
    }

    if (type) {
      whereClause.type = type;
    }

    // Get notifications with pagination
    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: whereClause,
        include: {
          ticket: {
            select: {
              id: true,
              title: true,
              ticketId: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: limit,
        skip: offset,
      }),
      prisma.notification.count({
        where: whereClause,
      }),
      prisma.notification.count({
        where: {
          userId: userId,
          isRead: false,
        },
      }),
    ]);

    return NextResponse.json({
      notifications,
      total,
      unreadCount,
    });
  } catch (error: any) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications", message: error.message },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromToken(req);

    // Only allow ADMIN and ACCOUNTS roles to create notifications for other users
    // Regular users can't create notifications via this endpoint
 

    const body = await req.json();
    const { userId, type, title, message, ticketId, actionUrl } = body;

    // Validate required fields
    if (!userId || !type || !title || !message) {
      return NextResponse.json(
        { error: "Missing required fields: userId, type, title, message" },
        { status: 400 },
      );
    }

    // Validate user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "Target user not found" },
        { status: 404 },
      );
    }

    // Validate ticket exists if ticketId is provided
    if (ticketId) {
      const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        select: { id: true },
      });

      if (!ticket) {
        return NextResponse.json(
          { error: "Ticket not found" },
          { status: 404 },
        );
      }
    }

    // Create notification
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        ticketId: ticketId || null,
        actionUrl: actionUrl || null,
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

    return NextResponse.json(notification, { status: 201 });
  } catch (error: any) {
    console.error("Error creating notification:", error);
    return NextResponse.json(
      { error: "Failed to create notification", message: error.message },
      { status: 500 },
    );
  }
}
