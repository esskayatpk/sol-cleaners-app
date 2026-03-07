# Sol Cleaners App — React Native (Expo)

Works on **iPhone**, **Android**, and **Web** from the same codebase.

## 🚀 Now with Supabase Cloud Backend!

**Hybrid Architecture**: Local SQLite storage + Supabase cloud database for seamless offline-first experience with cloud backup.

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

1. Install **Expo Go** from App Store (iPhone) or Google Play (Android)
2. Scan the QR code shown in terminal
3. App loads on your phone

## Running in Browser

```bash
npx expo start --web
```

Opens at http://localhost:8081

## Running on Simulators

- Press **i** in terminal → opens iOS Simulator (Mac + Xcode only)
- Press **a** in terminal → opens Android Emulator (Android Studio only)

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
