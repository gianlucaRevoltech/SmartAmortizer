# Smart Amortizer - Production Deployment Guide

## Server Requirements

- Ubuntu 20.04+ or similar Linux distribution
- At least 1GB RAM (2GB recommended)
- Node.js 18.x
- Nginx
- PM2 Process Manager

## Quick Deploy

### 1. Upload files to your VPS

```bash
# From your local machine
scp -r * user@your-server-ip:/tmp/smart-amortizer/
```

### 2. Connect to your VPS and run deployment

```bash
ssh user@your-server-ip
cd /tmp/smart-amortizer
sudo chmod +x deploy.sh
sudo ./deploy.sh
```

### 3. Configure your domain (if you have one)

Edit the nginx configuration:

```bash
sudo nano /etc/nginx/sites-available/smart-amortizer
# Replace 'your-domain.com' with your actual domain
sudo systemctl reload nginx
```

## Manual Deployment Steps

### 1. Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs nginx git

# Install PM2
sudo npm install -g pm2
```

### 2. Setup Application

```bash
# Create app directory
sudo mkdir -p /var/www/smart-amortizer
sudo chown -R $USER:$USER /var/www/smart-amortizer
cd /var/www/smart-amortizer

# Copy your application files here
# Install dependencies
npm install --production

# Build for production
npm run build:prod
```

### 3. Configure PM2

```bash
# Start application with PM2
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Enable PM2 to start on boot
pm2 startup
# Follow the instructions provided by the command above
```

### 4. Configure Nginx

```bash
# Copy nginx configuration
sudo cp nginx.conf /etc/nginx/sites-available/smart-amortizer

# Enable the site
sudo ln -s /etc/nginx/sites-available/smart-amortizer /etc/nginx/sites-enabled/

# Remove default site
sudo rm -f /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### 5. Configure Firewall

```bash
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

## SSL/HTTPS Setup (Recommended)

### Using Let's Encrypt (Free SSL)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal is set up automatically
```

## Monitoring and Maintenance

### Check Application Status

```bash
pm2 status
pm2 logs smart-amortizer
```

### Check Nginx Status

```bash
sudo systemctl status nginx
sudo nginx -t  # Test configuration
```

### Update Application

```bash
cd /var/www/smart-amortizer
git pull  # if using git
npm install --production
npm run build:prod
pm2 restart smart-amortizer
```

## Troubleshooting

### Application won't start

```bash
pm2 logs smart-amortizer  # Check logs
pm2 restart smart-amortizer
```

### Nginx issues

```bash
sudo nginx -t  # Check configuration
sudo systemctl status nginx
sudo journalctl -u nginx -f  # View logs
```

### Performance tuning

- Increase server memory if needed
- Configure PM2 cluster mode for better performance
- Enable Nginx caching for static assets

## Security Considerations

1. Keep your server updated
2. Use strong passwords and SSH keys
3. Configure fail2ban for intrusion prevention
4. Regular backups of your application data
5. Monitor server resources and logs
