#!/bin/bash
# Script to set Railway environment variables for production
# Run this after deploying to Railway

echo "Setting Railway environment variables for fermentum-api service..."
echo "⚠️  You must run this from your Railway dashboard or use Railway CLI"
echo ""

cat << 'EOF'
Required Environment Variables for Railway API Service:
=========================================================

# Database Connection (get password from Railway Postgres service)
ConnectionStrings__DefaultConnection=Host=postgres.railway.internal;Port=5432;Database=railway;Username=postgres;Password=${{Postgres.PASSWORD}}

# Redis Connection (get password from Railway Redis service)
ConnectionStrings__Redis=redis.railway.internal:6379,password=${{Redis.PASSWORD}}

# Stytch Authentication (test credentials, replace for production)
Stytch__ProjectId=project-test-602a83cb-068f-4dd4-a473-0bb708335ee6
Stytch__ProjectSecret=secret-test-orObSrhvLvkqC2IMClzRxug7FICBkkqKH0g=
Stytch__PublicToken=public-token-test-92b06025-3b67-4193-a934-54b95bb5bbcb

# JWT Configuration - MUST GENERATE UNIQUE SECRET!
Jwt__Issuer=https://auth.fermentum.dev
Jwt__Audience=https://fermentum.dev
Jwt__SecretKey=<GENERATE_WITH_openssl_rand_base64_64>
Jwt__ExpiryMinutes=60

# Stripe Payment Processing (test keys, replace for production)
Stripe__SecretKey=sk_test_51S9841S4Vkg3juZcdlrb3ir0DUZgYKQQTJkmt0Vj9aGWaQq2Me6VXqCBhgWGm8IKVcNQ4JwNQyu8LBmfDIR35AJV00nfVOyx8t
Stripe__PublishableKey=pk_test_51S9841S4Vkg3juZc0uHOaNnNBJrFfyhetvmmIoRbCEdxnnwKnCZTtQAMg9Rq38kLVq71TqSt1d0TtXBTOOw1qfOw00vYAcStzo

# QuickBooks Integration (sandbox, replace for production)
QuickBooksOnline__ClientId=ABz2UqE4t2pzruG4EM4bw4mSeKH5NGBB6kz0DEV1UPRbBTSHB8
QuickBooksOnline__ClientSecret=RhrAUSQ4MEPUJoYjBwgjEVM5Pb45mloPoBQZqGKU
QuickBooksOnline__Environment=sandbox
QuickBooksOnline__RedirectUri=https://fermentum-api-production.up.railway.app/api/quickbooks/callback

=========================================================

Steps to Set in Railway:
------------------------
1. Go to Railway dashboard: https://railway.app/dashboard
2. Select your fermentum project
3. Click on the fermentum-api service
4. Go to Variables tab
5. Click "New Variable" for each variable above
6. After setting all variables, Railway will auto-redeploy

Alternative - Generate JWT Secret:
----------------------------------
Run this command to generate a secure JWT secret:
  openssl rand -base64 64

Then add it to Railway as: Jwt__SecretKey

Critical Notes:
--------------
- Without these variables, the API will return 502 Bad Gateway
- Database passwords use Railway's ${{Service.VAR}} syntax
- Generate unique JWT secret (don't use example above!)
- Test deployment after setting all variables

EOF
