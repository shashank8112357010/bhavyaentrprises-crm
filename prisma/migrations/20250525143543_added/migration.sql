/*
  Warnings:

  - A unique constraint covering the columns `[ticketId]` on the table `WorkStage` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "WorkStage" ADD COLUMN     "ticketId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "WorkStage_ticketId_key" ON "WorkStage"("ticketId");
