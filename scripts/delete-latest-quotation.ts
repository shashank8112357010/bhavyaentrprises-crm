import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteLatestQuotation(ticketId: string) {
  try {
    if (!ticketId) {
      console.error('ticketId is required as a command line argument');
      process.exit(1);
    }
    const latestQuotation = await prisma.quotation.findFirst({
      where: { ticketId },
      orderBy: { createdAt: 'desc' },
    });
    if (!latestQuotation) {
      console.log('No quotation found for this ticket');
      process.exit(0);
    }
    await prisma.quotation.delete({ where: { id: latestQuotation.id } });
    console.log('Latest quotation deleted successfully');
  } catch (error: any) {
    console.error('Error deleting latest quotation:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Usage: ts-node scripts/delete-latest-quotation.ts <ticketId>
const [, , ticketId] = process.argv;
deleteLatestQuotation(ticketId);
