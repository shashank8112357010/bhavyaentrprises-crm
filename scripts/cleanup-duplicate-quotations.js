const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanupDuplicateQuotations() {
  try {
    console.log('Starting cleanup of duplicate quotations...');

    // Find all tickets that have multiple quotations
    const duplicateQuotations = await prisma.$queryRaw`
      SELECT "ticketId", COUNT(*) as count, 
             array_agg("id" ORDER BY "createdAt" DESC) as quotation_ids,
             array_agg("quoteNo" ORDER BY "createdAt" DESC) as quote_numbers
      FROM "Quotation" 
      WHERE "ticketId" IS NOT NULL 
      GROUP BY "ticketId" 
      HAVING COUNT(*) > 1
    `;

    console.log(`Found ${duplicateQuotations.length} tickets with multiple quotations`);

    for (const duplicate of duplicateQuotations) {
      const { ticketId, quotation_ids, quote_numbers, count } = duplicate;
      
      console.log(`\nTicket ${ticketId} has ${count} quotations:`);
      quotation_ids.forEach((id, index) => {
        console.log(`  - ${quote_numbers[index]} (${id})`);
      });

      // Keep the most recent quotation (first in the array), delete the rest
      const [keepId, ...deleteIds] = quotation_ids;
      console.log(`Keeping most recent: ${quote_numbers[0]} (${keepId})`);
      console.log(`Deleting ${deleteIds.length} older quotations...`);

      if (deleteIds.length > 0) {
        const deleteResult = await prisma.quotation.deleteMany({
          where: {
            id: {
              in: deleteIds
            }
          }
        });
        console.log(`Deleted ${deleteResult.count} quotations`);
      }
    }

    // Verify cleanup
    const remainingDuplicates = await prisma.$queryRaw`
      SELECT "ticketId", COUNT(*) as count
      FROM "Quotation" 
      WHERE "ticketId" IS NOT NULL 
      GROUP BY "ticketId" 
      HAVING COUNT(*) > 1
    `;

    if (remainingDuplicates.length === 0) {
      console.log('\n✅ Cleanup successful! No duplicate quotations remain.');
    } else {
      console.log(`\n⚠️  Warning: ${remainingDuplicates.length} tickets still have multiple quotations`);
    }

    // Show final statistics
    const totalQuotations = await prisma.quotation.count();
    const quotationsWithTickets = await prisma.quotation.count({
      where: { ticketId: { not: null } }
    });
    
    console.log(`\nFinal statistics:`);
    console.log(`Total quotations: ${totalQuotations}`);
    console.log(`Quotations linked to tickets: ${quotationsWithTickets}`);

  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupDuplicateQuotations();
