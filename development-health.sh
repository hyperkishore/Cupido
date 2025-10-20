#!/bin/bash

# CUPIDO DEVELOPMENT HEALTH MONITOR
# =================================
# Consolidated development environment validation combining:
# - dev-server.sh (development server management)
# - debug-browser-reality.sh (browser state debugging)
# - validate-js-syntax.sh (JavaScript validation)
# - debug-dashboard.sh (dashboard debugging)
#
# This script validates development environment health and provides
# debugging capabilities for the Health Check dashboard tab

echo "🔧 CUPIDO DEVELOPMENT HEALTH MONITOR"
echo "===================================="
echo "Development environment validation"
echo ""

# Configuration
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
LOG_FILE="logs/development-health.log"
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
echo "[$TIMESTAMP] Development health check started" >> "$LOG_FILE"

echo "1️⃣  DEVELOPMENT TOOLS"
echo "===================="

# Check React Native / Expo CLI
info "Checking Expo CLI..."
if command -v npx >/dev/null 2>&1; then
    if npx expo --version >/dev/null 2>&1; then
        EXPO_VERSION=$(npx expo --version 2>/dev/null || echo "unknown")
        success "Expo CLI available (version $EXPO_VERSION)"
    else
        warning "Expo CLI not available via npx"
    fi
else
    error "npx not available"
fi

# Check development dependencies
info "Checking development dependencies..."
if [[ -f "package.json" ]]; then
    # Check if node_modules exists
    if [[ -d "node_modules" ]]; then
        success "node_modules directory exists"
        
        # Check key development packages
        DEV_PACKAGES=("expo" "react" "react-native" "typescript")
        for package in "${DEV_PACKAGES[@]}"; do
            if [[ -d "node_modules/$package" ]]; then
                success "$package installed"
            else
                warning "$package not found in node_modules"
            fi
        done
    else
        error "node_modules directory missing (run npm install)"
    fi
else
    error "package.json not found"
fi

echo ""
echo "2️⃣  JAVASCRIPT SYNTAX VALIDATION"
echo "================================"

# Validate critical JavaScript files
info "Validating JavaScript syntax..."
JS_FILES=(
    "App.tsx"
    "server.js"
    "comprehensive-test-functions.js"
    "auto-init.js"
    "session-logger.js"
)

for file in "${JS_FILES[@]}"; do
    if [[ -f "$file" ]]; then
        # Use Node.js to check syntax (skip .tsx files)
        if [[ "$file" == *.tsx ]]; then
            # For TypeScript files, just check if file exists and has content
            if [[ -s "$file" ]]; then
                success "$file exists and has content"
            else
                error "$file is empty or has issues"
            fi
        else
            if node -c "$file" 2>/dev/null; then
                success "$file syntax valid"
            else
                error "$file syntax errors detected"
            fi
        fi
    else
        warning "$file not found for validation"
    fi
done

# Validate HTML files
info "Validating HTML files..."
HTML_FILES=(
    "cupido-test-dashboard.html"
    "public/index.html"
)

for file in "${HTML_FILES[@]}"; do
    if [[ -f "$file" ]]; then
        # Basic HTML validation (check for basic structure)
        if grep -q "<!DOCTYPE" "$file" && grep -q "<html" "$file" && grep -q "</html>" "$file"; then
            success "$file HTML structure valid"
        else
            warning "$file may have HTML structure issues"
        fi
    else
        warning "$file not found for validation"
    fi
done

echo ""
echo "3️⃣  DEVELOPMENT SERVERS"
echo "======================="

# Check server processes
info "Checking development servers..."

# Check if servers are running
if lsof -i:3001 >/dev/null 2>&1; then
    PID_3001=$(lsof -ti:3001)
    success "Server running on port 3001 (PID: $PID_3001)"
    
    # Test server responsiveness
    if curl -s --max-time 5 http://localhost:3001/health >/dev/null 2>&1; then
        success "Server responding normally"
    else
        warning "Server not responding to health checks"
    fi
else
    warning "No server running on port 3001"
fi

if lsof -i:8081 >/dev/null 2>&1; then
    PID_8081=$(lsof -ti:8081)
    success "Expo server running on port 8081 (PID: $PID_8081)"
else
    warning "No Expo server running on port 8081"
fi

# Check for common development issues
info "Checking for development issues..."

# Check for Metro cache issues
if [[ -d ".expo" ]]; then
    CACHE_SIZE=$(du -sh .expo 2>/dev/null | cut -f1)
    success "Expo cache directory exists ($CACHE_SIZE)"
else
    info "No Expo cache directory (clean state)"
fi

# Check for TypeScript compilation
if [[ -f "tsconfig.json" ]]; then
    if command -v npx >/dev/null 2>&1; then
        if npx tsc --noEmit --skipLibCheck 2>/dev/null; then
            success "TypeScript compilation successful"
        else
            warning "TypeScript compilation has issues"
        fi
    fi
