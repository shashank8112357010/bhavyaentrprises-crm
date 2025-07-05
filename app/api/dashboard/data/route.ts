import { NextRequest, NextResponse } from "next/server";
import { prismaWithReconnect as prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const JWT_SECRET = process.env.JWT_SECRET;

interface DashboardData {
  tickets: any[];
  clients: any[];
  agents: any[];
  quotations: any[];
  counts: {
    openTicketsCount: number;
    scheduledTodayCount: number;
    clientUpdatesNeededCount: number;
    completedThisWeekCount: number;
    totalAgents: number;
    totalClients: number;
  };
}

export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const authHeader = req.headers.get("authorization");
    const cookieHeader = req.headers.get("cookie");
    
    let token = null;
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (cookieHeader) {
      const tokenMatch = cookieHeader.match(/token=([^;]+)/);
      token = tokenMatch ? tokenMatch[1] : null;
    }

    if (!token || !JWT_SECRET) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    const { userId, role } = decoded;

    // Base filter for role-based access
    const isAdminOrAccounts = role === "ADMIN" || role === "ACCOUNTS";
    const ticketFilter = isAdminOrAccounts ? {} : { assigneeId: userId };

    // Get current date ranges for counts
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    // Parse pagination parameters
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    // Batch all counts in a single transaction for better performance
    const counts = await prisma.$transaction(async (tx) => {
      const [openTickets, scheduledToday, clientUpdates, completedWeek, agents, clients] = await Promise.all([
        tx.ticket.count({
          where: {
            ...ticketFilter,
            status: { in: ["new", "inProgress", "onHold"] },
          },
        }),
        tx.ticket.count({
          where: {
            ...ticketFilter,
            scheduledDate: {
              gte: today,
              lt: tomorrow,
            },
          },
        }),
        tx.ticket.count({
          where: {
            ...ticketFilter,
            status: { in: ["billing_pending", "completed"] },
            feedback: "PENDING",
          },
        }),
        tx.ticket.count({
          where: {
            ...ticketFilter,
            status: "completed",
            completedDate: {
              gte: startOfWeek,
              lt: endOfWeek,
            },
          },
        }),
        isAdminOrAccounts
          ? tx.user.count({
              where: {
                role: { in: ["ADMIN", "BACKEND", "RM", "MST", "ACCOUNTS"] },
                status: "ACTIVE",
              },
            })
          : Promise.resolve(0),
        isAdminOrAccounts ? tx.client.count() : Promise.resolve(0),
      ]);

      return {
        openTicketsCount: openTickets,
        scheduledTodayCount: scheduledToday,
        clientUpdatesNeededCount: clientUpdates,
        completedThisWeekCount: completedWeek,
        totalAgents: agents,
        totalClients: clients,
      };
    });

    // Parallel data fetching for optimal performance
    const [
      tickets,
      clients,
      agents,
      quotations,
    ] = await Promise.all([
      // Fetch tickets with role-based filtering and pagination
      prisma.ticket.findMany({
        where: ticketFilter,
        select: {
          id: true,
          ticketId: true,
          title: true,
          branch: true,
          priority: true,
          dueDate: true,
          scheduledDate: true,
          completedDate: true,
          createdAt: true,
          description: true,
          holdReason: true,
          due: true,
          paid: true,
          status: true,
          feedback: true,
          photosUploaded: true,
          assignee: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
              initials: true,
              role: true,
            },
          },
          client: {
            select: {
              id: true,
              name: true,
              type: true,
              contactPerson: true,
            },
          },
          workStage: {
            select: {
              id: true,
              stateName: true,
              adminName: true,
              clientName: true,
              siteName: true,
              workStatus: true,
              approval: true,
              poStatus: true,
              jcrStatus: true,
              agentName: true,
            },
          },
          expenses: {
            select: {
              id: true,
              amount: true,
              category: true,
              createdAt: true,
              pdfUrl: true,
            },
          },
          Quotation: {
            select: {
              id: true,
              name: true,
              quoteNo: true,
              pdfUrl: true,
              createdAt: true,
              subtotal: true,
              gst: true,
              grandTotal: true,
            },
          },
          comments: {
            select: {
              id: true,
              text: true,
              createdAt: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  initials: true,
                },
              },
            },
            orderBy: { createdAt: "desc" },
            take: 10, // Limit comments to recent 10
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: skip,
      }),

      // Fetch clients (only for admin/accounts) with pagination
      isAdminOrAccounts
        ? prisma.client.findMany({
            select: {
              id: true,
              displayId: true,
              name: true,
              type: true,
              totalBranches: true,
              contactPerson: true,
              contactEmail: true,
              contactPhone: true,
              contractStatus: true,
              lastServiceDate: true,
              avatar: true,
              initials: true,
              gstn: true,
              state: true,
              tickets: {
                select: { id: true, status: true },
              },
            },
            orderBy: { name: "asc" },
            take: limit,
            skip: skip,
          })
        : [],

      // Fetch agents (only for admin/accounts) with pagination
      isAdminOrAccounts
        ? prisma.user.findMany({
            where: {
              role: { in: ["ADMIN", "BACKEND", "RM", "MST", "ACCOUNTS"] },
              status: "ACTIVE",
            },
            select: {
              id: true,
              displayId: true,
              name: true,
              email: true,
              role: true,
              department: true,
              specialization: true,
              status: true,
              activeTickets: true,
              rating: true,
              completedTickets: true,
              createdAt: true,
              initials: true,
              avatar: true,
            },
            orderBy: { createdAt: "desc" },
            take: limit,
            skip: skip,
          })
        : [],

      // Fetch recent quotations with pagination
      prisma.quotation.findMany({
        select: {
          id: true,
          displayId: true,
          quoteNo: true,
          name: true,
          pdfUrl: true,
          createdAt: true,
          subtotal: true,
          gst: true,
          grandTotal: true,
          salesType: true,
          validUntil: true,
          expectedExpense: true,
          client: {
            select: {
              id: true,
              name: true,
            },
          },
          ticket: {
            select: {
              id: true,
              title: true,
              ticketId: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: skip,
      }),
    ]);

    const dashboardData: DashboardData = {
      tickets,
      clients,
      agents: agents.map(agent => ({
        ...agent,
        userId: agent.id, // Map id to userId for compatibility
      })),
      quotations,
      counts,
    };

    return NextResponse.json(dashboardData);
  } catch (error: any) {
    console.error("Dashboard data fetch error:", error);
    return NextResponse.json(
      { message: "Failed to fetch dashboard data", error: error.message },
      { status: 500 },
    );
  }
}
