/*
  Warnings:

  - A unique constraint covering the columns `[quoteNo]` on the table `Quotation` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `quoteNo` to the `Quotation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Quotation" ADD COLUMN     "quoteNo" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Quotation_quoteNo_key" ON "Quotation"("quoteNo");
