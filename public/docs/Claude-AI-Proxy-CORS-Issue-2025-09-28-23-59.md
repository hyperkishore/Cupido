# Claude AI Proxy CORS Implementation Issue - September 28, 2025 23:59

**Investigation Date/Time**: September 28, 2025 @ 11:59 PM  
**Session Duration**: ~4 hours of debugging  
**Status**: UNRESOLVED - Metro bundler cache invalidation issue

## Problem Summary

The Cupido dating app's reflection chat system consistently returns generic fallback responses with `ai_model: none` instead of intelligent Claude AI responses with `ai_model: haiku/sonnet`, despite implementing a complete CORS proxy solution.

## Technical Architecture

### Current Setup
- **Frontend**: React Native Expo web app (localhost:8081)
- **Backend**: Express proxy server (localhost:3001) 
- **Database**: Supabase PostgreSQL
- **AI Provider**: Anthropic Claude API
- **Issue**: Metro bundler serving stale JavaScript cache

## Root Cause Analysis

### Evidence of Metro Cache Issue

#### 1. Database Evidence (Real-time monitoring)
```
Latest messages (timestamp: 2025-09-28 23:59):
1. [BOT] Wow, that's so cool! What's your favorite part about it? (Model: none)
2. [USER] yoy yoy (Model: none) 
3. [BOT] That's really interesting! Tell me more about that. (Model: none)
4. [USER] Testing (Model: none)
```
**Result**: 100% fallback responses, 0% Claude AI responses

#### 2. Proxy Server Evidence
- ✅ **Server Status**: Running on PID with Express/CORS
- ✅ **Direct Testing**: `curl` returns valid Claude responses
- ❌ **Request Logs**: Zero incoming requests from frontend
- **Expected**: `🔥 PROXY REQUEST RECEIVED!` logs (not appearing)

#### 3. Browser Console Evidence  
- ❌ **Missing Expected Logs**:
  - `🔄 Using proxy server for Claude HAIKU`
  - `🌐 Calling proxy at: http://localhost:3001/api/chat`
  - `✅ Success: Got X chars from Claude haiku`
- **Conclusion**: Old JavaScript code still executing

## Implementation Attempts

### 1. CORS Proxy Solution ✅
```javascript
// server.js - Express proxy server
app.post('/api/chat', async (req, res) => {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify(requestBody)
  });
  res.json({ message: data.content[0]?.text, usedModel: modelType });
});
```

### 2. Environment Configuration ✅
```bash
# .env
EXPO_PUBLIC_AI_PROXY_URL=http://localhost:3001
```

### 3. Frontend Proxy Integration ✅  
```typescript
// src/services/chatAiService.ts
private async callAnthropicAPI(messages, modelType) {
  const envProxyUrl = process.env.EXPO_PUBLIC_AI_PROXY_URL;
  const proxyUrl = `${envProxyUrl}/api/chat`;
  
  const response = await fetch(proxyUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, modelType })
  });
  
  return response.json().message;
}
```

### 4. Enhanced Error Handling ✅
- Platform-aware URL resolution (web vs native)
- HTTPS/HTTP mixed content detection  
- Detailed error categorization (NETWORK_ERROR, PROXY_ERROR, etc.)
- Hardened response parsing for Claude API format changes

## Cache Invalidation Attempts ❌

### Metro Bundler Restart Attempts
1. **Multiple `npx expo start --clear --web`** - No effect
2. **Hard browser refresh (Ctrl+F5)** - No effect  
3. **File touch to trigger recompilation** - No effect
4. **Metro cache directory clearing** - Not attempted
5. **Complete server restart** - No effect

### Evidence of Persistent Cache
- Environment variable `EXPO_PUBLIC_AI_PROXY_URL` not accessible in frontend
- No new console.log statements appearing in browser
- Same fallback response patterns as pre-proxy implementation
- Zero network requests to localhost:3001 in browser DevTools

## Expert Consultation Points

### 1. Metro Bundler Cache Strategy
**Question**: How can we force Expo Metro bundler to completely invalidate and rebuild JavaScript bundle?

**Current Issue**: Despite `--clear` flag and file modifications, bundler serves stale code that predates proxy implementation.

### 2. Environment Variable Loading
**Question**: Why is `EXPO_PUBLIC_AI_PROXY_URL` not accessible in frontend runtime despite being in `.env`?

**Expectation**: Expo should load EXPO_PUBLIC_* variables automatically
**Reality**: Frontend code cannot access the variable

### 3. Alternative Architecture
**Question**: Should proxy be integrated into Expo dev server rather than separate Express server?

**Current**: Standalone Express server on port 3001
**Alternative**: Expo dev server middleware/API routes

### 4. Bundle Inspection
**Question**: How to verify which version of `chatAiService.ts` is actually being served to browser?

**Need**: Confirm that Metro is bundling latest code vs serving cached version

## Debugging Commands Used

```bash
# Proxy server validation
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hello"}],"modelType":"haiku"}'
# Result: ✅ Returns Claude response

# Database monitoring  
node -e "const { createClient } = require('@supabase/supabase-js'); ..."
# Result: ❌ All ai_model fields show 'none'

# Process verification
ps aux | grep "node server.js"  
# Result: ✅ Proxy server running on PID

# Metro restart
npx expo start --clear --web
# Result: ❌ Still serves cached JavaScript
```

## Technical Debt Created

1. **Hardcoded API Key**: Currently embedded in proxy server for debugging
2. **Development-only Solution**: Proxy URL only works on localhost
3. **No Production Strategy**: HTTPS certificate handling not implemented
4. **Error Monitoring**: Enhanced error handling code not executing due to cache issue

## Next Steps Required

1. **Metro Cache Resolution**: Find method to force complete bundle invalidation
2. **Environment Variable Loading**: Ensure Expo properly injects EXPO_PUBLIC_* vars
3. **Bundle Verification**: Confirm Metro is compiling latest source code
4. **Alternative Architecture**: Consider integrated proxy vs standalone server

## Files Modified (Not Taking Effect)

- `src/services/chatAiService.ts` - Proxy integration code
- `.env` - EXPO_PUBLIC_AI_PROXY_URL configuration  
- `server.js` - Express proxy server with enhanced logging
- Multiple Metro restart attempts

**URL for this document**: `http://localhost:8081/docs/Claude-AI-Proxy-CORS-Issue-2025-09-28-23-59.md`

---
*Document created during active debugging session*  
*All code implementations are complete but not executing due to Metro bundler cache issue*