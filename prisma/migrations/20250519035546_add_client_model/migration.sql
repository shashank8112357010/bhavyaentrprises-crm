/*
  Warnings:

  - You are about to drop the column `client` on the `Ticket` table. All the data in the column will be lost.
  - Added the required column `clientId` to the `Ticket` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Ticket" DROP COLUMN "client",
ADD COLUMN     "clientId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "totalBranches" INTEGER NOT NULL,
    "contactPerson" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "contactPhone" TEXT NOT NULL,
    "contractStatus" TEXT NOT NULL,
    "lastServiceDate" TIMESTAMP(3) NOT NULL,
    "avatar" TEXT NOT NULL,
    "initials" TEXT NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
