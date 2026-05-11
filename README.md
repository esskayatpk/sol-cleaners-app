# Sol Cleaners App — React Native (Expo)

Works on **iPhone**, **Android**, and **Web** from the same codebase.

## 🚀 Now with Supabase Cloud Backend + Advanced Features!

**Hybrid Architecture**: Local SQLite storage + Supabase cloud database for seamless offline-first experience with cloud backup, automatic sync, and real-time admin reporting.

## Latest Features (April 2026)

✅ **Biometric Authentication** — Face ID (iOS) & Fingerprint (Android) for secure, fast login  
✅ **Hidden Admin Access** — 5-tap gesture on splash screen logo reveals admin portal  
✅ **Password Reset** — Email-based password recovery with email verification  
✅ **Auto-Login** — Supabase session persisted via AsyncStorage; survives restarts without re-entering password  
✅ **Customer Identity** — Logged-in customer name displayed on all screens  
✅ **Unique Order Numbers** — No duplicate order constraint violations  
✅ **Admin Order Sync** — Automatic sync of pending orders when admin logs in  
✅ **Weekly/Monthly/Yearly Reports** — Admin & Manager roles get detailed analytics  
✅ **Role-Based Access** — Admin, Manager (reports access), Driver (dashboard only)  
✅ **Remote Testing** — Expo Tunnel for sharing app via URL with remote testers  
✅ **Sol-POS Customer Deduplication** — Existing POS customers linked via `auth_user_id`; no FK-breaking row changes  
✅ **Order Cancellation** — Customer can cancel pending orders with required reason; soft-deleted in POS  
✅ **Sunday Pickup Slots** — 10 AM–1 PM Sunday slots; same-day eligible before 10 AM  
✅ **One-Click Store Call** — "Call Us" button on new-order screen dials `(781) 784-3937` instantly  
✅ **Add/Edit Note on Existing Orders** — Customer can append special instructions to any non-cancelled order  
✅ **Persistent File Logging** — Daily `.log` files written to device storage; 30-day retention; 50 MB cap  

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
- **Session Persistence**: Supabase refresh token stored in AsyncStorage; auto-restores session on every restart — no password re-entry needed unless inactive for >60 days
- **Session Restore Order**: `restoreSession()` (token) → `loginCustomer()` (password fallback) → local storage (offline fallback)
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

## 📅 Pickup Scheduling

### Date Window
The scheduler shows a **2-week rolling window** of Mon–Sun. Same day is only included if it is **before 10 AM** on the device clock.

### Pickup Time Slots

| Day | Available Slots |
|-----|-----------------|
| Monday – Friday | 6:00 PM – 7:00 PM, 7:00 PM – 8:00 PM |
| Saturday | 4:00 PM – 5:00 PM, 5:00 PM – 6:00 PM, 6:00 PM – 7:00 PM |
| Sunday | 10:00 AM – 11:00 AM, 11:00 AM – 12:00 PM, 12:00 PM – 1:00 PM |

## 📋 Order Status Lifecycle

Orders move through the following statuses set by admin/driver:

| Status | Label | Description |
|--------|-------|-------------|
| `pending` | Pending | Order submitted, awaiting confirmation |
| `confirmed` | Confirmed | Admin has confirmed the pickup |
| `pickup_scheduled` | Scheduled | Driver scheduled for pickup |
| `picked_up` | Picked Up | Items collected from customer |
| `processing` | Processing | Items being cleaned |
| `ready` | Ready | Cleaned items ready for delivery |
| `out_for_delivery` | Delivering | Driver en route to customer |
| `delivered` | Delivered | Items returned to customer |
| `cancelled` | Cancelled | Cancelled by customer with reason |

