# Comprehensive Test Functions - Integration Guide

## 📋 Overview

This file contains **40 production-ready test functions** across 7 categories designed to automatically catch bugs and monitor app health. The most critical feature is **console error monitoring** that will catch bugs like "commonLocations is not defined" that recently slipped through.

## 🎯 Test Categories

### 1. Console Error Detection (5 tests) - CRITICAL PRIORITY
- `console-1`: No ReferenceErrors - Catches bugs like "commonLocations is not defined"
- `console-2`: No TypeErrors - Monitors for type-related errors
- `console-3`: No Uncaught Promises - Detects unhandled promise rejections
- `console-4`: No Network Errors - Monitors API call failures
- `console-5`: No Database Errors - Checks Supabase connection issues

### 2. Message Flow & UI (8 tests)
- `message-1`: User Message Appears
- `message-2`: Message Persistence
- `message-3`: Message Order
- `message-4`: Duplicate Prevention
- `message-5`: Input Field Clears
- `message-6`: Scroll to Bottom
- `message-7`: Long Message Support
- `message-8`: Special Characters

### 3. Profile Extraction (6 tests)
- `profile-1`: Name Extraction
- `profile-2`: Location vs Name (critical - prevents "Boston" being stored as name)
- `profile-3`: Age Detection
- `profile-4`: Gender Detection
- `profile-5`: Profile Persistence
- `profile-6`: Profile Update

### 4. Database Operations (5 tests)
- `database-1`: User Creation
- `database-2`: Conversation Init
- `database-3`: Save User Message
- `database-4`: Save AI Message
- `database-5`: Conversation History

### 5. Error Handling & Recovery (6 tests)
- `error-1`: Network Failure
- `error-2`: API Error Response
- `error-3`: Database Failure
- `error-4`: Invalid Message
- `error-5`: AI Timeout
- `error-6`: Retry Mechanism

### 6. State Management (6 tests)
- `state-1`: Send Button State
- `state-2`: isSending Reset
- `state-3`: Typing Indicator
- `state-4`: Message Count
- `state-5`: Conversation ID
- `state-6`: Loading States

### 7. API & Performance (4 tests)
- `api-1`: API Connectivity
- `api-2`: Claude API
- `api-3`: Response Time (<10s threshold)
- `api-4`: Model Selection (Haiku/Sonnet)

## 🔧 Integration with test-dashboard.html

### Step 1: Add Script Tag

Add this line in the `<head>` section of test-dashboard.html:

```html
<script src="comprehensive-test-functions.js"></script>
```

### Step 2: Update Test Mapping

Replace the existing test mapping in test-dashboard.html with:

```javascript
// Use the comprehensive test functions
const tests = window.TEST_FUNCTIONS;
```

### Step 3: Enable Console Error Monitoring

The file automatically overrides `console.error` and `console.warn` to track errors. It also listens for:
- Unhandled promise rejections
- Console errors from iframe
- Network errors

### Step 4: Use Batch Execution

Run all tests in a category:

```javascript
// Run all console error detection tests
await runCategory('console');

// Run all message tests
await runCategory('message');

// Run all tests
for (const category of ['console', 'message', 'profile', 'database', 'error', 'state', 'api']) {
  await runCategory(category);
}
```

## 🚨 Critical Features

### Console Error Monitoring

The most important feature - automatically tracks:

```javascript
// Get error summary at any time
const summary = getConsoleErrorSummary();
console.log(summary);
// {
//   totalErrors: 2,
//   totalWarnings: 1,
//   errors: [...],
//   warnings: [...]
// }

// Clear tracking
clearConsoleErrors();
```

### Natural Test Messages

Uses human-like messages to avoid AI detection:

```javascript
const messages = [
  "Hey! How's your day going?",
  "My name is Alex and I'm from San Francisco",
  "I'm 28 years old and love hiking",
  // ... 20+ natural messages
];
```

### Return Format

Every test returns:

```javascript
{
  pass: boolean,           // Test passed or failed
  message: string,         // Human-readable result
  errors?: string[],       // Array of error messages (if failed)
  metadata?: object        // Additional debug info
}
```

## 📊 Usage Examples

### Run Single Test

```javascript
const result = await TEST_FUNCTIONS['console-1']();
console.log(result);
// { pass: true, message: '✓ No ReferenceErrors detected' }
```

### Run Category

```javascript
const results = await runCategory('console');
console.log(results);
// {
//   category: 'console',
//   total: 5,
//   passed: 5,
//   failed: 0,
//   results: [...]
// }
```

### Check for Specific Errors

```javascript
// Send message that would trigger profile extraction
sendMessageToApp("My name is Alex and I'm from San Francisco");

// Wait for processing
await new Promise(resolve => setTimeout(resolve, 2000));

// Check for ReferenceErrors
const summary = getConsoleErrorSummary();
const referenceErrors = summary.errors.filter(err =>
  err.message.includes('ReferenceError')
);

if (referenceErrors.length > 0) {
  console.error('CRITICAL: ReferenceError detected!', referenceErrors);
}
```

### Monitor App State

```javascript
// Get current app state
const state = await getAppState();
console.log(state);
// {
//   messageCount: 5,
//   isTyping: false,
//   isSending: false,
//   conversationId: '...',
//   userId: '...',
//   profile: { name: 'Alex', ... }
// }
```

## 🔍 How Console Error Tests Catch Bugs

### Example: "commonLocations is not defined"

1. Test `console-1` sends message: "I'm from San Francisco"
2. This triggers profile extraction in `userProfileService.ts`
3. If `commonLocations` array is referenced incorrectly, ReferenceError occurs
4. Console override captures error immediately
5. Test fails with specific error message
6. Developer can fix bug before it reaches production

