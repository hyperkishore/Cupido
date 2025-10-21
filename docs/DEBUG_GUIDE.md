# Debugging Double Messages Issue

## Quick Start

```bash
# Run the development server with debugging enabled
./dev-server.sh

# Or if you want to run it manually
EXPO_DEBUG=true npx expo start --web
```

Then open http://localhost:8081 in your browser

## Console Logs to Monitor

Open your browser's developer console (F12) and look for these log patterns:

### Message Sending Flow
1. `📤 [timestamp] Sending message:` - Should appear ONCE per message
2. `✅ User message saved to database:` - Should appear ONCE
3. `💬 Sending to AI:` - Should appear ONCE
4. `✅ AI message saved to database:` - Should appear ONCE

### Duplicate Prevention Logs
- `⚠️ Blocked send: empty text or already sending` - Prevents empty or concurrent sends
- `⚠️ Blocked duplicate: message already pending` - Prevents duplicate sends
- `⚠️ Blocked Enter: too soon after last Enter` - Prevents double-trigger from Enter key
- `⚠️ Ignoring local message from subscription` - Prevents subscription duplicates
- `⚠️ Message already exists, skipping` - Prevents UI duplicates

### Real-time Subscription Logs
- `🔔 [timestamp] Subscription received message:` - Shows all incoming subscription messages
- Look for `isLocal: true` indicating messages created in this session

## What We Fixed

1. **Enhanced Duplicate Prevention**: Added message hash tracking with automatic cleanup
2. **Enter Key Debouncing**: Added 100ms debounce for Enter key on web
3. **Better Logging**: Added timestamps and detailed logging for debugging
4. **Local Message Tracking**: Improved tracking of locally created messages to prevent subscription duplicates

## If You Still See Duplicates

1. Check the browser console for any of these patterns:
   - Same message ID appearing multiple times
   - `📤 Sending message:` appearing twice with the same text
   - Network tab showing duplicate API calls

2. Check the database:
   ```sql
   -- Look for duplicate messages in the database
   SELECT content, COUNT(*) as count
   FROM chat_messages
   WHERE created_at > NOW() - INTERVAL '1 hour'
   GROUP BY content
   HAVING COUNT(*) > 1;
   ```

3. Clear browser cache and local storage:
   - Open DevTools → Application → Storage → Clear site data

## Continuous Development Workflow

Instead of restarting the app each time:

1. **Use the dev server script**: `./dev-server.sh`
2. **Hot Reload**: Save your changes and the app will automatically reload
3. **Manual Refresh**: Press `r` in the terminal or Cmd+R in the browser
4. **Clear Cache**: Press `c` in the terminal to clear Metro cache

## Testing Checklist

- [ ] Send a message with Enter key
- [ ] Send a message with Send button
- [ ] Send multiple messages quickly
- [ ] Send long messages
- [ ] Send messages with special characters
- [ ] Check console for duplicate warnings
- [ ] Check database for duplicate entries