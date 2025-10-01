#!/bin/bash
# Initialize SSL directory structure for Let's Encrypt

set -e

echo "📁 Creating SSL directory structure..."

# Create base directories
mkdir -p infrastructure/data/certbot
mkdir -p infrastructure/data/letsencrypt
mkdir -p infrastructure/ssl/www.fermentum.dev
mkdir -p infrastructure/nginx/conf.d

# Create placeholder certificates for initial nginx startup
# (nginx won't start if SSL cert files don't exist)
if [ ! -f "infrastructure/ssl/www.fermentum.dev/fullchain.pem" ]; then
    echo "🔑 Creating temporary self-signed certificates for initial startup..."

    # Generate temporary self-signed certificate
    openssl req -x509 -nodes -days 1 -newkey rsa:2048 \
        -keyout infrastructure/ssl/www.fermentum.dev/privkey.pem \
        -out infrastructure/ssl/www.fermentum.dev/fullchain.pem \
        -subj "/CN=www.fermentum.dev" \
        2>/dev/null

    echo "✅ Temporary certificates created"
    echo "⚠️  These will be replaced with Let's Encrypt certificates"
fi

# Create ACME challenge directory
mkdir -p infrastructure/data/certbot/.well-known/acme-challenge

# Set permissions
chmod 755 infrastructure/data/certbot
chmod 755 infrastructure/data/letsencrypt
chmod 755 infrastructure/ssl/www.fermentum.dev

echo "✅ SSL directory structure initialized"
echo ""
echo "📝 Next steps:"
echo "1. Ensure DNS points to your server"
echo "2. Start services: docker-compose up -d"
echo "3. Obtain Let's Encrypt cert: see SSL_SETUP.md"
