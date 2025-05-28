/*
  Warnings:

  - Added the required column `grandTotal` to the `Quotation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `gst` to the `Quotation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subtotal` to the `Quotation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Quotation" ADD COLUMN     "grandTotal" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "gst" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "subtotal" DOUBLE PRECISION NOT NULL;
