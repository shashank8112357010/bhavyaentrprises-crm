const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function addExpectedExpenseField() {
  try {
    console.log("🚀 Adding expectedExpense field to existing quotations...");
    console.log("");

    // First, let's check how many quotations exist without expectedExpense
    const quotationsCount = await prisma.quotation.count();
    console.log(`📊 Found ${quotationsCount} quotations in the database`);

    // Since we're adding a new field with a default value of 0,
    // Prisma should handle this automatically when we push the schema.
    // But let's verify all quotations have the field set properly.

    const quotationsWithoutExpectedExpense = await prisma.quotation.count({
      where: {
        expectedExpense: null,
      },
    });

    console.log(
      `📊 Quotations without expectedExpense: ${quotationsWithoutExpectedExpense}`,
    );

    if (quotationsWithoutExpectedExpense > 0) {
      console.log(
        "🔧 Updating quotations to set default expectedExpense value...",
      );

      const result = await prisma.quotation.updateMany({
        where: {
          expectedExpense: null,
        },
        data: {
          expectedExpense: 0,
        },
      });

      console.log(
        `✅ Updated ${result.count} quotations with default expectedExpense value`,
      );
    } else {
      console.log("✅ All quotations already have expectedExpense field set");
    }

    console.log("");
    console.log("✅ expectedExpense field migration completed!");
    console.log("");
  } catch (error) {
    console.error("❌ Error adding expectedExpense field:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
addExpectedExpenseField();
