# Railway Deployment Guide for Fermentum

## Prerequisites
- Railway account with CLI installed (`npm install -g @railway/cli`)
- GitHub repository connected to Railway
- Domain names configured (optional but recommended)

## Step-by-Step Deployment

### 1. Create Railway Project
```bash
railway login
railway new -n fermentum
cd fermentum
railway link
```

### 2. Create Database Services

#### PostgreSQL Database
```bash
railway add -d postgresql
```
- Note the generated `DATABASE_URL` in variables

#### Redis Cache (Required)
Redis is **required** for the Fermentum API and used for:
- **Session Management**: Stores user session data
- **JWT Token Caching**: Caches authentication tokens for performance

```bash
railway add -d redis
```

Railway will automatically provision a Redis instance and create a `REDIS_URL` variable in the format:
```
redis://default:[password]@[host]:[port]
```

The StackExchange.Redis library used by fermentum-api will automatically handle this connection string format.

### 3. Initialize Database
```bash
# Connect to PostgreSQL service
railway connect postgresql

# Run the initialization script
\i database/railway-init.sql
```

### 4. Deploy Services

#### Fermentum API Service
The fermentum-api service combines authentication, authorization, and all core API functionality.

```bash
# From project root - connect your GitHub repository
# Railway will automatically detect the railway.toml file which specifies root = "services/fermentum-api"

# Add the service
railway add -s fermentum-api

# Link required services (creates automatic environment variable references)
railway service fermentum-api
railway link -s postgresql
railway link -s redis

# Set environment variables
railway variables set ASPNETCORE_ENVIRONMENT=Production
railway variables set ASPNETCORE_URLS=http://0.0.0.0:8080

# Database connection (use Railway's auto-generated variable)
railway variables set ConnectionStrings__DefaultConnection=${DATABASE_URL}

# Redis connection (IMPORTANT: Map Railway's REDIS_URL to your connection string)
railway variables set ConnectionStrings__Redis=${REDIS_URL}

# JWT Configuration
railway variables set Jwt__SecretKey=your-secure-jwt-secret-minimum-32-characters-long
railway variables set Jwt__Issuer=https://auth.fermentum.com
railway variables set Jwt__Audience=https://fermentum.com
railway variables set Jwt__ExpiryMinutes=60

# Stytch Configuration
railway variables set Stytch__ProjectId=your-stytch-project-id
railway variables set Stytch__ProjectSecret=your-stytch-secret
railway variables set Stytch__PublicToken=your-stytch-public-token
railway variables set Stytch__Environment=production

# Stripe Configuration
railway variables set Stripe__SecretKey=sk_live_...
railway variables set Stripe__PublishableKey=pk_live_...
railway variables set Stripe__WebhookSecret=whsec_...

# QuickBooks Online Configuration
railway variables set QuickBooksOnline__ClientId=your-qbo-client-id
railway variables set QuickBooksOnline__ClientSecret=your-qbo-client-secret
railway variables set QuickBooksOnline__Environment=production
railway variables set QuickBooksOnline__BaseUrl=https://quickbooks.api.intuit.com
railway variables set QuickBooksOnline__RedirectUri=https://app.fermentum.com/oauth/quickbooks/callback

# Deploy (Railway will auto-deploy when connected to GitHub)
# Or trigger manual deployment:
railway up --service fermentum-api
```

**Important Note on Redis Connection:**
Railway provides Redis connection as `REDIS_URL`, but ASP.NET Core configuration expects `ConnectionStrings:Redis`. The double underscore (`__`) notation maps to nested JSON configuration, so:
- `ConnectionStrings__Redis=${REDIS_URL}` maps to `"ConnectionStrings": { "Redis": "..." }`

#### User Interface Service
```bash
railway service create ui-user
railway service connect ui-user

# Set environment variables
railway variables set VITE_API_URL=https://api.fermentum.com
railway variables set VITE_STYTCH_PUBLIC_TOKEN=public-token-test-92b06025-3b67-4193-a934-54b95bb5bbcb
railway variables set VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Deploy
railway up --service ui-user --detach ./ui/user
```

#### Admin Interface Service
```bash
railway service create ui-admin
railway service connect ui-admin

# Set environment variables
railway variables set VITE_API_URL=https://api.fermentum.com
railway variables set VITE_STYTCH_PUBLIC_TOKEN=public-token-test-92b06025-3b67-4193-a934-54b95bb5bbcb

# Deploy
railway up --service ui-admin --detach ./ui/admin
```

