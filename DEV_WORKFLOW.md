# 🔄 Cupido Development Workflow

## One Command, Full Stack Running

```bash
./dev-server.sh
```

That's it! This single command now:

## ✅ What Starts Automatically

1. **API Server** (port 3001)
   - Claude AI proxy
   - Health check endpoint
   - Message processing

2. **Expo/Metro** (port 8081)
   - React Native web
   - Hot reload enabled
   - Debug mode active

3. **Test Dashboard**
   - Opens in Chrome automatically
   - 9 automated tests
   - Runs every 30 seconds
   - Logs saved to localStorage

## 🎯 Zero Configuration Required

Everything is pre-configured:
- ✅ Environment variables loaded
- ✅ Ports checked and cleaned
- ✅ Servers verified before testing
- ✅ Cleanup on exit (Ctrl+C)

## 📊 Monitor Your Development

### Terminal Output
```
📝 Development Server Running
==================================
  App:   http://localhost:8081
  API:   http://localhost:3001/health
  Tests: ✅ Enabled
```

### Test Dashboard (Auto-Opens)
- Real-time test execution
- Pass/fail indicators
- Console output log
- Live app preview

### Browser Console
```javascript
showHistory()           // View all test runs
exportLogs()            // Download test logs
stopAutomatedTesting()  // Pause testing
```

## 🚫 Disable Auto-Testing (Optional)

If you don't want tests to run automatically:

```bash
ENABLE_AUTO_TESTS=false ./dev-server.sh
```

Or edit `dev-server.sh` and change line 10:
```bash
ENABLE_AUTO_TESTS="${ENABLE_AUTO_TESTS:-false}"
```

## 🔍 What Gets Tested Automatically

**User Flow Tests** (6 tests):
1. User creation readiness
2. Conversation initialization
3. Message sending to live app
4. AI response generation
5. UI message display verification
6. Typing indicator state

**Infrastructure Tests** (3 tests):
1. API server connectivity
2. Database connection
3. Response time validation

## 📝 Test Logs

All test runs are automatically saved:
- **Location**: Browser localStorage
- **Key**: `cupido_test_logs`
- **Retention**: Last 50 runs
- **Export**: Click "📥 Export" button

## 🎨 Development Flow

### Starting Development
```bash
./dev-server.sh
```

### Making Changes
1. Edit code in your editor
2. Hot reload updates the app
3. Tests automatically re-run every 30s
4. Check test dashboard for regressions

### Debugging
1. Check terminal for server logs
2. View test dashboard for test results
3. Open browser console (F12) for detailed logs
4. Export test logs for analysis

### Stopping Development
```
Ctrl+C
```
Everything stops cleanly (servers + tests).

## 🆚 Alternative Workflows

### Option 1: Dev Server with Auto-Tests (Recommended)
```bash
./dev-server.sh
```
Full integration, zero intervention.

### Option 2: Manual Server + Tests
```bash
# Terminal 1: Start servers manually
npm start

# Terminal 2: Start API server
node server.js

# Terminal 3: Run tests
./scripts/run-automated-tests.sh
```

### Option 3: Manual Everything
```bash
# Start servers manually
npm start
node server.js

# Open test dashboard manually
open file://$(pwd)/test-dashboard.html
```

## 💡 Pro Tips

1. **Keep test dashboard open** - It shows real-time issues
2. **Check console commands** - Auto-displayed after each test cycle
3. **Export logs regularly** - Great for debugging patterns
4. **Watch terminal** - Server errors show up here first

## 🐛 Troubleshooting

### Tests won't start
```bash
# Check if servers are running
curl http://localhost:8081
curl http://localhost:3001/health

# Restart dev server
./dev-server.sh
```

### Port conflicts
```bash
# Kill processes on ports
lsof -ti:8081 | xargs kill -9
lsof -ti:3001 | xargs kill -9

# Restart
./dev-server.sh
```

### Test dashboard not opening
```bash
# Open manually
open file://$(pwd)/test-dashboard.html
```

## 📚 More Information

- **Full testing docs**: `AUTOMATED_TESTING.md`
- **Test dashboard**: `test-dashboard.html`
- **Test runner**: `scripts/run-automated-tests.sh`
- **Dev server**: `dev-server.sh`

---

**Status**: 🟢 Fully Integrated | **Intervention**: 0% | **Auto-Start**: ✅
