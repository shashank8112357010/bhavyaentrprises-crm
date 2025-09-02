// Server-side data fetching for agents
import { prisma } from '@/lib/prisma';
import { cache } from 'react';

export const getInitialAgents = cache(async (page = 1, limit = 5) => {
  try {
    const skip = (page - 1) * limit;
    
    const [agents, total] = await Promise.all([
      prisma.user.findMany({
        where: {
          role: {
            in: ["BACKEND", "RM", "MST", "ACCOUNTS"]
          }
        },
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          mobile: true,
          role: true,
          avatar: true,
          createdAt: true,
          _count: {
            select: {
              tickets: {
                where: {
                  status: {
                    not: "completed"
                  }
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.user.count({
        where: {
          role: {
            in: ["BACKEND", "RM", "MST", "ACCOUNTS"]
          }
        }
      })
    ]);

    return {
      data: agents,
      total,
      page,
      limit,
      hasMore: skip + agents.length < total
    };
  } catch (error) {
    // Error will be handled by the route handler
    return {
      data: [],
      total: 0,
      page: 1,
      limit: 5,
      hasMore: false
    };
  }
});

export const getAgentStats = cache(async () => {
  try {
    const [totalAgents, activeTickets, completedToday] = await Promise.all([
      prisma.user.count({
        where: {
          role: {
            in: ["BACKEND", "RM", "MST", "ACCOUNTS"]
          }
        }
      }),
      prisma.ticket.count({
        where: {
          status: {
            notIn: ["completed", "billing_completed"]
          }
        }
      }),
      prisma.ticket.count({
        where: {
          status: "completed",
          completedDate: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      })
    ]);

    return {
      totalAgents,
      activeTickets,
      completedToday
    };
  } catch (error) {
    // Error will be handled by the route handler
    return {
      totalAgents: 0,
      activeTickets: 0,
      completedToday: 0
    };
  }
});

export const searchAgents = cache(async (query: string, page = 1, limit = 5) => {
  try {
    const skip = (page - 1) * limit;
    
    const [agents, total] = await Promise.all([
      prisma.user.findMany({
        where: {
          AND: [
            {
              role: {
                in: ["BACKEND", "RM", "MST", "ACCOUNTS"]
              }
            },
            {
              OR: [
                {
                  name: {
                    contains: query,
                    mode: 'insensitive'
                  }
                },
                {
                  email: {
                    contains: query,
                    mode: 'insensitive'
                  }
                }
              ]
            }
          ]
        },
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          mobile: true,
          role: true,
          avatar: true,
          createdAt: true,
          _count: {
            select: {
              tickets: {
                where: {
                  status: {
                    not: "completed"
                  }
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.user.count({
        where: {
          AND: [
            {
              role: {
                in: ["BACKEND", "RM", "MST", "ACCOUNTS"]
              }
            },
            {
              OR: [
                {
                  name: {
                    contains: query,
                    mode: 'insensitive'
                  }
                },
                {
                  email: {
                    contains: query,
                    mode: 'insensitive'
                  }
                }
              ]
            }
          ]
        }
      })
    ]);

    return {
      data: agents,
      total,
      page,
      limit,
      hasMore: skip + agents.length < total
    };
  } catch (error) {
    // Error will be handled by the route handler
    return {
      data: [],
      total: 0,
      page: 1,
      limit: 5,
      hasMore: false
    };
  }
});