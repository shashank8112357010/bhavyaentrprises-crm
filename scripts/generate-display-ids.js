const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function generateDisplayIds() {
  try {
    console.log("🚀 Generating display IDs for existing records...");
    console.log("");

    // Update schema first
    console.log("📝 Updating database schema...");
    // Note: You need to run `npx prisma db push` first

    // Generate display IDs for existing users/agents
    console.log("👥 Generating AGENT display IDs...");
    const users = await prisma.user.findMany({
      where: {
        role: { not: "ADMIN" },
        displayId: null,
      },
      orderBy: { createdAt: "asc" },
    });

    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const displayId = `AGENT-${(i + 1).toString().padStart(4, "0")}`;

      await prisma.user.update({
        where: { id: user.id },
        data: { displayId },
      });

      console.log(`   ✅ ${user.name}: UUID -> ${displayId}`);
    }

    // Generate display IDs for existing clients
    console.log("🏢 Generating CLIENT display IDs...");
    const clients = await prisma.client.findMany({
      where: { displayId: null },
      orderBy: { name: "asc" }, // Use name instead of createdAt since createdAt doesn't exist
    });

    for (let i = 0; i < clients.length; i++) {
      const client = clients[i];
      const displayId = `CLIENT-${(i + 1).toString().padStart(4, "0")}`;

      await prisma.client.update({
        where: { id: client.id },
        data: { displayId },
      });

      console.log(`   ✅ ${client.name}: UUID -> ${displayId}`);
    }

    // Generate display IDs for existing quotations
    console.log("📋 Generating QUOTATION display IDs...");
    const quotations = await prisma.quotation.findMany({
      where: { displayId: null },
      orderBy: { createdAt: "asc" },
    });

    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    const quotationsByMonth = {};

    for (const quotation of quotations) {
      const createdDate = new Date(quotation.createdAt);
      const monthKey = `${createdDate.getFullYear()}-${monthNames[createdDate.getMonth()]}`;

      if (!quotationsByMonth[monthKey]) {
        quotationsByMonth[monthKey] = [];
      }
      quotationsByMonth[monthKey].push(quotation);
    }

    for (const [monthKey, monthQuotations] of Object.entries(
      quotationsByMonth,
    )) {
      const [year, month] = monthKey.split("-");

      for (let i = 0; i < monthQuotations.length; i++) {
        const quotation = monthQuotations[i];
        const displayId = `BE/${month}/${(i + 1).toString().padStart(4, "0")}`;

        await prisma.quotation.update({
          where: { id: quotation.id },
          data: { displayId },
        });

        console.log(`   ✅ ${quotation.name}: UUID -> ${displayId}`);
      }
    }

    // Generate display IDs for existing expenses
    console.log("💰 Generating EXPENSE display IDs...");
    const expenses = await prisma.expense.findMany({
      where: { displayId: null },
      orderBy: { createdAt: "asc" },
    });

    const expensesByMonth = {};

    for (const expense of expenses) {
      const createdDate = new Date(expense.createdAt);
      const monthKey = `${createdDate.getFullYear()}-${monthNames[createdDate.getMonth()]}`;

      if (!expensesByMonth[monthKey]) {
        expensesByMonth[monthKey] = [];
      }
      expensesByMonth[monthKey].push(expense);
    }

    for (const [monthKey, monthExpenses] of Object.entries(expensesByMonth)) {
      const [year, month] = monthKey.split("-");

      for (let i = 0; i < monthExpenses.length; i++) {
        const expense = monthExpenses[i];
        const displayId = `EXPENSE/${month}/${(i + 1).toString().padStart(4, "0")}`;

        await prisma.expense.update({
          where: { id: expense.id },
          data: { displayId },
        });

        console.log(`   ✅ ${expense.description}: UUID -> ${displayId}`);
      }
    }

    console.log("");
    console.log("✅ Display ID generation completed!");
    console.log("");
    console.log("🎯 Now your API responses will show:");
    console.log('   • id: "AGENT-0001" (for display)');
    console.log('   • originalId: "uuid-here" (for database operations)');
    console.log("");
    console.log("🔄 Restart your server to see the changes");
  } catch (error) {
    console.error("❌ Error generating display IDs:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
generateDisplayIds();
