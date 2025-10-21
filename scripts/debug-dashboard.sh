#!/bin/bash

# DASHBOARD DEBUG DIAGNOSTIC SCRIPT
# =================================
# Co-founder level debugging using our own testing infrastructure

echo "🔍 DEBUGGING DASHBOARD LOADING ISSUES"
echo "====================================="
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

echo "🎯 STEP 1: BASIC CONNECTIVITY"
echo "────────────────────────────"

# Test basic dashboard access
info "Testing dashboard accessibility..."
DASHBOARD_RESPONSE=$(curl -s http://localhost:3001/cupido-test-dashboard)
if echo "$DASHBOARD_RESPONSE" | grep -q "Cupido Test Dashboard"; then
    success "Dashboard HTML loads successfully"
else
    error "Dashboard HTML failed to load"
    exit 1
fi

echo ""
echo "🧪 STEP 2: JAVASCRIPT LOADING ANALYSIS"
echo "──────────────────────────────────────"

# Check if TEST_FUNCTIONS script is included
info "Checking if comprehensive-test-functions.js is included..."
if echo "$DASHBOARD_RESPONSE" | grep -q "comprehensive-test-functions.js"; then
    success "comprehensive-test-functions.js is included in HTML"
else
    error "comprehensive-test-functions.js is NOT included in HTML"
fi

# Test direct access to test functions file
info "Testing direct access to test functions..."
TEST_FUNCTIONS_RESPONSE=$(curl -s http://localhost:3001/comprehensive-test-functions.js)
if echo "$TEST_FUNCTIONS_RESPONSE" | grep -q "TEST_FUNCTIONS"; then
    success "comprehensive-test-functions.js is accessible"
    
    # Count actual functions in the file
    FUNCTION_COUNT=$(echo "$TEST_FUNCTIONS_RESPONSE" | grep -o "'[a-z-]*-[0-9]*':" | wc -l | tr -d ' ')
    info "Found $FUNCTION_COUNT test functions in file"
else
    error "comprehensive-test-functions.js is NOT accessible"
fi

echo ""
echo "🔧 STEP 3: JAVASCRIPT EXECUTION TESTING"
echo "───────────────────────────────────────"

# Create a test script to check if JavaScript is executing
info "Creating JavaScript execution test..."

# Test if we can execute JavaScript that loads the test functions
NODE_TEST=$(node -e "
try {
    const fs = require('fs');
    const testFunctions = fs.readFileSync('/Users/kishore/Desktop/Claude-experiments/Cupido/comprehensive-test-functions.js', 'utf8');
    
    // Create a minimal browser-like environment
    global.window = { 
        TEST_FUNCTIONS: {},
        addEventListener: function() {}, // Mock DOM method
        postMessage: function() {},
        parent: { postMessage: function() {} }
    };
    global.console = { log: () => {}, warn: () => {}, error: () => {} };
    global.document = { 
        getElementById: () => ({ src: '' }),
        addEventListener: function() {}
    };
    
    // Execute the test functions code
    eval(testFunctions);
    
    // Check if TEST_FUNCTIONS was populated
    const count = Object.keys(global.window.TEST_FUNCTIONS).length;
    process.stdout.write('SUCCESS: ' + count + ' test functions loaded');
} catch (error) {
    process.stdout.write('ERROR: ' + error.message);
}
")

if echo "$NODE_TEST" | grep -q "SUCCESS:"; then
    success "JavaScript executes correctly in Node.js environment"
    NODE_COUNT=$(echo "$NODE_TEST" | grep -o "SUCCESS: [0-9]*" | grep -o "[0-9]*")
    info "Node.js loaded $NODE_COUNT test functions"
else
    error "JavaScript execution failed in Node.js"
    echo "Error details: $NODE_TEST"
fi

echo ""
echo "🌐 STEP 4: BROWSER JAVASCRIPT ANALYSIS"
echo "─────────────────────────────────────"

# Check for JavaScript errors in the HTML
info "Analyzing HTML for JavaScript issues..."

# Look for script tags and their order
SCRIPT_COUNT=$(echo "$DASHBOARD_RESPONSE" | grep -o "<script" | wc -l | tr -d ' ')
info "Found $SCRIPT_COUNT script tags in HTML"

# Check if comprehensive-test-functions.js is loaded before the main script
if echo "$DASHBOARD_RESPONSE" | grep -B10 -A10 "comprehensive-test-functions.js"; then
    info "Script loading order analysis:"
    echo "$DASHBOARD_RESPONSE" | grep -o "<script[^>]*src[^>]*>" | nl
else
    warning "Could not find script loading pattern"
fi

echo ""
echo "🔍 STEP 5: RUNTIME EXECUTION TEST"
echo "────────────────────────────────"

# Test actual runtime execution by fetching the page and checking computed values
info "Testing runtime execution with headless approach..."

# Create a simple test to see what the dashboard actually renders
RUNTIME_TEST=$(curl -s http://localhost:3001/cupido-test-dashboard | grep -A5 -B5 "total-tests")
info "Current total-tests element state:"
echo "$RUNTIME_TEST"

echo ""
echo "🎯 STEP 6: SPECIFIC ISSUE DIAGNOSIS"
echo "──────────────────────────────────"

# Check if the issue is script loading order
info "Diagnosing potential root causes..."

# Check if window.addEventListener is properly set up
if echo "$DASHBOARD_RESPONSE" | grep -q "window.addEventListener.*DOMContentLoaded"; then
    success "DOMContentLoaded event listener is set up"
else
    error "DOMContentLoaded event listener is missing"
fi

# Check if initializeTests function exists
if echo "$DASHBOARD_RESPONSE" | grep -q "function initializeTests"; then
    success "initializeTests function is defined"
else
    error "initializeTests function is missing"
fi

# Check if updateStats function exists
if echo "$DASHBOARD_RESPONSE" | grep -q "function updateStats"; then
    success "updateStats function is defined"
else
    error "updateStats function is missing"
fi

echo ""
echo "📋 DIAGNOSIS SUMMARY"
echo "==================="

echo "Based on the analysis above, the likely issues are:"
echo "1. JavaScript execution timing (scripts loading out of order)"
echo "2. TEST_FUNCTIONS not available when initializeTests runs"
echo "3. updateStats not being called after TEST_FUNCTIONS loads"
echo ""
echo "🔧 Recommended fixes:"
echo "1. Ensure comprehensive-test-functions.js loads before main script"
echo "2. Add proper error handling in initializeTests"
echo "3. Add debugging logs to track function execution"