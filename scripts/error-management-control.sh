#!/bin/bash

# LAYER 4: ERROR MANAGEMENT CONTROL SYSTEM
# ========================================
# Co-founder level operational controls for the error management system
# Provides monitoring, control, and maintenance of the error logging infrastructure

echo "🚨 CUPIDO ERROR MANAGEMENT CONTROL CENTER"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
ERROR_LOG_FILE="logs/errors.json"
MONITORING_LOG="logs/monitoring.log"
ERROR_LOGGER_PID_FILE="logs/error-logger.pid"

# Helper functions
info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
success() { echo -e "${GREEN}✅ $1${NC}"; }
warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
error() { echo -e "${RED}❌ $1${NC}"; }
highlight() { echo -e "${CYAN}🎯 $1${NC}"; }

# Function to check error logger status
check_error_logger_status() {
    if [ -f "$ERROR_LOGGER_PID_FILE" ]; then
        local pid=$(cat "$ERROR_LOGGER_PID_FILE")
        if ps -p "$pid" > /dev/null 2>&1; then
            success "Error logger is running (PID: $pid)"
            return 0
        else
            warning "Error logger PID file exists but process is dead"
            rm -f "$ERROR_LOGGER_PID_FILE"
            return 1
        fi
    else
        warning "Error logger is not running"
        return 1
    fi
}

# Function to start error logger
start_error_logger() {
    info "Starting error logger service..."
    
    # Ensure logs directory exists
    mkdir -p logs
    
    # Start the error logger in background
    nohup node -e "
        const errorLogger = require('./error-logger');
        
        // Start watching for errors
        errorLogger.startWatching();
        
        // Log the PID for management
        require('fs').writeFileSync('logs/error-logger.pid', process.pid.toString());
        
        console.log('Error logger started with PID:', process.pid);
        
        // Keep the process alive
        process.on('SIGTERM', () => {
            console.log('Error logger shutting down...');
            require('fs').unlinkSync('logs/error-logger.pid');
            process.exit(0);
        });
        
        // Prevent the script from exiting
        setInterval(() => {}, 1000);
    " > logs/error-logger.log 2>&1 &
    
    local error_logger_pid=$!
    echo "$error_logger_pid" > "$ERROR_LOGGER_PID_FILE"
    
    sleep 2
    
    if check_error_logger_status; then
        success "Error logger started successfully"
    else
        error "Failed to start error logger"
        return 1
    fi
}

# Function to stop error logger
stop_error_logger() {
    info "Stopping error logger service..."
    
    if [ -f "$ERROR_LOGGER_PID_FILE" ]; then
        local pid=$(cat "$ERROR_LOGGER_PID_FILE")
        if ps -p "$pid" > /dev/null 2>&1; then
            kill -TERM "$pid"
            sleep 2
            
            if ps -p "$pid" > /dev/null 2>&1; then
                warning "Graceful shutdown failed, forcing kill..."
                kill -9 "$pid"
            fi
            
            rm -f "$ERROR_LOGGER_PID_FILE"
            success "Error logger stopped"
        else
            warning "Error logger process not found"
            rm -f "$ERROR_LOGGER_PID_FILE"
        fi
    else
        warning "Error logger was not running"
    fi
}

# Function to restart error logger
restart_error_logger() {
    info "Restarting error logger service..."
    stop_error_logger
    sleep 1
    start_error_logger
}

