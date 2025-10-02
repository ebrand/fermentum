# Production Deployment Fixes

## Issues Fixed

### 1. 404 Error When Saving Profile ✅
**Problem**: Frontend was using relative URL `/api` which doesn't work when UI and API are on different Railway services.

**Solution**: Created `.env.production` with absolute Railway API URL:
```bash
VITE_API_URL=https://fermentum-api-production.up.railway.app/api
```

### 2. Development Secrets in Production ✅
**Problem**: Dockerfile had hardcoded development credentials that could be deployed to production.

**Solution**: Removed all hardcoded secrets from Dockerfile. Now uses empty strings as defaults, requiring Railway environment variables to be set.

### 3. Port Configuration Mismatch ✅
**Problem**: Health check was checking port 80, but app listens on PORT variable.

**Solution**: Updated health check to use `${PORT:-8080}` to match actual listening port.

## Files Changed

1. **services/fermentum-api/Dockerfile**
   - Removed hardcoded secrets (JWT, database passwords, Stytch, Stripe, QuickBooks)
   - Fixed health check to use PORT variable
   - Added comments explaining Railway environment variables are required

2. **ui/user/.env.production** (NEW)
   - Production API URL configuration
   - Production Stytch public token

3. **ui/user/.env** (UPDATED)
   - Added comments explaining usage

4. **RAILWAY-CONFIG.md** (NEW)
   - Complete guide for configuring Railway environment variables
   - Security best practices
   - Troubleshooting guide

## Next Steps to Deploy

### Step 1: Set Railway Environment Variables

In your Railway API service dashboard, add these environment variables:

```bash
# Database (get these from Railway Postgres service)
ConnectionStrings__DefaultConnection=Host=postgres.railway.internal;Port=5432;Database=railway;Username=postgres;Password=${{Postgres.PASSWORD}}
ConnectionStrings__Redis=redis.railway.internal:6379,password=${{Redis.PASSWORD}}

# Authentication
Stytch__ProjectId=project-test-602a83cb-068f-4dd4-a473-0bb708335ee6
Stytch__ProjectSecret=secret-test-orObSrhvLvkqC2IMClzRxug7FICBkkqKH0g=
Stytch__PublicToken=public-token-test-92b06025-3b67-4193-a934-54b95bb5bbcb

# JWT - GENERATE NEW SECRET FOR PRODUCTION!
Jwt__SecretKey=<run: openssl rand -base64 64>
Jwt__Issuer=https://auth.fermentum.dev
Jwt__Audience=https://fermentum.dev
Jwt__ExpiryMinutes=60

# Stripe (use production keys)
Stripe__SecretKey=sk_test_51S9841S4Vkg3juZcdlrb3ir0DUZgYKQQTJkmt0Vj9aGWaQq2Me6VXqCBhgWGm8IKVcNQ4JwNQyu8LBmfDIR35AJV00nfVOyx8t
Stripe__PublishableKey=pk_test_51S9841S4Vkg3juZc0uHOaNnNBJrFfyhetvmmIoRbCEdxnnwKnCZTtQAMg9Rq38kLVq71TqSt1d0TtXBTOOw1qfOw00vYAcStzo

# QuickBooks
QuickBooksOnline__ClientId=ABz2UqE4t2pzruG4EM4bw4mSeKH5NGBB6kz0DEV1UPRbBTSHB8
QuickBooksOnline__ClientSecret=RhrAUSQ4MEPUJoYjBwgjEVM5Pb45mloPoBQZqGKU
QuickBooksOnline__Environment=sandbox
QuickBooksOnline__RedirectUri=https://fermentum-api-production.up.railway.app/api/quickbooks/callback
```

### Step 2: Commit and Push Changes

```bash
git add -A
git commit -m "Fix production deployment - remove hardcoded secrets, configure proper API URLs"
git push origin main
```

### Step 3: Rebuild Railway Services

Railway should auto-deploy when you push. If not:
1. Go to Railway dashboard
2. Trigger manual deploy for API service
3. Trigger manual deploy for UI service (if separate)

### Step 4: Verify Deployment

1. Check Railway logs for successful startup
2. Test API health endpoint: `https://your-api.railway.app/health`
3. Test profile save functionality in production UI
4. Verify JWT authentication works

## Security Checklist

- [ ] Generate unique JWT secret for production (don't use dev secret!)
- [ ] Use Railway secret references `${{SERVICE.VARIABLE}}` where possible
- [ ] Verify all secrets are set in Railway (not in code)
- [ ] Test authentication after deployment
- [ ] Rotate JWT secret regularly

## Troubleshooting

### Still Getting 404?
- Check Railway logs for API startup errors
- Verify `VITE_API_URL` in `.env.production` matches actual Railway API URL
- Ensure Railway environment variables are all set

### JWT Errors?
- Verify JWT secret is set in Railway
- Check token expiry settings
- Ensure Jwt__Issuer and Jwt__Audience match

### Database Connection Errors?
- Use internal Railway DNS names (postgres.railway.internal)
- Verify Railway database service is running
- Check connection string format

## Documentation

See `RAILWAY-CONFIG.md` for detailed Railway configuration guide.
