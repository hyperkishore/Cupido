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
