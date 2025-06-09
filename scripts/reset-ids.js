const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function safeDeleteMany(modelName, operation, condition = {}) {
  try {
    console.log(`📝 Deleting ${modelName}...`);
    const result = await operation(condition);
    console.log(`   ✅ Deleted ${result.count || 0} ${modelName} records`);
  } catch (error) {
    if (error.code === "P2021") {
      console.log(`   ⚠️  Table ${modelName} doesn't exist, skipping...`);
    } else {
      console.log(`   ❌ Error deleting ${modelName}:`, error.message);
    }
  }
}

async function resetDatabaseForNewIds() {
  try {
    console.log("🚀 Starting database reset for new ID formats...");
    console.log("");

    // Step 1: Delete dependent records first (to avoid foreign key constraints)
    // Only delete from tables that exist

    await safeDeleteMany("notifications", () =>
      prisma.notification.deleteMany({}),
    );
    await safeDeleteMany("comments", () => prisma.comment.deleteMany({}));
    await safeDeleteMany("expenses", () => prisma.expense.deleteMany({}));
    await safeDeleteMany("quotations", () => prisma.quotation.deleteMany({}));
    await safeDeleteMany("work stages", () => prisma.workStage.deleteMany({}));
    await safeDeleteMany("tickets", () => prisma.ticket.deleteMany({}));
    await safeDeleteMany("clients", () => prisma.client.deleteMany({}));

    console.log("👥 Deleting users (except admin)...");
    try {
      const result = await prisma.user.deleteMany({
        where: {
          role: {
            not: "ADMIN",
          },
        },
      });
      console.log(`   ✅ Deleted ${result.count} non-admin users`);
    } catch (error) {
      console.log("   ❌ Error deleting users:", error.message);
    }

    console.log("");
    console.log("✅ Database reset completed successfully!");
    console.log("");
    console.log("🆕 New records will now use the updated ID formats:");
    console.log("   • Clients: CLIENT-0001, CLIENT-0002, ...");
    console.log("   • Agents: AGENT-0001, AGENT-0002, ...");
    console.log("   • Quotations: BE/January/0001, BE/January/0002, ...");
    console.log(
      "   • Expenses: EXPENSE/January/0001, EXPENSE/January/0002, ...",
    );
    console.log("");
    console.log("🔐 Your admin user has been preserved.");
    console.log("");
    console.log("🎯 Next steps:");
    console.log("   1. Create a new client to see CLIENT-0001");
    console.log("   2. Create a new agent to see AGENT-0001");
    console.log("   3. Create quotations and expenses to see monthly formats");
  } catch (error) {
    console.error("❌ Error resetting database:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
resetDatabaseForNewIds();
