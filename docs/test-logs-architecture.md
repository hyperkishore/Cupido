# Test Logging Architecture Proposal

## Current Problems
- Test logs stored only in browser localStorage
- No file-based persistence 
- Cannot access logs from CLI or scripts
- Lost when browser cache cleared

## Proposed Architecture

### 1. File-Based Logging
```
/logs/
  ├── test-runs/
  │   ├── 2025-10-20-15-30-45.json  # Individual test runs
  │   ├── 2025-10-20-15-32-12.json
  │   └── latest.json               # Symlink to most recent
  ├── test-summary.json             # Aggregated results
  ├── failed-tests.json             # Current failures only
  └── test-history.log              # Human-readable log
```

### 2. Dual Storage Strategy
- **Primary**: File system (`/logs/test-runs/`)
- **Secondary**: localStorage for dashboard UI speed
- **Sync**: Dashboard reads from files, writes to both

### 3. API Endpoints
```
GET  /api/test-logs/recent     # Last 10 test runs
GET  /api/test-logs/failures   # Current failed tests
POST /api/test-logs/run        # Save new test run
GET  /api/test-logs/summary    # Aggregated stats
```

### 4. Log File Format
```json
{
  "id": "test_run_1729436545123_abc123",
  "timestamp": "2025-10-20T15:30:45.123Z",
  "environment": {
    "nodeVersion": "18.17.0",
    "dashboard": "http://localhost:8081",
    "server": "http://localhost:3001"
  },
  "summary": {
    "total": 72,
    "passed": 62,
    "failed": 10,
    "duration": 45.2,
    "passRate": 86.1
  },
  "tests": [
    {
      "id": "console-1",
      "name": "Basic Console Log",
      "status": "pass",
      "duration": 1.2,
      "message": "Test passed successfully"
    },
    {
      "id": "message-3", 
      "name": "Send Test Message",
      "status": "fail",
      "duration": 5.1,
      "message": "Element not found: [data-testid='send-button']",
      "errors": ["DOM element not accessible"],
      "stackTrace": "Error: Element not found..."
    }
  ]
}
```

## Implementation Benefits

1. **CLI Access**: `cat logs/failed-tests.json` shows current issues
2. **Persistence**: Logs survive browser restarts
3. **Analysis**: Scripts can process log files
4. **History**: Complete test run history preserved
5. **Debugging**: Rich error context and stack traces
6. **Monitoring**: External tools can watch log files