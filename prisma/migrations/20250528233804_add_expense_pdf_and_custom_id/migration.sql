/*
  Warnings:

  - A unique constraint covering the columns `[customId]` on the table `Expense` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `customId` to the `Expense` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Expense" ADD COLUMN     "customId" TEXT NOT NULL,
ADD COLUMN     "pdfUrl" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Expense_customId_key" ON "Expense"("customId");
