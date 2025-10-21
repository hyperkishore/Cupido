#!/bin/bash

# BROWSER REALITY DEBUG - WHAT'S ACTUALLY HAPPENING
# ================================================
# Co-founder level deep debugging of actual browser state

echo "🔍 DEBUGGING BROWSER REALITY"
echo "============================"
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

echo "🎯 OBSERVED BROWSER STATE:"
echo "─────────────────────────"
error "Total Tests: 0 (should be 66)"
error "Pending: 40 (inconsistent with Total Tests: 0)"
error "Test table: Empty"
warning "This indicates multiple issues with our JavaScript"

echo ""
echo "🔍 STEP 1: EXAMINE HTML SOURCE"
echo "─────────────────────────────"

# Get the actual HTML being served
DASHBOARD_HTML=$(curl -s http://localhost:3001/cupido-test-dashboard)

# Check if our debugging code is present
if echo "$DASHBOARD_HTML" | grep -q "initializeTests called"; then
    success "Debug logging code is present in HTML"
else
    error "Debug logging code is missing from HTML"
fi

# Check script loading
SCRIPT_TAGS=$(echo "$DASHBOARD_HTML" | grep -o "<script[^>]*>" | wc -l)
info "Found $SCRIPT_TAGS script tags in HTML"

# Check if comprehensive-test-functions.js is included
if echo "$DASHBOARD_HTML" | grep -q "comprehensive-test-functions.js"; then
    success "comprehensive-test-functions.js is included"
else
    error "comprehensive-test-functions.js is NOT included"
fi

echo ""
echo "🔍 STEP 2: CHECK JAVASCRIPT FILES"
echo "────────────────────────────────"

# Test if comprehensive-test-functions.js is accessible
TEST_JS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/comprehensive-test-functions.js)
if [ "$TEST_JS_STATUS" = "200" ]; then
    success "comprehensive-test-functions.js returns HTTP 200"
    
    # Check content
    TEST_JS_CONTENT=$(curl -s http://localhost:3001/comprehensive-test-functions.js)
    FUNCTION_COUNT=$(echo "$TEST_JS_CONTENT" | grep -o "'[a-z-]*-[0-9]*':" | wc -l | tr -d ' ')
    info "comprehensive-test-functions.js contains $FUNCTION_COUNT functions"
    
    if echo "$TEST_JS_CONTENT" | grep -q "window.TEST_FUNCTIONS = TEST_FUNCTIONS"; then
        success "window.TEST_FUNCTIONS assignment is present"
    else
        error "window.TEST_FUNCTIONS assignment is MISSING"
    fi
else
    error "comprehensive-test-functions.js returns HTTP $TEST_JS_STATUS"
fi

echo ""
echo "🔍 STEP 3: ANALYZE PENDING:40 ANOMALY"
echo "────────────────────────────────────"

# Search for where "40" might be coming from
info "Searching for hardcoded '40' in dashboard HTML..."

if echo "$DASHBOARD_HTML" | grep -q "40"; then
    warning "Found '40' in HTML source:"
    echo "$DASHBOARD_HTML" | grep -n "40" | head -5
else
    info "No hardcoded '40' found in HTML"
fi

# Check for testConfig usage
if echo "$DASHBOARD_HTML" | grep -A20 -B5 "testConfig"; then
    info "Found testConfig references in HTML"
else
    warning "No testConfig references found"
fi

echo ""
echo "🔍 STEP 4: CREATE BROWSER CONSOLE DEBUG"
echo "──────────────────────────────────────"

# Create a JavaScript snippet that can be run in browser console
cat > browser-debug.js << 'EOF'
// PASTE THIS INTO BROWSER CONSOLE FOR REAL-TIME DEBUGGING
console.log("🔍 BROWSER DEBUG STARTING...");

console.log("🔍 window.TEST_FUNCTIONS available:", !!window.TEST_FUNCTIONS);
if (window.TEST_FUNCTIONS) {
    console.log("🔍 TEST_FUNCTIONS count:", Object.keys(window.TEST_FUNCTIONS).length);
    console.log("🔍 First few functions:", Object.keys(window.TEST_FUNCTIONS).slice(0, 5));
} else {
    console.log("❌ TEST_FUNCTIONS is not available");
}

console.log("🔍 tests array length:", window.tests ? window.tests.length : "tests array not found");

console.log("🔍 DOM elements:");
console.log("  total-tests element:", document.getElementById('total-tests')?.textContent);
console.log("  passed-tests element:", document.getElementById('passed-tests')?.textContent);
console.log("  pending-tests element:", document.getElementById('pending-tests')?.textContent);

console.log("🔍 testConfig:");
console.log(window.testConfig || "testConfig not found");

console.log("🔍 Checking script tags:");
const scripts = document.querySelectorAll('script[src]');
scripts.forEach((script, i) => {
    console.log(`  Script ${i + 1}: ${script.src}`);
});

console.log("🔍 Manual initialization test:");
if (typeof initializeTests === 'function') {
    console.log("✅ initializeTests function exists");
    console.log("🔄 Calling initializeTests manually...");
    initializeTests();
    console.log("🔍 After manual call - tests array length:", window.tests ? window.tests.length : "tests array not found");
} else {
    console.log("❌ initializeTests function not found");
}

console.log("🔍 BROWSER DEBUG COMPLETE");
EOF

success "Created browser-debug.js file"
info "To debug in browser:"
echo "1. Open http://localhost:3001/cupido-test-dashboard"
echo "2. Open browser console (F12)"
echo "3. Copy and paste the contents of browser-debug.js"
echo "4. Press Enter to run the debug script"

echo ""
echo "🔧 STEP 5: QUICK FIX ATTEMPT"
echo "───────────────────────────"

info "Let me check if there's a server-side issue..."

# Check if the server is serving the file correctly
SERVER_RESPONSE=$(curl -s -I http://localhost:3001/comprehensive-test-functions.js)
CONTENT_TYPE=$(echo "$SERVER_RESPONSE" | grep -i "content-type" || echo "Content-Type not found")
info "Server response for JS file: $CONTENT_TYPE"

echo ""
echo "📋 DIAGNOSIS SUMMARY"
echo "==================="

echo ""
echo "🎯 LIKELY ISSUES:"
echo "1. JavaScript execution order problem"
echo "2. TEST_FUNCTIONS not being assigned to window correctly"
echo "3. Script loading timing still not resolved"
echo "4. Possible caching issue in browser"
echo ""
echo "🔧 IMMEDIATE ACTIONS NEEDED:"
echo "1. Run the browser-debug.js script in browser console"
echo "2. Check for JavaScript errors in browser console"
echo "3. Try hard refresh (Ctrl+F5 or Cmd+Shift+R)"
echo "4. Verify comprehensive-test-functions.js is loading"
echo ""
echo "💡 Next: Use browser-debug.js to see exactly what's happening!"