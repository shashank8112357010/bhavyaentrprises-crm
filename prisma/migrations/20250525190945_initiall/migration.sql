-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'BACKEND', 'RM', 'MST', 'ACCOUNTS');

-- CreateEnum
CREATE TYPE "PerformanceTrend" AS ENUM ('UP', 'DOWN', 'STABLE');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('ACTIVE', 'INACTIVE', 'PENDING');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('new', 'inProgress', 'scheduled', 'onHold', 'completed');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "department" TEXT,
    "specialization" TEXT,
    "status" "Status" NOT NULL DEFAULT 'ACTIVE',
    "leadsAssigned" INTEGER NOT NULL DEFAULT 0,
    "leadsActive" INTEGER NOT NULL DEFAULT 0,
    "leadsClosed" INTEGER NOT NULL DEFAULT 0,
    "conversionRate" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "performanceTrend" "PerformanceTrend" NOT NULL DEFAULT 'STABLE',
    "joinedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "avatar" TEXT,
    "initials" TEXT,
    "activeTickets" INTEGER NOT NULL DEFAULT 0,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "completedTickets" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "totalBranches" INTEGER NOT NULL,
    "contactPerson" TEXT NOT NULL,
    "contactEmail" TEXT,
    "contactPhone" TEXT NOT NULL,
    "contractStatus" TEXT NOT NULL,
    "lastServiceDate" TIMESTAMP(3) NOT NULL,
    "avatar" TEXT,
    "initials" TEXT NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ticket" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
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
    "status" "TicketStatus" NOT NULL DEFAULT 'new',
    "workStageId" TEXT,
    "clientId" TEXT NOT NULL,

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
    "ticketId" TEXT,

    CONSTRAINT "WorkStage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_mobile_key" ON "User"("mobile");

-- CreateIndex
CREATE UNIQUE INDEX "Ticket_workStageId_key" ON "Ticket"("workStageId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkStage_ticketId_key" ON "WorkStage"("ticketId");

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_workStageId_fkey" FOREIGN KEY ("workStageId") REFERENCES "WorkStage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
