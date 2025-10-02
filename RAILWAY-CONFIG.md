# Railway Configuration Guide

## Overview
This guide shows how to properly configure Railway environment variables to avoid deploying development credentials to production.

## Required Railway Environment Variables

### API Service (fermentum-api)

Set these environment variables in your Railway API service:

#### Database Configuration
```bash
ConnectionStrings__DefaultConnection=Host=postgres.railway.internal;Port=5432;Database=railway;Username=postgres;Password=YOUR_POSTGRES_PASSWORD
ConnectionStrings__Redis=redis.railway.internal:6379,password=YOUR_REDIS_PASSWORD
```

#### Authentication (Stytch)
```bash
Stytch__ProjectId=YOUR_STYTCH_PROJECT_ID
Stytch__ProjectSecret=YOUR_STYTCH_SECRET
Stytch__PublicToken=YOUR_STYTCH_PUBLIC_TOKEN
```

#### JWT Configuration
```bash
Jwt__Issuer=https://auth.fermentum.dev
Jwt__Audience=https://fermentum.dev
Jwt__SecretKey=YOUR_STRONG_PRODUCTION_SECRET_KEY_HERE
Jwt__ExpiryMinutes=60
```

**IMPORTANT**: Generate a strong, unique JWT secret for production:
```bash
# Generate a secure random secret (use this command locally)
openssl rand -base64 64
```

#### Payment Processing (Stripe)
```bash
Stripe__SecretKey=YOUR_STRIPE_SECRET_KEY
Stripe__PublishableKey=YOUR_STRIPE_PUBLISHABLE_KEY
```

#### QuickBooks Integration
```bash
QuickBooksOnline__ClientId=YOUR_QUICKBOOKS_CLIENT_ID
QuickBooksOnline__ClientSecret=YOUR_QUICKBOOKS_CLIENT_SECRET
QuickBooksOnline__Environment=production
QuickBooksOnline__RedirectUri=https://YOUR-API-URL.railway.app/api/quickbooks/callback
```

### Frontend Service (fermentum-ui-user)

The frontend uses `.env.production` for production builds. No Railway environment variables needed if you build before deploying.

**Option 1: Build locally and deploy dist/**
1. Update `.env.production` with your API URL
2. Run `npm run build`
3. Deploy the `dist/` folder to Railway

**Option 2: Set Railway build environment variable**
```bash
VITE_API_URL=https://YOUR-API-SERVICE.railway.app/api
```

## Deployment Checklist

### Before Deploying to Railway:

- [ ] Update frontend `.env.production` with Railway API URL
- [ ] Set all required Railway environment variables (see above)
- [ ] Generate strong JWT secret for production (use `openssl rand -base64 64`)
- [ ] Use production Stripe keys (not test keys)
- [ ] Update QuickBooksOnline__RedirectUri to match Railway API URL
- [ ] Verify database connection strings point to Railway internal services
- [ ] Test locally with production-like environment variables

### Security Best Practices:

1. **Never commit** `.env.production` or any file with real credentials to git
2. **Use Railway's environment variables** for all secrets
3. **Generate unique secrets** for each environment (dev, staging, prod)
4. **Rotate secrets regularly** especially JWT keys and API secrets
5. **Use Railway's secret references** `${{Postgres.PASSWORD}}` when possible

## Development vs Production

### Development (.env.development)
```bash
VITE_API_URL=https://localhost:5001/api
VITE_STYTCH_PUBLIC_TOKEN=public-token-test-...
```

### Production (.env.production)
```bash
VITE_API_URL=https://fermentum-api-production.up.railway.app/api
VITE_STYTCH_PUBLIC_TOKEN=public-token-prod-...
```

## Troubleshooting

### 404 Errors on Profile Save
**Problem**: Frontend can't reach API
**Solution**: Verify `VITE_API_URL` in `.env.production` matches your Railway API service URL

### JWT Authentication Fails
**Problem**: Invalid JWT signature
**Solution**: Ensure Railway `Jwt__SecretKey` matches what the API expects

### Database Connection Errors
**Problem**: Can't connect to database
**Solution**: Verify Railway database connection string uses internal DNS names:
- Postgres: `postgres.railway.internal`
- Redis: `redis.railway.internal`

## Getting Railway Service URLs

```bash
# List all services and their URLs
railway list

# Get specific service URL
railway service [service-name]
```

Or check the Railway dashboard for public URLs.
