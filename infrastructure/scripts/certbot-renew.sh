#!/bin/bash
# Automated certificate renewal script for Let's Encrypt
# Run this via cron: 0 0 * * 0 /path/to/certbot-renew.sh

set -e

DOMAIN="www.fermentum.dev"
NGINX_CONTAINER="fermentum-nginx"

echo "🔄 Checking certificate renewal for ${DOMAIN}..."

# Renew certificate if needed
docker exec certbot certbot renew --quiet --webroot --webroot-path=/var/www/certbot

# Check if renewal occurred
if [ $? -eq 0 ]; then
    echo "✅ Certificate renewal check complete"

    # Copy renewed certificates to nginx SSL directory
    if [ -f "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" ]; then
        echo "📋 Copying renewed certificates..."
        docker exec certbot cp /etc/letsencrypt/live/${DOMAIN}/fullchain.pem /etc/nginx/ssl/${DOMAIN}/
        docker exec certbot cp /etc/letsencrypt/live/${DOMAIN}/privkey.pem /etc/nginx/ssl/${DOMAIN}/

        # Reload nginx
        echo "🔄 Reloading nginx..."
        docker exec ${NGINX_CONTAINER} nginx -s reload
        echo "✅ Nginx reloaded with renewed certificates"
    fi
else
    echo "❌ Certificate renewal failed"
    exit 1
fi
