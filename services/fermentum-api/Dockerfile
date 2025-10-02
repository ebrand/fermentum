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
COPY ["FermentumApi.csproj", "./"]
RUN dotnet restore "FermentumApi.csproj"

# Copy source code (this layer busts when code changes)
COPY . .
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
# IMPORTANT: These values will be overridden by Railway environment variables
# The values below are fallbacks for local Docker builds only
# In Railway, set these as service variables for security

ENV ASPNETCORE_ENVIRONMENT="Production"
ENV ASPNETCORE_URLS="http://+:${PORT:-8080}"

# Database connection (set in Railway as environment variable)
ENV ConnectionStrings__DefaultConnection=""

# Redis connection (set in Railway as environment variable)
ENV ConnectionStrings__Redis=""

# Stytch authentication (set in Railway as environment variable)
ENV Stytch__ProjectId=""
ENV Stytch__ProjectSecret=""
ENV Stytch__PublicToken=""

# JWT configuration (set in Railway as environment variable with strong secret)
ENV Jwt__Issuer="https://auth.fermentum.dev"
ENV Jwt__Audience="https://fermentum.dev"
ENV Jwt__SecretKey=""
ENV Jwt__ExpiryMinutes="60"

# Stripe payment processing (set in Railway as environment variable)
ENV Stripe__SecretKey=""
ENV Stripe__PublishableKey=""

# QuickBooks integration (set in Railway as environment variable)
ENV QuickBooksOnline__ClientId=""
ENV QuickBooksOnline__ClientSecret=""
ENV QuickBooksOnline__Environment="sandbox"
ENV QuickBooksOnline__RedirectUri=""

COPY --from=publish /app/publish .

# Create uploads directory for profile pictures and files
RUN mkdir -p /app/uploads && chmod 755 /app/uploads

# Health check - API listens on the PORT variable (Railway sets this dynamically)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:${PORT:-8080}/health || exit 1

ENTRYPOINT ["dotnet", "FermentumApi.dll"]