-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'BACKEND', 'RM', 'MST', 'ACCOUNTS');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ticket" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "client" TEXT NOT NULL,
    "branch" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3),
    "scheduledDate" TIMESTAMP(3),
    "completedDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT NOT NULL,
    "comments" INTEGER NOT NULL,
    "holdReason" TEXT,
    "assigneeId" TEXT NOT NULL,
    "workStageId" TEXT,

    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkStage" (
    "id" TEXT NOT NULL,
    "stateName" TEXT NOT NULL,
    "adminName" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "siteName" TEXT NOT NULL,
    "quoteNo" TEXT NOT NULL,
    "dateReceived" TIMESTAMP(3) NOT NULL,
    "quoteTaxable" DOUBLE PRECISION NOT NULL,
    "quoteAmount" DOUBLE PRECISION NOT NULL,
    "workStatus" TEXT NOT NULL,
    "approval" TEXT NOT NULL,
    "poStatus" TEXT NOT NULL,
    "poNumber" TEXT NOT NULL,
    "jcrStatus" TEXT NOT NULL,
    "agentName" TEXT NOT NULL,

    CONSTRAINT "WorkStage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Ticket_workStageId_key" ON "Ticket"("workStageId");

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_workStageId_fkey" FOREIGN KEY ("workStageId") REFERENCES "WorkStage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
