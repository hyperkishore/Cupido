# 🤖 Automated Fix Loop

## Overview

The automated fix loop continuously monitors test results and automatically fixes failures using Claude AI analysis.

## Features

✅ **Fully Automated** - Monitors tests every 30 seconds
✅ **Intelligent Analysis** - Uses Claude AI to diagnose failures
✅ **Safe Auto-Fix** - Automatically applies low-risk fixes
✅ **Approval Gates** - Requests approval for risky changes
✅ **Loop Prevention** - Max 3 attempts per test/file combination
✅ **Real-time Feedback** - Shows analysis and proposed fixes

## Architecture

```
┌─────────────────────┐
│  Test Dashboard     │ (localhost:3001/test-dashboard)
│  (runs every 30s)   │
└──────────┬──────────┘
           │ POST results
           ▼
┌─────────────────────┐
│  API Server         │ (localhost:3001)
│  /api/test-results  │
└──────────┬──────────┘
           │ GET latest
           ▼
┌─────────────────────┐
│  Auto-Fix Script    │ (node scripts/auto-fix-tests.js)
│  - Polls API        │
│  - Analyzes fails   │
│  - Applies fixes    │
└─────────────────────┘
```

## Quick Start

### Option 1: Integrated Dev Server (Recommended)

```bash
./dev-server.sh
```

This automatically:
1. Starts API server on port 3001
2. Starts Expo on port 8081
3. Opens test dashboard at `http://localhost:3001/test-dashboard`
4. Tests run every 30 seconds and POST results to API

### Option 2: Add Automated Fix Loop

In a **new terminal**, start the auto-fix script:

```bash
node scripts/auto-fix-tests.js
```

Now the system will:
1. Monitor test results from the API
2. Analyze failures with Claude AI
3. Automatically fix safe issues
4. Ask for approval on risky fixes

## How It Works

### 1. Test Results Collection

The test dashboard automatically:
- Runs 9 automated tests every 30 seconds
- POSTs results to `http://localhost:3001/api/test-results`
- Stores results in API server memory

### 2. Failure Analysis

When the auto-fix script detects failures:

```javascript
// Polls API every 30 seconds
const results = await fetch('http://localhost:3001/api/test-results/latest');

// Analyzes failures with Claude AI
const analysis = await analyzeFailuresWithClaude(results);
// Returns:
// {
//   "analysis": "Root cause analysis",
//   "fixes": [
//     {
//       "testId": "newuser-4",
//       "file": "src/components/SimpleReflectionChat.tsx",
//       "reason": "postMessage not reaching parent",
//       "riskLevel": "LOW",
//       "changes": "Use window.parent.postMessage instead"
//     }
//   ]
// }
```

### 3. Risk Assessment

Each fix is assigned a risk level:

| Risk Level | Auto-Apply? | Criteria |
|------------|-------------|----------|
| **LOW** | ✅ Yes | Non-critical files, simple changes |
| **MEDIUM** | ⚠️ Ask | Important files OR complex changes |
| **HIGH** | ❌ Ask | Critical files (server.js, .env, package.json) |

### 4. Fix Application

**Safe fixes (AUTO-APPLIED):**
```
✅ AUTO-APPLYING SAFE FIX: src/components/SimpleReflectionChat.tsx
   Risk: LOW
   Reason: Fix postMessage to use window.parent

🔧 Applying fix...
📝 Fix instructions: [Claude's detailed fix]
✅ Fix applied!
```

**Risky fixes (APPROVAL REQUIRED):**
```
⚠️  RISKY FIX DETECTED: server.js
   Risk: HIGH
   Reason: Update API endpoint configuration

Apply this fix? (y/n):
```

## Configuration

Edit `scripts/auto-fix-tests.js`:

```javascript
const CONFIG = {
    API_URL: 'http://localhost:3001/api/test-results/latest',
    POLL_INTERVAL: 30000,              // 30 seconds
    MAX_AUTO_FIX_ATTEMPTS: 3,          // Max 3 attempts per test+file
    SAFE_FILE_PATTERNS: [              // Auto-fix these patterns
        /\.tsx?$/,
        /\.jsx?$/,
        /\.json$/,
        /\.css$/
    ],
    RISKY_PATTERNS: [                  // Always ask for approval
        /server\.js$/,
        /\.env$/,
        /package\.json$/,
        /tsconfig\.json$/
    ]
};
```

## API Endpoints

### POST /api/test-results

Save test results from dashboard:

```bash
curl -X POST http://localhost:3001/api/test-results \
  -H "Content-Type: application/json" \
  -d @test-results.json
```

