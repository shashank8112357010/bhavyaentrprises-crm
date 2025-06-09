const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function checkDatabaseStatus() {
  try {
    console.log("🔍 Checking database status...");
    console.log("");

    // Check if displayId column exists
    try {
      const sampleUser = await prisma.user.findFirst({
        select: {
          id: true,
          displayId: true,
          name: true,
        },
      });

      if (sampleUser) {
        console.log("✅ displayId column exists in User table");
        console.log(`   Sample: ${sampleUser.name}`);
        console.log(`   UUID: ${sampleUser.id}`);
        console.log(`   DisplayId: ${sampleUser.displayId || "NULL"}`);
      } else {
        console.log("⚠️  No users found in database");
      }
    } catch (error) {
      if (error.message.includes("displayId")) {
        console.log("❌ displayId column does not exist in User table");
        console.log("   Run: npx prisma db push");
      } else {
        console.log("❌ Error checking User table:", error.message);
      }
    }

    // Check clients
    try {
      const sampleClient = await prisma.client.findFirst({
        select: {
          id: true,
          displayId: true,
          name: true,
        },
      });

      if (sampleClient) {
        console.log("✅ displayId column exists in Client table");
        console.log(`   Sample: ${sampleClient.name}`);
        console.log(`   UUID: ${sampleClient.id}`);
        console.log(`   DisplayId: ${sampleClient.displayId || "NULL"}`);
      }
    } catch (error) {
      if (error.message.includes("displayId")) {
        console.log("❌ displayId column does not exist in Client table");
      }
    }

    // Count records without display IDs
    try {
      const usersWithoutDisplayId = await prisma.user.count({
        where: {
          displayId: null,
          role: { not: "ADMIN" },
        },
      });
      console.log(`📊 Users without display ID: ${usersWithoutDisplayId}`);

      const clientsWithoutDisplayId = await prisma.client.count({
        where: { displayId: null },
      });
      console.log(`📊 Clients without display ID: ${clientsWithoutDisplayId}`);
    } catch (error) {
      console.log("⚠️  Could not count records without display IDs");
    }
  } catch (error) {
    console.error("❌ Error checking database:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
checkDatabaseStatus();
