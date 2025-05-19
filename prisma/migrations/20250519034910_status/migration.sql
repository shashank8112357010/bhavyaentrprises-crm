-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('new', 'inProgress', 'scheduled', 'onHold', 'completed');

-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN     "status" "TicketStatus" NOT NULL DEFAULT 'new';
