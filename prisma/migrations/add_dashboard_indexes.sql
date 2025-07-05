-- Migration: Add composite indexes for dashboard optimization
-- This migration adds the indexes required for optimizing dashboard queries

BEGIN;

-- Add composite index for ticket(status, assigneeId) - most frequently used combination
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_ticket_status_assigneeid" 
ON "Ticket" ("status", "assigneeId");

-- Add index for scheduledDate queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_ticket_scheduled_date" 
ON "Ticket" ("scheduledDate") 
WHERE "scheduledDate" IS NOT NULL;

-- Add index for completedDate queries  
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_ticket_completed_date" 
ON "Ticket" ("completedDate") 
WHERE "completedDate" IS NOT NULL;

-- Add composite index for feedback queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_ticket_feedback_status" 
ON "Ticket" ("feedback", "status");

-- Add composite index for role and status queries on User table
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_user_role_status" 
ON "User" ("role", "status");

-- Add index for client name ordering
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_client_name" 
ON "Client" ("name");

COMMIT;
