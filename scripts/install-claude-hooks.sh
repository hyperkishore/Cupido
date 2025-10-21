#!/bin/bash

# CLAUDE CODE HOOKS INSTALLER
# ============================
# Installs Cupido context automation hooks for Claude Code

echo "🚀 INSTALLING CLAUDE CODE HOOKS FOR CUPIDO"
echo "==========================================="

# Detect operating system and set Claude Code settings path
if [[ "$OSTYPE" == "darwin"* ]]; then
    CLAUDE_SETTINGS_DIR="$HOME/Library/Application Support/Claude Code"
    echo "📍 Detected macOS - Settings path: $CLAUDE_SETTINGS_DIR"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    CLAUDE_SETTINGS_DIR="$HOME/.config/claude-code"
    echo "📍 Detected Linux - Settings path: $CLAUDE_SETTINGS_DIR"
elif [[ "$OSTYPE" == "msys"* || "$OSTYPE" == "win32"* ]]; then
    CLAUDE_SETTINGS_DIR="$APPDATA/Claude Code"
    echo "📍 Detected Windows - Settings path: $CLAUDE_SETTINGS_DIR"
else
    echo "❌ Unsupported operating system: $OSTYPE"
    exit 1
fi

# Check if Claude Code settings directory exists
if [[ ! -d "$CLAUDE_SETTINGS_DIR" ]]; then
    echo "⚠️  Claude Code settings directory not found!"
    echo "   Expected: $CLAUDE_SETTINGS_DIR"
    echo ""
    echo "💡 This could mean:"
    echo "   1. Claude Code is not installed"
    echo "   2. Claude Code hasn't been run yet (run it once to create settings)"
    echo "   3. Different settings path on your system"
    echo ""
    echo "🔍 To find the correct path, look for:"
    echo "   - settings.json file in Claude Code app"
    echo "   - Check Claude Code documentation for your OS"
    echo ""
    exit 1
fi

# Create the settings directory if it doesn't exist
mkdir -p "$CLAUDE_SETTINGS_DIR"

# Backup existing hooks if they exist
HOOKS_FILE="$CLAUDE_SETTINGS_DIR/hooks.json"
if [[ -f "$HOOKS_FILE" ]]; then
    echo "📋 Backing up existing hooks configuration..."
    cp "$HOOKS_FILE" "$HOOKS_FILE.backup.$(date +%Y%m%d_%H%M%S)"
    echo "   ✅ Backup created: $HOOKS_FILE.backup.*"
fi

# Copy our hooks configuration
echo "📁 Installing Cupido hooks configuration..."
cp "claude-hooks.json" "$HOOKS_FILE"

if [[ $? -eq 0 ]]; then
    echo "   ✅ Hooks configuration installed successfully!"
else
    echo "   ❌ Failed to install hooks configuration"
    exit 1
fi

# Verify installation
echo "🔍 Verifying installation..."
if [[ -f "$HOOKS_FILE" ]]; then
    echo "   ✅ Hooks file exists: $HOOKS_FILE"
    
    # Check if our hooks are in the file
    if grep -q "cupido_session_start" "$HOOKS_FILE"; then
        echo "   ✅ Cupido hooks found in configuration"
    else
        echo "   ❌ Cupido hooks not found in configuration"
        exit 1
    fi
else
    echo "   ❌ Hooks file not found after installation"
    exit 1
fi

echo ""
echo "🎉 INSTALLATION COMPLETE!"
echo "========================="
echo ""
echo "📋 WHAT'S BEEN INSTALLED:"
echo "   ✅ Cupido context automation hooks"
echo "   ✅ Auto-initialization on directory entry"
echo "   ✅ Automatic session logging"
echo "   ✅ Real-time CLAUDE.md updates"
echo ""
echo "🔧 NEXT STEPS:"
echo "   1. ⚡ RESTART Claude Code completely"
echo "   2. 🎯 Navigate to any directory outside Cupido"
echo "   3. 🚀 Navigate back to Cupido directory"
echo "   4. ✨ Watch the magic happen!"
echo ""
echo "🧪 TESTING:"
echo "   • Open Claude Code"
echo "   • Navigate away from Cupido directory"
echo "   • Navigate back to Cupido directory"
echo "   • Claude should automatically run context loading"
echo ""
echo "📁 CONFIGURATION LOCATION:"
echo "   $HOOKS_FILE"
echo ""
echo "🔄 TO UNINSTALL:"
echo "   Remove or rename: $HOOKS_FILE"
echo ""
echo "🎯 RESULT:"
echo "   Claude will now automatically load Cupido context"
echo "   and maintain perfect session continuity!"
echo ""
echo "💡 If hooks don't work, check Claude Code console for errors"
echo "   and verify the settings directory path is correct."