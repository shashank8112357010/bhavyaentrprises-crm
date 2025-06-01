import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Schema for validating comment creation
const createCommentSchema = z.object({
  text: z.string().min(1, "Comment text cannot be empty"),
  userId: z.string().uuid("Invalid user ID"),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { message: "Ticket ID is required" },
        { status: 400 }
      );
    }

    const comments = await prisma.comment.findMany({
      where: { ticketId: id },
      include: {
        user: { // Include user details for the commenter
          select: {
            id: true,
            name: true,
            avatar: true, // Assuming user model has avatar
            initials: true // Assuming user model has initials
          },
        },
      },
      orderBy: {
        createdAt: "asc", // Show oldest comments first
      },
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { message: "Internal server error while fetching comments" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { message: "Ticket ID is required" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const parsedBody = createCommentSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json(
        { message: "Invalid input", errors: parsedBody.error.errors },
        { status: 400 }
      );
    }

    const { text, userId } = parsedBody.data;

    // Verify ticket exists
    const ticket = await prisma.ticket.findUnique({
      where: { id: id },
    });

    if (!ticket) {
      return NextResponse.json(
        { message: "Ticket not found" },
        { status: 404 }
      );
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    const newComment = await prisma.comment.create({
      data: {
        text,
        ticketId: id,
        userId,
      },
      include: { // Include user details in the response for the new comment
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            initials: true
          },
        },
      }
    });

    return NextResponse.json(newComment, { status: 201 });
  } catch (error) {
    console.error("Error creating comment:", error);
    // Handle potential Prisma errors, e.g., foreign key constraint
    if (error instanceof Error && 'code' in error && (error as any).code === 'P2003') {
        return NextResponse.json({ message: "Invalid ticket ID or user ID provided." }, { status: 400 });
    }
    return NextResponse.json(
      { message: "Internal server error while creating comment" },
      { status: 500 }
    );
  }
}
