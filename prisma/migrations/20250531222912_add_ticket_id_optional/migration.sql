-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'BACKEND', 'RM', 'MST', 'ACCOUNTS');

-- CreateEnum
CREATE TYPE "PerformanceTrend" AS ENUM ('UP', 'DOWN', 'STABLE');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('ACTIVE', 'INACTIVE', 'PENDING');

-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('LABOR', 'TRANSPORT', 'MATERIAL', 'OTHER');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('VCASH', 'ONLINE', 'REST');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('new', 'inProgress', 'onHold', 'completed', 'billing_pending', 'billing_completed');

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
CREATE TABLE "RateCard" (
    "id" TEXT NOT NULL,
    "srNo" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "bankName" TEXT NOT NULL,
    "bankRcNo" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RateCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quotation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "pdfUrl" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rateCardDetails" JSONB,
    "ticketId" TEXT,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "gst" DOUBLE PRECISION NOT NULL,
    "grandTotal" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Quotation_pkey" PRIMARY KEY ("id")
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
    "gstn" TEXT,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "customId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL,
    "category" "ExpenseCategory" NOT NULL,
    "requester" TEXT NOT NULL,
    "paymentType" "PaymentType" NOT NULL,
    "quotationId" TEXT,
    "ticketId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pdfUrl" TEXT,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ticket" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT,
    "title" TEXT NOT NULL,
    "branch" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3),
    "scheduledDate" TIMESTAMP(3),
    "completedDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT NOT NULL,
    "comments" INTEGER,
    "holdReason" TEXT,
    "due" INTEGER,
    "paid" BOOLEAN DEFAULT false,
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
    "poStatus" BOOLEAN NOT NULL DEFAULT false,
    "poNumber" TEXT NOT NULL,
    "jcrStatus" BOOLEAN NOT NULL DEFAULT false,
    "agentName" TEXT NOT NULL,
    "ticketId" TEXT,

    CONSTRAINT "WorkStage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_mobile_key" ON "User"("mobile");

-- CreateIndex
CREATE UNIQUE INDEX "Expense_customId_key" ON "Expense"("customId");

-- CreateIndex
CREATE UNIQUE INDEX "Ticket_ticketId_key" ON "Ticket"("ticketId");

-- CreateIndex
CREATE UNIQUE INDEX "Ticket_workStageId_key" ON "Ticket"("workStageId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkStage_ticketId_key" ON "WorkStage"("ticketId");

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_workStageId_fkey" FOREIGN KEY ("workStageId") REFERENCES "WorkStage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
