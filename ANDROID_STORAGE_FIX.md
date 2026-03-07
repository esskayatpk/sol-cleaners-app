# Android AsyncStorage Native Module Fix

## Problem
```
WARN [WARN] 2026-03-03T03:04:29.275Z: Backend storage init failed (non-blocking) 
{"error": "Native module is null, cannot access legacy storage", "platform": "android"}
```

## Root Cause
The native AsyncStorage module hasn't been properly initialized or linked on Android when the app tries to access it too early.

## Solution Implemented in `backend.js`

### 1. **Platform-Specific Delay**
```javascript
if (Platform.OS === "android") {
  await new Promise(resolve => setTimeout(resolve, 500));
}
```
Waits 500ms on Android to allow native modules to load.

### 2. **Retry Logic with Exponential Backoff**
- Attempts up to 3 times to initialize AsyncStorage
- Waits 100ms → 200ms → 400ms between attempts
- Each attempt checks if AsyncStorage methods are actually callable

### 3. **Function Availability Checks**
All operations now verify AsyncStorage methods exist before calling:
```javascript
if (!AsyncStorage || typeof AsyncStorage.getItem !== "function") {
  return null; // Graceful fallback
}
```

### 4. **Timeout Protection**
Every AsyncStorage operation wrapped with 5-second timeout:
```javascript
await Promise.race([
  AsyncStorage.getItem(key),
  new Promise((_, reject) => 
    setTimeout(() => reject(new Error("timeout")), 5000)
  )
]);
```

### 5. **Graceful Degradation**
- App continues even if storage is unavailable
- Logs all failures without crashing
- Returns safe defaults (null, [], false)

## How to Test

1. **Clear and reinstall dependencies:**
   ```bash
   cd c:\sk\sol\app\Sol_Cleaners_Native\sol-native
   rm -Recurse -Force node_modules
   npm install --legacy-peer-deps
   ```

2. **Clear Expo cache:**
   ```bash
   npm start -- -c
   ```

3. **Monitor logs for success message:**
   ```
   [INFO] Backend storage initialized {"platform":"android","attempts":1}
   ```

## What Changed in `backend.js`

✅ **New `initialize()` approach:**
- Platform detection (500ms delay for Android)
- Retry loop with exponential backoff
- Type checking on AsyncStorage methods

✅ **Updated all operations:**
- `getItem()`, `setItem()`, `removeItem()`, `clearAll()`
- `getCustomer()`, `saveCustomer()`, `clearCustomer()`
- `getCustomerCredentials()`, `saveCustomerCredentials()`, `clearCustomerCredentials()`
- `getOrders()`, `saveOrders()`, `clearOrders()`
- `getAdmin()`, `saveAdmin()`, `clearAdmin()`

Each method now:
1. Checks if AsyncStorage method exists
2. Wraps call with timeout
3. Catches errors gracefully
4. Returns safe defaults on failure

## Device Testing

### On Android Device/Emulator:
- Watch `console.warn()` messages during app launch
- Check for initialization attempt logs
- Verify customer login persists across app restarts

### Common Still-Broken Scenarios:
**Issue:** Module is still null  
**Fix 1:** Fully rebuild Expo:
```bash
npm start -- -c --clear
```

**Fix 2:** Rebuild native modules:
```bash
expo prebuild --clean
```

**Fix 3:** Test on different device/emulator

## Fallback Behavior

If AsyncStorage is completely unavailable:
- ✅ App still starts (no crashes)
- ✅ Logging still works (to memory + console)
- ❌ Customer login won't persist
- ❌ Orders won't save to device storage
- ⚠️ All operations log warnings but continue

## Performance Impact

- **Initialization:** Extra 500ms on Android (one-time)
- **Per operation:** 5-second timeout (reusable)
- **Retries:** 3 attempts × ~700ms total max
- **Overall:** Non-blocking, won't freeze UI
