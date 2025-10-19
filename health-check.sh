#!/bin/bash

# CUPIDO HEALTH CHECK SCRIPT
# ==========================
# This script validates all critical components before deployment
# Co-founder level checks to ensure nothing breaks for users

echo "🔍 Starting Cupido Health Check..."
echo "=================================="

HEALTH_PASSED=true
CHECKS_PASSED=0
TOTAL_CHECKS=0

# Helper functions
pass_check() {
    echo "✅ $1"
    ((CHECKS_PASSED++))
    ((TOTAL_CHECKS++))
}

fail_check() {
    echo "❌ $1"
    HEALTH_PASSED=false
    ((TOTAL_CHECKS++))
}

warn_check() {
    echo "⚠️  $1"
    ((TOTAL_CHECKS++))
}

# 1. SERVICE AVAILABILITY
echo -e "\n📡 SERVICE AVAILABILITY CHECKS"
echo "─────────────────────────────────"

# Check if Node server is running
if curl -s http://localhost:3001 > /dev/null; then
    pass_check "Node.js server (localhost:3001) is running"
else
    fail_check "Node.js server (localhost:3001) is NOT running"
fi

# Check if Expo server is running
if curl -s http://localhost:8081 > /dev/null; then
    pass_check "Expo server (localhost:8081) is running"
else
    fail_check "Expo server (localhost:8081) is NOT running"
fi

# 2. DASHBOARD FUNCTIONALITY
echo -e "\n🎛️  DASHBOARD FUNCTIONALITY CHECKS"
echo "──────────────────────────────────────"

# Check if dashboard is accessible
if curl -s http://localhost:3001/cupido-test-dashboard | grep -q "Cupido Test Dashboard"; then
    pass_check "Test dashboard is accessible"
else
    fail_check "Test dashboard is NOT accessible"
fi

# Check test count display - should be automatically calculated
EXPECTED_TEST_COUNT=$(curl -s http://localhost:3001/comprehensive-test-functions.js | grep -o "'[a-z-]*-[0-9]*':" | wc -l | tr -d ' ')
DISPLAYED_TEST_COUNT=$(curl -s http://localhost:3001/cupido-test-dashboard | grep -o 'id="total-tests">[0-9]*' | grep -o '[0-9]*')

if [ "$DISPLAYED_TEST_COUNT" = "$EXPECTED_TEST_COUNT" ]; then
    pass_check "Dashboard shows correct test count ($DISPLAYED_TEST_COUNT automatically calculated)"
else
    fail_check "Dashboard test count mismatch: shows $DISPLAYED_TEST_COUNT, should be $EXPECTED_TEST_COUNT"
fi

# Check if test functions file exists
if curl -s http://localhost:3001/comprehensive-test-functions.js | grep -q "TEST_FUNCTIONS"; then
    pass_check "Test functions file is accessible"
else
    fail_check "Test functions file is NOT accessible"
fi

# 3. API ENDPOINTS
echo -e "\n🔌 API ENDPOINTS CHECKS"
echo "─────────────────────────"

# Check error stats endpoint
if curl -s http://localhost:3001/api/error-stats | grep -q "total"; then
    pass_check "Error stats API endpoint is working"
else
    fail_check "Error stats API endpoint is NOT working"
fi

# Check simulator endpoint
if curl -s -X POST http://localhost:3001/api/simulator/test -H "Content-Type: application/json" -d '{"user_message":"test"}' | grep -q "response"; then
    pass_check "Simulator API endpoint is working"
else
    warn_check "Simulator API endpoint may have issues (check personas)"
fi

# 4. DATABASE CONNECTIVITY
echo -e "\n🗄️  DATABASE CHECKS"
echo "───────────────────"

# Check if database migration files exist
if [ -f "src/database/migrations/007_add_simulator_fields.sql" ]; then
    pass_check "Latest database migration exists"
else
    fail_check "Latest database migration is missing"
fi

# 5. ERROR MONITORING
echo -e "\n🚨 ERROR MONITORING CHECKS"
echo "─────────────────────────────"

# Check if error logger exists
if [ -f "error-logger.js" ]; then
    pass_check "Error logger file exists"
else
    fail_check "Error logger file is missing"
fi

# Check if logs directory exists
if [ -d "logs" ]; then
    pass_check "Logs directory exists"
else
    warn_check "Logs directory doesn't exist (will be created automatically)"
fi

# 6. CRITICAL FILES
echo -e "\n📁 CRITICAL FILES CHECKS"
echo "───────────────────────────"

CRITICAL_FILES=(
    "server.js"
    "cupido-test-dashboard.html"
    "comprehensive-test-functions.js"
    "error-logger.js"
    "package.json"
    ".env"
)

for file in "${CRITICAL_FILES[@]}"; do
    if [ -f "$file" ]; then
        pass_check "Critical file exists: $file"
    else
        fail_check "Critical file missing: $file"
    fi
done

# 7. ENVIRONMENT VARIABLES
echo -e "\n🌍 ENVIRONMENT CHECKS"
echo "─────────────────────"

if [ -f ".env" ]; then
    if grep -q "ANTHROPIC_API_KEY" .env; then
        pass_check "Anthropic API key is configured"
    else
        fail_check "Anthropic API key is missing from .env"
    fi
    
    if grep -q "SUPABASE_URL" .env; then
        pass_check "Supabase URL is configured"
    else
        fail_check "Supabase URL is missing from .env"
    fi
else
    fail_check ".env file is missing"
fi

# SUMMARY
echo -e "\n📊 HEALTH CHECK SUMMARY"
echo "══════════════════════════"
echo "Checks passed: $CHECKS_PASSED/$TOTAL_CHECKS"

if [ "$HEALTH_PASSED" = true ]; then
    echo "🎉 ALL SYSTEMS GO! Cupido is ready for users."
    echo "✨ Co-founder confidence level: HIGH"
    exit 0
else
    echo "💥 CRITICAL ISSUES DETECTED! Do NOT deploy to users."
    echo "⚠️  Co-founder confidence level: LOW"
    echo ""
    echo "🔧 Action required: Fix the failed checks above before proceeding."
    exit 1
fi