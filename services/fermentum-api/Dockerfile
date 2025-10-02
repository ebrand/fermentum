# Build arguments for version tracking
ARG GIT_SHA=unknown
ARG BUILD_TIME=unknown
ARG CACHE_BUSTER=0

# Environment variable build arguments
ARG ASPNETCORE_ENVIRONMENT=Production
ARG ASPNETCORE_URLS=http://+:8080
ARG ConnectionStrings__DefaultConnection
ARG ConnectionStrings__Redis
ARG Stytch__ProjectId
ARG Stytch__ProjectSecret
ARG Stytch__PublicToken
ARG Jwt__Issuer
ARG Jwt__Audience
ARG Jwt__SecretKey
ARG Jwt__ExpiryMinutes=60
ARG Stripe__SecretKey
ARG Stripe__PublishableKey
ARG QuickBooksOnline__ClientId
ARG QuickBooksOnline__ClientSecret
ARG QuickBooksOnline__Environment
ARG QuickBooksOnline__RedirectUri

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080
EXPOSE 80
EXPOSE 443

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Cache busting layer (when needed)
RUN echo "cache_buster=${CACHE_BUSTER}"

# Copy solution and project files first for better layer caching
COPY ["services/fermentum-api/FermentumApi.csproj", "./"]
RUN dotnet restore "FermentumApi.csproj"

# Copy source code (this layer busts when code changes)
COPY services/fermentum-api/ .
WORKDIR "/src"

# Build with version info
RUN dotnet build "FermentumApi.csproj" -c Release -o /app/build \
    -p:AssemblyVersion=1.0.0.0 \
    -p:FileVersion=1.0.0.0 \
    -p:InformationalVersion=${GIT_SHA}

FROM build AS publish
RUN dotnet publish "FermentumApi.csproj" -c Release -o /app/publish \
    /p:UseAppHost=false \
    -p:AssemblyVersion=1.0.0.0 \
    -p:FileVersion=1.0.0.0 \
    -p:InformationalVersion=${GIT_SHA}

FROM base AS final
WORKDIR /app

# Install curl for healthchecks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Add version labels for identification
LABEL org.opencontainers.image.revision=${GIT_SHA}
LABEL org.opencontainers.image.created=${BUILD_TIME}
LABEL org.fermentum.version=${GIT_SHA}

# Set environment variables for runtime version info
ENV APP_VERSION=${GIT_SHA}
ENV BUILD_TIME=${BUILD_TIME}

# Set runtime environment variables
# CRITICAL: Railway's variable system is completely broken - it cannot pass variables
# through runtime injection, ${{}} substitution, or Docker ARG mechanism.
# As a workaround, we hardcode all values directly here.
# NOTE: These are test/development credentials only.
ENV ASPNETCORE_ENVIRONMENT="Production"
ENV ASPNETCORE_URLS="http://+:${PORT:-8080}"
ENV ConnectionStrings__DefaultConnection="Host=postgres.railway.internal;Port=5432;Database=railway;Username=postgres;Password=WzDKXNheaetFpzbsEhMoCpzWASzyPFtH"
ENV ConnectionStrings__Redis="redis.railway.internal:6379,password=lSmKXiFBTOIsbtgwvHudKCNIAJBoNACn"
ENV Stytch__ProjectId="project-test-602a83cb-068f-4dd4-a473-0bb708335ee6"
ENV Stytch__ProjectSecret="secret-test-orObSrhvLvkqC2IMClzRxug7FICBkkqKH0g="
ENV Stytch__PublicToken="public-token-test-92b06025-3b67-4193-a934-54b95bb5bbcb"
ENV Jwt__Issuer="https://auth.fermentum.dev"
ENV Jwt__Audience="https://fermentum.dev"
ENV Jwt__SecretKey="3hk4bie7ftgw34iub4qiyrg863trf9283hruiq3griyfqgoirhu3qrq"
ENV Jwt__ExpiryMinutes="60"
ENV Stripe__SecretKey="sk_test_51S9841S4Vkg3juZcdlrb3ir0DUZgYKQQTJkmt0Vj9aGWaQq2Me6VXqCBhgWGm8IKVcNQ4JwNQyu8LBmfDIR35AJV00nfVOyx8t"
ENV Stripe__PublishableKey="pk_test_51S9841S4Vkg3juZc0uHOaNnNBJrFfyhetvmmIoRbCEdxnnwKnCZTtQAMg9Rq38kLVq71TqSt1d0TtXBTOOw1qfOw00vYAcStzo"
ENV QuickBooksOnline__ClientId="ABz2UqE4t2pzruG4EM4bw4mSeKH5NGBB6kz0DEV1UPRbBTSHB8"
ENV QuickBooksOnline__ClientSecret="RhrAUSQ4MEPUJoYjBwgjEVM5Pb45mloPoBQZqGKU"
ENV QuickBooksOnline__Environment="sandbox"
ENV QuickBooksOnline__RedirectUri="https://fermentum-api-production.up.railway.app/api/quickbooks/callback"

COPY --from=publish /app/publish .

# Health check - API listens on port 80 inside container
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:80/health || exit 1

ENTRYPOINT ["dotnet", "FermentumApi.dll"]