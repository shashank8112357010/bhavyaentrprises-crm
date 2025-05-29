/*
  Warnings:

  - Added the required column `paymentType` to the `Expense` table without a default value. This is not possible if the table is not empty.
  - Added the required column `requester` to the `Expense` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('VCASH', 'ONLINE', 'REST');

-- AlterTable
ALTER TABLE "Expense" ADD COLUMN     "paymentType" "PaymentType" NOT NULL,
ADD COLUMN     "requester" TEXT NOT NULL;
