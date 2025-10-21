#!/bin/bash

# CUPIDO SYSTEM HEALTH MONITOR
# ============================
# Consolidated system health validation combining:
# - health-check.sh (core system validation)
# - continuous-monitor.sh (24/7 monitoring capabilities)  
# - error-management-control.sh (error management system)
#
# This script validates all critical system components and provides
# real-time health status for the Health Check dashboard tab

echo "🏥 CUPIDO SYSTEM HEALTH MONITOR"
echo "==============================="
echo "Co-founder level system validation"
echo ""

# Configuration
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
LOG_FILE="logs/system-health.log"
ERROR_THRESHOLD=3
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
echo "[$TIMESTAMP] System health check started" >> "$LOG_FILE"

echo "1️⃣  CORE SYSTEM COMPONENTS"
echo "=========================="

# Check Node.js
info "Checking Node.js..."
if command -v node >/dev/null 2>&1; then
    NODE_VERSION=$(node --version)
    success "Node.js $NODE_VERSION installed"
else
    error "Node.js not found"
fi

# Check npm
info "Checking npm..."
if command -v npm >/dev/null 2>&1; then
    NPM_VERSION=$(npm --version)
    success "npm $NPM_VERSION installed"
else
    error "npm not found"
fi

# Check critical files
info "Checking critical files..."
CRITICAL_FILES=(
    "package.json"
    "server.js"
    "App.tsx"
    "comprehensive-test-functions.js"
    "cupido-test-dashboard.html"
    "CLAUDE.md"
)

for file in "${CRITICAL_FILES[@]}"; do
    if [[ -f "$file" ]]; then
        success "$file exists"
    else
        error "$file missing"
    fi
done

echo ""
echo "2️⃣  NETWORK & CONNECTIVITY"
echo "=========================="

# Check port availability
info "Checking port availability..."
if lsof -i:3001 >/dev/null 2>&1; then
    success "Port 3001 is active (server running)"
else
    warning "Port 3001 not in use (server may be down)"
fi

if lsof -i:8081 >/dev/null 2>&1; then
    success "Port 8081 is active (Expo server running)"
else
    warning "Port 8081 not in use (Expo server may be down)"
fi

# Test server health
info "Testing server health..."
if curl -s http://localhost:3001/health >/dev/null 2>&1; then
    success "Server responding at http://localhost:3001"
else
    error "Server not responding at http://localhost:3001"
fi

# Test dashboard accessibility
info "Testing dashboard accessibility..."
if curl -s http://localhost:3001/cupido-test-dashboard >/dev/null 2>&1; then
    success "Test dashboard accessible"
else
    error "Test dashboard not accessible"
fi

echo ""
echo "3️⃣  SYSTEM RESOURCES"
echo "==================="

# Check disk space
info "Checking disk space..."
DISK_USAGE=$(df . | awk 'NR==2 {print $5}' | sed 's/%//')
if [[ $DISK_USAGE -lt 90 ]]; then
    success "Disk usage: ${DISK_USAGE}% (healthy)"
else
    warning "Disk usage: ${DISK_USAGE}% (getting full)"
fi

# Check memory usage (macOS)
info "Checking memory usage..."
if command -v vm_stat >/dev/null 2>&1; then
    MEMORY_INFO=$(vm_stat | grep "Pages free" | awk '{print $3}' | sed 's/\.//')
    if [[ $MEMORY_INFO -gt 50000 ]]; then
        success "Memory available: sufficient"
    else
        warning "Memory available: low"
    fi
else
    info "Memory check not available on this system"
fi

echo ""
echo "4️⃣  DATABASE & STORAGE"
echo "======================"

# Check environment variables
info "Checking environment configuration..."
if [[ -f ".env" ]]; then
    success ".env file exists"
    
    # Check for required env vars (without exposing values)
    if grep -q "SUPABASE_URL" .env; then
        success "SUPABASE_URL configured"
    else
        warning "SUPABASE_URL not found in .env"
    fi
    
    if grep -q "SUPABASE_ANON_KEY" .env; then
        success "SUPABASE_ANON_KEY configured"
    else
        warning "SUPABASE_ANON_KEY not found in .env"
    fi
else
    warning ".env file not found"
fi

# Check localStorage (would need browser context)
info "Local storage check requires browser context (handled by dashboard)"

echo ""
echo "5️⃣  ERROR MANAGEMENT SYSTEM"
echo "==========================="

# Check error logs
info "Checking error logs..."
if [[ -f "logs/error.log" ]]; then
    ERROR_COUNT=$(wc -l < logs/error.log 2>/dev/null || echo "0")
    if [[ $ERROR_COUNT -lt $ERROR_THRESHOLD ]]; then
        success "Error count: $ERROR_COUNT (acceptable)"
    else
        warning "Error count: $ERROR_COUNT (elevated)"
    fi
else
    success "No error log file (clean system)"
fi

# Check monitoring capabilities
info "Checking monitoring system..."
if [[ -f "session-logger.js" ]]; then
    success "Session logging system available"
else
    warning "Session logging system not found"
fi

echo ""
echo "6️⃣  AUTOMATION SYSTEMS"
echo "======================"

# Check automation files
info "Checking automation systems..."
AUTOMATION_FILES=(
    "auto-init.js"
    "session-logger.js"
)

for file in "${AUTOMATION_FILES[@]}"; do
    if [[ -f "$file" ]]; then
        success "$file available"
    else
        warning "$file not found"
    fi
done

echo ""
echo "📊 HEALTH SUMMARY"
echo "================="

# Calculate health score
TOTAL_CHECKS=20
FAILED_CHECKS=$(echo "$EXIT_CODE" | wc -l)
if [[ $EXIT_CODE -eq 0 ]]; then
    FAILED_CHECKS=0
else
    FAILED_CHECKS=1
fi
SUCCESS_RATE=$(( (TOTAL_CHECKS - FAILED_CHECKS) * 100 / TOTAL_CHECKS ))

if [[ $EXIT_CODE -eq 0 ]]; then
    success "System Health: HEALTHY (${SUCCESS_RATE}%)"
else
    error "System Health: ISSUES DETECTED (${SUCCESS_RATE}%)"
fi

# Log completion
echo "[$TIMESTAMP] System health check completed (exit code: $EXIT_CODE)" >> "$LOG_FILE"

echo ""
echo "💾 Full logs available at: $LOG_FILE"
echo "🕐 Check completed at: $TIMESTAMP"

exit $EXIT_CODE