#!/bin/bash

# CUPIDO DIRECTORY WATCHER
# Automatically runs when entering Cupido directory

CUPIDO_MARKER=".cupido-auto-init"

# Check if we're in a Cupido directory
if [[ -f "CLAUDE.md" && -f "init.sh" ]]; then
    # Check if we've already auto-initialized this session
    if [[ ! -f "$CUPIDO_MARKER" ]]; then
        echo "🎯 Cupido directory detected!"
        echo "🚀 Auto-initializing..."
        
        # Create marker to prevent repeated initialization
        touch "$CUPIDO_MARKER"
        
        # Run auto-initialization
        node auto-init.js
        
        echo "✅ Ready for co-founder level development!"
    fi
fi
