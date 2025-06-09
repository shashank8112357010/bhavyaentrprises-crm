const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function testClientCreation() {
  try {
    console.log("🔍 Testing client creation with display ID generation...");
    console.log("");

    // Check current state
    console.log("📊 Current client state:");
    const allClients = await prisma.client.findMany({
      select: {
        id: true,
        displayId: true,
        name: true,
      },
      orderBy: { name: "asc" },
    });

    allClients.forEach((client, index) => {
      console.log(`   ${index + 1}. ${client.name}`);
      console.log(`      UUID: ${client.id}`);
      console.log(`      Display ID: ${client.displayId || "NULL"}`);
      console.log("");
    });

    // Test finding the latest client with displayId
    console.log("🔍 Testing latest client lookup for display ID generation...");
    const latestClient = await prisma.client.findFirst({
      where: { displayId: { not: null } },
      orderBy: { displayId: "desc" }, // Order by displayId since no createdAt
      select: { displayId: true },
    });

    if (latestClient) {
      console.log(
        `   Latest client with display ID: ${latestClient.displayId}`,
      );

      // Extract number from existing client displayId (format: CLIENT-0001)
      const idMatch = latestClient.displayId.match(/CLIENT-(\d+)$/);
      if (idMatch) {
        const nextNumber = parseInt(idMatch[1]) + 1;
        const nextDisplayId = `CLIENT-${nextNumber.toString().padStart(4, "0")}`;
        console.log(`   Next display ID would be: ${nextDisplayId}`);
      } else {
        console.log(
          `   ⚠️  Could not parse display ID format: ${latestClient.displayId}`,
        );
      }
    } else {
      console.log(
        "   No clients with display ID found, next would be: CLIENT-0001",
      );
    }

    console.log("");
    console.log("✅ Test completed!");
  } catch (error) {
    console.error("❌ Error testing client creation:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testClientCreation();
