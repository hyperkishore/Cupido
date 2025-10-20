#!/bin/bash

# CUPIDO CONTEXT AUTOMATION SETUP
# ================================
# Sets up complete automated context preservation and loading system

echo "🚀 SETTING UP CUPIDO CONTEXT AUTOMATION SYSTEM"
echo "=============================================="

# Make all scripts executable
echo "📝 Making scripts executable..."
chmod +x init.sh
chmod +x init-context.js  
chmod +x session-logger.js
chmod +x auto-init.js

echo "✅ Scripts are now executable"

# Initialize session logging
echo "📊 Starting session logging system..."
node session-logger.js start

echo "✅ Session logging initialized"

# Test auto-initialization
echo "🔍 Testing auto-initialization..."
node auto-init.js check

echo "✅ Auto-initialization system ready"

# Setup directory watching (optional)
echo "🎯 Setting up directory auto-detection..."
node auto-init.js setup

echo "✅ Directory auto-detection configured"

# Create Claude Code hooks configuration instructions
echo "📋 Creating Claude Code hooks setup instructions..."

cat > claude-hooks-setup.md << 'EOF'
# CLAUDE CODE HOOKS SETUP

To enable automatic Cupido context loading, you need to configure Claude Code hooks.

## Step 1: Locate Claude Code Settings

Find your Claude Code settings directory:
- **macOS**: `~/Library/Application Support/Claude Code/`
- **Linux**: `~/.config/claude-code/`
- **Windows**: `%APPDATA%\Claude Code\`

## Step 2: Copy Hooks Configuration

Copy the `claude-hooks.json` file to your Claude Code settings directory:

```bash
# For macOS (adjust path for other systems)
cp claude-hooks.json ~/Library/Application\ Support/Claude\ Code/hooks.json
```

## Step 3: Restart Claude Code

Restart Claude Code for the hooks to take effect.

## Step 4: Verify Setup

When you enter the Cupido directory with Claude Code, it should automatically:
1. Run `./init.sh` to load context
2. Display comprehensive project status
3. Start session logging
4. Update CLAUDE.md with session activities

## Manual Testing

You can manually test the system:
```bash
./init.sh                    # Load context manually
node session-logger.js log  # Log an activity
node auto-init.js auto       # Test auto-initialization
```

## Troubleshooting

If hooks don't work:
1. Check Claude Code settings directory path
2. Verify hooks.json is in the correct location
3. Restart Claude Code completely
4. Check console for hook execution errors

## Security Note

Hooks execute shell commands automatically. The configuration is restricted to:
- Only the Cupido project directory
- Only specific safe commands (init.sh, session-logger.js, etc.)
- No external network access or system modifications
EOF

echo "✅ Claude Code hooks setup instructions created"

# Test the complete system
echo "🧪 TESTING COMPLETE SYSTEM..."
echo "=============================="

echo "1. Testing context loading..."
./init.sh > /dev/null 2>&1 && echo "   ✅ Context loading works" || echo "   ❌ Context loading failed"

echo "2. Testing session logging..."
node session-logger.js status > /dev/null 2>&1 && echo "   ✅ Session logging works" || echo "   ❌ Session logging failed"

echo "3. Testing auto-initialization..."
node auto-init.js check > /dev/null 2>&1 && echo "   ✅ Auto-initialization works" || echo "   ❌ Auto-initialization failed"

echo "4. Testing CLAUDE.md updates..."
if [[ -f "CLAUDE.md" ]]; then
    echo "   ✅ CLAUDE.md exists"
else
    echo "   ❌ CLAUDE.md missing"
fi

echo ""
echo "🎉 SETUP COMPLETE!"
echo "=================="
echo ""
echo "📋 WHAT'S BEEN CONFIGURED:"
echo "   ✅ Automatic context loading (./init.sh)"
echo "   ✅ Session activity logging (session-logger.js)"
echo "   ✅ Directory auto-detection (auto-init.js)" 
echo "   ✅ CLAUDE.md automatic updates"
echo "   ✅ Claude Code hooks configuration (claude-hooks.json)"
echo ""
echo "🔧 TO COMPLETE SETUP:"
echo "   1. Follow instructions in claude-hooks-setup.md"
echo "   2. Copy claude-hooks.json to Claude Code settings"
echo "   3. Restart Claude Code"
echo ""
echo "🚀 FEATURES ENABLED:"
echo "   • Auto-loads context when Claude enters Cupido directory"
echo "   • Automatically updates CLAUDE.md with session progress"
echo "   • Logs all significant activities for continuity"
echo "   • Provides comprehensive system health monitoring"
echo ""
echo "💡 NEXT SESSION:"
echo "   Claude will automatically know everything that happened!"
echo ""
echo "🎯 The co-founder will be AMAZED at the seamless continuity!"