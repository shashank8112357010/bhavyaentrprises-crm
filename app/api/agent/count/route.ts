import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

// Define the expected structure of the JWT payload
interface TokenPayload {
  id: string;
  role: string;
  // Add other properties from your JWT payload if necessary
}

export async function GET(req: NextRequest) {
  try {
    // 1. Verify JWT token from cookies
    const tokenCookie = req.cookies.get('token');
    if (!tokenCookie) {
      return NextResponse.json({ message: 'Authentication token not found.' }, { status: 401 });
    }
    const token = tokenCookie.value;

    let decodedPayload: TokenPayload;
    try {
      // It's good practice to use the same secret key as when the token was signed
      const JWT_SECRET = process.env.JWT_SECRET;
      if (!JWT_SECRET) {
        console.error('JWT_SECRET is not defined in environment variables.');
        return NextResponse.json({ message: 'Server configuration error.' }, { status: 500 });
      }
      decodedPayload = jwt.verify(token, JWT_SECRET) as TokenPayload;
    } catch (error) {
      console.error('Invalid token:', error);
      return NextResponse.json({ message: 'Invalid or expired token.' }, { status: 401 });
    }

    // 2. Verify user's role
    if (decodedPayload.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Forbidden: User does not have ADMIN privileges.' }, { status: 403 });
    }

    // 3. Query the database for the count of agents
    const agentRoles = ['BACKEND', 'RM', 'MST', 'ACCOUNTS'];
    const totalAgentCount = await prisma.user.count({
      where: {
        role: {
          in: agentRoles as any,
        },
      },
    });

    // 4. Return the count
    return NextResponse.json({ count: totalAgentCount }, { status: 200 });

  } catch (error) {
    console.error('Error fetching agent count:', error);
    // It's good practice to avoid sending detailed error messages to the client in production
    return NextResponse.json({ message: 'Internal server error while fetching agent count.' }, { status: 500 });
  }
}