SMS notifications are sent to customers at: `confirmed`, `pickup_scheduled`, `picked_up`, `processing`, `ready`, `out_for_delivery`, `delivered`.

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
- **Sunday Slots**: 10 AM–1 PM Sunday pickup slots; same-day slots shown if before 10 AM
- **Special Instructions**: Customer enters notes during order creation (appended to item description)
- **Add/Edit Note After**: Customer can update special instructions on any non-cancelled order from My Orders
- **Full Order Edit**: Customer can edit item quantities, pickup date/time, and payment method on pending orders
- **Order Cancellation**: Customer can cancel pending/confirmed orders with a required reason; soft-deleted (`deleted_at`) so POS can surface reason
- **One-Click Store Call**: "Call Us" button on new-order screen dials `(781) 784-3937` directly
- **Minimum Order**: 10 items required to submit an order
- **Payment Methods**: "Pay on Delivery" (default) or "Credit Card" selectable at order time
- **Supported Item Types**: Shirts, Pants, Suits, Dresses, Coats/Jackets, Blouses, Sweaters, Traditional Wear, Comforters/Bedding, Curtains, Rugs, Other Items

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
- **SMS Mode — Native** (default): Opens the device SMS app pre-filled with the customer's number and status message. No backend required; works immediately.
- **SMS Mode — Twilio** (optional): Auto-sends via a Supabase Edge Function. Configure `TWILIO_CONFIG` in `App.js` with Account SID, Auth Token, from-number, and Edge Function URL.
- **Status Updates**: SMS triggered whenever admin changes an order status
- **Customer Notifications**: SMS sent at key milestones (confirmed, scheduled, picked up, processing, ready, delivering, delivered)
- **SMS Log**: All sent messages tracked in `sms_log` Supabase table and shown in admin SMS history

## Supabase Configuration

Your app is configured with Supabase project: `hngxowkjanqz`

**Database Tables:**
- `customers` — Customer profiles (`id`, `email`, `name`, `phone`, `address`, `city`, `zip`, `auth_user_id UUID UNIQUE`)
- `orders` — Order details (`id`, `order_number UNIQUE`, `customer_id`, `status`, `pickup_date`, `pickup_time`, `num_items`, `note`, `payment_method`, `route_order`, `lat`, `lng`, `cancellation_reason`, `cancelled_at`, `deleted_at`, `created_at`, `updated_at`)
- `sms_log` — SMS delivery tracking (`id`, `order_id`, `to_phone`, `text`, `status`, `created_at`)

**`auth_user_id` column** — bridges sol-pos existing customers with app auth users without changing `customers.id` (preserves all FK references to orders).

**Cancellation soft-delete** — cancelled orders set `deleted_at` so POS can filter on `deleted_at IS NOT NULL` to surface cancellations with reason.

**Key Files:**
- `supabaseClient.js` — Supabase integration layer (functions for all operations incl. `restoreSession`, `appendOrderNote`, `cancelOrder`)
- `networkStatus.js` — Network monitoring with offline detection
- `App.js` — Main app with Supabase auth, order integration, reporting, role-based access
- `sqliteStorage.js` — Local SQLite storage for offline cache
- `i18n.js` — Multi-language support (EN/ES)
- `logger.js` — File-based logging (daily `.log` files, 30-day retention, 50 MB cap)

**Credentials:**
- Located in `supabaseClient.js` (lines 3-4)
- Never hardcode in production; use `.env.local` for security

## 🌐 Deploy as PWA on Hostinger

Sol Cleaners exports as a fully static site that uploads directly to any web host. No server or Node.js required.

### Step 1 — Build the Web Bundle

Run inside the `sol-native/` folder:

```bash
npx expo export --platform web
```

This generates a `dist/` folder (~30–60 MB) containing the complete app as plain HTML/JS/CSS files.

### Step 2 — Upload to Hostinger

