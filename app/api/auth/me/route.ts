// app/api/auth/me/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';
import { User } from '@/store/authStore'; // Assuming User type is exported or can be defined here

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');

export async function GET(request: NextRequest) {
  const token = request.cookies.get('token')?.value;

  if (!token) {
    return NextResponse.json({ message: 'Authentication token not found.' }, { status: 401 });
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);

    if (!payload.sub || typeof payload.sub !== 'string' || !payload.role) {
      return NextResponse.json({ message: 'Invalid token payload.' }, { status: 401 });
    }

    const userId = payload.sub;
    const userRole = payload.role as User['role']; // Cast to the Role type

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        // Add any other fields needed by the client-side authStore's User type
        name: true,
        // Assuming 'initials' might be derived or stored, or not strictly needed by /me
      },
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found.' }, { status: 404 });
    }

    // Ensure the role from token matches the DB role, or decide which is source of truth
    // For now, trust the token's role if user is found. Or better, use user.role from DB.
    if (user.role !== userRole) {
      // This case should ideally not happen if JWTs are issued correctly based on DB state.
      // Log this discrepancy. For now, we'll prefer the DB role.
      console.warn(`Role mismatch for user ${userId}: JWT role ${userRole}, DB role ${user.role}. Using DB role.`);
    }

    const responseUser: Partial<User> = { // Ensure this matches what authStore expects
         userId: user.id,
         email: user.email,
         role: user.role, // Use DB role as source of truth after verification
         name: user.name, // Example: if 'name' is part of your User type in store
    };


    return NextResponse.json({ user: responseUser }, { status: 200 }); // Token is HttpOnly, not sent in body
  } catch (err) {
    console.error('API /me error:', err);
    return NextResponse.json({ message: 'Invalid or expired token.' }, { status: 401 });
  }
}
