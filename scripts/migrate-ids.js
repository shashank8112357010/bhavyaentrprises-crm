const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function migrateExistingIds() {
  try {
    console.log("🚀 Starting ID migration for existing records...");

    // Migrate Clients
    console.log("🏢 Updating client IDs...");
    const clients = await prisma.client.findMany({
      orderBy: { createdAt: "asc" },
    });

    for (let i = 0; i < clients.length; i++) {
      const client = clients[i];
      const newId = `CLIENT-${(i + 1).toString().padStart(4, "0")}`;

      // We can't update the primary key directly, so we'll need to delete and recreate
      // This is complex with foreign keys, so we recommend using the reset script instead
      console.log(`  Client ${client.name}: ${client.id} -> ${newId}`);
    }

    // Migrate Users/Agents
    console.log("👥 Updating agent IDs...");
    const users = await prisma.user.findMany({
      where: { role: { not: "ADMIN" } },
      orderBy: { createdAt: "asc" },
    });

    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const newId = `AGENT-${(i + 1).toString().padStart(4, "0")}`;
      console.log(`  Agent ${user.name}: ${user.id} -> ${newId}`);
    }

    // Note: Quotations and Expenses use current month format and are harder to migrate
    // It's recommended to use the reset script instead

    console.log("");
    console.log(
      "⚠️  Note: Due to foreign key constraints, it's recommended to use the reset script instead.",
    );
    console.log("   Run: npm run reset-ids");
  } catch (error) {
    console.error("❌ Error migrating IDs:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
migrateExistingIds();
