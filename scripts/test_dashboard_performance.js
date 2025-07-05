const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function testDashboardPerformance() {
  console.log('🚀 Testing Dashboard Query Performance...\n');

  const sampleUserId = 'test-user-id'; // Replace with actual user ID
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);

  const ticketFilter = { assigneeId: sampleUserId };

  try {
    console.log('1️⃣ Testing Batched Count Queries...');
    const startTime = Date.now();
    
    const counts = await prisma.$transaction(async (tx) => {
      const [openTickets, scheduledToday, clientUpdates, completedWeek, agents, clients] = 
        await Promise.all([
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
          tx.user.count({
            where: {
              role: { in: ["BACKEND", "RM", "MST"] },
              status: "ACTIVE",
            },
          }),
          tx.client.count(),
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

    const countsTime = Date.now() - startTime;
    console.log(`✅ Batched counts completed in ${countsTime}ms`);
    console.log('📊 Count Results:', counts);

    console.log('\n2️⃣ Testing Optimized Ticket Query...');
    const ticketsStartTime = Date.now();
    
    const tickets = await prisma.ticket.findMany({
      where: ticketFilter,
      select: {
        id: true,
        ticketId: true,
        title: true,
        status: true,
        createdAt: true,
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        client: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    const ticketsTime = Date.now() - ticketsStartTime;
    console.log(`✅ Optimized tickets query completed in ${ticketsTime}ms`);
    console.log(`📝 Retrieved ${tickets.length} tickets`);

    console.log('\n3️⃣ Testing Agents Query...');
    const agentsStartTime = Date.now();
    
    const agents = await prisma.user.findMany({
      where: {
        role: { in: ["BACKEND", "RM", "MST"] },
        status: "ACTIVE",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    const agentsTime = Date.now() - agentsStartTime;
    console.log(`✅ Agents query completed in ${agentsTime}ms`);
    console.log(`👥 Retrieved ${agents.length} agents`);

    console.log('\n4️⃣ Testing Clients Query...');
    const clientsStartTime = Date.now();
    
    const clients = await prisma.client.findMany({
      select: {
        id: true,
        name: true,
        type: true,
        contactPerson: true,
      },
      orderBy: { name: "asc" },
      take: 10,
    });

    const clientsTime = Date.now() - clientsStartTime;
    console.log(`✅ Clients query completed in ${clientsTime}ms`);
    console.log(`🏢 Retrieved ${clients.length} clients`);

    console.log('\n5️⃣ Testing Quotations Query...');
    const quotationsStartTime = Date.now();
    
    const quotations = await prisma.quotation.findMany({
      select: {
        id: true,
        quoteNo: true,
        name: true,
        createdAt: true,
        grandTotal: true,
        client: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    const quotationsTime = Date.now() - quotationsStartTime;
    console.log(`✅ Quotations query completed in ${quotationsTime}ms`);
    console.log(`📋 Retrieved ${quotations.length} quotations`);

    const totalTime = Date.now() - startTime;
    console.log(`\n🏁 Total execution time: ${totalTime}ms`);
    
    console.log('\n📈 Performance Summary:');
    console.log(`- Batched counts: ${countsTime}ms`);
    console.log(`- Tickets query: ${ticketsTime}ms`);
    console.log(`- Agents query: ${agentsTime}ms`);
    console.log(`- Clients query: ${clientsTime}ms`);
    console.log(`- Quotations query: ${quotationsTime}ms`);

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function checkIndexes() {
  console.log('\n🔍 Checking Database Indexes...');
  
  try {
    const indexes = await prisma.$queryRaw`
      SELECT 
        tablename,
        indexname,
        indexdef
      FROM pg_indexes 
      WHERE schemaname = 'public' 
      AND (
        tablename IN ('Ticket', 'User', 'Client', 'Quotation')
        AND (
          indexname LIKE '%status%' OR 
          indexname LIKE '%assignee%' OR
          indexname LIKE '%role%' OR
          indexname LIKE '%scheduled%' OR
          indexname LIKE '%completed%' OR
          indexname LIKE '%name%'
        )
      )
      ORDER BY tablename, indexname;
    `;
    
    console.log('📊 Relevant Indexes:');
    indexes.forEach(index => {
      console.log(`- ${index.tablename}.${index.indexname}`);
    });
    
  } catch (error) {
    console.error('❌ Failed to check indexes:', error);
  }
}

// Run the tests
async function main() {
  await checkIndexes();
  await testDashboardPerformance();
}

main().catch(console.error);