### 5. Configure Custom Domains

#### In Railway Dashboard:
1. Go to each service → Settings → Domains
2. Add custom domains:
   - `fermentum-api` → `api.fermentum.com`
   - `ui-user` → `app.fermentum.com`
   - `ui-admin` → `admin.fermentum.com`

#### DNS Configuration:
Add CNAME records in your domain provider:
```
api.fermentum.com    CNAME    fermentum-api.railway.app
www.fermentum.com    CNAME    ui-user.railway.app
```

### 6. Environment Variables Reference

#### Shared Variables (Set in Project Settings):
```
JWT_SECRET=your-secure-jwt-secret-minimum-256-bits
STYTCH_PROJECT_ID=project-test-602a83cb-068f-4dd4-a473-0bb708335ee6
STYTCH_SECRET=your-stytch-secret-key
STYTCH_PUBLIC_TOKEN=public-token-test-92b06025-3b67-4193-a934-54b95bb5bbcb
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
```

#### Service-Specific Variables:
See `.env.railway.template` for complete reference.

### 7. Database Migrations

#### For Existing Data Migration:
```bash
# Export from local PostgreSQL
pg_dump -h localhost -p 5432 -U postgres fermentum > fermentum_backup.sql

# Import to Railway PostgreSQL
railway connect postgresql
\i fermentum_backup.sql
```

### 8. Production Considerations

#### Security:
- Generate new JWT secret for production
- Use production Stytch and Stripe credentials
- Enable SSL/TLS (automatic with Railway)
- Configure proper CORS origins

#### Monitoring:
- Railway provides built-in metrics and logs
- Set up log retention policies
- Configure health checks

#### Scaling:
- Monitor resource usage in Railway dashboard
- Scale services based on traffic patterns
- Consider upgrading to Pro plan for higher limits

### 9. Troubleshooting

#### Common Issues:
1. **Build Failures**: Check logs with `railway logs --service <service-name>`
2. **Database Connection**: Verify `DATABASE_URL` is properly referenced as `ConnectionStrings__DefaultConnection`
3. **Redis Connection Errors**: Verify `REDIS_URL` is mapped to `ConnectionStrings__Redis`
4. **Session/Cache Errors**: Ensure Redis service is running and connected
5. **CORS Errors**: Ensure allowed origins are properly configured in environment variables
6. **Environment Variables**: Use `railway variables` to verify settings

#### Debug Commands:
```bash
# View service logs
railway logs --service fermentum-api

# Check deployment status
railway status

# View all variables
railway variables

# Connect to database
railway connect postgresql

# Connect to Redis (for debugging)
railway connect redis

# Restart service
railway redeploy --service fermentum-api

# Check if Redis is running
railway logs --service redis
```

#### Redis-Specific Troubleshooting:
- **Error: "No connection is available"**: Redis service may not be linked properly
- **Solution**: Run `railway link -s redis` from fermentum-api service context
- **Verify Connection**: Check that `ConnectionStrings__Redis` environment variable is set to `${REDIS_URL}`

## Cost Estimation

### Railway Pricing (as of 2024):
- **Starter Plan**: $5/month per service
- **PostgreSQL**: $5-10/month based on usage
- **Redis** (Required): $5/month for small instances
- **Total Estimated**: $25-35/month for complete stack

### Required Services:
1. **fermentum-api** - Main API service (combines auth + business logic)
2. **PostgreSQL** - Database (required)
3. **Redis** - Cache & session management (required)
4. **ui-user** - User interface (optional, can host elsewhere)
5. **ui-admin** - Admin interface (optional, can host elsewhere)

### Service Resource Requirements:
- **fermentum-api**: 512MB RAM, 1 vCPU
- **ui-user**: 256MB RAM, 0.5 vCPU (if hosted on Railway)
- **ui-admin**: 256MB RAM, 0.5 vCPU (if hosted on Railway)
- **PostgreSQL**: 1GB RAM, 1 vCPU
- **Redis**: 256MB RAM (required for session/caching)

## Support and Resources
- [Railway Documentation](https://docs.railway.app/)
- [Railway Discord](https://discord.gg/railway)
- [Fermentum GitHub Repository](https://github.com/your-org/fermentum)