1. Log in to [hpanel.hostinger.com](https://hpanel.hostinger.com)
2. Go to **Hosting → Manage → File Manager**
3. Navigate to `public_html/` and delete any placeholder files
4. Upload the **contents** of your local `dist/` folder (not the folder itself — upload what's inside it)
5. Confirm `public_html/index.html` exists after upload

> **Tip — FTP alternative:** Use FileZilla with credentials from Hostinger → Hosting → Manage → FTP Accounts. Connect and drag `dist/*` to `/public_html/`.

### Step 3 — Create / Edit .htaccess

In Hostinger File Manager, open or create `public_html/.htaccess` and paste:

```apache
RewriteEngine On

# Force HTTPS
RewriteCond %{HTTPS} off
RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# SPA fallback — required for React Navigation to work on page refresh
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ /index.html [L]
```

> **⚠️ The SPA fallback lines are critical.** Without them, refreshing any screen other than the home page returns a 404 error.

### Step 4 — Enable Free SSL (HTTPS)

1. Hostinger Dashboard → **Hosting → Manage → SSL**
2. Click **Install** on the free Let's Encrypt certificate
3. HTTPS is now active — required for PWA install prompts

### Step 5 — Install as PWA on Phones

Share the URL with customers. They install it like a native app:

| Device | Browser | How |
|--------|---------|-----|
| iPhone / iPad | Safari | Share → **Add to Home Screen** |
| Android | Chrome | Three-dot menu → **Add to Home Screen** |
| Desktop | Chrome / Edge | Click ⊕ in address bar → Install |

The installed icon shows the Sol Cleaners name, navy theme, and favicon.

### Updating After Code Changes

```bash
npx expo export --platform web   # rebuild
# then in Hostinger File Manager:
# 1. Delete all files in public_html/
# 2. Upload new dist/ contents
```

No server restart needed — changes go live instantly.

### Pre-Deployment Checklist

- [ ] `npx expo export --platform web` completes without errors
- [ ] All files from `dist/` uploaded to `public_html/`
- [ ] `public_html/index.html` exists at root
- [ ] `.htaccess` with HTTPS redirect + SPA fallback is in place
- [ ] SSL certificate installed (HTTPS active)
- [ ] Visit `https://your-domain.com` — app loads correctly
- [ ] Test customer login, order creation
- [ ] Test admin 5-tap gesture and admin login
- [ ] Install PWA on iPhone (Safari) and Android (Chrome)

---

## 📖 User Guide

A full illustrated HTML user guide is available at:

```
sol-native/docs/user-guide.html
```

Open it in any browser. It includes a fixed left sidebar with links to all topics and scrollable content on the right — covering customer registration, placing orders, admin access, route management, reports, Hostinger deployment steps, and FAQ.

---

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

### EAS Build Profiles

| Profile | Distribution | Android Output | Notes |
|---------|-------------|----------------|-------|
| `development` | Internal | APK | Includes dev client for debugging |
| `preview` | Internal | APK | Side-loadable test build |
| `production` | Store | AAB (App Bundle) | Auto-increments `versionCode` |

### App Identifiers

| Platform | Value |
|----------|-------|
| iOS Bundle Identifier | `com.solcleaners.app` |
| Android Package | `com.solcleaners.app` |
| Deep Link Scheme | `solcleaners://` |
| EAS Project ID | `b15629fd-4a94-40ea-a39b-83ed288c4290` |

### iOS Permissions (in `app.json`)
- **Local Network** — syncing with cleaning orders
- **Location When In Use** — route optimization and delivery tracking
- `ITSAppUsesNonExemptEncryption: false` — required for App Store export compliance

### Android Permissions
- `INTERNET`, `ACCESS_COARSE_LOCATION`, `ACCESS_FINE_LOCATION`

## Technical Stack

- **Framework**: React Native 0.81.5
- **Build System**: Expo SDK 54
- **Language**: JavaScript/React
- **Cloud Database**: Supabase (PostgreSQL) with real-time capabilities
- **Cloud Auth**: Supabase Auth (email/password with reset; session persisted via AsyncStorage)
- **Local Storage**: SQLite (expo-sqlite) on native, in-memory on web
- **Biometric Auth**: expo-local-authentication (Face ID/Fingerprint)
- **Network Detection**: @react-native-community/netinfo
- **Localization**: Custom i18n.js (EN/ES)
- **Logging**: File-based logger (expo-file-system), daily `.log` files, 30-day/50 MB retention
- **Async Storage**: @react-native-async-storage/async-storage (Supabase session + fallback log buffer)
- **File System**: expo-file-system (log file writes)
- **Navigation**: Custom screen state machine (`screen` + `mode` state) — React Navigation is **not** used
- **UI Components**: React Native built-ins + SVG icons (react-native-svg)
- **Safe Area**: react-native-safe-area-context

## File Structure

```
sol-native/
├── App.js                      # Main app (2600+ lines)
│                               #   • Splash screen with 5-tap admin access
│                               #   • Customer auth (login/register/password reset/auto-login)
│                               #   • Biometric auth (Face ID/Fingerprint with toggle)
│                               #   • Customer screens (home/new order/my orders/profile)
│                               #     - Sunday pickup slots; same-day cutoff at 10 AM
│                               #     - Order cancellation with reason modal
│                               #     - Add/edit note on existing orders
│                               #     - One-click store call button
│                               #   • Admin dashboard (orders/routes/reports)
│                               #   • Role-based navigation & access control
├── supabaseClient.js           # Supabase integration (cloud operations)
│                               #   restoreSession, cancelOrder, appendOrderNote
│                               #   findCustomerByPhone, setCustomerAuthId
│                               #   AsyncStorage session persistence adapter
├── networkStatus.js            # Network detection & monitoring
├── sqliteStorage.js            # Local SQLite storage (offline cache + biometric prefs)
├── i18n.js                     # English/Spanish translations
├── logger.js                   # File-based logging (daily .log files, 30-day retention)
├── backend.js                  # AsyncStorage wrapper w/ retry & timeout (Android-safe init)
├── mmkvStorage.js              # MMKV storage integration (secondary/fallback; react-native-mmkv
│                               #   not in dependencies — safe to ignore if unused)
├── app.json                    # Expo config
├── babel.config.js             # Babel config
├── eas.json                    # EAS build config
├── README.md                   # This file
├── LOGGER_DOCUMENTATION.md     # Logger API reference
├── SUPABASE_INTEGRATION.md     # Supabase setup & SQL migrations
└── assets/                     # Icons & images
```

## Deployment Checklist

- [ ] Verify all npm dependencies are compatible
- [ ] Test customer authentication (login/register/password reset)
- [ ] Test auto-login: close and reopen app — should land on home screen without password prompt
- [ ] Test admin authentication (5-tap hidden access)
- [ ] Test biometric authentication (enable/disable toggle)
- [ ] Test biometric login on iPhone (Face ID) and Android (Fingerprint)
- [ ] Test fallback to password if biometric fails
- [ ] Test order creation with special instructions
- [ ] Test Add/Edit Note on an existing order
- [ ] Test order cancellation with reason; verify `deleted_at` set in Supabase
- [ ] Test Sunday pickup slot visibility (run before/after 10 AM)
- [ ] Test "Call Us" button dials store number
- [ ] Test offline order creation & sync on reconnect
- [ ] Test admin order sync on login
- [ ] Test reports with different timeframes (weekly/monthly/yearly)
- [ ] Test role-based access (admin sees reports, driver doesn't)
- [ ] Verify log files written to `documentDirectory/sol_logs/` on device
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

### 👤 Customer Profile Editing
- Customers can update their **name, phone, address, city, and ZIP** from the Profile screen
- Changes saved to local SQLite immediately and synced to Supabase when online
- Profile data is used to auto-fill new order forms

### 🛡️ Admin — Additional Details
- **Last Login Display**: Admin portal shows the timestamp of the previous admin session on login
- **Demo/Mock Orders**: App ships with 5 sample orders pre-loaded for first-run testing. These are replaced by live Supabase data once synced.

## Support

For issues or feature requests, contact the development team at **admin@solcleanersinc.com** or call **(781) 784-3937**.
