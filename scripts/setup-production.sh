#!/bin/bash

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting Bhavya Enterprises CRM setup...${NC}"

# Check if postgresql is installed
if ! command -v psql &> /dev/null; then
    echo -e "${RED}PostgreSQL is not installed. Please install PostgreSQL first.${NC}"
    exit 1
fi

# Database configuration
DB_NAME="interiorcrm"
DB_USER="admin"
DB_PASSWORD="admin"
DB_HOST="localhost"

# Create database user if not exists
echo -e "${YELLOW}Creating database user if not exists...${NC}"
sudo -u postgres psql -v ON_ERROR_STOP=1 <<-EOSQL
    DO \$\$
    BEGIN
        IF NOT EXISTS (SELECT FROM pg_user WHERE usename = '$DB_USER') THEN
            CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
        END IF;
    END
    \$\$;
EOSQL

# Create database if not exists
echo -e "${YELLOW}Creating database if not exists...${NC}"
sudo -u postgres psql -v ON_ERROR_STOP=1 <<-EOSQL
    SELECT 'CREATE DATABASE $DB_NAME'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$DB_NAME')\gexec
    GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
EOSQL

# Update .env file
echo -e "${YELLOW}Updating .env file...${NC}"
cat > .env <<EOL
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:5432/${DB_NAME}"
JWT_SECRET=bhavyaentrprises_secret
NEXT_PUBLIC_API_BASE_URL=https://crm.bhavyaentrprises.com/api
NEXT_PUBLIC_BASE_URL=https://crm.bhavyaentrprises.com
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=help@tchassistant.co.in
SMTP_PASS="Kgn?c6@|6"
NEXT_PUBLIC_ADMIN_USER_EMAIL=lead@praarabdh.com
EOL

# Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
npm install

# Run Prisma migrations
echo -e "${YELLOW}Running database migrations...${NC}"
npx prisma migrate deploy

# Seed the database
echo -e "${YELLOW}Seeding the database with initial data...${NC}"
npx prisma db seed

# Build the Next.js application
echo -e "${YELLOW}Building the Next.js application...${NC}"
npm run build

# Create Nginx configuration
echo -e "${YELLOW}Creating Nginx configuration...${NC}"
sudo cat > /etc/nginx/sites-available/crm.bhavyaentrprises.com <<EOL
server {
    listen 80;
    server_name crm.bhavyaentrprises.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOL

# Enable the site
echo -e "${YELLOW}Enabling the site in Nginx...${NC}"
sudo ln -s /etc/nginx/sites-available/crm.bhavyaentrprises.com /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl restart nginx

# Install PM2 if not present
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}Installing PM2...${NC}"
    npm install -g pm2
fi

# Start the application with PM2
echo -e "${YELLOW}Starting the application with PM2...${NC}"
pm2 start npm --name "bhavya-crm" -- start

# Install Certbot and get SSL certificate
echo -e "${YELLOW}Setting up SSL with Let's Encrypt...${NC}"
sudo apt-get update
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d crm.bhavyaentrprises.com --non-interactive --agree-tos --email lead@praarabdh.com

echo -e "${GREEN}Setup completed successfully!${NC}"
echo -e "${GREEN}Your CRM is now running at https://crm.bhavyaentrprises.com${NC}"
echo -e "${YELLOW}Important: Please update the .env file with your actual credentials and secrets${NC}"