else
    info "No TypeScript configuration found"
fi

echo ""
echo "4️⃣  BROWSER & DEBUGGING"
echo "======================="

# Check browser debugging capabilities
info "Checking browser debugging setup..."

# Check if Chrome/debugging tools are available
if command -v google-chrome >/dev/null 2>&1 || command -v chrome >/dev/null 2>&1 || [[ -d "/Applications/Google Chrome.app" ]]; then
    success "Chrome browser available for debugging"
else
    warning "Chrome browser not found (may limit debugging capabilities)"
fi

# Check dashboard accessibility for debugging
info "Testing dashboard debugging features..."
if curl -s http://localhost:3001/cupido-test-dashboard >/dev/null 2>&1; then
    success "Test dashboard accessible for debugging"
    
    # Check if dashboard has console access
    DASHBOARD_CONTENT=$(curl -s http://localhost:3001/cupido-test-dashboard 2>/dev/null || echo "")
    if echo "$DASHBOARD_CONTENT" | grep -q "console\.log\|console\.error"; then
        success "Dashboard has console logging capabilities"
    else
        warning "Dashboard console logging may be limited"
    fi
else
    error "Test dashboard not accessible for debugging"
fi

echo ""
echo "5️⃣  PERFORMANCE & RESOURCES"
echo "============================"

# Check file sizes for performance
info "Checking file sizes..."
LARGE_FILES=$(find . -name "*.js" -o -name "*.html" -o -name "*.tsx" -o -name "*.ts" | xargs ls -la 2>/dev/null | awk '$5 > 100000 {print $9 " (" $5 " bytes)"}' | head -5)

if [[ -n "$LARGE_FILES" ]]; then
    warning "Large files detected (may impact performance):"
    echo "$LARGE_FILES" | while read -r line; do
        warning "  $line"
    done
else
    success "No oversized development files detected"
fi

# Check for common performance issues
info "Checking for performance issues..."

# Check for excessive console logging
CONSOLE_COUNT=$(grep -r "console\." --include="*.js" --include="*.tsx" --include="*.ts" . 2>/dev/null | wc -l)
if [[ $CONSOLE_COUNT -lt 50 ]]; then
    success "Console logging count reasonable ($CONSOLE_COUNT)"
else
    warning "High console logging count ($CONSOLE_COUNT) - may impact performance"
fi

echo ""
echo "6️⃣  BUILD & DEPLOYMENT READINESS"
echo "================================="

# Check build readiness
info "Checking build readiness..."

# Check if build scripts exist
if [[ -f "package.json" ]]; then
    if grep -q "\"build\":" package.json; then
        success "Build script configured in package.json"
    else
        warning "No build script found in package.json"
    fi
    
    if grep -q "\"start\":" package.json; then
        success "Start script configured in package.json"
    else
        warning "No start script found in package.json"
    fi
fi

# Check for environment-specific configs
if [[ -f ".env.development" ]]; then
    success "Development environment config exists"
else
    info "No development-specific environment config"
fi

if [[ -f ".env.production" ]]; then
    success "Production environment config exists"
else
    info "No production-specific environment config"
fi

echo ""
echo "📊 DEVELOPMENT HEALTH SUMMARY"
echo "============================="

# Calculate development health score
TOTAL_CHECKS=15
if [[ -f "$LOG_FILE" ]]; then
    FAILED_CHECKS=$(grep -c "❌" "$LOG_FILE" 2>/dev/null || echo "0")
else
    FAILED_CHECKS=0
fi

# Ensure variables are numeric
TOTAL_CHECKS=${TOTAL_CHECKS:-15}
FAILED_CHECKS=${FAILED_CHECKS:-0}

# Simple success rate calculation
if [[ $TOTAL_CHECKS -gt 0 ]]; then
    SUCCESS_RATE=$(( (TOTAL_CHECKS - FAILED_CHECKS) * 100 / TOTAL_CHECKS ))
else
    SUCCESS_RATE=0
fi

if [[ $EXIT_CODE -eq 0 ]]; then
    success "Development Environment: HEALTHY (${SUCCESS_RATE}%)"
else
    error "Development Environment: ISSUES DETECTED (${SUCCESS_RATE}%)"
fi

# Provide development recommendations
echo ""
info "Development Recommendations:"
if [[ ! -d "node_modules" ]]; then
    echo "  • Run 'npm install' to install dependencies"
fi
if ! lsof -i:3001 >/dev/null 2>&1; then
    echo "  • Start server with 'node server.js'"
fi
if ! lsof -i:8081 >/dev/null 2>&1; then
    echo "  • Start Expo with 'npx expo start --web'"
fi

# Log completion
echo "[$TIMESTAMP] Development health check completed (exit code: $EXIT_CODE)" >> "$LOG_FILE"

echo ""
echo "💾 Full logs available at: $LOG_FILE"
echo "🕐 Check completed at: $TIMESTAMP"

exit $EXIT_CODE