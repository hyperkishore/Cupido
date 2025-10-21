# 🤖 Fully Automated Testing System

## Zero Human Intervention Required

This system automatically tests your Cupido app continuously with comprehensive logging and debugging capabilities.

## 🚀 Quick Start

### Option 1: Integrated with Dev Server (Recommended)
```bash
./dev-server.sh
```
**Tests automatically start with the dev server!**

### Option 2: Standalone Test Runner
```bash
./scripts/run-automated-tests.sh
```
Requires app and API servers to be already running.

### Option 3: Manual Open
1. Open `file:///Users/kishore/Desktop/Claude-experiments/Cupido/test-dashboard.html` in Chrome
2. Tests auto-start after 3 seconds
3. Tests run every 30 seconds continuously

### Disable Auto-Testing (if needed)
```bash
ENABLE_AUTO_TESTS=false ./dev-server.sh
```

## 🔧 Dev Server Integration

When you start the development server with `./dev-server.sh`, the system automatically:

1. ✅ **Starts API server** (port 3001)
2. ✅ **Starts Expo/Metro** (port 8081)
3. ✅ **Waits for servers** to be ready
4. ✅ **Opens test dashboard** in Chrome
5. ✅ **Begins automated testing** (every 30 seconds)

### What You See

```
🚀 Starting Cupido Development Server
==================================
🧹 Cleaning up existing processes...
🤖 Starting AI Proxy Server on port 3001...
📦 Starting Expo with debugging enabled...
⏳ Waiting for servers to be ready...
✅ Both servers are running

🤖 AUTOMATED TESTING MODE
==================================
Opening test dashboard with auto-testing enabled...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 Test Automation Active
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Mode:     Continuous (every 30 seconds)
  App:      http://localhost:8081
  API:      http://localhost:3001
  Tests:    9 automated test cases
  Logging:  Enabled (localStorage)

📊 Monitor tests:
  • Check test dashboard in browser
  • View console output (F12)
  • Type: showHistory()

⏸️  Stop tests: stopAutomatedTesting()
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📝 Development Server Running
==================================
  App:   http://localhost:8081
  API:   http://localhost:3001/health
  Tests: ✅ Enabled

Press Ctrl+C to stop all servers
```

## 📊 What Gets Tested

### Critical Tests (New User Flow)
1. **User Creation** - Verifies demo user setup
2. **Conversation Init** - Checks conversation creation
3. **Send Message** - Sends automated test messages to live app
4. **AI Response** - Validates API responses
5. **Display Response** - Verifies messages appear in UI
6. **State Management** - Checks typing indicator behavior

### Supporting Tests (Infrastructure)
1. **API Connectivity** - Server health checks
2. **Database Connection** - Supabase availability
3. **Response Time** - Performance validation

## 🎮 Test Controls

All control functions are **automatically displayed** in the console output on load and after each test cycle.

### Available Console Commands
```javascript
showHistory()           // View all previous test runs
exportLogs()            // Download logs as JSON file
clearHistory()          // Clear all stored test logs
stopAutomatedTesting()  // Pause automated testing
startAutomatedTesting() // Resume automated testing
showAvailableCommands() // Show this help menu again
```

**Note**: These commands are shown automatically - just look at the console output!

### Via UI Buttons
- **📊 History** - View all previous test runs
- **📥 Export** - Download logs as JSON file
- **▶️ Run All Tests** - Manual test trigger

## 📝 What Gets Logged

Every test run automatically logs:
- ✅ Test results (pass/fail)
- ⏱️ Execution duration
- 🔗 API call details (request/response)
- ❌ Error messages with stack traces
- 📊 App state (message count, typing status, etc.)
- 🌍 Environment info (browser, timestamp, URLs)

## 🗄️ Where Logs Are Stored

- **Location**: Browser localStorage
- **Key**: `cupido_test_logs`
- **Retention**: Last 50 test runs
- **Format**: JSON with full metadata

