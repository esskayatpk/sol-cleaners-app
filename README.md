# Sol Cleaners App — React Native (Expo)

Works on **iPhone**, **Android**, and **Web** from the same codebase.

## 🚀 Now with Supabase Cloud Backend + Advanced Features!

**Hybrid Architecture**: Local SQLite storage + Supabase cloud database for seamless offline-first experience with cloud backup, automatic sync, and real-time admin reporting.

## Latest Features (March 2026)

✅ **Biometric Authentication** — Face ID (iOS) & Fingerprint (Android) for secure, fast login  
✅ **Hidden Admin Access** — 5-tap gesture on splash screen logo reveals admin portal  
✅ **Password Reset** — Email-based password recovery with email verification  
✅ **Auto-Login** — Stays logged in even after app restart (with manual logout option)  
✅ **Customer Identity** — Logged-in customer name displayed on all screens  
✅ **Unique Order Numbers** — No duplicate order constraint violations  
✅ **Admin Order Sync** — Automatic sync of pending orders when admin logs in  
✅ **Weekly/Monthly/Yearly Reports** — Admin & Manager roles get detailed analytics  
✅ **Role-Based Access** — Admin, Manager (reports access), Driver (dashboard only)  
✅ **Remote Testing** — Expo Tunnel for sharing app via URL with remote testers  
✅ **Splash Screen Polish** — Improved address display, logo clarity fix  

## Setup (5 minutes)

