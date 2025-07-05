import { NextRequest, NextResponse } from 'next/server';
import { prismaWithReconnect as prisma } from "@/lib/prisma";

import crypto from 'crypto';
import bcryptjs from 'bcryptjs';
import { sendMail } from '@/lib/mailer';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;


// Helper function to add hours to a date
const addHours = (date: Date, hours: number): Date => {
  const newDate = new Date(date);
  newDate.setHours(newDate.getHours() + hours);
  return newDate;
};

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ message: 'Email is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    // If user not found, return a success message to prevent email enumeration
    // It's important not to reveal whether an email address is registered or not
    if (!user) {
      return NextResponse.json({ message: 'If your email is registered, you will receive a password reset link.' }, { status: 200 });
    }

    // Generate a random token
    const token = crypto.randomBytes(32).toString('hex');

    // Hash the token before storing it in the database
    const hashedToken = await bcryptjs.hash(token, 10);

    // Set an expiry for the token (1 hour from now)
    const tokenExpiry = addHours(new Date(), 1);

    // Update the user record in the database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: tokenExpiry,
      },
    });

    // Construct the reset URL (use the plain token here)
    const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/reset-password?token=${token}`;

    // Send the email using the mailer function
    // Assuming sendMail takes an object with to, subject, and html/text content
    await sendMail({
      to: user.email,
      subject: 'Password Reset Request',
      html: `<p>You requested a password reset. Click the link below to reset your password:</p><a href="${resetUrl}">${resetUrl}</a><p>This link will expire in 1 hour.</p>`,
    });

    return NextResponse.json({ message: 'If your email is registered, you will receive a password reset link.' }, { status: 200 });

  } catch (error) {
    console.error('Error in forgot password endpoint:', error);
    // Generic error message for the client
    return NextResponse.json({ message: 'An error occurred. Please try again later.' }, { status: 500 });
  }
}
