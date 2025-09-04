#!/bin/bash

# Deploy script for Smart Amortizer
# Usage: ./deploy.sh

set -e

echo "🚀 Starting deployment process..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="smart-amortizer"
APP_DIR="/var/www/${APP_NAME}"
NGINX_SITES="/etc/nginx/sites-available"
NGINX_ENABLED="/etc/nginx/sites-enabled"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Please run this script as root (use sudo)${NC}"
    exit 1
fi

echo -e "${YELLOW}1. Updating system packages...${NC}"
apt update && apt upgrade -y

echo -e "${YELLOW}2. Installing required packages...${NC}"
# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs nginx git

# Install PM2 globally
npm install -g pm2

echo -e "${YELLOW}3. Creating application directory...${NC}"
mkdir -p ${APP_DIR}
mkdir -p ${APP_DIR}/logs

echo -e "${YELLOW}4. Setting up Nginx configuration...${NC}"
cp nginx.conf ${NGINX_SITES}/${APP_NAME}
ln -sf ${NGINX_SITES}/${APP_NAME} ${NGINX_ENABLED}/
rm -f ${NGINX_ENABLED}/default

echo -e "${YELLOW}5. Installing application dependencies...${NC}"
cd ${APP_DIR}
npm install --production

echo -e "${YELLOW}6. Building application...${NC}"
npm run build:prod

echo -e "${YELLOW}7. Setting up PM2...${NC}"
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup

echo -e "${YELLOW}8. Configuring firewall...${NC}"
ufw allow 22
ufw allow 80
ufw allow 443
ufw --force enable

echo -e "${YELLOW}9. Starting services...${NC}"
systemctl enable nginx
systemctl restart nginx

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo -e "${GREEN}Your application should now be accessible at: http://your-server-ip${NC}"
echo -e "${YELLOW}Don't forget to:${NC}"
echo -e "  - Replace 'your-domain.com' in nginx.conf with your actual domain/IP"
echo -e "  - Set up SSL certificates for HTTPS (optional but recommended)"
echo -e "  - Configure your domain DNS to point to this server"

echo -e "${YELLOW}Useful commands:${NC}"
echo -e "  - Check application status: pm2 status"
echo -e "  - View logs: pm2 logs ${APP_NAME}"
echo -e "  - Restart app: pm2 restart ${APP_NAME}"
echo -e "  - Check Nginx status: systemctl status nginx"
