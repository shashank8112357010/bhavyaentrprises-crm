const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log("🔍 Checking database structure...");
    console.log("");

    // Check which tables exist
    const tables = [
      { name: "User", check: () => prisma.user.findFirst() },
      { name: "Client", check: () => prisma.client.findFirst() },
      { name: "Ticket", check: () => prisma.ticket.findFirst() },
      { name: "Quotation", check: () => prisma.quotation.findFirst() },
      { name: "Expense", check: () => prisma.expense.findFirst() },
      { name: "WorkStage", check: () => prisma.workStage.findFirst() },
      { name: "Comment", check: () => prisma.comment.findFirst() },
      { name: "Notification", check: () => prisma.notification.findFirst() },
      { name: "RateCard", check: () => prisma.rateCard.findFirst() },
    ];

    const existingTables = [];
    const missingTables = [];

    for (const table of tables) {
      try {
        await table.check();
        existingTables.push(table.name);
        console.log(`✅ ${table.name} table exists`);
      } catch (error) {
        if (error.code === "P2021") {
          missingTables.push(table.name);
          console.log(`❌ ${table.name} table missing`);
        } else {
          existingTables.push(table.name);
          console.log(`✅ ${table.name} table exists (empty)`);
        }
      }
    }

    console.log("");
    console.log(
      `📊 Summary: ${existingTables.length} tables exist, ${missingTables.length} tables missing`,
    );

    if (missingTables.length > 0) {
      console.log("");
      console.log("🛠️  To fix missing tables, run:");
      console.log("   npx prisma db push");
      console.log("   or");
      console.log("   npx prisma migrate dev");
    }

    // Count existing records
    if (existingTables.includes("User")) {
      const userCount = await prisma.user.count();
      console.log(`👥 Users: ${userCount}`);
    }

    if (existingTables.includes("Client")) {
      const clientCount = await prisma.client.count();
      console.log(`🏢 Clients: ${clientCount}`);
    }

    if (existingTables.includes("Ticket")) {
      const ticketCount = await prisma.ticket.count();
      console.log(`🎫 Tickets: ${ticketCount}`);
    }

    if (existingTables.includes("Quotation")) {
      const quotationCount = await prisma.quotation.count();
      console.log(`📋 Quotations: ${quotationCount}`);
    }

    console.log("");
    console.log("🎯 To reset data for new ID formats, run:");
    console.log("   npm run reset-ids");
  } catch (error) {
    console.error("❌ Error checking database:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
checkDatabase();
