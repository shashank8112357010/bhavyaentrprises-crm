-- CreateEnum
CREATE TYPE "TicketFeedback" AS ENUM ('POSITIVE', 'NEUTRAL', 'NEGATIVE', 'PENDING');

-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN     "feedback" "TicketFeedback" DEFAULT 'PENDING',
ADD COLUMN     "photosUploaded" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Quotation_createdAt_idx" ON "Quotation"("createdAt");
