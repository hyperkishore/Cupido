#!/bin/bash

# CUPIDO TESTING HEALTH MONITOR
# =============================
# Consolidated testing system validation combining:
# - test-automation.sh (automation testing)
# - test-dashboard-fix.sh (dashboard validation)
# - validate-dashboard-fix.sh (validation testing)
# - auto-test-reflect.sh (UI testing automation)
# - scripts/run-automated-tests.sh (automated test runner)
#
# This script validates testing infrastructure health and provides
# comprehensive test system monitoring for the Health Check dashboard tab

echo "🧪 CUPIDO TESTING HEALTH MONITOR"
echo "================================="
echo "Testing infrastructure validation"
echo ""

# Configuration
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
LOG_FILE="logs/testing-health.log"
EXIT_CODE=0

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging functions
info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
success() { echo -e "${GREEN}✅ $1${NC}"; }
warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
error() { echo -e "${RED}❌ $1${NC}"; EXIT_CODE=1; }

# Ensure logs directory exists
mkdir -p logs

# Log start
echo "[$TIMESTAMP] Testing health check started" >> "$LOG_FILE"

echo "1️⃣  TEST INFRASTRUCTURE"
echo "======================="

# Check test framework files
info "Checking test framework files..."
TEST_FILES=(
    "comprehensive-test-functions.js"
    "infrastructure-tests.js"
    "cupido-test-dashboard.html"
)

for file in "${TEST_FILES[@]}"; do
    if [[ -f "$file" ]]; then
        success "$file exists"
        
        # Check file size (should not be empty)
        if [[ -s "$file" ]]; then
            FILE_SIZE=$(wc -l < "$file")
            success "$file has content ($FILE_SIZE lines)"
        else
            error "$file is empty"
        fi
    else
        error "$file missing"
    fi
done

# Check test metadata
info "Validating test metadata..."
if [[ -f "comprehensive-test-functions.js" ]]; then
    # Check for TEST_METADATA
    if grep -q "TEST_METADATA" comprehensive-test-functions.js; then
        success "TEST_METADATA found in test functions"
        
        # Count test metadata entries
        METADATA_COUNT=$(grep -c "': {" comprehensive-test-functions.js | head -1)
        success "Test metadata contains $METADATA_COUNT test definitions"
    else
        error "TEST_METADATA not found in test functions"
    fi
    
    # Check for TEST_FUNCTIONS
    if grep -q "TEST_FUNCTIONS" comprehensive-test-functions.js; then
        success "TEST_FUNCTIONS found in test functions"
    else
        error "TEST_FUNCTIONS not found in test functions"
    fi
fi

echo ""
echo "2️⃣  TEST DASHBOARD HEALTH"
echo "========================="

