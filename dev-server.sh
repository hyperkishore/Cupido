#!/bin/bash

# Development server script with auto-restart and debug monitoring

echo "🚀 Starting Cupido Development Server"
echo "=================================="
echo ""

# Kill any existing processes
echo "🧹 Cleaning up existing processes..."
lsof -ti:8081 | xargs kill -9 2>/dev/null || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true

# Clear Metro cache
echo "🗑️  Clearing Metro cache..."
npx expo start --clear --reset-cache 2>/dev/null || true

echo ""
echo "🤖 Starting AI Proxy Server on port 3001..."
echo "=================================="

# Load environment variables
source .env 2>/dev/null || true

# Start proxy server in background
ANTHROPIC_API_KEY="${ANTHROPIC_API_KEY}" node server.js &
PROXY_PID=$!

# Wait for proxy to start
sleep 2

echo ""
echo "📦 Starting Expo with debugging enabled..."
echo "=================================="

# Start Expo with debug mode and web support
EXPO_DEBUG=true npx expo start --web

# Cleanup on exit
trap "kill $PROXY_PID 2>/dev/null" EXIT

# The server will keep running until you press Ctrl+C
echo ""
echo "📝 Tips for debugging double message issue:"
echo "  1. Check browser console for duplicate network requests"
echo "  2. Look for 'Sending message:' logs appearing twice"
echo "  3. Check if messages have duplicate IDs in the database"
echo "  4. Monitor the 'Background Bash' notifications in the terminal"
echo ""
echo "Press Ctrl+C to stop the server"