## 🔧 Configuration

Edit `test-dashboard.html` to customize:

```javascript
const AUTO_TEST_CONFIG = {
    enabled: true,              // Set false to disable auto-testing
    delayOnLoad: 3000,          // Wait time before first test (ms)
    continuousMode: true,       // Run tests continuously
    intervalBetweenRuns: 30000, // Time between test runs (ms)
    maxRuns: null,              // null = unlimited, or set a number
};
```

## 🎯 Real App Interaction

Tests actually interact with the live app via postMessage:
- Sends real messages to the chat
- Queries actual app state
- Verifies UI updates
- Tests complete user flows

## 🐛 Debugging Failed Tests

### 1. Check Console Output
The test dashboard shows real-time logs with color coding:
- 🔵 Info - General information
- 🟢 Success - Tests passed
- 🔴 Error - Test failures
- 🟡 Warning - Non-critical issues

### 2. Export Detailed Logs
Click "📥 Export" to download JSON with:
- Full request/response payloads
- Complete error stack traces
- Timing information
- App state snapshots

### 3. View History
Click "📊 History" or run `showHistory()` to see:
- All previous test runs
- Pass/fail rates
- Timing trends
- Error patterns

## 📈 Continuous Monitoring

Once started, the system:
1. ✅ Runs tests automatically every 30 seconds
2. ✅ Logs all results to localStorage
3. ✅ Tracks test trends over time
4. ✅ Requires zero human intervention
5. ✅ Continues until browser tab is closed

## 🔄 Test Flow

```
1. Dashboard loads (3s wait)
   ↓
2. Initialize test run with unique ID
   ↓
3. Run 9 automated tests sequentially
   ↓
4. Log all results to localStorage
   ↓
5. Wait 30 seconds
   ↓
6. Repeat from step 2
```

## 💾 Sample Log Structure

```json
{
  "id": "test_run_1234567890_abc123",
  "startTime": "2025-10-07T10:30:00.000Z",
  "endTime": "2025-10-07T10:30:15.000Z",
  "totalDuration": 15000,
  "environment": {
    "apiUrl": "http://localhost:3001/api/chat",
    "appUrl": "http://localhost:8081",
    "userAgent": "Mozilla/5.0..."
  },
  "tests": [
    {
      "testId": "newuser-1",
      "testName": "User Creation",
      "status": "pass",
      "message": "✓ User creation ready",
      "duration": 1234,
      "timestamp": "2025-10-07T10:30:01.000Z",
      "apiCalls": [],
      "errors": [],
      "metadata": {}
    }
  ],
  "summary": {
    "total": 9,
    "passed": 8,
    "failed": 1,
    "passRate": "88.9"
  }
}
```

## 🎥 Monitoring Dashboard

The test dashboard provides:
- Real-time test execution status
- Live app preview (iframe)
- Console output with timestamps
- Visual pass/fail indicators
- Test cards with detailed results

## ⚡ Performance

- Each test run completes in ~15-20 seconds
- Logs are stored efficiently in localStorage
- No external dependencies required
- Minimal CPU/memory usage

## 🛑 Stopping Tests

### Gracefully
```javascript
stopAutomatedTesting()
```

### Forcefully
- Close the browser tab
- Reload the page with auto-test disabled

## 📚 Additional Resources

- Test dashboard: `test-dashboard.html`
- Test runner script: `scripts/run-automated-tests.sh`
- App integration: `src/components/SimpleReflectionChat.tsx` (postMessage handlers)

## 🎉 Benefits

✅ **Zero intervention** - Set it and forget it
✅ **Comprehensive logging** - Debug any issue
✅ **Real app testing** - Not just mocks
✅ **Continuous monitoring** - Catch regressions early
✅ **Historical data** - Track trends over time
✅ **Export capability** - Share logs with team

---

**Status**: 🟢 Fully Automated | **Intervention Required**: 0%
