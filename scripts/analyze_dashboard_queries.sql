-- Dashboard Query Analysis Script
-- This script analyzes the performance of queries used in /api/dashboard/data

-- 1. Analyze main tickets query (with role-based filtering)
EXPLAIN ANALYZE
SELECT * FROM "Ticket" 
WHERE "assigneeId" = 'sample-user-id'
ORDER BY "createdAt" DESC;

-- 2. Analyze open tickets count query
EXPLAIN ANALYZE
SELECT COUNT(*) FROM "Ticket" 
WHERE "assigneeId" = 'sample-user-id' 
AND "status" IN ('new', 'inProgress', 'onHold');

-- 3. Analyze scheduled today count query
EXPLAIN ANALYZE
SELECT COUNT(*) FROM "Ticket" 
WHERE "assigneeId" = 'sample-user-id' 
AND "scheduledDate" >= CURRENT_DATE 
AND "scheduledDate" < CURRENT_DATE + INTERVAL '1 day';

-- 4. Analyze client updates needed count query
EXPLAIN ANALYZE
SELECT COUNT(*) FROM "Ticket" 
WHERE "assigneeId" = 'sample-user-id' 
AND "status" IN ('billing_pending', 'completed') 
AND "feedback" = 'PENDING';

-- 5. Analyze completed this week count query
EXPLAIN ANALYZE
SELECT COUNT(*) FROM "Ticket" 
WHERE "assigneeId" = 'sample-user-id' 
AND "status" = 'completed' 
AND "completedDate" >= DATE_TRUNC('week', CURRENT_DATE) 
AND "completedDate" < DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '1 week';

-- 6. Analyze clients query (admin only)
EXPLAIN ANALYZE
SELECT * FROM "Client" 
ORDER BY "name" ASC;

-- 7. Analyze agents query (admin only)
EXPLAIN ANALYZE
SELECT * FROM "User" 
WHERE "role" IN ('BACKEND', 'RM', 'MST') 
AND "status" = 'ACTIVE'
ORDER BY "createdAt" DESC;

-- 8. Analyze quotations query
EXPLAIN ANALYZE
SELECT * FROM "Quotation" 
ORDER BY "createdAt" DESC 
LIMIT 50;

-- 9. Analyze total agents count
EXPLAIN ANALYZE
SELECT COUNT(*) FROM "User" 
WHERE "role" IN ('BACKEND', 'RM', 'MST') 
AND "status" = 'ACTIVE';

-- 10. Analyze total clients count
EXPLAIN ANALYZE
SELECT COUNT(*) FROM "Client";
