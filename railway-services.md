# Railway Deployment Configuration

## Required Services

### 1. PostgreSQL Database
- **Service Type**: Database
- **Template**: PostgreSQL 15
- **Configuration**:
  - Database Name: `fermentum`
  - Auto-backup enabled
  - Connection pooling: 20 connections

### 2. Redis Cache
- **Service Type**: Database
- **Template**: Redis 7
- **Configuration**:
  - Memory: 256MB (starter)
  - Persistence enabled

### 3. Auth API Service
- **Service Type**: Web Service
- **Source**: `services/auth-api/`
- **Build Command**: `dotnet publish -c Release -o out`
- **Start Command**: `dotnet out/Fermentum.Auth.dll`
- **Port**: 8080
- **Domain**: `api.fermentum.com`

### 4. User Interface
- **Service Type**: Web Service
- **Source**: `ui/user/`
- **Build Command**: `npm run build`
- **Start Command**: `npx serve -s dist -p $PORT`
- **Port**: Dynamic (Railway assigned)
- **Domain**: `app.fermentum.com`

### 5. Admin Interface
- **Service Type**: Web Service
- **Source**: `ui/admin/`
- **Build Command**: `npm run build`
- **Start Command**: `npx serve -s dist -p $PORT`
- **Port**: Dynamic (Railway assigned)
- **Domain**: `admin.fermentum.com`

## Environment Variables by Service

### Auth API Service
```
ASPNETCORE_ENVIRONMENT=Production
ASPNETCORE_URLS=http://0.0.0.0:8080
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
JWT_SECRET=${{JWT_SECRET}}
STYTCH_PROJECT_ID=${{STYTCH_PROJECT_ID}}
STYTCH_SECRET=${{STYTCH_SECRET}}
STRIPE_SECRET_KEY=${{STRIPE_SECRET_KEY}}
STRIPE_PUBLISHABLE_KEY=${{STRIPE_PUBLISHABLE_KEY}}
CORS_ORIGINS=https://app.fermentum.com,https://admin.fermentum.com
```

### User Interface
```
VITE_API_URL=https://api.fermentum.com
VITE_STYTCH_PUBLIC_TOKEN=${{STYTCH_PUBLIC_TOKEN}}
VITE_STRIPE_PUBLISHABLE_KEY=${{STRIPE_PUBLISHABLE_KEY}}
```

### Admin Interface
```
VITE_API_URL=https://api.fermentum.com
VITE_STYTCH_PUBLIC_TOKEN=${{STYTCH_PUBLIC_TOKEN}}
```

## Shared Environment Variables
Create these in Railway's shared environment:
```
JWT_SECRET=your-jwt-secret-here
STYTCH_PROJECT_ID=project-test-602a83cb-068f-4dd4-a473-0bb708335ee6
STYTCH_SECRET=your-stytch-secret-here
STYTCH_PUBLIC_TOKEN=public-token-test-92b06025-3b67-4193-a934-54b95bb5bbcb
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
```