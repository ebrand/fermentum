#!/bin/bash

echo "🍺 Starting Fermentum Development Environment with HTTPS"
echo "======================================================="

# Clean up any Docker-created files with wrong permissions
echo "Cleaning up Docker artifacts..."
docker-compose down 2>/dev/null || true
sudo rm -rf ui/user/node_modules ui/user/package-lock.json 2>/dev/null || true

# Install UI dependencies
echo "Installing UI dependencies..."
cd ui/user
npm install

# Start React dev server with HTTPS on port 3000
echo "Starting React dev server on https://localhost:3000"
echo ""
echo "📋 Next steps:"
echo "1. Add localhost.crt to your browser's trusted certificates"
echo "2. Update Stytch redirect URLs to https://localhost:3000"
echo "3. Start .NET API on https://localhost:5000"
echo ""
npm run dev