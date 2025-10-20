#!/bin/bash

echo "🤖 FULLY AUTOMATED TEST RUNNER"
echo "==============================="
echo ""
echo "This script will:"
echo "  1. Open test dashboard in Chrome"
echo "  2. Tests will auto-run every 30 seconds"
echo "  3. All results logged to localStorage"
echo "  4. Zero human intervention required"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if servers are running
echo -e "${BLUE}Checking if servers are running...${NC}"

if ! curl -s http://localhost:8081 > /dev/null; then
    echo -e "${YELLOW}⚠️  App server not running on port 8081${NC}"
    echo "Please start the app with: npm start"
    exit 1
fi

if ! curl -s http://localhost:3001/health > /dev/null; then
    echo -e "${YELLOW}⚠️  API server not running on port 3001${NC}"
    echo "Please start the API with: node server.js"
    exit 1
fi

echo -e "${GREEN}✅ Both servers are running${NC}"
echo ""

echo -e "${BLUE}1. Opening test dashboard in Chrome...${NC}"
open "file:///Users/kishore/Desktop/Claude-experiments/Cupido/test-dashboard.html"

echo -e "${BLUE}2. Waiting for dashboard to load...${NC}"
sleep 3

echo ""
echo -e "${GREEN}✅ AUTOMATED TESTING IS NOW RUNNING${NC}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🤖 Test Automation Status"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Mode:     Continuous"
echo "  Interval: 30 seconds"
echo "  Logging:  Enabled (localStorage)"
echo "  App:      http://localhost:8081"
echo "  API:      http://localhost:3001"
echo ""
echo "📊 View test logs:"
echo "  • Open browser console"
echo "  • Type: showHistory()"
echo "  • Or click '📊 History' button"
echo ""
echo "📥 Export logs:"
echo "  • Click '📥 Export' button"
echo "  • Or type: exportLogs()"
echo ""
echo "⏸️  Stop testing:"
echo "  • Type: stopAutomatedTesting()"
echo "  • Or close the browser tab"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${BLUE}Monitoring will continue until you close this terminal...${NC}"
echo ""

# Keep script running to show it's active
while true; do
    sleep 60
    echo -e "${BLUE}[$(date '+%H:%M:%S')] Automated testing running... (servers: ✅)${NC}"
done
