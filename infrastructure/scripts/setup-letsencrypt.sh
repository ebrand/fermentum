#!/bin/bash
# Let's Encrypt SSL Certificate Setup for www.fermentum.dev
# This script obtains and configures free SSL certificates using Certbot

set -e

DOMAIN="www.fermentum.dev"
EMAIL="eric.d.brand@gmail.com"  # Update this to your email
WEBROOT="/var/www/certbot"
SSL_DIR="/etc/nginx/ssl/${DOMAIN}"

echo "🔒 Let's Encrypt SSL Setup for ${DOMAIN}"
echo "========================================"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "❌ This script must be run as root (use sudo)"
    exit 1
fi

# Install certbot if not already installed
if ! command -v certbot &> /dev/null; then
    echo "📦 Installing Certbot..."
    if command -v apt-get &> /dev/null; then
        apt-get update
        apt-get install -y certbot python3-certbot-nginx
    elif command -v yum &> /dev/null; then
        yum install -y certbot python3-certbot-nginx
    elif command -v brew &> /dev/null; then
        brew install certbot
    else
        echo "❌ Could not install certbot. Please install manually."
        exit 1
    fi
fi

# Create webroot directory for ACME challenge
mkdir -p "${WEBROOT}"

# Create SSL directory
mkdir -p "${SSL_DIR}"

# Obtain certificate (or renew if already exists)
echo "🔑 Obtaining SSL certificate for ${DOMAIN}..."
certbot certonly \
    --webroot \
    --webroot-path="${WEBROOT}" \
    --email "${EMAIL}" \
    --agree-tos \
    --no-eff-email \
    --domains "${DOMAIN},fermentum.dev,admin.fermentum.dev,api.fermentum.dev" \
    --non-interactive \
    --keep-until-expiring

# Copy certificates to nginx SSL directory
echo "📋 Copying certificates to nginx SSL directory..."
cp /etc/letsencrypt/live/${DOMAIN}/fullchain.pem "${SSL_DIR}/"
cp /etc/letsencrypt/live/${DOMAIN}/privkey.pem "${SSL_DIR}/"
cp /etc/letsencrypt/live/${DOMAIN}/chain.pem "${SSL_DIR}/"

# Set proper permissions
chmod 644 "${SSL_DIR}/fullchain.pem"
chmod 644 "${SSL_DIR}/chain.pem"
chmod 600 "${SSL_DIR}/privkey.pem"

echo "✅ SSL certificate obtained and configured successfully!"
echo ""
echo "📝 Certificate details:"
echo "   Domain: ${DOMAIN}"
echo "   Certificate: ${SSL_DIR}/fullchain.pem"
echo "   Private Key: ${SSL_DIR}/privkey.pem"
echo "   Valid for: 90 days"
echo ""
echo "🔄 To set up automatic renewal, add this to crontab:"
echo "   0 0 * * 0 certbot renew --quiet && systemctl reload nginx"
echo ""
echo "🚀 Reload nginx to apply the new certificate:"
echo "   systemctl reload nginx"
echo "   OR for Docker: docker-compose restart nginx"
