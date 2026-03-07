# Sol Cleaners Logger Documentation

## Overview
The Sol Cleaners app includes a comprehensive logging system that automatically captures all errors, warnings, info messages, and debug logs with timestamps. Logs are persisted to AsyncStorage and can be exported for debugging.

## Features
- ✅ Automatic timestamp on every log entry
- ✅ Multiple log levels: DEBUG, INFO, WARN, ERROR
- ✅ Persists logs to AsyncStorage (one log file per calendar day)
- ✅ Automatic console logging with proper formatting
- ✅ Maximum 1000 logs stored in memory (auto-cleanup)
- ✅ Export logs to text file with timestamped filename
- ✅ Clear logs when needed

## Usage

### Import the Logger
```javascript
import logger from "./logger";
```

### Log Levels

#### ERROR - Critical issues
```javascript
logger.error("Order submission failed", { orderId: "ord-123", reason: "Network error" });
// Output: [ERROR] 2026-03-02T14:35:22.123Z: Order submission failed - {"orderId":"ord-123",...}
```

#### WARN - Warnings that should be noted
```javascript
logger.warn("Order cancelled by user", { orderId: "ord-456" });
// Output: [WARN] 2026-03-02T14:35:25.456Z: Order cancelled by user - {"orderId":"ord-456"}
```

#### INFO - General information
```javascript
logger.info("Customer logged in", { email: "john@example.com" });
// Output: [INFO] 2026-03-02T14:35:30.789Z: Customer logged in - {"email":"john@example.com"}
```

#### DEBUG - Debugging details
```javascript
logger.debug("Processing item selection", { itemCount: 5 });
// Output: [DEBUG] 2026-03-02T14:35:35.012Z: Processing item selection - {"itemCount":5}
```

### Initialize Logger
The logger is automatically initialized when the app starts. It loads any existing logs from AsyncStorage for the current day.

```javascript
// Called automatically in App.js:
await logger.initialize();
logger.info("App started");
```

### Access Logs

#### Get logs as array
```javascript
const logs = logger.getLogs();
console.log("Total logs:", logs.length);
```

#### Get logs as formatted string
```javascript
const logsText = logger.getLogsAsString();
console.log(logsText);
```

#### Export logs to file
```javascript
const result = await logger.exportLogs();
// Creates file: sol_logs_2026-03-02T14-35-42-123Z.txt
if (result.success) {
  console.log("Exported to:", result.filename);
} else {
  console.log("Export failed:", result.error);
}
```

#### Clear all logs
```javascript
await logger.clearLogs();
```

## Log Storage

### Location
- **AsyncStorage Key**: `sol_logs_YYYY-MM-DD` (one per calendar day)
- **Format**: JSON array of log entries
- **Max Size**: 1000 logs per session

### Log Entry Structure
```javascript
{
  timestamp: "2026-03-02T14:35:22.123Z",
  level: "ERROR",
  message: "Order submission failed",
  data: { orderId: "ord-123", error: "Network timeout" }
}
```

## Common Use Cases

### 1. Track Customer Actions
```javascript
logger.info("Customer created order", { 
  customerId: custName, 
  itemCount: totalItems, 
  pickupDate: pickupDate 
});
```

### 2. Debug Payment Issues
```javascript
try {
  processPayment(paymentData);
  logger.info("Payment successful", { amount: paymentData.amount });
} catch (e) {
  logger.error("Payment failed", { 
    error: e.message, 
    paymentMethod: paymentData.method 
  });
}
```

### 3. Monitor Admin Actions
```javascript
logger.info("Admin updated order status", { 
  orderId: order.id, 
  oldStatus: order.status, 
  newStatus: newStatus,
  admin: adminUser.name 
});
```

### 4. Track Authentication
```javascript
logger.info("User login", { email: email, mode: "customer/admin" });
logger.info("User logout", { email: email });
```

## Viewing Logs in Development

### Console Output
All logs are also printed to the console with level-based formatting:
- ERROR → console.error()
- WARN → console.warn()
- INFO → console.log()
- DEBUG → console.debug()

### Expo DevTools
1. Open Expo DevTools in VS Code
2. Check the console for real-time log output
3. Look for `[ERROR]`, `[WARN]`, `[INFO]`, `[DEBUG]` prefixes

### Export for Analysis
```javascript
// In a debug screen or admin panel:
const exported = await logger.exportLogs();
// Download the exported file to analyze offline
```

## Best Practices

✅ **DO:**
- Log important user actions (login, orders, payments)
- Include relevant data with errors (IDs, user info, amounts)
- Use appropriate log levels (don't use ERROR for warnings)
- Log at critical decision points

❌ **DON'T:**
- Log sensitive data (passwords, credit cards, PINs)
- Log on every render (will spam the logger)
- Use ERROR for non-critical issues
- Log large objects repeatedly

## Troubleshooting

### Logs not persisting
- Check AsyncStorage permissions
- Verify `logger.initialize()` is called on app startup
- Check available storage on device

### Log file too large
- Logs are automatically limited to 1000 entries
- Old logs can be exported then cleared with `logger.clearLogs()`
- Logs reset daily (separate file per calendar day)

### Export not working
- Ensure the device supports file export (works on web/Expo)
- Check browser file download settings
- Verify sufficient storage space

## Future Enhancements

Potential improvements:
- Cloud backup of logs
- Remote log aggregation
- Compression of exported logs
- Log rotation/archival
- Filtered log export (by level, date range, etc.)
