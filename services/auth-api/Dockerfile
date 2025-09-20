FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["services/auth-api/Fermentum.Auth.csproj", "services/auth-api/"]
RUN dotnet restore "services/auth-api/Fermentum.Auth.csproj"
COPY services/auth-api/ services/auth-api/
WORKDIR "/src/services/auth-api"
RUN dotnet build "Fermentum.Auth.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "Fermentum.Auth.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:80/health || exit 1

ENTRYPOINT ["dotnet", "Fermentum.Auth.dll"]