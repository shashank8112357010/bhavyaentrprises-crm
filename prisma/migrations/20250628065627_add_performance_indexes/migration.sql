-- CreateIndex
CREATE INDEX "Client_type_idx" ON "Client"("type");

-- CreateIndex
CREATE INDEX "Client_contactEmail_idx" ON "Client"("contactEmail");

-- CreateIndex
CREATE INDEX "Client_contactPhone_idx" ON "Client"("contactPhone");

-- CreateIndex
CREATE INDEX "Expense_ticketId_idx" ON "Expense"("ticketId");

-- CreateIndex
CREATE INDEX "Expense_quotationId_idx" ON "Expense"("quotationId");

-- CreateIndex
CREATE INDEX "Expense_createdAt_idx" ON "Expense"("createdAt");

-- CreateIndex
CREATE INDEX "Quotation_clientId_idx" ON "Quotation"("clientId");

-- CreateIndex
CREATE INDEX "Quotation_ticketId_idx" ON "Quotation"("ticketId");

-- CreateIndex
CREATE INDEX "RateCard_description_idx" ON "RateCard"("description");

-- CreateIndex
CREATE INDEX "Ticket_status_idx" ON "Ticket"("status");

-- CreateIndex
CREATE INDEX "Ticket_assigneeId_idx" ON "Ticket"("assigneeId");

-- CreateIndex
CREATE INDEX "Ticket_clientId_idx" ON "Ticket"("clientId");

-- CreateIndex
CREATE INDEX "Ticket_createdAt_idx" ON "Ticket"("createdAt");

-- CreateIndex
CREATE INDEX "Ticket_completedDate_idx" ON "Ticket"("completedDate");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_department_idx" ON "User"("department");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");
