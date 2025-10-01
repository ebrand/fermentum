#!/bin/bash

echo "🚀 Starting Fermentum localhost development environment"

# Kill any existing processes on ports 3000 and 5001
echo "🛑 Stopping any existing processes..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:5001 | xargs kill -9 2>/dev/null || true

# Generate SSL certificates if they don't exist
if [ ! -f ".dev-certs/localhost.crt" ]; then
    echo "🔐 Generating SSL certificates..."
    mkdir -p .dev-certs
    openssl req -x509 -newkey rsa:2048 -keyout .dev-certs/localhost.key -out .dev-certs/localhost.crt -days 365 -nodes -subj "/C=US/ST=CA/L=Local/O=Dev/CN=localhost" -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"
fi

# Start React dev server in background
echo "⚛️  Starting React dev server (https://localhost:3000)..."
cd dev-ui
npm run dev &
REACT_PID=$!
cd ..

# Wait a moment for React to start
sleep 3

echo ""
echo "✅ Development servers started!"
echo ""
echo "📱 React UI:  https://localhost:3000"
echo "🔌 API:      https://localhost:5001 (when built)"
echo ""
echo "🔧 Next steps for Stytch setup:"
echo "   1. Add these URLs to your Stytch project:"
echo "      - https://localhost:3000/auth/callback"
echo "      - https://localhost:3000"
echo ""
echo "📝 To stop all servers: kill $REACT_PID"
echo ""
echo "🌐 Open https://localhost:3000 in your browser"

# Keep script running
wait $REACT_PID