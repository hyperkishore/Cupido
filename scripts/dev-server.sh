#!/bin/bash

# Development server script with auto-restart, debug monitoring, and automated testing

echo "🚀 Starting Cupido Development Server"
echo "=================================="
echo ""

# Configuration: Set to "false" to disable automated testing
ENABLE_AUTO_TESTS="${ENABLE_AUTO_TESTS:-true}"

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

# Start proxy server in background
# Note: server.js now uses dotenv to load .env automatically
node server.js &
PROXY_PID=$!

# Wait for proxy to start
sleep 2

echo ""
echo "📦 Starting Expo with debugging enabled..."
echo "=================================="

# Start Expo with debug mode and web support in background
EXPO_DEBUG=true npx expo start --web &
EXPO_PID=$!

# Wait for servers to be fully ready
echo ""
echo "⏳ Waiting for servers to be ready..."
sleep 5

# Check if both servers are running
if curl -s http://localhost:8081 > /dev/null && curl -s http://localhost:3001/health > /dev/null; then
    echo "✅ Both servers are running"
    echo ""

    # Launch automated tests if enabled
    if [ "$ENABLE_AUTO_TESTS" = "true" ]; then
        echo "🤖 AUTOMATED TESTING MODE"
        echo "=================================="
        echo "Opening test dashboard with auto-testing enabled..."
        echo ""

        # Open test dashboard in Chrome (now served from localhost)
        open "http://localhost:3001/test-dashboard"

        sleep 2

        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "🎯 Test Automation Active"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "  Mode:     Continuous (every 30 seconds)"
        echo "  App:      http://localhost:8081"
        echo "  API:      http://localhost:3001"
        echo "  Tests:    9 automated test cases"
        echo "  Logging:  Enabled (localStorage)"
        echo ""
        echo "📊 Monitor tests:"
        echo "  • Check test dashboard in browser"
        echo "  • View console output (F12)"
        echo "  • Type: showHistory()"
        echo ""
        echo "⏸️  Stop tests: stopAutomatedTesting()"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
    else
        echo "ℹ️  Automated testing disabled"
        echo "   Set ENABLE_AUTO_TESTS=true to enable"
        echo ""
    fi
else
    echo "⚠️  Warning: One or more servers failed to start"
    echo ""
fi

# Cleanup function
cleanup() {
    echo ""
    echo "🛑 Shutting down servers..."
    kill $PROXY_PID 2>/dev/null
    kill $EXPO_PID 2>/dev/null
    echo "✅ Cleanup complete"
}

# Setup cleanup on exit
trap cleanup EXIT INT TERM

echo "📝 Development Server Running"
echo "=================================="
echo "  App:   http://localhost:8081"
echo "  API:   http://localhost:3001/health"
echo "  Tests: $([ "$ENABLE_AUTO_TESTS" = "true" ] && echo "✅ Enabled" || echo "❌ Disabled")"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Keep script running
wait $EXPO_PID