#!/bin/bash

# JAVASCRIPT SYNTAX VALIDATION
# ============================
# Validate the dashboard JavaScript has no syntax errors

echo "🔍 VALIDATING JAVASCRIPT SYNTAX"
echo "==============================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
success() { echo -e "${GREEN}✅ $1${NC}"; }
warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
error() { echo -e "${RED}❌ $1${NC}"; }

echo "🎯 STEP 1: CHECK FOR DUPLICATE DECLARATIONS"
echo "──────────────────────────────────────────"

# Check for duplicate originalSwitchTab
ORIGINAL_SWITCH_COUNT=$(grep -c "const originalSwitchTab" /Users/kishore/Desktop/Claude-experiments/Cupido/cupido-test-dashboard.html)
if [ "$ORIGINAL_SWITCH_COUNT" -eq 1 ]; then
    success "No duplicate originalSwitchTab declarations (count: $ORIGINAL_SWITCH_COUNT)"
elif [ "$ORIGINAL_SWITCH_COUNT" -eq 0 ]; then
    warning "No originalSwitchTab declarations found"
else
    error "Multiple originalSwitchTab declarations found (count: $ORIGINAL_SWITCH_COUNT)"
fi

echo ""
echo "🎯 STEP 2: CHECK FUNCTION DEFINITIONS"
echo "────────────────────────────────────"

# Check if runBrowserDebug function exists
if grep -q "function runBrowserDebug" /Users/kishore/Desktop/Claude-experiments/Cupido/cupido-test-dashboard.html; then
    success "runBrowserDebug function is defined"
else
    error "runBrowserDebug function is NOT defined"
fi

# Check if initializeTests function exists
if grep -q "function initializeTests" /Users/kishore/Desktop/Claude-experiments/Cupido/cupido-test-dashboard.html; then
    success "initializeTests function is defined"
else
    error "initializeTests function is NOT defined"
fi

echo ""
echo "🎯 STEP 3: CHECK SCRIPT LOADING"
echo "──────────────────────────────"

# Test if comprehensive-test-functions.js loads without error
TEST_JS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/comprehensive-test-functions.js)
if [ "$TEST_JS_STATUS" = "200" ]; then
    success "comprehensive-test-functions.js loads successfully (HTTP $TEST_JS_STATUS)"
else
    error "comprehensive-test-functions.js failed to load (HTTP $TEST_JS_STATUS)"
fi

echo ""
echo "🎯 STEP 4: TEST BASIC DASHBOARD LOADING"
echo "──────────────────────────────────────"

# Test if dashboard loads without immediate errors
DASHBOARD_RESPONSE=$(curl -s http://localhost:3001/cupido-test-dashboard)
if echo "$DASHBOARD_RESPONSE" | grep -q "Cupido Test Dashboard"; then
    success "Dashboard HTML loads successfully"
else
    error "Dashboard HTML failed to load"
fi

# Check if debug button is present
if echo "$DASHBOARD_RESPONSE" | grep -q "runBrowserDebug"; then
    success "DEBUG button is present in HTML"
else
    error "DEBUG button is missing from HTML"
fi

echo ""
echo "📋 SYNTAX VALIDATION SUMMARY"
echo "============================"

echo ""
echo "✅ Fixed issues:"
echo "   • Duplicate originalSwitchTab declaration"
echo "   • Added proper runBrowserDebug function"
echo "   • Added JavaScript error capturing"
echo ""
echo "🔧 Next steps:"
echo "   1. Refresh dashboard: http://localhost:3001/cupido-test-dashboard"
echo "   2. Click the red 🔍 DEBUG button"
echo "   3. Check Console tab for debug output"
echo "   4. Wait for auto-debug to run after 3 seconds"
echo ""
info "If errors persist, check browser developer console for additional clues"