### GET /api/test-results/latest

Get most recent test run:

```bash
curl http://localhost:3001/api/test-results/latest
```

Response:
```json
{
  "id": "test_run_1234567890_abc123",
  "startTime": "2025-10-07T10:30:00.000Z",
  "endTime": "2025-10-07T10:30:15.000Z",
  "summary": {
    "total": 9,
    "passed": 6,
    "failed": 3,
    "passRate": "66.7"
  },
  "tests": [...],
  "receivedAt": "2025-10-07T10:30:16.000Z"
}
```

### GET /api/test-results/history

Get last 50 test runs:

```bash
curl http://localhost:3001/api/test-results/history
```

## Monitoring

### View Test Dashboard

Open in browser:
```
http://localhost:3001/test-dashboard
```

### Check Auto-Fix Script Output

The script provides real-time updates:

```
🤖 Automated Test Fix Loop Started
============================================================
API: http://localhost:3001/api/test-results/latest
Poll Interval: 30000ms
Max Auto-Fix Attempts: 3
============================================================

Monitoring test results...

============================================================
📊 NEW TEST RESULTS: 6/9 passed
============================================================

🔍 Analyzing test failures with Claude AI...

📋 Analysis: Tests failing due to postMessage communication issue

🔧 Proposed fixes: 2

✅ AUTO-APPLYING SAFE FIX: src/components/SimpleReflectionChat.tsx
   Risk: LOW
   Reason: Fix postMessage communication

🔧 Applying fix...
✅ Fix applied!

✅ Fix application complete. Waiting for next test run...
```

## Safety Features

### 1. Loop Prevention

Tracks fix attempts per test+file:
```javascript
fixAttempts = {
  "SimpleReflectionChat.tsx:newuser-5": 2,  // 2 attempts so far
  "server.js:api-1": 3                      // Max reached, won't auto-fix
}
```

### 2. Approval Gates

Risky files always require approval:
- `server.js`
- `.env`
- `package.json`
- `tsconfig.json`

### 3. Graceful Shutdown

Press `Ctrl+C` to stop:
```
🛑 Shutting down automated fix loop...
Fix attempt summary:
{
  "SimpleReflectionChat.tsx:newuser-5": 2,
  "test-dashboard.html:api-1": 1
}
```

## Troubleshooting

### Script not detecting test results

**Check API server:**
```bash
curl http://localhost:3001/api/test-results/latest
```

Should return test results, not 404.

**Solution:** Run tests in dashboard first to populate results.

### Fixes not being applied

**Possible causes:**
1. Max attempts reached (3 per test+file)
2. File marked as risky
3. Claude API not responding

**Solution:** Check script output for details.

### Test dashboard not POSTing results

**Check browser console (F12):**
```javascript
// Should see:
✅ Test results posted to API for automated analysis
```

**Solution:** Verify API server is running on port 3001.

## Advanced Usage

### Manual Fix Trigger

Fetch latest results and manually trigger analysis:

```javascript
const results = await fetch('http://localhost:3001/api/test-results/latest');
const data = await results.json();

// Analyze specific test
const failedTest = data.tests.find(t => t.testId === 'newuser-5');
console.log(failedTest);
```

### Custom Risk Assessment

Override risk levels in the script:

```javascript
function isSafeFix(fix) {
    // Always auto-fix certain files
    if (fix.file.includes('test-dashboard.html')) {
        return true;
    }

    // Never auto-fix database files
    if (fix.file.includes('Database')) {
        return false;
    }

    return fix.riskLevel === 'LOW';
}
```

## Complete Workflow

1. **Start development:**
   ```bash
   ./dev-server.sh
   ```

2. **Start auto-fix (optional):**
   ```bash
   node scripts/auto-fix-tests.js
   ```

3. **Make code changes**

4. **Tests auto-run every 30s:**
   - Results POST to API
   - Auto-fix script analyzes failures
   - Safe fixes applied automatically
   - Risky fixes require approval

5. **View progress:**
   - Dashboard: `http://localhost:3001/test-dashboard`
   - Console: Auto-fix script output
   - API: `curl http://localhost:3001/api/test-results/latest`

## Benefits

✅ **Zero Manual Intervention** - For safe fixes
✅ **Intelligent Risk Management** - Approval gates for critical changes
✅ **Continuous Improvement** - Fixes applied immediately
✅ **Full Transparency** - All fixes logged and visible
✅ **Loop Protection** - Prevents infinite fix attempts
✅ **Real-time Monitoring** - See results as they happen

---

**Status**: 🟢 Ready | **Intervention**: Minimal | **Automation Level**: 95%
