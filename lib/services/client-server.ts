// Server-side data fetching for clients
import { prisma } from '@/lib/prisma';
import { cache } from 'react';

export const getInitialClients = cache(async (page = 1, limit = 10) => {
  try {
    const skip = (page - 1) * limit;
    
    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        skip,
        take: limit,
        select: {
          id: true,
          displayId: true,
          name: true,
          type: true,
          contactPerson: true,
          contactEmail: true,
          contactPhone: true,
          gstn: true,
          tickets: {
            select: {
              id: true,
              status: true
            }
          }
        },
        orderBy: {
          lastServiceDate: 'desc'
        }
      }),
      prisma.client.count()
    ]);

    // Transform data to include active tickets count
    const transformedClients = clients.map(client => ({
      ...client,
      activeTickets: client.tickets.filter(ticket => 
        !["completed", "billing_completed"].includes(ticket.status)
      ).length,
      totalTickets: client.tickets.length,
      // Remove tickets from the response to reduce payload
      tickets: undefined
    }));

    return {
      data: transformedClients,
      total,
      page,
      limit,
      hasMore: skip + clients.length < total
    };
  } catch (error) {
    // Error will be handled by the route handler
    return {
      data: [],
      total: 0,
      page: 1,
      limit: 10,
      hasMore: false
    };
  }
});

export const getClientStats = cache(async () => {
  try {
    const [totalClients, activeClients, newThisMonth, totalTickets] = await Promise.all([
      prisma.client.count(),
      prisma.client.count({
        where: {
          tickets: {
            some: {
              status: {
                notIn: ["completed", "billing_completed"]
              }
            }
          }
        }
      }),
      prisma.client.count({
        where: {
          lastServiceDate: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      }),
      prisma.ticket.count({
        where: {
          status: {
            notIn: ["completed", "billing_completed"]
          }
        }
      })
    ]);

    return {
      totalClients,
      activeClients,
      newThisMonth,
      totalTickets
    };
  } catch (error) {
    // Error will be handled by the route handler
    return {
      totalClients: 0,
      activeClients: 0,
      newThisMonth: 0,
      totalTickets: 0
    };
  }
});

export const searchClients = cache(async (query: string, page = 1, limit = 10) => {
  try {
    const skip = (page - 1) * limit;
    
    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where: {
          OR: [
            {
              name: {
                contains: query,
                mode: 'insensitive'
              }
            },
            {
              displayId: {
                contains: query,
                mode: 'insensitive'
              }
            },
            {
              contactPerson: {
                contains: query,
                mode: 'insensitive'
              }
            },
            {
              contactEmail: {
                contains: query,
                mode: 'insensitive'
              }
            }
          ]
        },
        skip,
        take: limit,
        select: {
          id: true,
          displayId: true,
          name: true,
          type: true,
          contactPerson: true,
          contactEmail: true,
          contactPhone: true,
          gstn: true,
          tickets: {
            select: {
              id: true,
              status: true
            }
          }
        },
        orderBy: {
          lastServiceDate: 'desc'
        }
      }),
      prisma.client.count({
        where: {
          OR: [
            {
              name: {
                contains: query,
                mode: 'insensitive'
              }
            },
            {
              displayId: {
                contains: query,
                mode: 'insensitive'
              }
            },
            {
              contactPerson: {
                contains: query,
                mode: 'insensitive'
              }
            },
            {
              contactEmail: {
                contains: query,
                mode: 'insensitive'
              }
            }
          ]
        }
      })
    ]);

    // Transform data to include active tickets count
    const transformedClients = clients.map(client => ({
      ...client,
      activeTickets: client.tickets.filter(ticket => 
        !["completed", "billing_completed"].includes(ticket.status)
      ).length,
      totalTickets: client.tickets.length,
      // Remove tickets from the response to reduce payload
      tickets: undefined
    }));

    return {
      data: transformedClients,
      total,
      page,
      limit,
      hasMore: skip + clients.length < total
    };
  } catch (error) {
    // Error will be handled by the route handler
    return {
      data: [],
      total: 0,
      page: 1,
      limit: 10,
      hasMore: false
    };
  }
});