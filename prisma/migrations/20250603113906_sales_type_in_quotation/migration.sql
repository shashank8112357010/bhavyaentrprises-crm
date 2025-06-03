/*
  Warnings:

  - Added the required column `salesType` to the `Quotation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Quotation" ADD COLUMN     "salesType" TEXT NOT NULL,
ADD COLUMN     "validUntil" TIMESTAMP(3),
ALTER COLUMN "pdfUrl" DROP NOT NULL;