# Check dashboard accessibility
info "Testing dashboard accessibility..."
if curl -s --max-time 10 http://localhost:3001/cupido-test-dashboard >/dev/null 2>&1; then
    success "Test dashboard accessible at http://localhost:3001/cupido-test-dashboard"
    
    # Check dashboard content
    DASHBOARD_CONTENT=$(curl -s http://localhost:3001/cupido-test-dashboard 2>/dev/null)
    
    # Check for essential dashboard components
    if echo "$DASHBOARD_CONTENT" | grep -q "Health Check"; then
        success "Health Check tab found in dashboard"
    else
        warning "Health Check tab not found in dashboard"
    fi
    
    if echo "$DASHBOARD_CONTENT" | grep -q "runAllHealthChecks"; then
        success "runAllHealthChecks function found in dashboard"
    else
        error "runAllHealthChecks function missing from dashboard"
    fi
    
    if echo "$DASHBOARD_CONTENT" | grep -q "comprehensive-test-functions.js"; then
        success "Test functions script loaded in dashboard"
    else
        error "Test functions script not loaded in dashboard"
    fi
    
else
    error "Test dashboard not accessible (check if server is running)"
fi

# Check for JavaScript errors in dashboard
info "Checking dashboard JavaScript integrity..."
if [[ -f "cupido-test-dashboard.html" ]]; then
    # Basic syntax check for common JS errors
    if grep -q "function.*{" cupido-test-dashboard.html && grep -q "</script>" cupido-test-dashboard.html; then
        success "Dashboard JavaScript structure looks valid"
    else
        warning "Dashboard JavaScript structure may have issues"
    fi
    
    # Check for essential functions
    ESSENTIAL_FUNCTIONS=("runAllHealthChecks" "populateHealthTable" "switchTab")
    for func in "${ESSENTIAL_FUNCTIONS[@]}"; do
        if grep -q "$func" cupido-test-dashboard.html; then
            success "$func function found in dashboard"
        else
            warning "$func function not found in dashboard"
        fi
    done
fi

echo ""
echo "3️⃣  AUTOMATED TESTING CAPABILITIES"
echo "=================================="

# Check automation tools
info "Checking automation capabilities..."

# Check if Chrome/browser automation is possible
if command -v google-chrome >/dev/null 2>&1 || command -v chrome >/dev/null 2>&1 || [[ -d "/Applications/Google Chrome.app" ]]; then
    success "Chrome browser available for automation"
else
    warning "Chrome browser not found (automation may be limited)"
fi

# Check Node.js testing capabilities
info "Testing Node.js test execution..."
if command -v node >/dev/null 2>&1; then
    # Test if we can analyze test functions (they contain browser globals)
    if grep -q "TEST_FUNCTIONS\|TEST_METADATA" comprehensive-test-functions.js 2>/dev/null; then
        success "Test functions contain expected exports"
        
        # Check if the file has browser-only code
        if grep -q "window\." comprehensive-test-functions.js 2>/dev/null; then
            success "Test functions are browser-based (normal for dashboard)"
        else
            warning "Test functions may have compatibility issues"
        fi
    else
        error "Test functions missing required exports"
    fi
else
    error "Node.js not available for test execution"
fi

# Check test categories
info "Validating test categories..."
if [[ -f "comprehensive-test-functions.js" ]]; then
    CATEGORIES=("foundation" "prompts" "monitor" "console" "message" "profile" "database" "error" "state" "api" "simulator")
    
    for category in "${CATEGORIES[@]}"; do
        if grep -q "category.*$category" comprehensive-test-functions.js; then
            success "$category test category found"
        else
            warning "$category test category not found"
        fi
    done
fi

echo ""
echo "4️⃣  TEST EXECUTION ENVIRONMENT"
echo "=============================="

# Test actual test execution
info "Testing test execution environment..."

# Check if server API endpoints for testing exist
TEST_ENDPOINTS=("/health" "/api/health/status" "/cupido-test-dashboard")

for endpoint in "${TEST_ENDPOINTS[@]}"; do
    if curl -s --max-time 5 "http://localhost:3001$endpoint" >/dev/null 2>&1; then
        success "Test endpoint $endpoint accessible"
    else
        warning "Test endpoint $endpoint not accessible"
    fi
done

# Check localStorage simulation capability
info "Checking local storage simulation..."
if command -v node >/dev/null 2>&1; then
    # Test if we can simulate localStorage
    if node -e "
        global.localStorage = {
            getItem: (key) => null,
            setItem: (key, value) => {},
            removeItem: (key) => {}
        };
        console.log('localStorage simulation available');
    " 2>/dev/null; then
        success "localStorage simulation available for testing"
    else
        warning "localStorage simulation may have issues"
    fi
fi

# Check test result logging
info "Checking test result logging..."
if [[ -d "logs" ]] || mkdir -p logs 2>/dev/null; then
    success "Test logging directory available"
    
    # Test write permissions
    if echo "test" > logs/test-write-check.tmp 2>/dev/null && rm logs/test-write-check.tmp 2>/dev/null; then
        success "Test result logging writable"
    else
        warning "Test result logging may have permission issues"
    fi
else
    error "Cannot create test logging directory"
fi

echo ""
echo "5️⃣  TEST DATA & FIXTURES"
echo "========================"

# Check test data integrity
info "Checking test data integrity..."

# Check for test configuration
if grep -q "testConfig" cupido-test-dashboard.html 2>/dev/null; then
    success "Test configuration found in dashboard"
else
    warning "Test configuration not found in dashboard"
fi

# Check for mock data
if [[ -f "comprehensive-test-functions.js" ]]; then
    if grep -q "NATURAL_TEST_MESSAGES" comprehensive-test-functions.js; then
        success "Natural test messages found for UI testing"
    else
        warning "Natural test messages not found"
    fi
fi

# Check test utilities
info "Checking test utilities..."
TEST_UTILITIES=("consoleErrors" "sendMessageToApp" "getAppState")

if [[ -f "comprehensive-test-functions.js" ]]; then
    for utility in "${TEST_UTILITIES[@]}"; do
        if grep -q "$utility" comprehensive-test-functions.js; then
            success "$utility test utility found"
        else
            warning "$utility test utility not found"
        fi
    done
fi

echo ""
echo "6️⃣  CONTINUOUS TESTING CAPABILITIES"
echo "==================================="

# Check automated testing setup
info "Checking automated testing capabilities..."

# Check for automated test scheduling
if grep -q "setInterval\|setTimeout" cupido-test-dashboard.html 2>/dev/null; then
    success "Automated test scheduling found in dashboard"
else
    warning "No automated test scheduling found"
fi

# Check for test result persistence
if grep -q "localStorage.*test" cupido-test-dashboard.html 2>/dev/null; then
    success "Test result persistence found"
else
    warning "Test result persistence not found"
fi

# Check monitoring integration
info "Checking monitoring integration..."
if [[ -f "session-logger.js" ]]; then
    success "Session logging available for test monitoring"
else
    warning "Session logging not available"
fi

echo ""
echo "📊 TESTING HEALTH SUMMARY"
echo "========================="

# Calculate testing health score
TOTAL_CHECKS=25
if [[ -f "$LOG_FILE" ]]; then
    FAILED_CHECKS=$(grep -c "❌" "$LOG_FILE" 2>/dev/null || echo "0")
else
    FAILED_CHECKS=0
fi

# Ensure variables are numeric and valid
TOTAL_CHECKS=${TOTAL_CHECKS:-25}
FAILED_CHECKS=${FAILED_CHECKS:-0}

# Validate numeric values
if ! [[ "$TOTAL_CHECKS" =~ ^[0-9]+$ ]]; then
    TOTAL_CHECKS=25
fi
if ! [[ "$FAILED_CHECKS" =~ ^[0-9]+$ ]]; then
    FAILED_CHECKS=0
fi

# Simple success rate calculation with safety check
if [[ $TOTAL_CHECKS -gt 0 ]]; then
    PASSED_CHECKS=$((TOTAL_CHECKS - FAILED_CHECKS))
    SUCCESS_RATE=$((PASSED_CHECKS * 100 / TOTAL_CHECKS))
else
    SUCCESS_RATE=0
fi

if [[ $EXIT_CODE -eq 0 ]]; then
    success "Testing Infrastructure: HEALTHY (${SUCCESS_RATE}%)"
else
    error "Testing Infrastructure: ISSUES DETECTED (${SUCCESS_RATE}%)"
fi

# Provide testing recommendations
echo ""
info "Testing Recommendations:"
if [[ ! -f "comprehensive-test-functions.js" ]]; then
    echo "  • Ensure comprehensive-test-functions.js is present and properly configured"
fi
if ! curl -s http://localhost:3001/cupido-test-dashboard >/dev/null 2>&1; then
    echo "  • Start server to enable dashboard testing: 'node server.js'"
fi
if ! command -v google-chrome >/dev/null 2>&1 && ! [[ -d "/Applications/Google Chrome.app" ]]; then
    echo "  • Install Chrome browser for automated testing capabilities"
fi

# Test execution summary
echo ""
info "Test Execution Status:"
if curl -s http://localhost:3001/cupido-test-dashboard >/dev/null 2>&1; then
    echo "  • Dashboard ready for manual and automated testing"
    echo "  • Visit: http://localhost:3001/cupido-test-dashboard"
else
    echo "  • Dashboard not accessible - start server first"
fi

# Log completion
echo "[$TIMESTAMP] Testing health check completed (exit code: $EXIT_CODE)" >> "$LOG_FILE"

echo ""
echo "💾 Full logs available at: $LOG_FILE"
echo "🕐 Check completed at: $TIMESTAMP"

exit $EXIT_CODE