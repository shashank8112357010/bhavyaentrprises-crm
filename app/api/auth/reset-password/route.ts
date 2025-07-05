import { NextRequest, NextResponse } from 'next/server';
import bcryptjs from 'bcryptjs';
import { prismaWithReconnect as prisma } from "@/lib/prisma";

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;


export async function POST(request: NextRequest) {
  try {
    const { token, newPassword } = await request.json();

    if (!token || !newPassword) {
      return NextResponse.json({ message: 'Token and new password are required' }, { status: 400 });
    }

    if (typeof newPassword !== 'string' || newPassword.length < 6) {
      return NextResponse.json({ message: 'Password must be at least 6 characters long' }, { status: 400 });
    }

    // Find potential users with a non-null resetPasswordToken and a non-expired token
    const potentialUsers = await prisma.user.findMany({
      where: {
        resetPasswordToken: {
          not: null,
        },
        resetPasswordExpires: {
          gt: new Date(), // Check if the token expiry is greater than the current time
        },
      },
    });

    let user = null;
    for (const potentialUser of potentialUsers) {
      if (potentialUser.resetPasswordToken) {
        const tokenMatch = await bcryptjs.compare(token, potentialUser.resetPasswordToken);
        if (tokenMatch) {
          user = potentialUser;
          break;
        }
      }
    }

    if (!user) {
      return NextResponse.json({ message: 'Invalid or expired token. Please try resetting your password again.' }, { status: 400 });
    }

    // Hash the new password
    const hashedPassword = await bcryptjs.hash(newPassword, 10);

    // Update the user's password and clear the reset token fields
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    return NextResponse.json({ message: 'Password has been reset successfully.' }, { status: 200 });

  } catch (error) {
    console.error('Error in reset password endpoint:', error);
    // Check if the error is a known Prisma error or a generic one
    if (error instanceof Error && 'code' in error && error.code === 'P2025') { // Example: Prisma's "Record to update not found."
        return NextResponse.json({ message: 'Failed to update password. User not found.' }, { status: 404 });
    }
    return NextResponse.json({ message: 'An error occurred. Please try again later.' }, { status: 500 });
  }
}
