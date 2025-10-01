#!/bin/bash

echo "🔒 Setting up Localhost HTTPS for Fermentum"
echo "=========================================="

# Trust the certificate in macOS keychain
echo "Installing certificate in macOS trust store..."
sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain dev-certs/localhost.crt

echo ""
echo "✅ SSL Certificate Setup Complete!"
echo ""
echo "📋 Update these URLs in Stytch:"
echo "   Redirect URLs: https://localhost:3000/dashboard"
echo "   Logout URL: https://localhost:3000/"
echo ""
echo "🚀 Ready to start development:"
echo "   1. Run: ./start-dev.sh (for React app)"
echo "   2. Run: cd services/fermentum-api && dotnet run (for API)"
echo "   3. Visit: https://localhost:3000"
echo ""