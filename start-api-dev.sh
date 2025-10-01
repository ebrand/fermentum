#!/bin/bash

echo "🍺 Starting Fermentum API Development Server"
echo "============================================"

# Start required infrastructure if not running
if ! docker ps | grep -q infra-postgres; then
    echo "Starting PostgreSQL..."
    docker-compose up -d infra-postgres
fi

if ! docker ps | grep -q infra-redis; then
    echo "Starting Redis..."
    docker-compose up -d infra-redis
fi

# Wait for infrastructure
echo "Waiting for infrastructure to be ready..."
sleep 5

# Start API
echo "Starting .NET API on https://localhost:5000"
cd services/fermentum-api
export ASPNETCORE_ENVIRONMENT=Development
dotnet run