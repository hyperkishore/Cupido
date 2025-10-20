#!/bin/bash

# CUPIDO CONTEXT INITIALIZATION WRAPPER
# =====================================
# Simple wrapper script to load Cupido context for Claude Code sessions

echo "🚀 Initializing Cupido Context..."
node "$(dirname "$0")/init-context.js"

echo ""
echo "💡 USAGE INSTRUCTIONS:"
echo "   • At the start of each Claude Code session, run: ./init.sh"
echo "   • This ensures Claude has full context of all revolutionary features"
echo "   • All project history and system status will be loaded"
echo ""
echo "📋 CONTEXT FILES:"
echo "   • CLAUDE.md - Comprehensive project documentation"
echo "   • init-context.js - System status and health checker"
echo "   • init.sh - This wrapper script"
echo ""
echo "🎯 READY FOR CO-FOUNDER LEVEL DEVELOPMENT!"