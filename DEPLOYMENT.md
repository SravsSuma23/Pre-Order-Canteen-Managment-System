# Deployment Guide - Pre-Order Canteen Management System

## Overview

This guide provides comprehensive instructions for deploying the Pre-Order Canteen Management System to various environments including local development, staging, and production servers.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Configuration](#environment-configuration)
3. [Database Setup](#database-setup)
4. [Docker Deployment](#docker-deployment)
5. [Manual Deployment](#manual-deployment)
6. [Cloud Deployment](#cloud-deployment)
7. [SSL/TLS Configuration](#ssl-tls-configuration)
8. [Monitoring & Maintenance](#monitoring--maintenance)
9. [Backup & Recovery](#backup--recovery)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### System Requirements

#### Minimum Requirements
- **CPU**: 2 cores
- **RAM**: 4GB
- **Storage**: 20GB SSD
- **OS**: Ubuntu 20.04 LTS or CentOS 8+

#### Recommended Requirements (Production)
- **CPU**: 4+ cores
- **RAM**: 8GB+
- **Storage**: 50GB+ SSD
- **OS**: Ubuntu 22.04 LTS

### Software Dependencies
- Node.js 16+ or 18+ (LTS recommended)
- MySQL 8.0+
- Redis 6+ (optional, for session management)
- Nginx (for reverse proxy)
- Docker & Docker Compose (for containerized deployment)
- Git
- PM2 (for process management)

---

## Environment Configuration

### 1. Production Environment Variables

Create a `.env.production` file:

```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=canteen_user
DB_PASSWORD=secure_db_password_123
DB_NAME=canteen_management

# Server Configuration
PORT=5000
NODE_ENV=production
API_BASE_URL=https://api.yourcanteen.com

# JWT Configuration
JWT_SECRET=your_very_secure_jwt_secret_key_with_64_characters_minimum
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# UPI Payment Configuration
UPI_MERCHANT_ID=yourmerchant@upi
UPI_MERCHANT_NAME=Your Canteen Management System
UPI_PAYMENT_TIMEOUT=900

# File Upload Configuration
MAX_FILE_SIZE=5242880
UPLOAD_DIR=./uploads
STATIC_FILES_URL=https://yourcanteen.com

# Email Configuration (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=yourcanteen@gmail.com
SMTP_PASS=your_app_password

# Company Information
COMPANY_NAME=Your Institution Canteen
COMPANY_ADDRESS=Your Institution Address
COMPANY_PHONE=+91-80-12345678
COMPANY_EMAIL=info@yourcanteen.com
COMPANY_WEBSITE=https://yourcanteen.com

# Frontend URL
FRONTEND_URL=https://yourcanteen.com
ADMIN_URL=https://admin.yourcanteen.com

# Redis Configuration (if using Redis)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redis_password_123

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Security
BCRYPT_ROUNDS=12
COOKIE_SECRET=your_cookie_secret_key_64_characters
```

### 2. Frontend Environment Configuration

Create `.env.production` for frontend:

```bash
VITE_API_BASE_URL=https://api.yourcanteen.com
VITE_APP_NAME=Canteen Management System
VITE_COMPANY_NAME=Your Institution
VITE_SUPPORT_EMAIL=support@yourcanteen.com
VITE_SUPPORT_PHONE=+91-80-12345678
```

---

## Database Setup

### 1. Production Database Setup

```sql
-- Connect to MySQL as root
mysql -u root -p

-- Create database
CREATE DATABASE canteen_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create dedicated user
CREATE USER 'canteen_user'@'localhost' IDENTIFIED BY 'secure_db_password_123';
GRANT ALL PRIVILEGES ON canteen_management.* TO 'canteen_user'@'localhost';
FLUSH PRIVILEGES;

-- Exit MySQL
EXIT;
```

### 2. Initialize Database Schema

```bash
# Navigate to backend directory
cd backend

# Run database migrations
npm run migrate:prod

# Seed initial data
npm run seed:prod
```

### 3. Database Optimization for Production

```sql
-- Connect as canteen_user
mysql -u canteen_user -p canteen_management

-- Optimize database settings
SET GLOBAL innodb_buffer_pool_size = 1G;
SET GLOBAL query_cache_size = 128M;
SET GLOBAL query_cache_type = 1;

-- Create additional indexes for performance
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_status ON orders(order_status);
CREATE INDEX idx_menu_items_category ON menu_items(category);
CREATE INDEX idx_cart_items_user ON cart_items(user_id, created_at);
```

---

## Docker Deployment

### 1. Production Docker Setup

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    container_name: canteen_mysql_prod
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}
      MYSQL_DATABASE: ${DB_NAME}
      MYSQL_USER: ${DB_USER}
      MYSQL_PASSWORD: ${DB_PASSWORD}
    volumes:
      - mysql_data_prod:/var/lib/mysql
      - ./database/init.sql:/docker-entrypoint-initdb.d/init.sql:ro
    ports:
      - "3307:3306"
    restart: unless-stopped
    command: --default-authentication-plugin=mysql_native_password
    networks:
      - canteen_network

  redis:
    image: redis:7-alpine
    container_name: canteen_redis_prod
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data_prod:/data
    ports:
      - "6380:6379"
    restart: unless-stopped
    networks:
      - canteen_network

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    container_name: canteen_backend_prod
    environment:
      - NODE_ENV=production
      - DB_HOST=mysql
      - REDIS_HOST=redis
    volumes:
      - ./uploads:/app/uploads
      - ./logs:/app/logs
    ports:
      - "5000:5000"
    depends_on:
      - mysql
      - redis
    restart: unless-stopped
    networks:
      - canteen_network

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
    container_name: canteen_frontend_prod
    ports:
      - "3000:80"
    depends_on:
      - backend
    restart: unless-stopped
    networks:
      - canteen_network

  nginx:
    image: nginx:alpine
    container_name: canteen_nginx_prod
    volumes:
      - ./nginx/prod.conf:/etc/nginx/conf.d/default.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
      - ./uploads:/var/www/uploads:ro
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - frontend
      - backend
    restart: unless-stopped
    networks:
      - canteen_network

volumes:
  mysql_data_prod:
  redis_data_prod:

networks:
  canteen_network:
    driver: bridge
```

### 2. Production Dockerfile for Backend

Create `backend/Dockerfile.prod`:

```dockerfile
FROM node:18-alpine

# Install system dependencies
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Set environment variables for Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Create necessary directories
RUN mkdir -p uploads logs && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node healthcheck.js || exit 1

# Start application
CMD ["npm", "start"]
```

### 3. Production Dockerfile for Frontend

Create `frontend/Dockerfile.prod`:

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Add non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
```

### 4. Deploy with Docker

```bash
# Create production environment file
cp .env.example .env.production

# Edit production environment variables
nano .env.production

# Build and start services
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d --build

# Check status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f backend
```

---

## Manual Deployment

### 1. Server Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MySQL
sudo apt install mysql-server -y
sudo mysql_secure_installation

# Install Redis (optional)
sudo apt install redis-server -y

# Install Nginx
sudo apt install nginx -y

# Install PM2
sudo npm install -g pm2

# Install Git
sudo apt install git -y
```

### 2. Application Deployment

```bash
# Create application directory
sudo mkdir -p /opt/canteen-app
sudo chown $USER:$USER /opt/canteen-app

# Clone repository
cd /opt/canteen-app
git clone https://github.com/yourusername/canteen-management-system.git .

# Install backend dependencies
cd backend
npm install --production

# Install frontend dependencies and build
cd ../frontend
npm install
npm run build

# Create uploads directory
mkdir -p ../uploads
mkdir -p ../logs

# Set permissions
sudo chown -R www-data:www-data ../uploads
sudo chmod -R 755 ../uploads
```

### 3. PM2 Configuration

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'canteen-backend',
    script: './backend/server.js',
    cwd: '/opt/canteen-app',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    log_file: './logs/app.log',
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    max_memory_restart: '1G',
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
```

Start the application:

```bash
# Start with PM2
cd /opt/canteen-app
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Set up PM2 startup
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME
```

---

## Cloud Deployment

### 1. AWS EC2 Deployment

#### Instance Setup
```bash
# Launch EC2 instance (Ubuntu 22.04 LTS)
# Security groups: HTTP (80), HTTPS (443), SSH (22), Custom (5000)

# Connect to instance
ssh -i your-key.pem ubuntu@your-ec2-public-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Follow manual deployment steps above
```

#### RDS Database Setup
```bash
# Create RDS MySQL instance
# Update environment variables with RDS endpoint
DB_HOST=your-rds-endpoint.amazonaws.com
DB_PORT=3306
```

### 2. DigitalOcean Deployment

```bash
# Create Droplet (Ubuntu 22.04)
# Size: 2GB RAM, 1vCPU minimum

# Add domain to DNS
# A record: @ -> your-droplet-ip
# A record: api -> your-droplet-ip
# A record: www -> your-droplet-ip

# Follow manual deployment steps
```

### 3. Google Cloud Platform

```bash
# Create Compute Engine instance
gcloud compute instances create canteen-app \
    --image-family=ubuntu-2204-lts \
    --image-project=ubuntu-os-cloud \
    --machine-type=e2-medium \
    --zone=us-central1-a

# SSH to instance
gcloud compute ssh canteen-app --zone=us-central1-a

# Follow deployment steps
```

---

## SSL/TLS Configuration

### 1. Obtain SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install snapd
sudo snap install core; sudo snap refresh core
sudo snap install --classic certbot

# Create symlink
sudo ln -s /snap/bin/certbot /usr/bin/certbot

# Obtain certificate
sudo certbot --nginx -d yourcanteen.com -d www.yourcanteen.com -d api.yourcanteen.com

# Test auto-renewal
sudo certbot renew --dry-run
```

### 2. Nginx SSL Configuration

Create `/etc/nginx/sites-available/canteen-app`:

```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name yourcanteen.com www.yourcanteen.com api.yourcanteen.com;
    return 301 https://$server_name$request_uri;
}

# Frontend
server {
    listen 443 ssl http2;
    server_name yourcanteen.com www.yourcanteen.com;

    ssl_certificate /etc/letsencrypt/live/yourcanteen.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourcanteen.com/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    root /opt/canteen-app/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /uploads/ {
        alias /opt/canteen-app/uploads/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
}

# Backend API
server {
    listen 443 ssl http2;
    server_name api.yourcanteen.com;

    ssl_certificate /etc/letsencrypt/live/yourcanteen.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourcanteen.com/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/canteen-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## Monitoring & Maintenance

### 1. Application Monitoring

#### PM2 Monitoring
```bash
# Monitor processes
pm2 monit

# View logs
pm2 logs canteen-backend

# Restart application
pm2 restart canteen-backend

# Reload application (zero downtime)
pm2 reload canteen-backend
```

#### System Monitoring Script

Create `/opt/canteen-app/scripts/monitor.sh`:

```bash
#!/bin/bash

# Check application status
check_app() {
    if ! curl -f http://localhost:5000/health > /dev/null 2>&1; then
        echo "$(date): Application is down, restarting..." >> /opt/canteen-app/logs/monitor.log
        pm2 restart canteen-backend
    fi
}

# Check database connection
check_db() {
    if ! mysqladmin ping -h localhost --silent; then
        echo "$(date): Database is down" >> /opt/canteen-app/logs/monitor.log
        # Send alert email
        echo "Database is down on $(hostname)" | mail -s "Database Alert" admin@yourcanteen.com
    fi
}

# Check disk space
check_disk() {
    USAGE=$(df /opt/canteen-app | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ $USAGE -gt 80 ]; then
        echo "$(date): Disk usage is ${USAGE}%" >> /opt/canteen-app/logs/monitor.log
        # Clean old logs
        find /opt/canteen-app/logs -name "*.log" -mtime +7 -delete
    fi
}

check_app
check_db
check_disk
```

Add to crontab:
```bash
crontab -e
# Add line: */5 * * * * /opt/canteen-app/scripts/monitor.sh
```

### 2. Log Management

#### Logrotate Configuration

Create `/etc/logrotate.d/canteen-app`:

```
/opt/canteen-app/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    notifempty
    copytruncate
    postrotate
        pm2 reload canteen-backend
    endscript
}
```

---

## Backup & Recovery

### 1. Database Backup

Create backup script `/opt/canteen-app/scripts/backup.sh`:

```bash
#!/bin/bash

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/canteen-app/backups"
DB_NAME="canteen_management"
DB_USER="canteen_user"
DB_PASS="your_db_password"

# Create backup directory
mkdir -p $BACKUP_DIR

# Database backup
mysqldump -u$DB_USER -p$DB_PASS $DB_NAME > $BACKUP_DIR/db_backup_$DATE.sql

# Compress backup
gzip $BACKUP_DIR/db_backup_$DATE.sql

# Upload files backup
tar -czf $BACKUP_DIR/uploads_backup_$DATE.tar.gz -C /opt/canteen-app uploads/

# Remove old backups (older than 7 days)
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete

# Upload to cloud storage (optional)
# aws s3 cp $BACKUP_DIR/ s3://your-backup-bucket/ --recursive
```

Add to crontab:
```bash
crontab -e
# Add line: 0 2 * * * /opt/canteen-app/scripts/backup.sh
```

### 2. Recovery Procedure

```bash
# Stop application
pm2 stop canteen-backend

# Restore database
gunzip -c /opt/canteen-app/backups/db_backup_YYYYMMDD_HHMMSS.sql.gz | mysql -u canteen_user -p canteen_management

# Restore uploads
cd /opt/canteen-app
tar -xzf backups/uploads_backup_YYYYMMDD_HHMMSS.tar.gz

# Start application
pm2 start canteen-backend
```

---

## Troubleshooting

### 1. Common Issues

#### Application Won't Start
```bash
# Check PM2 logs
pm2 logs canteen-backend

# Check environment variables
cat /opt/canteen-app/.env.production

# Check Node.js version
node --version
npm --version

# Reinstall dependencies
cd /opt/canteen-app/backend
npm install --production
```

#### Database Connection Issues
```bash
# Check MySQL status
sudo systemctl status mysql

# Test connection
mysql -u canteen_user -p -h localhost canteen_management

# Check firewall
sudo ufw status
```

#### SSL Certificate Issues
```bash
# Check certificate status
sudo certbot certificates

# Renew certificates
sudo certbot renew

# Test SSL configuration
openssl s_client -connect yourcanteen.com:443
```

### 2. Performance Issues

#### High CPU Usage
```bash
# Check PM2 processes
pm2 list

# Monitor system resources
top
htop

# Check slow queries
mysql -u root -p -e "SHOW PROCESSLIST;"
```

#### Memory Issues
```bash
# Check memory usage
free -h

# Monitor Node.js memory
pm2 monit

# Restart application if memory leak
pm2 restart canteen-backend
```

### 3. Security Checklist

- [ ] SSL/TLS certificates installed and auto-renewing
- [ ] Firewall configured (UFW or iptables)
- [ ] Database user has minimal privileges
- [ ] Environment variables secured
- [ ] File permissions set correctly
- [ ] Regular security updates applied
- [ ] Backup and recovery tested
- [ ] Monitoring and alerting configured
- [ ] Rate limiting configured
- [ ] CORS properly configured

---

## Deployment Checklist

### Pre-Deployment
- [ ] Code tested in staging environment
- [ ] Database migrations reviewed
- [ ] Environment variables configured
- [ ] SSL certificates ready
- [ ] Backup strategy in place
- [ ] Rollback plan prepared

### Deployment
- [ ] Server prepared and dependencies installed
- [ ] Database setup and optimized
- [ ] Application deployed and configured
- [ ] SSL/TLS configured
- [ ] Nginx configured
- [ ] PM2 configured for auto-restart
- [ ] Monitoring scripts installed
- [ ] Backup scripts configured

### Post-Deployment
- [ ] Health checks passing
- [ ] All endpoints responding correctly
- [ ] SSL certificate working
- [ ] Monitoring alerts configured
- [ ] Backup system tested
- [ ] Performance baselines established
- [ ] Documentation updated
- [ ] Team trained on deployment

---

This deployment guide provides comprehensive instructions for deploying the canteen management system in various environments. Follow the appropriate sections based on your deployment requirements and infrastructure preferences.