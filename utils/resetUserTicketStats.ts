

import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

async function resetStats() {
  try {
    await prisma.user.updateMany({
      data: {
        activeTickets: 0,
        completedTickets: 0,
      },
    });
    console.log("✅ Reset ticket stats for all users.");
  } catch (error) {
    console.error("❌ Failed to reset ticket stats:", error);
  } finally {
    await prisma.$disconnect();
  }
}

resetStats();
