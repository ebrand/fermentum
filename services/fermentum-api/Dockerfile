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
COPY ["Fermentum.Auth.csproj", "./"]
RUN dotnet restore "Fermentum.Auth.csproj"

# Copy source code (this layer busts when code changes)
COPY . .
WORKDIR "/src"

# Build with version info
RUN dotnet build "Fermentum.Auth.csproj" -c Release -o /app/build \
    -p:AssemblyVersion=1.0.0.0 \
    -p:FileVersion=1.0.0.0 \
    -p:InformationalVersion=${GIT_SHA}

FROM build AS publish
RUN dotnet publish "Fermentum.Auth.csproj" -c Release -o /app/publish \
    /p:UseAppHost=false \
    -p:AssemblyVersion=1.0.0.0 \
    -p:FileVersion=1.0.0.0 \
    -p:InformationalVersion=${GIT_SHA}

FROM base AS final
WORKDIR /app

# Add version labels for identification
LABEL org.opencontainers.image.revision=${GIT_SHA}
LABEL org.opencontainers.image.created=${BUILD_TIME}
LABEL org.fermentum.version=${GIT_SHA}

# Set environment variables for runtime version info
ENV APP_VERSION=${GIT_SHA}
ENV BUILD_TIME=${BUILD_TIME}

# Set runtime environment variables from build arguments
ENV ASPNETCORE_ENVIRONMENT=${ASPNETCORE_ENVIRONMENT}
ENV ASPNETCORE_URLS=${ASPNETCORE_URLS}
ENV ConnectionStrings__DefaultConnection=${ConnectionStrings__DefaultConnection}
ENV ConnectionStrings__Redis=${ConnectionStrings__Redis}
ENV Stytch__ProjectId=${Stytch__ProjectId}
ENV Stytch__ProjectSecret=${Stytch__ProjectSecret}
ENV Stytch__PublicToken=${Stytch__PublicToken}
ENV Jwt__Issuer=${Jwt__Issuer}
ENV Jwt__Audience=${Jwt__Audience}
ENV Jwt__SecretKey=${Jwt__SecretKey}
ENV Jwt__ExpiryMinutes=${Jwt__ExpiryMinutes}
ENV Stripe__SecretKey=${Stripe__SecretKey}
ENV Stripe__PublishableKey=${Stripe__PublishableKey}
ENV QuickBooksOnline__ClientId=${QuickBooksOnline__ClientId}
ENV QuickBooksOnline__ClientSecret=${QuickBooksOnline__ClientSecret}
ENV QuickBooksOnline__Environment=${QuickBooksOnline__Environment}
ENV QuickBooksOnline__RedirectUri=${QuickBooksOnline__RedirectUri}

COPY --from=publish /app/publish .

# Health check - use PORT env var if set, default to 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:${PORT:-8080}/health || exit 1

ENTRYPOINT ["dotnet", "Fermentum.Auth.dll"]