```javascript
// Test output on failure:
{
  pass: false,
  message: '✗ Found 1 ReferenceError(s)',
  errors: [
    'ReferenceError: commonLocations is not defined at extractProfileFromMessage'
  ],
  metadata: {
    referenceErrors: [{
      message: 'ReferenceError: commonLocations is not defined',
      timestamp: '2025-10-08T10:30:45.123Z',
      stack: '...'
    }]
  }
}
```

## 🎯 Best Practices

### 1. Run Console Tests First
Always run console error tests before other tests to catch critical bugs early:

```javascript
await runCategory('console');  // Run first
await runCategory('message');  // Then UI tests
await runCategory('profile');  // Then feature tests
```

### 2. Clear Errors Between Runs
Clear error tracking between test runs for accurate results:

```javascript
clearConsoleErrors();
await runCategory('console');
```

### 3. Monitor in Real-Time
Check errors continuously during development:

```javascript
setInterval(() => {
  const summary = getConsoleErrorSummary();
  if (summary.totalErrors > 0) {
    console.warn('New errors detected:', summary.errors);
  }
}, 5000);  // Check every 5 seconds
```

### 4. Use with CI/CD
Integrate with automated testing:

```javascript
// In CI pipeline
const allCategories = ['console', 'message', 'profile', 'database', 'error', 'state', 'api'];
let totalPassed = 0;
let totalFailed = 0;

for (const category of allCategories) {
  const result = await runCategory(category);
  totalPassed += result.passed;
  totalFailed += result.failed;
}

if (totalFailed > 0) {
  process.exit(1);  // Fail CI build
}
```

## 📝 App Integration Requirements

For tests to work, your React Native app must respond to these postMessage events:

### 1. test-send-message
```javascript
window.addEventListener('message', (event) => {
  if (event.data.type === 'test-send-message') {
    const message = event.data.message;
    // Send message to chat
    handleSendMessage(message);
  }
});
```

### 2. test-get-state
```javascript
window.addEventListener('message', (event) => {
  if (event.data.type === 'test-get-state') {
    // Return current app state
    event.source.postMessage({
      type: 'test-state-response',
      state: {
        messageCount: messages.length,
        isTyping,
        isSending,
        conversationId,
        userId,
        profile: userProfile,
        inputText: messageText
      }
    }, '*');
  }
});
```

### 3. test-clear-session
```javascript
window.addEventListener('message', (event) => {
  if (event.data.type === 'test-clear-session') {
    // Clear session data
    await AsyncStorage.clear();
    // Reset state
  }
});
```

### 4. console-error (from app to dashboard)
```javascript
// Override console.error in app to send to dashboard
const originalError = console.error;
console.error = (...args) => {
  originalError(...args);

  // Send to test dashboard
  window.parent.postMessage({
    type: 'console-error',
    message: args.join(' ')
  }, '*');
};
```

## 🚀 Quick Start

1. **Add to HTML**:
```html
<script src="comprehensive-test-functions.js"></script>
```

2. **Run All Tests**:
```javascript
// In test-dashboard.html
async function runAllTests() {
  clearConsoleErrors();

  for (const category of ['console', 'message', 'profile', 'database', 'error', 'state', 'api']) {
    await runCategory(category);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  const summary = getConsoleErrorSummary();
  console.log('Final error summary:', summary);
}
```

3. **Monitor Continuously**:
```javascript
// Auto-run tests every 30 seconds
setInterval(async () => {
  await runCategory('console');  // Most critical
}, 30000);
```

## 🐛 Debugging Failed Tests

When a test fails:

1. Check the error array: `result.errors`
2. Review metadata: `result.metadata`
3. Get console summary: `getConsoleErrorSummary()`
4. Check app state: `await getAppState()`

Example:
```javascript
const result = await TEST_FUNCTIONS['console-1']();

if (!result.pass) {
  console.error('Test failed!');
  console.error('Errors:', result.errors);
  console.error('Metadata:', result.metadata);

  const summary = getConsoleErrorSummary();
  console.error('All console errors:', summary.errors);

  const state = await getAppState();
  console.error('App state:', state);
}
```

## 📈 Success Metrics

Track test health over time:

```javascript
const testHistory = [];

async function runTestsAndTrack() {
  const results = {};

  for (const category of ['console', 'message', 'profile', 'database', 'error', 'state', 'api']) {
    results[category] = await runCategory(category);
  }

  const totalPassed = Object.values(results).reduce((sum, r) => sum + r.passed, 0);
  const totalTests = Object.values(results).reduce((sum, r) => sum + r.total, 0);
  const passRate = (totalPassed / totalTests * 100).toFixed(1);

  testHistory.push({
    timestamp: new Date().toISOString(),
    passRate,
    results
  });

  console.log(`Pass rate: ${passRate}% (${totalPassed}/${totalTests})`);

  return { passRate, totalPassed, totalTests };
}
```

---

## 🎉 Summary

This comprehensive test suite provides:

- ✅ **40 automated tests** across all critical app features
- 🔴 **Console error monitoring** to catch runtime bugs
- 📊 **Detailed logging** with errors, metadata, and timestamps
- 🎯 **Batch execution** by category
- 🔍 **Real-time monitoring** capabilities
- 📈 **CI/CD integration** support

**Critical feature**: Console error detection will catch bugs like "commonLocations is not defined" automatically, preventing them from reaching production.

Start by running: `await runCategory('console')` to verify no critical errors exist.
