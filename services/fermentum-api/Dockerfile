# Build arguments for version tracking
ARG GIT_SHA=unknown
ARG BUILD_TIME=unknown
ARG CACHE_BUSTER=0

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Cache busting layer (when needed)
RUN echo "cache_buster=${CACHE_BUSTER}"

# Copy solution and project files first for better layer caching
COPY ["services/fermentum-api/Fermentum.Auth.csproj", "services/fermentum-api/"]
RUN dotnet restore "services/fermentum-api/Fermentum.Auth.csproj"

# Copy source code (this layer busts when code changes)
COPY services/fermentum-api/ services/fermentum-api/
WORKDIR "/src/services/fermentum-api"

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

COPY --from=publish /app/publish .

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:80/health || exit 1

ENTRYPOINT ["dotnet", "Fermentum.Auth.dll"]