# Function to show error statistics
show_error_stats() {
    highlight "ERROR STATISTICS DASHBOARD"
    echo "──────────────────────────────"
    
    if [ -f "$ERROR_LOG_FILE" ]; then
        local total_errors=$(jq length "$ERROR_LOG_FILE" 2>/dev/null || echo "0")
        local last_24h=$(jq '[.[] | select((.timestamp | strptime("%Y-%m-%dT%H:%M:%S.%fZ") | mktime) > (now - 86400))] | length' "$ERROR_LOG_FILE" 2>/dev/null || echo "0")
        local auto_fixed=$(jq '[.[] | select(.autoFixAttempted == true)] | length' "$ERROR_LOG_FILE" 2>/dev/null || echo "0")
        
        echo "📊 Total Errors Logged: $total_errors"
        echo "🕐 Last 24 Hours: $last_24h"
        echo "🔧 Auto-Fix Attempts: $auto_fixed"
        
        if [ "$total_errors" -gt 0 ]; then
            echo ""
            echo "🔥 Recent Error Types:"
            jq -r '.[:5] | .[] | "   • \(.type // "unknown"): \(.message[0:60])..."' "$ERROR_LOG_FILE" 2>/dev/null || echo "   No recent errors"
        fi
    else
        warning "No error log file found"
    fi
    
    echo ""
    
    # Show API endpoint status
    highlight "REAL-TIME ERROR MONITORING"
    echo "─────────────────────────────"
    
    if curl -s http://localhost:3001/api/error-stats > /dev/null 2>&1; then
        local api_stats=$(curl -s http://localhost:3001/api/error-stats)
        local api_total=$(echo "$api_stats" | jq -r '.total // 0')
        local api_24h=$(echo "$api_stats" | jq -r '.last24h // 0')
        
        echo "🌐 API Endpoint: ✅ Active"
        echo "📈 Live Total: $api_total"
        echo "📅 Live 24h: $api_24h"
    else
        error "API endpoint not responding"
    fi
}

# Function to clean old logs
clean_logs() {
    info "Cleaning old error logs..."
    
    if [ -f "$ERROR_LOG_FILE" ]; then
        # Keep only last 1000 errors
        local temp_file=$(mktemp)
        jq '.[:1000]' "$ERROR_LOG_FILE" > "$temp_file" && mv "$temp_file" "$ERROR_LOG_FILE"
        success "Cleaned error log (kept last 1000 entries)"
    fi
    
    # Clean monitoring logs older than 7 days
    if [ -f "$MONITORING_LOG" ]; then
        find logs/ -name "*.log" -mtime +7 -delete 2>/dev/null
        success "Cleaned old monitoring logs"
    fi
}

# Function to run diagnostics
run_diagnostics() {
    highlight "ERROR MANAGEMENT DIAGNOSTICS"
    echo "────────────────────────────────"
    
    # Check error logger status
    echo "1. Error Logger Service:"
    check_error_logger_status
    
    # Check log files
    echo ""
    echo "2. Log Files:"
    if [ -f "$ERROR_LOG_FILE" ]; then
        local file_size=$(du -h "$ERROR_LOG_FILE" | cut -f1)
        success "Error log exists ($file_size)"
    else
        warning "Error log file missing"
    fi
    
    if [ -d "logs" ]; then
        local log_count=$(ls logs/ | wc -l)
        success "Logs directory exists ($log_count files)"
    else
        error "Logs directory missing"
    fi
    
    # Check API integration
    echo ""
    echo "3. API Integration:"
    if curl -s http://localhost:3001/api/error-stats > /dev/null 2>&1; then
        success "Error stats API responding"
    else
        error "Error stats API not responding"
    fi
    
    # Check error logger module
    echo ""
    echo "4. Error Logger Module:"
    if [ -f "error-logger.js" ]; then
        success "Error logger module exists"
        
        # Test module loading
        if node -e "require('./error-logger')" 2>/dev/null; then
            success "Error logger module loads correctly"
        else
            error "Error logger module has syntax errors"
        fi
    else
        error "Error logger module missing"
    fi
}

# Main command handler
case "$1" in
    "start")
        start_error_logger
        ;;
    "stop")
        stop_error_logger
        ;;
    "restart")
        restart_error_logger
        ;;
    "status")
        check_error_logger_status
        show_error_stats
        ;;
    "stats")
        show_error_stats
        ;;
    "clean")
        clean_logs
        ;;
    "diagnostics")
        run_diagnostics
        ;;
    "dashboard")
        highlight "Opening Error Management Dashboard..."
        open "http://localhost:3001/cupido-test-dashboard"
        echo "Navigate to the 'Error Monitor' tab"
        ;;
    *)
        echo "🚨 CUPIDO ERROR MANAGEMENT CONTROL"
        echo "=================================="
        echo ""
        echo "Usage: $0 <command>"
        echo ""
        echo "Commands:"
        echo "  start       - Start the error logger service"
        echo "  stop        - Stop the error logger service"
        echo "  restart     - Restart the error logger service"
        echo "  status      - Show service status and error statistics"
        echo "  stats       - Show detailed error statistics"
        echo "  clean       - Clean old log files"
        echo "  diagnostics - Run comprehensive diagnostics"
        echo "  dashboard   - Open error monitoring dashboard"
        echo ""
        echo "Examples:"
        echo "  $0 start       # Start error monitoring"
        echo "  $0 status      # Check current status"
        echo "  $0 dashboard   # Open web dashboard"
        echo ""
        echo "Co-founder tip: Run 'status' regularly to monitor system health"
        ;;
esac