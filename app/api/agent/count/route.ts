import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prismaWithReconnect as prisma } from "@/lib/prisma";


export async function GET(req: NextRequest) {
  try {
   

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
