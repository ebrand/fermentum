# SSL Certificate Setup for www.fermentum.dev

## Why Not Buy from GoDaddy?

**Don't waste money on SSL certificates!** Let's Encrypt provides:
- ✅ **Free** - $0/year vs $50-200/year from GoDaddy
- ✅ **Automated** - Auto-renewal every 90 days
- ✅ **Trusted** - Same security as paid certificates
- ✅ **Better** - Modern TLS 1.3 support
- ✅ **Standard** - Used by millions of websites

## Prerequisites

1. **DNS Setup** - Point your domain to your server:
   ```
   www.fermentum.dev    A    YOUR_SERVER_IP
   fermentum.dev        A    YOUR_SERVER_IP
   admin.fermentum.dev  A    YOUR_SERVER_IP
   api.fermentum.dev    A    YOUR_SERVER_IP
   ```

2. **Server Requirements**:
   - Docker and Docker Compose installed
   - Ports 80 and 443 open
   - Domain pointing to server

## Quick Setup (Recommended)

### Option 1: Automated Docker Setup

1. **Start services with SSL configuration**:
   ```bash
   cd /Users/eric/Documents/github/fermentum
   docker-compose -f docker-compose.yml -f infrastructure/docker/docker-compose.ssl.yml up -d
   ```

2. **Obtain initial certificates**:
   ```bash
   # First, let nginx start with temporary self-signed certs
   docker exec fermentum-certbot certbot certonly \
       --webroot \
       --webroot-path=/var/www/certbot \
       --email eric.d.brand@gmail.com \
       --agree-tos \
       --no-eff-email \
       --domains www.fermentum.dev,fermentum.dev,admin.fermentum.dev,api.fermentum.dev
   ```

3. **Copy certificates to nginx**:
   ```bash
   docker exec fermentum-certbot sh -c "
       cp /etc/letsencrypt/live/www.fermentum.dev/fullchain.pem /etc/nginx/ssl/www.fermentum.dev/ &&
       cp /etc/letsencrypt/live/www.fermentum.dev/privkey.pem /etc/nginx/ssl/www.fermentum.dev/
   "
   ```

4. **Reload nginx**:
   ```bash
   docker exec fermentum-nginx nginx -s reload
   ```

### Option 2: Server-based Setup (Without Docker)

Run the automated setup script:
```bash
sudo ./infrastructure/scripts/setup-letsencrypt.sh
```

This will:
- Install Certbot if needed
- Obtain certificates for all domains
- Configure nginx
- Set up auto-renewal

## Certificate Renewal

### Automatic (Recommended)

Certificates auto-renew every 12 hours via the certbot container.

### Manual Renewal

If you need to manually renew:
```bash
docker exec fermentum-certbot certbot renew --quiet
docker exec fermentum-nginx nginx -s reload
```

### Cron Job (Non-Docker)

Add to crontab for automatic renewal:
```bash
0 0 * * 0 /path/to/infrastructure/scripts/certbot-renew.sh
```

## Verification

Check certificate status:
```bash
# Check expiration date
docker exec fermentum-certbot certbot certificates

# Test HTTPS connection
curl -I https://www.fermentum.dev
curl -I https://api.fermentum.dev
curl -I https://admin.fermentum.dev
```

## Troubleshooting

### "Certificate not found" error
Make sure DNS is properly configured and pointing to your server BEFORE running certbot.

### "Connection refused" on port 80
Ensure nginx is running and port 80 is accessible:
```bash
docker ps | grep nginx
curl http://www.fermentum.dev/.well-known/acme-challenge/test
```

### Certificate not applying
1. Check certificate files exist:
   ```bash
   docker exec fermentum-certbot ls -la /etc/letsencrypt/live/www.fermentum.dev/
   ```

2. Verify nginx configuration:
   ```bash
   docker exec fermentum-nginx nginx -t
   ```

3. Reload nginx:
   ```bash
   docker exec fermentum-nginx nginx -s reload
   ```

## SSL Configuration Details

### Certificate Files Location
- **Docker**: `/etc/letsencrypt/live/www.fermentum.dev/`
- **Nginx**: `/etc/nginx/ssl/www.fermentum.dev/`

### Certificate Validity
- **Duration**: 90 days
- **Renewal**: Automatic every 12 hours (renews at 30 days remaining)
- **Grace Period**: 60 days before expiration

### Supported Domains
- www.fermentum.dev (primary)
- fermentum.dev
- admin.fermentum.dev
- api.fermentum.dev

### Security Features
- ✅ TLS 1.2 and 1.3 only
- ✅ Strong cipher suites
- ✅ HSTS (HTTP Strict Transport Security)
- ✅ Perfect Forward Secrecy
- ✅ XSS Protection headers
- ✅ Content Security Policy ready

## Cost Comparison

| Provider | Annual Cost | Auto-Renewal | Support |
|----------|-------------|--------------|---------|
| **Let's Encrypt** | **$0** | **Yes** | **Community** |
| GoDaddy Standard | $63.99 | No | Email |
| GoDaddy Premium | $149.99 | No | Phone |
| DigiCert | $218+ | No | Premium |

**Savings: $60-200/year per domain** 🎉

## Next Steps

1. ✅ Verify DNS is pointing to your server
2. ✅ Run the setup script or docker-compose command
3. ✅ Test HTTPS access to all domains
4. ✅ Set up monitoring for certificate expiration
5. ✅ Save money on unnecessary SSL purchases!
