#!/bin/bash

# CONTINUOUS MONITORING SYSTEM
# ============================
# Co-founder level monitoring that runs 24/7 to catch issues before users do
# This ensures we maintain high quality and catch regressions immediately

echo "🔄 CUPIDO CONTINUOUS MONITORING"
echo "==============================="
echo "Co-founder protection: Always watching for issues"
echo ""

# Configuration
CHECK_INTERVAL=300  # 5 minutes
ALERT_THRESHOLD=3   # Number of failures before escalating
LOG_FILE="logs/monitoring.log"

# Script execution context detection
SCRIPT_TAB_MODE=${CUPIDO_SCRIPT_TAB_MODE:-false}
MAX_ITERATIONS=${CUPIDO_MAX_ITERATIONS:-2}

# Adjust timing for Scripts tab mode
if [ "$SCRIPT_TAB_MODE" = "true" ]; then
    CHECK_INTERVAL=5  # 5 seconds for quick Scripts tab execution
fi

# Ensure logs directory exists
mkdir -p logs

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Global counters
CONSECUTIVE_FAILURES=0
TOTAL_CHECKS=0
TOTAL_FAILURES=0
CURRENT_ITERATION=0

log_with_timestamp() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

alert() {
    echo -e "${RED}🚨 ALERT: $1${NC}"
    log_with_timestamp "ALERT: $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
    log_with_timestamp "SUCCESS: $1"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    log_with_timestamp "WARNING: $1"
}

info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
    log_with_timestamp "INFO: $1"
}

# Health check function - uses the comprehensive health-check.sh
perform_health_check() {
    # Run the comprehensive health check script
    if ./health-check.sh > /dev/null 2>&1; then
        return 0  # Success
    else
        # If health check fails, run individual checks for detailed alerts
        local check_passed=true
        
        # Quick service availability checks
        if ! curl -s http://localhost:3001 > /dev/null 2>&1; then
            alert "Node.js server (localhost:3001) is DOWN"
            check_passed=false
        fi
        
        if ! curl -s http://localhost:8081 > /dev/null 2>&1; then
            alert "Expo server (localhost:8081) is DOWN"
            check_passed=false
        fi
        
        # Dashboard functionality
        if ! curl -s http://localhost:3001/cupido-test-dashboard | grep -q "Cupido Test Dashboard" 2>/dev/null; then
            alert "Test dashboard is NOT responding correctly"
            check_passed=false
        fi
        
        # API endpoints
        if ! curl -s http://localhost:3001/api/error-stats | grep -q "total" 2>/dev/null; then
            alert "Error stats API is NOT working"
            check_passed=false
        fi
        
        return 1  # Failure
    fi
}

# Function to handle failures
handle_failure() {
    ((CONSECUTIVE_FAILURES++))
    ((TOTAL_FAILURES++))
    
    if [ $CONSECUTIVE_FAILURES -ge $ALERT_THRESHOLD ]; then
        alert "CRITICAL: $CONSECUTIVE_FAILURES consecutive failures detected!"
        alert "System may be unstable - immediate attention required"
        
        # Log system state for debugging
        info "Logging system state for debugging..."
        echo "=== SYSTEM STATE DEBUG ===" >> "$LOG_FILE"
        echo "Date: $(date)" >> "$LOG_FILE"
        echo "Process List:" >> "$LOG_FILE"
        ps aux | grep -E "(node|expo)" >> "$LOG_FILE" 2>/dev/null
        echo "Port Usage:" >> "$LOG_FILE"
        lsof -i :3001 >> "$LOG_FILE" 2>/dev/null
        lsof -i :8081 >> "$LOG_FILE" 2>/dev/null
        echo "=== END DEBUG ===" >> "$LOG_FILE"
        
        # Attempt automatic recovery
        info "Attempting automatic recovery..."
        # Note: In production, this could restart services
        warning "Manual intervention may be required"
    fi
}

# Function to handle success
handle_success() {
    if [ $CONSECUTIVE_FAILURES -gt 0 ]; then
        success "System recovered after $CONSECUTIVE_FAILURES failures"
    fi
    CONSECUTIVE_FAILURES=0
}

# Main monitoring loop
main_monitoring_loop() {
    if [ "$SCRIPT_TAB_MODE" = "true" ]; then
        info "Starting Scripts tab monitoring (limited to $MAX_ITERATIONS iterations)"
    else
        info "Starting continuous monitoring (checking every ${CHECK_INTERVAL}s)"
    fi
    info "Alert threshold: $ALERT_THRESHOLD consecutive failures"
    info "Log file: $LOG_FILE"
    
    while true; do
        ((TOTAL_CHECKS++))
        ((CURRENT_ITERATION++))
        
        echo ""
        if [ "$SCRIPT_TAB_MODE" = "true" ]; then
            info "Check #$TOTAL_CHECKS (iteration $CURRENT_ITERATION/$MAX_ITERATIONS) - $(date '+%H:%M:%S')"
        else
            info "Check #$TOTAL_CHECKS - $(date '+%H:%M:%S')"
        fi
        
        if perform_health_check; then
            success "All systems operational"
            handle_success
        else
            warning "Health check failed"
            handle_failure
        fi
        
        # Display summary stats
        UPTIME_PERCENTAGE=$(echo "scale=2; ($TOTAL_CHECKS - $TOTAL_FAILURES) * 100 / $TOTAL_CHECKS" | bc -l 2>/dev/null || echo "100")
        info "Stats: Uptime ${UPTIME_PERCENTAGE}% | Total checks: $TOTAL_CHECKS | Failures: $TOTAL_FAILURES"
        
        # Exit condition for Scripts tab mode
        if [ "$SCRIPT_TAB_MODE" = "true" ] && [ "$CURRENT_ITERATION" -ge "$MAX_ITERATIONS" ]; then
            info "Scripts tab monitoring completed ($MAX_ITERATIONS iterations)"
            break
        fi
        
        # Wait for next check (skip sleep on last iteration in Scripts tab mode)
        if [ "$SCRIPT_TAB_MODE" = "true" ] && [ "$CURRENT_ITERATION" -ge "$MAX_ITERATIONS" ]; then
            break
        else
            sleep $CHECK_INTERVAL
        fi
    done
}

# Signal handlers for graceful shutdown
cleanup() {
    echo ""
    info "Monitoring stopped by user"
    info "Final stats: Total checks: $TOTAL_CHECKS | Total failures: $TOTAL_FAILURES"
    log_with_timestamp "Monitoring session ended"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start monitoring
log_with_timestamp "Continuous monitoring started"
main_monitoring_loop