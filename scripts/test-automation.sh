#!/bin/bash

# CUPIDO AUTOMATION TEST SCRIPT
# ==============================
# Tests all automation components to ensure they're working correctly

echo "🧪 TESTING CUPIDO AUTOMATION SYSTEM"
echo "==================================="

# Test 1: Context Loading
echo ""
echo "1️⃣  Testing Context Loading..."
if ./init.sh > /dev/null 2>&1; then
    echo "   ✅ Context loading works"
else
    echo "   ❌ Context loading failed"
fi

# Test 2: Session Logging
echo ""
echo "2️⃣  Testing Session Logging..."
if node session-logger.js status > /dev/null 2>&1; then
    echo "   ✅ Session logging works"
else
    echo "   ❌ Session logging failed"
fi

# Test 3: Auto-Initialization
echo ""
echo "3️⃣  Testing Auto-Initialization..."
if node auto-init.js check > /dev/null 2>&1; then
    echo "   ✅ Auto-initialization works"
else
    echo "   ❌ Auto-initialization failed"
fi

# Test 4: File Integrity
echo ""
echo "4️⃣  Testing File Integrity..."
files_missing=0

required_files=(
    "CLAUDE.md"
    "init.sh"
    "init-context.js"
    "session-logger.js"
    "auto-init.js"
    "claude-hooks.json"
    "install-claude-hooks.sh"
    "OPTION-2-SETUP-GUIDE.md"
)

for file in "${required_files[@]}"; do
    if [[ -f "$file" ]]; then
        echo "   ✅ $file exists"
    else
        echo "   ❌ $file missing"
        files_missing=1
    fi
done

# Test 5: Revolutionary Systems
echo ""
echo "5️⃣  Testing Revolutionary Systems..."
revolutionary_files=(
    "prompt-analytics-engine.js"
    "prompt-template-engine.js"
    "cupido-analytics-dashboard.html"
    "automation-workflow-engine.js"
    "production-deployment-pipeline.js"
)

revolutionary_missing=0
for file in "${revolutionary_files[@]}"; do
    if [[ -f "$file" ]]; then
        echo "   ✅ $file exists"
    else
        echo "   ❌ $file missing"
        revolutionary_missing=1
    fi
done

# Test 6: Server Status
echo ""
echo "6️⃣  Testing Server Status..."
if lsof -i :3001 > /dev/null 2>&1; then
    echo "   ✅ Server running on port 3001"
else
    echo "   ⚠️  Server not running (use 'npm start')"
fi

# Test 7: Claude Code Hooks
echo ""
echo "7️⃣  Testing Claude Code Hooks Setup..."

# Check if hooks file exists in common locations
hook_locations=(
    "$HOME/Library/Application Support/Claude Code/hooks.json"
    "$HOME/.config/claude-code/hooks.json"
    "$APPDATA/Claude Code/hooks.json"
)

hooks_installed=0
for location in "${hook_locations[@]}"; do
    if [[ -f "$location" ]]; then
        if grep -q "cupido_session_start" "$location" 2>/dev/null; then
            echo "   ✅ Claude Code hooks installed at: $location"
            hooks_installed=1
            break
        fi
    fi
done

if [[ $hooks_installed -eq 0 ]]; then
    echo "   ⚠️  Claude Code hooks not installed yet"
    echo "      Run: ./install-claude-hooks.sh"
fi

# Calculate overall score
echo ""
echo "📊 OVERALL SYSTEM HEALTH"
echo "========================"

total_score=0
max_score=7

# Scoring
[[ $? -eq 0 ]] && ((total_score++))  # Context loading
node session-logger.js status > /dev/null 2>&1 && ((total_score++))  # Session logging
node auto-init.js check > /dev/null 2>&1 && ((total_score++))  # Auto-init
[[ $files_missing -eq 0 ]] && ((total_score++))  # File integrity
[[ $revolutionary_missing -eq 0 ]] && ((total_score++))  # Revolutionary systems
lsof -i :3001 > /dev/null 2>&1 && ((total_score++))  # Server status
[[ $hooks_installed -eq 1 ]] && ((total_score++))  # Hooks installed

percentage=$((total_score * 100 / max_score))

if [[ $percentage -eq 100 ]]; then
    echo "🟢 PERFECT SCORE: $total_score/$max_score ($percentage%)"
    echo "🎉 ALL SYSTEMS OPERATIONAL!"
    echo "🚀 Ready for seamless co-founder level development!"
elif [[ $percentage -ge 85 ]]; then
    echo "🟡 EXCELLENT: $total_score/$max_score ($percentage%)"
    echo "✅ System ready with minor setup remaining"
elif [[ $percentage -ge 70 ]]; then
    echo "🟠 GOOD: $total_score/$max_score ($percentage%)"
    echo "⚠️  Some components need attention"
else
    echo "🔴 NEEDS WORK: $total_score/$max_score ($percentage%)"
    echo "❌ Several components need setup"
fi

echo ""
echo "📋 NEXT STEPS:"
if [[ $hooks_installed -eq 0 ]]; then
    echo "   1. Run: ./install-claude-hooks.sh"
    echo "   2. Restart Claude Code"
fi

if ! lsof -i :3001 > /dev/null 2>&1; then
    echo "   • Start server: npm start"
fi

if [[ $percentage -eq 100 ]]; then
    echo "   🎯 Everything ready! Test by navigating away and back to Cupido directory."
fi

echo ""
echo "🔧 For detailed setup instructions, see: OPTION-2-SETUP-GUIDE.md"