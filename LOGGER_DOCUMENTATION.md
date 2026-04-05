# Sol Cleaners Logger Documentation

## Overview
The Sol Cleaners app uses a file-based logging system that writes structured JSON entries to daily log files on the device. Logs persist across app restarts, survive 30 days, and are capped at 50 MB total to protect storage.

## Storage

| Property | Value |
|----------|-------|
| Location | `FileSystem.documentDirectory + sol_logs/` |
| File naming | `sol_YYYY-MM-DD.log` (one per calendar day) |
| Format | One JSON object per line (newline-delimited JSON) |
| Retention | 30 days; files older than 30 days deleted on startup |
| Size cap | 50 MB total; oldest files removed first when exceeded |
| Fallback | AsyncStorage key `sol_log_fallback` if device FS unavailable |

## Features
- ✅ Daily log files written to device storage (`expo-file-system`)
- ✅ Automatic 30-day retention cleanup on every app start
- ✅ 50 MB total size cap; oldest files evicted when exceeded
- ✅ In-memory ring buffer (latest 1000 entries) for fast `getLogs()`
- ✅ Serialised writes — no race conditions between concurrent log calls
- ✅ AsyncStorage fallback if file system is unavailable
- ✅ Multiple log levels: DEBUG, INFO, WARN, ERROR
- ✅ DEBUG goes to memory/file only — no console noise

## Log Entry Structure
```json
{
  "timestamp": "2026-04-03T12:52:49.973Z",
  "level": "WARN",
  "message": "Background Supabase re-auth failed",
  "data": { "error": "Invalid login credentials" }
}
```

## Usage

### Import
```javascript
import logger from "./logger";
```

### Log Levels

```javascript
logger.debug("Processing item selection", { itemCount: 5 });  // memory/file only
logger.info("Customer logged in", { email: "john@example.com" });
logger.warn("Supabase re-auth failed, will retry", { error: "..." });
logger.error("Order submission failed", { orderId: "ord-123" });
```

### Initialize (called automatically in App.js)
```javascript
await logger.initialize();
```
On init the logger:
1. Creates `sol_logs/` directory if missing
2. Loads today's file into the in-memory buffer
3. Runs cleanup (delete old / oversized files)

### Access Logs

```javascript
// Array of latest 1000 log entries
const logs = logger.getLogs();

// Human-readable multi-line string of in-memory logs
const text = logger.getLogsAsString();

// Absolute path to today's log file (pass to expo-sharing, etc.)
const todayPath = logger.getTodayLogPath();

// All retained log paths, newest first
const allPaths = await logger.getAllLogPaths();
```

### Export Today's Log
```javascript
const result = await logger.exportLogs();
if (result.success) {
  console.log("File:", result.path);   // absolute path
  console.log("Content:", result.content);
}
```

### Clear All Logs
```javascript
await logger.clearLogs(); // deletes all .log files + clears memory buffer
```

## Viewing Logs

### During Development (Expo terminal)
All `INFO` / `WARN` / `ERROR` entries are printed to the Expo dev-server console with the format:
```
[WARN] 2026-04-03T12:52:49.973Z: Background Supabase re-auth failed { error: "Invalid login credentials" }
```

### On Device (after go-live)
1. Call `logger.getTodayLogPath()` to get the file path
2. Pass to `expo-sharing` to share/email the file:
```javascript
import * as Sharing from "expo-sharing";
await Sharing.shareAsync(logger.getTodayLogPath());
```
3. Open in any text editor — one JSON object per line

### Programmatic Filtering
```javascript
const errors = logger.getLogs().filter(l => l.level === "ERROR");
const recent = logger.getLogs().filter(l => new Date(l.timestamp) > new Date(Date.now() - 3600_000));
```

## Retention & Cleanup

Cleanup runs automatically every time `logger.initialize()` is called (i.e. every app start):

1. **Age**: Any file with `sol_YYYY-MM-DD.log` name where the date is > 30 days ago is deleted.
2. **Size**: After age-based deletion, if total remaining size > 50 MB, the oldest files are deleted one by one until total is ≤ 50 MB.

No manual intervention required.

## Common Use Cases

### Track Auth Events
```javascript
logger.info("Auto-login: Supabase session restored", { email });
logger.warn("Background re-auth failed — customer still logged in locally", { error });
```

### Track Order Lifecycle
```javascript
logger.info("Order created", { orderId, orderNumber, items: totalItems });
logger.info("Order note updated", { orderId });
logger.info("Order cancelled", { orderId, reason });
```

### Track Sync Status
```javascript
logger.info("Orders synced to Supabase", { count: updatedOrders.length });
logger.warn("Sync failed, retrying on next connection", { error });
```

## Best Practices

✅ **DO:**
- Log important customer actions (login, orders, cancellations, notes)
- Include relevant IDs and context with every entry
- Use `warn` for recoverable failures, `error` only for unhandled exceptions
- Log at entry/exit of critical async flows

❌ **DON'T:**
- Log passwords, full auth tokens, or payment card data
- Log on every render or in tight loops
- Use `error` for expected failure paths (wrong password, offline state)

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| No log files on device | `expo-file-system` not installed | `npx expo install expo-file-system` |
| Logs missing after restart | Old AsyncStorage-only build | Upgrade to current `logger.js` |
| `initialize()` hangs | Slow FS on first run | Already handled — 5s timeout then continues |
| File not found in sharing | Path changed | Use `logger.getTodayLogPath()` — never hardcode |

- Compression of exported logs
- Log rotation/archival
- Filtered log export (by level, date range, etc.)
