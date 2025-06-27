// app/api/performance/agent/[agentId]/route.ts
import { NextResponse } from 'next/server';
import { calculateAgentPerformance } from '@/lib/services/performance'; // Adjust path as necessary
import { verifyAuth } from '@/lib/services/auth'; // Assuming you have an auth verification service

export async function GET(
  request: Request,
  { params }: { params: { agentId: string } }
) {
  try {
    // 1. Authentication and Authorization (Example)
    // const { user, error: authError } = await verifyAuth(request); // Your actual auth check
    // if (authError || !user) {
    //   return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
    // }
    //
    // // Authorization: Check if the logged-in user can access this agent's performance
    // // For example, an admin can access any, an agent can only access their own.
    // if (user.role !== 'ADMIN' && user.id !== params.agentId) {
    //    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    // }


    const agentId = params.agentId;
    if (!agentId) {
      return NextResponse.json({ error: 'Agent ID is required' }, { status: 400 });
    }

    // Ensure DATABASE_URL is available for prisma client in performance service
    // This should be handled by the environment where the Next.js server runs.
    // If running locally and .env is used, it should be picked up.
    // For Vercel/other deployments, environment variables need to be set.
    if (!process.env.DATABASE_URL) {
        // THIS IS A FALLBACK FOR THE SANDBOX AND SHOULD BE REMOVED OR SECURED IN PRODUCTION
        // It's better to ensure the environment itself has DATABASE_URL set.
        process.env.DATABASE_URL = "postgresql://admin:praarabdh@financial@god@147.79.68.189:5432/interiorcrm";
        console.warn("Temporarily setting DATABASE_URL for performance API. Ensure it's set in the environment.");
    }


    const performanceData = await calculateAgentPerformance(agentId);

    if (!performanceData) {
      return NextResponse.json({ error: 'Performance data not found for this agent' }, { status: 404 });
    }

    return NextResponse.json(performanceData, { status: 200 });

  } catch (error: any) {
    console.error(`Error fetching performance for agent ${params.agentId}:`, error);
    // Specific error from calculateAgentPerformance if agent not found
    if (error.message.includes("not found")) {
        return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