1. Open this folder in VS Code
2. Open terminal in VS Code (Ctrl + `)
3. Run:

```bash
npm install --legacy-peer-deps
```

4. Start the app:

```bash
npx expo start
```

## Running on Your Phone

### Local Testing (Same WiFi)
1. Install **Expo Go** from App Store (iPhone) or Google Play (Android)
2. Scan the QR code shown in terminal
3. App loads on your phone

### Remote Testing (Anywhere in World)
Share the app with remote testers without deploying:

```bash
npx expo start --tunnel
```

Copy the `exp://...` URL and share via email/Slack. Remote testers paste it into Expo Go to test instantly.

## Running in Browser

```bash
npx expo start --web
```

Opens at http://localhost:8081

## Running on Simulators

- Press **i** in terminal → opens iOS Simulator (Mac + Xcode only)
- Press **a** in terminal → opens Android Emulator (Android Studio only)

## 🔐 Access Control & Authentication

### Customer Authentication
- **Register**: Create account with name, phone, email, address, password
- **Login**: Sign in with email/password (cloud or local fallback)
- **Password Reset**: "Forgot password?" link → email verification → auto-redirect to sign in
- **Auto-Login**: Credentials persisted securely; auto-restores on app restart
- **Manual Logout**: Available on customer profile screen; clears saved credentials

### Admin Access (Hidden)
**Secret 5-Tap Gesture**: 
1. Tap the "Sol" logo on splash screen **5 times quickly**
2. Admin button appears in top-right
3. Proceed to admin login
4. Contact the team for admin credentials

**Admin Roles Available**:
| Role | Access | Email | Password |
|------|--------|-------|----------|
| **Admin** | Full access: orders, routes, reports, settings | admin@solcleanersinc.com | SolAdmin2026! |
| **Manager** | Reports, orders, routes, settings | manager@solcleanersinc.com | SolMgr2026! |
| **Driver** | Orders, routes (no reports) | driver@solcleanersinc.com | SolDriver2026! |

Admin button is never visible on customer-facing screens or when in customer mode.

## 📊 Reporting System (Admin & Manager)

Navigate to **Reports** tab to view business analytics:

### Timeframe Options
- **Weekly** — This week's data
- **Monthly** — This month's data  
- **Yearly** — This year's data

### Report Metrics
- **Total Orders** — Orders created in period
- **Completed Orders** — Orders delivered
- **Total Items** — Sum of all items processed
- **Status Breakdown** — Detailed count for each order status
- **Completion Rate** — Percentage of orders delivered (visual progress bar)

Reports update in real-time and are stored in Supabase.

## Supabase Integration Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                      Sol Cleaners Mobile App                        │
│                     (React Native + Expo)                           │
├────────────────────────┬──────────────────────────────────────────┤
│      Local Storage     │      Network Detection & Sync            │
│    (SQLite - Offline)  │   (Automatic Background Sync)          │
│                        │                                          │
│  • Customer Profiles   │  • Monitors connection status            │
│  • Order Cache         │  • Queues operations when offline       │
│  • Backup Credentials  │  • Auto-syncs when reconnected          │
│  • Customer Identity   │  • Syncs on admin login                 │
├────────────────────────┴──────────────────────────────────────────┤
│                    Supabase Cloud Backend                          │
│              (PostgreSQL + Real-time Subscriptions)               │
│                                                                   │
│  • Supabase Auth (customers, admin accounts)                     │
│  • Customers table (profiles, contact info, name display)        │
│  • Orders table (order details, status, route, timestamps)       │
│  • SMS_Log table (delivery tracking)                             │
│  • Role-based access control (Admin/Manager/Driver)              │
└─────────────────────────────────────────────────────────────────────┘
```

## 🎯 Key Features

### 🔐 Authentication & Persistence
- **Supabase Auth**: Cloud-based authentication with email/password
- **Password Reset**: Email-based recovery with verification
- **Local Backup**: Credentials stored in SQLite for offline access
- **Hybrid Login**: Tries Supabase first, falls back to local if offline
- **Auto-Login**: Credentials persisted safely across app launches
- **Manual Sign Out**: Available on profile; clears saved credentials
- **Customer Identity**: Name displayed on all customer screens

### 🔐 Biometric Authentication
- **Face ID (iOS)**: Native Face ID authentication on iPhone X and newer
- **Fingerprint (Android)**: Native fingerprint scanner on supported devices
- **Hardware Detection**: App automatically detects device biometric capabilities on startup
- **User Control**: Enable/disable biometric in customer profile → Security Settings card
- **Secure Credential Storage**: Biometric unlocks saved credentials for instant login
- **Device Encryption**: Biometrics use device's secure enclave (not stored in app)
- **Fallback to Password**: Password login always available if biometric fails or not enrolled
- **Fast Re-auth**: Users who enable biometric skip password entry on every login
- **Cross-Session Persistence**: Biometric preference saved to SQLite, survives app restart
- **How to Use**: 
  1. Tap "My Account" → scroll to "Security Settings"
  2. Tap "Enable Face ID" or "Enable Fingerprint"
  3. Confirm with device biometric
  4. On next login, use biometric button below password field

### ☁️ Cloud Backup & Sync
- **Local-First**: All changes saved to SQLite immediately for instant response
- **Cloud Sync**: Changes automatically replicated to Supabase when online
- **Offline-Ready**: App works completely offline, syncs on reconnection
- **Admin Sync**: Pending orders auto-sync when admin logs in
- **Conflict Resolution**: Cloud is source of truth; local cache is working copy
- **Real-time Updates**: Order data available on admin dashboard instantly when online

### 📡 Network Detection
- **Continuous Monitoring**: Tracks online/offline status in real-time
- **Automatic Sync**: Downloads fresh data from cloud when connection restored
- **Queue System**: Queues operations when offline, executes on reconnection
- **User Feedback**: App shows sync status (Online/Offline/Syncing)
- **Graceful Degradation**: Full functionality offline, enhanced features when online

### 📦 Order Management
- **Unique Order Numbers**: No duplicate constraint violations (generates by max existing + 1)
- **Online**: New orders visible on admin dashboard instantly
- **Offline**: Orders created locally, synced when online
- **Status Updates**: Status changes replicate to cloud with SMS notifications
- **Route Optimization**: Admin can optimize pickup routes; saved to cloud
- **Pickup Scheduling**: Schedule future pickups; date range aligns across customer/admin

### 📊 Business Analytics
- **Weekly Reports**: Orders, completions, items, status breakdown
- **Monthly Reports**: Aggregated business metrics by month
- **Yearly Reports**: Year-to-date analytics for annual planning
- **Completion Rates**: Visual progress bar showing delivery percentage
- **Role-Based**: Manager and Admin roles access reporting tab

### 🌍 Multi-Language Support
- English & Spanish available
- Select language on splash screen
- All screens translated (Home, Schedule Pickup, Admin)
- Store info (Sol Cleaners) shown in selected language

### 📱 Multi-Platform
- **iOS**: Full support via Expo Go or native build
- **Android**: Full support via Expo Go or native build  
- **Web**: Responsive browser version (in-memory storage session)
- **Remote Testing**: Expo Tunnel for worldwide testers

### 💬 Order Communication
- **SMS Integration**: Native SMS mode for order notifications
- **Status Updates**: Automatic SMS when order status changes
- **Customer Notifications**: SMS sent at key milestones (picked up, processing, ready, delivered)

## Supabase Configuration

Your app is configured with Supabase project: `hngxowkjanqz`

**Database Tables:**
- `customers` - Customer profiles (id, email, name, phone, address, city, zip)
- `orders` - Order details (id, order_number UNIQUE, customer_id, status, pickup_date, pickup_time, num_items, route_order, lat, lng, created_at)
- `sms_log` - SMS delivery tracking (id, order_id, to_phone, text, status, created_at)

**Key Files:**
- `supabaseClient.js` - Supabase integration layer (29 functions for all operations)
- `networkStatus.js` - Network monitoring with offline detection
- `App.js` - Main app with Supabase auth, order integration, reporting, role-based access
- `sqliteStorage.js` - Local SQLite storage for offline cache
- `i18n.js` - Multi-language support (EN/ES)
- `logger.js` - Comprehensive logging system

**Credentials:**
- Located in `supabaseClient.js` (lines 3-4)
- Never hardcode in production; use `.env.local` for security

## Build for App Store / Google Play

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform all
# For APK preview build:
eas build --platform android --profile preview
# For iOS
eas build --platform ios --profile preview
```

## Technical Stack

- **Framework**: React Native 0.81.5
- **Build System**: Expo 55.0.4
- **Language**: JavaScript/React
- **Cloud Database**: Supabase (PostgreSQL) with real-time capabilities
- **Cloud Auth**: Supabase Auth (email/password with reset)
- **Local Storage**: SQLite (expo-sqlite) on native, in-memory on web
- **Biometric Auth**: expo-local-authentication (Face ID/Fingerprint)
- **Network Detection**: @react-native-community/netinfo
- **Localization**: Custom i18n.js (EN/ES)
- **Logging**: Custom logger.js with INFO/WARN/ERROR levels
- **Async Storage**: @react-native-async-storage/async-storage
- **UI Components**: React Native built-ins + SVG icons
- **Safe Area**: react-native-safe-area-context

## File Structure

```
sol-native/
├── App.js                      # Main app (2100+ lines)
│                               #   • Splash screen with 5-tap admin access
│                               #   • Customer auth (login/register/password reset/auto-login)
│                               #   • Biometric auth (Face ID/Fingerprint with toggle)
│                               #   • Customer screens (home/new order/my orders/profile)
│                               #   • Admin dashboard (orders/routes/reports)
│                               #   • Role-based navigation & access control
├── supabaseClient.js           # Supabase integration (cloud operations)
├── networkStatus.js            # Network detection & monitoring
├── sqliteStorage.js            # Local SQLite storage (offline cache + biometric prefs)
├── i18n.js                     # English/Spanish translations
├── logger.js                   # Logging system (INFO/WARN/ERROR)
├── mmkvStorage.js              # MMKV storage integration
├── app.json                    # Expo config
├── babel.config.js             # Babel config
├── eas.json                    # EAS build config
├── README.md                   # This file
└── assets/                     # Icons & images
```

## Deployment Checklist

- [ ] Verify all npm dependencies are compatible
- [ ] Test customer authentication (login/register/password reset)
- [ ] Test admin authentication (5-tap hidden access)
- [ ] Test biometric authentication (enable/disable toggle)
- [ ] Test biometric login on iPhone (Face ID) and Android (Fingerprint)
- [ ] Test fallback to password if biometric fails
- [ ] Test offline order creation & sync on reconnect
- [ ] Test admin order sync on login
- [ ] Test reports with different timeframes (weekly/monthly/yearly)
- [ ] Test role-based access (admin sees reports, driver doesn't)
- [ ] Test auto-login persistence across app restarts
- [ ] Build APK/iOS with `eas build`
- [ ] Test on real devices (iPhone + Android phone with biometric)
- [ ] Verify no sensitive data in logs
- [ ] Final smoke test before app store submission

## Support

For issues or feature requests, contact the development team.


## Supabase Integration Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                      Sol Cleaners Mobile App                        │
│                     (React Native + Expo)                           │
├────────────────────────┬──────────────────────────────────────────┤
│      Local Storage     │      Network Detection & Sync            │
│    (SQLite - Offline)  │   (Automatic Background Sync)          │
│                        │                                          │
│  • Customer Profiles   │  • Monitors connection status            │
│  • Order Cache         │  • Queues operations when offline       │
│  • Backup Credentials  │  • Auto-syncs when reconnected          │
├────────────────────────┴──────────────────────────────────────────┤
│                    Supabase Cloud Backend                          │
│              (PostgreSQL + Real-time Subscriptions)               │
│                                                                   │
│  • Supabase Auth (customers, admin accounts)                     │
│  • Customers table (profiles, contact info)                      │
│  • Orders table (order details, status, route)                   │
│  • SMS_Log table (delivery tracking)                             │
└─────────────────────────────────────────────────────────────────────┘
```

### Customer Registration Flow

```
Customer Registration:
  ↓
Validate Input (name, email, password, address)
  ↓
Save to Local SQLite (instant)
  ├→ Store relationship offline
  ├→ Enable instant UI feedback
  └→ Works offline
  ↓
[IF ONLINE & Supabase Ready]
  ├→ Create account in Supabase Auth
  ├→ Create profile in customers table
  └→ Log success
  ↓
REGISTERED ✓ (local + cloud backup)
```

### Customer Login Flow

```
Customer Login:
  ↓
[IF ONLINE & Supabase Ready]
  ├→ Try Supabase Auth login
  └→ Fetch profile from cloud
    ↓
[SUCCESS] → Populate UI from cloud profile
    ↓
[FAILED or OFFLINE]
  ├→ Fall back to local SQLite credentials
  └→ Check email/password match
    ↓
[SUCCESS] → Populate UI from local profile
    ↓
[FAILURE] → "Invalid credentials" error
  ↓
LOGGED IN ✓ (local or cloud)
```

### Order Creation & Sync Flow

```
Customer Submits Order:
  ↓
Validate input (items, pickup date/time, address)
  ↓
Save to Local SQLite (instant)
  ├→ Update UI immediately
  ├→ Show order success screen
  └→ Works offline
  ↓
[IF ONLINE & Supabase Ready]
  ├→ createOrder() → sends to Supabase
  ├→ Replicates to cloud database
  └→ Admin can see order immediately
  ↓
[OFFLINE or FAILED]
  ├→ Order stored locally
  └→ Will sync automatically when online
  ↓
ORDER CREATED ✓ (local backup, cloud if online)
```

### Automatic Sync on Reconnection

```
Network Status Changed (from Offline → Online):
  ↓
App detects connection restored
  ├→ @react-native-community/netinfo triggers callback
  └→ handleOnline() executes
  ↓
Sync all local orders with cloud:
  ├→ syncOrdersWithSupabase()
  ├→ Compare local vs cloud
  └→ Upload missing orders
  ↓
Reload fresh orders from Supabase:
  ├→ getAllOrders()
  ├→ Get latest status from cloud
  ├→ Update local cache
  └→ Refresh UI
  ↓
SYNCED ✓ (local and cloud in sync)
```

### Order Status Update Flow

```
Admin Updates Order Status (pending → confirmed):
  ↓
Update Local State (instant UI)
  ↓
Save to SQLite (persistent)
  ↓
[IF ONLINE & Supabase Ready]
  ├→ updateOrderStatusSupabase()
  ├→ Send new status to cloud
  └→ Log success
  ↓
Send SMS Notification to Customer:
  ├→ Native SMS mode: Opens phone SMS app
  ├→ Twilio mode: Sends via Edge Function (optional)
  └→ Log SMS to sms_log table
  ↓
STATUS UPDATED ✓ (local + cloud)
```

## Key Features

### 🔐 Authentication & Persistence
- **Supabase Auth**: Cloud-based authentication with email/password
- **Local Backup**: Credentials stored in SQLite for offline access
- **Hybrid Login**: Tries Supabase first, falls back to local if offline
- **Auto-Login**: Credentials persisted across app launches
- **Sign Out Control**: Customers can manually sign out and clear credentials

### ☁️ Cloud Backup & Sync
- **Local-First**: All changes saved to SQLite immediately for instant response
- **Cloud Sync**: Changes automatically replicated to Supabase when online
- **Offline-Ready**: App works completely offline, syncs on reconnection
- **Conflict Resolution**: Cloud is source of truth; local cache is working copy
- **Real-time Updates**: Ordered data available on admin dashboard instantly when online

### 📡 Network Detection
- **Continuous Monitoring**: Tracks online/offline status in real-time
- **Automatic Sync**: Downloads fresh data from cloud when connection restored
- **Queue System**: Queues operations when offline, executes on reconnection
- **User Feedback**: App shows sync status (Online/Offline/Syncing)
- **Graceful Degradation**: Full functionality offline, enhanced features when online

### 🎯 Order Management
- **Online**: New orders visible on admin dashboard instantly
- **Offline**: Orders created locally, synced when online
- **Status Updates**: Status changes replicate to cloud with SMS notifications
- **Route Optimization**: Admin can optimize pickup routes; saved to cloud
- **Pickup Scheduling**: Schedule future pickups; synced to cloud

### 🔐 Automatic Login (Credential Persistence)
- **First Time**: Customer registers with email, password, and details
- **Credentials Saved**: Email & password are stored locally on device using SQLite
- **Auto-Login**: App opens directly to home screen on all future app starts—no login needed
- **Sign Out Control**: Customers can sign out from profile, which clears saved credentials
- **Device-Local**: Credentials never sent to server, stored securely on device only

### 🌍 Multi-Language Support
- English & Spanish available
- Select language on splash screen
- All screens translated (Home, Schedule Pickup, Admin)
- Store info (Sol Cleaners) shown in selected language

### 📱 Multi-Platform
- **iOS**: Full support via Expo Go or native build
- **Android**: Full support via Expo Go or native build  
- **Web**: Responsive browser version (in-memory storage session)

### 📊 Admin Dashboard
- View all customer orders
- Track pickup schedules
- Manage driver assignments
- Real-time order status updates
- Route optimization for efficient pickups

## Demo Admin Accounts

| Email | Password | Role |
|-------|----------|------|
| admin@solcleanersinc.com | SolAdmin2026! | Admin |
| driver@solcleanersinc.com | SolDriver2026! | Driver |
| manager@solcleanersinc.com | SolMgr2026! | Manager |

## Supabase Configuration

Your app is configured with Supabase project: `hngxowkjanqz`

**Database Tables:**
- `customers` - Customer profiles (id, email, name, phone, address, city, zip)
- `orders` - Order details (id, order_number, customer_id, status, pickup_date, pickup_time, num_items, route_order, lat, lng)
- `sms_log` - SMS delivery tracking (id, order_id, to_phone, text, status, created_at)

**Key Files:**
- `supabaseClient.js` - Supabase integration layer (29 functions for all operations)
- `networkStatus.js` - Network monitoring with offline detection
- `App.js` - Main app with Supabase auth & order integration
- `sqliteStorage.js` - Local SQLite storage for offline cache

**Credentials:**
- Located in `supabaseClient.js` (lines 3-4)
- Never hardcode in production; use `.env.local` for security

## Build for App Store / Google Play

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform all
eas submit --platform ios
eas submit --platform android
```

## Technical Stack

- **Framework**: React Native 0.76.6
- **Build System**: Expo 55.0.4
- **Language**: JavaScript/React
- **Cloud Database**: Supabase (PostgreSQL) with real-time capabilities
- **Cloud Auth**: Supabase Auth (email/password)
- **Local Storage**: SQLite (expo-sqlite) on native, in-memory on web
- **Network Detection**: @react-native-community/netinfo
- **Localization**: Custom i18n.js (EN/ES)
- **Logging**: Custom logger.js with INFO/WARN/ERROR levels
- **UI Components**: React Native built-ins + SVG icons
- **Safe Area**: react-native-safe-area-context

## File Structure

```
sol-native/
├── App.js                      # Main app component (customer + admin screens)
├── supabaseClient.js           # Supabase integration (cloud operations)
├── networkStatus.js            # Network detection & monitoring
├── sqliteStorage.js            # Local SQLite storage (offline cache)
├── i18n.js                     # English/Spanish translations
├── logger.js                   # Logging system
├── app.json                    # Expo config
├── babel.config.js             # Babel config
├── SUPABASE_INTEGRATION.md     # Setup & architecture guide
└── assets/                     # Icons & images
```

## Support

For issues or feature requests, contact the development team.
