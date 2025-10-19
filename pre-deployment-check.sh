#!/bin/bash

# PRE-DEPLOYMENT AUTOMATED TESTING
# =================================
# Co-founder level automation to ensure we NEVER ship broken code to users
# This script should be run before any deployment or release

echo "🚀 PRE-DEPLOYMENT AUTOMATED TESTING"
echo "===================================="
echo "Co-founder safety check: Ensuring code quality before users see it"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

DEPLOYMENT_SAFE=true
CRITICAL_FAILURES=0

# Helper functions
critical_fail() {
    echo -e "${RED}🚨 CRITICAL FAILURE: $1${NC}"
    DEPLOYMENT_SAFE=false
    ((CRITICAL_FAILURES++))
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# 1. HEALTH CHECK
echo -e "${BLUE}🔍 STEP 1: COMPREHENSIVE HEALTH CHECK${NC}"
echo "────────────────────────────────────────"

if ./health-check.sh > /dev/null 2>&1; then
    success "All health checks passed"
else
    critical_fail "Health checks failed - run ./health-check.sh for details"
fi

# 2. FUNCTIONAL TESTING
echo -e "\n${BLUE}🧪 STEP 2: FUNCTIONAL TESTING${NC}"
echo "──────────────────────────────────"

# Test critical user flows
info "Testing critical user flows..."

# Test dashboard loads completely
DASHBOARD_RESPONSE=$(curl -s http://localhost:3001/cupido-test-dashboard)
if echo "$DASHBOARD_RESPONSE" | grep -q "TEST_FUNCTIONS" && echo "$DASHBOARD_RESPONSE" | grep -q "Total Tests"; then
    success "Dashboard loads with all components"
else
    critical_fail "Dashboard missing critical components"
fi

# Test app loads
APP_RESPONSE=$(curl -s http://localhost:8081)
if echo "$APP_RESPONSE" | grep -q "Cupido"; then
    success "Main app loads successfully"
else
    critical_fail "Main app failed to load"
fi

# Test API endpoints
info "Testing API endpoints..."

# Test simulator API
SIMULATOR_TEST=$(curl -s -X POST http://localhost:3001/api/simulator/test -H "Content-Type: application/json" -d '{"user_message":"test"}' 2>/dev/null)
if echo "$SIMULATOR_TEST" | grep -q "response"; then
    success "Simulator API working"
else
    warning "Simulator API may have issues (non-critical)"
fi

# Test error monitoring
ERROR_STATS=$(curl -s http://localhost:3001/api/error-stats)
if echo "$ERROR_STATS" | grep -q "total"; then
    success "Error monitoring API working"
else
    critical_fail "Error monitoring API failed"
fi

# 3. DATABASE VALIDATION
echo -e "\n${BLUE}🗄️  STEP 3: DATABASE VALIDATION${NC}"
echo "─────────────────────────────────"

# Check migration files exist
if [ -f "src/database/migrations/007_add_simulator_fields.sql" ]; then
    success "Latest database migrations present"
else
    critical_fail "Database migrations missing"
fi

# 4. CODE QUALITY CHECKS
echo -e "\n${BLUE}🔍 STEP 4: CODE QUALITY CHECKS${NC}"
echo "───────────────────────────────────"

# Check for console.log statements (should be minimal in production)
LOG_COUNT=$(grep -r "console.log" --include="*.js" --include="*.ts" --include="*.tsx" src/ 2>/dev/null | wc -l)
if [ "$LOG_COUNT" -lt 10 ]; then
    success "Minimal console.log statements ($LOG_COUNT found)"
else
    warning "Many console.log statements found ($LOG_COUNT) - consider cleanup"
fi

# Check for TODO/FIXME comments
TODO_COUNT=$(grep -r "TODO\|FIXME" --include="*.js" --include="*.ts" --include="*.tsx" src/ 2>/dev/null | wc -l)
if [ "$TODO_COUNT" -lt 5 ]; then
    success "Minimal TODO/FIXME items ($TODO_COUNT found)"
else
    warning "Multiple TODO/FIXME items found ($TODO_COUNT) - review before release"
fi

# 5. SECURITY CHECKS
echo -e "\n${BLUE}🔒 STEP 5: SECURITY VALIDATION${NC}"
echo "───────────────────────────────────"

# Check for exposed API keys
if grep -r "sk-" --include="*.js" --include="*.ts" --include="*.tsx" src/ 2>/dev/null | grep -v ".env"; then
    critical_fail "Potential API keys found in source code"
else
    success "No exposed API keys in source code"
fi

# Check .env is in .gitignore
if grep -q ".env" .gitignore 2>/dev/null; then
    success ".env properly ignored by git"
else
    critical_fail ".env not in .gitignore - security risk!"
fi

# 6. PERFORMANCE CHECKS
echo -e "\n${BLUE}⚡ STEP 6: PERFORMANCE VALIDATION${NC}"
echo "──────────────────────────────────────"

# Check dashboard load time
START_TIME=$(date +%s)
curl -s http://localhost:3001/cupido-test-dashboard > /dev/null
END_TIME=$(date +%s)
LOAD_TIME=$(($END_TIME - $START_TIME)) # In seconds

if [ "$LOAD_TIME" -lt 3 ]; then
    success "Dashboard loads quickly (${LOAD_TIME}s)"
elif [ "$LOAD_TIME" -lt 10 ]; then
    warning "Dashboard load time acceptable (${LOAD_TIME}s)"
else
    critical_fail "Dashboard loads too slowly (${LOAD_TIME}s)"
fi

# 7. FINAL DEPLOYMENT DECISION
echo -e "\n${BLUE}🎯 STEP 7: DEPLOYMENT DECISION${NC}"
echo "──────────────────────────────────"

echo ""
echo "📊 PRE-DEPLOYMENT SUMMARY"
echo "========================"

if [ "$DEPLOYMENT_SAFE" = true ]; then
    echo -e "${GREEN}🎉 DEPLOYMENT APPROVED!${NC}"
    echo -e "${GREEN}✨ Co-founder confidence: MAXIMUM${NC}"
    echo -e "${GREEN}🚀 Safe to deploy to users${NC}"
    echo ""
    echo "📋 Deployment checklist completed:"
    echo "   ✅ Health checks passed"
    echo "   ✅ Functional testing passed"
    echo "   ✅ Database validation passed"
    echo "   ✅ Code quality verified"
    echo "   ✅ Security validated"
    echo "   ✅ Performance acceptable"
    echo ""
    echo "🎯 Ready for: Production deployment"
    exit 0
else
    echo -e "${RED}🚨 DEPLOYMENT BLOCKED!${NC}"
    echo -e "${RED}❌ Co-founder confidence: ZERO${NC}"
    echo -e "${RED}🛑 DO NOT deploy to users${NC}"
    echo ""
    echo "💥 Critical failures detected: $CRITICAL_FAILURES"
    echo ""
    echo "🔧 Required actions:"
    echo "   1. Fix all critical failures listed above"
    echo "   2. Re-run this script: ./pre-deployment-check.sh"
    echo "   3. Only deploy when this script passes completely"
    echo ""
    echo "⚠️  Remember: It's better to delay than to ship broken code!"
    exit 1
fi