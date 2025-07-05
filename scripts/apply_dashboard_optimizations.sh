#!/bin/bash

# Apply Dashboard Database Optimizations
echo "Applying dashboard database optimizations..."

# 1. Generate and apply Prisma migration for new indexes
echo "Generating Prisma migration for new indexes..."
npx prisma migrate dev --name add_dashboard_indexes

# 2. Apply the custom SQL migration for additional indexes
echo "Applying custom SQL migration..."
npx prisma db execute --file ./scripts/analyze_dashboard_queries.sql --schema ./prisma/schema.prisma

echo "Optimizations applied successfully!"

# 3. Optional: Run ANALYZE to update table statistics
echo "Updating table statistics..."
npx prisma db execute --stdin << 'EOF'
ANALYZE "Ticket";
ANALYZE "User";
ANALYZE "Client";
ANALYZE "Quotation";
EOF

echo "Database optimization complete!"
