/*
  Warnings:

  - The `poStatus` column on the `WorkStage` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `jcrStatus` column on the `WorkStage` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN     "due" INTEGER,
ADD COLUMN     "paid" BOOLEAN DEFAULT false;

-- AlterTable
ALTER TABLE "WorkStage" DROP COLUMN "poStatus",
ADD COLUMN     "poStatus" BOOLEAN NOT NULL DEFAULT false,
DROP COLUMN "jcrStatus",
ADD COLUMN     "jcrStatus" BOOLEAN NOT NULL DEFAULT false;
