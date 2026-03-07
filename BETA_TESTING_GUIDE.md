# Sol Cleaners App — Beta Testing Guide

Deploy your app to iOS and Android for real user testing using EAS (Expo Application Services).

## 📱 Distribution Options

### Option 1: Expo Go QR Code (Fastest)
- **Time**: 5 minutes
- **Cost**: Free
- **Setup**: Run `npx expo start` and share QR code
- **Limitation**: Dev server must run; testers need Expo Go app
- **Best for**: Immediate testing with 1-2 people

### Option 2: Native Apps via EAS (Recommended)
- **Time**: 30-45 minutes per build
- **Cost**: Free tier (10-20 builds/month), paid plans available
- **Setup**: EAS Build → TestFlight/Google Play
- **Advantage**: Works offline, professional distribution, automatic updates
- **Best for**: Real beta testing with 5-50+ testers

---

## 🚀 EAS Build Setup (Complete Guide)

### Step 1: Install EAS CLI

```bash
npm install -g eas-cli
```

Verify installation:
```bash
eas --version
```

### Step 2: Create Expo Account & Login

```bash
eas login
```

Follow prompts to:
- Create Expo account (if needed)
- Enter email and password
- Authorize CLI access

### Step 3: Configure EAS for Your Project

```bash
eas build:configure
```

This creates `eas.json` in your project root with default settings. You'll be prompted to:

1. **Create Apple App ID?** → Choose `Yes` (EAS manages this)
2. **Create Google Play App?** → Choose `Yes` (EAS manages this)
3. **Select platforms** → Choose `All` (iOS and Android)

Your `eas.json` will look like:
```json
{
  "cli": { "version": ">= 5.0.0" },
  "build": {
    "preview": {
      "android": { "buildType": "apk" },
      "ios": { "buildType": "simulator" }
    },
    "production": {
      "android": { "buildType": "aab" },
      "ios": { "buildType": "archive" }
    }
  },
  "submit": {
    "preview": { },
    "production": { }
  }
}
```

### Step 4: Update app.json with Build Information

Before first build, configure `app.json`:

```json
{
  "expo": {
    "name": "Sol Cleaners",
    "slug": "sol-cleaners",
    "version": "1.0.0",
    "platforms": ["ios", "android"],
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#0F2440"
    },
    "updates": {
      "fallbackToCacheTimeout": 0
    },
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "supportsTabletMode": false,
      "bundleIdentifier": "com.solcleaners.app",
      "buildNumber": "1",
      "infoPlist": {
        "NSLocalNetworkUsageDescription": "This app needs local network access to sync with your cleaning orders.",
        "NSBonjourServiceTypes": ["_http._tcp"],
        "NSLocationWhenInUseUsageDescription": "Location is used for route optimization and delivery tracking."
      }
    },
    "android": {
      "package": "com.solcleaners.app",
      "versionCode": 1,
      "permissions": [
        "INTERNET",
        "ACCESS_COARSE_LOCATION",
        "ACCESS_FINE_LOCATION"
      ]
    },
    "extra": {
      "eas": {
        "projectId": "your-project-id-here"
      }
    }
  }
}
```

Key fields:
- `version`: Semantic versioning (1.0.0, 1.1.0, etc.)
- `bundleIdentifier` (iOS): Unique identifier (reverse domain format)
- `package` (Android): Unique package name
- `buildNumber`/`versionCode`: Increment with each build

---

## 🔨 Build for Testing

### Build iOS

```bash
eas build --platform ios --profile preview
```

**What happens:**
1. Zips your project and sends to EAS servers
2. Compiles in cloud (takes 10-15 minutes)
3. Outputs `.ipa` file (iOS app bundle)
4. Provides download link when complete

**Next step:** Submit to TestFlight (see below)

### Build Android

```bash
eas build --platform android --profile preview
```

**What happens:**
1. Compiles for Android in cloud (takes 8-12 minutes)
2. Outputs `.apk` file (Android app bundle)
3. Can test on emulator or real devices

**Next step:** Submit to Google Play (see below)

### Build Both Platforms

```bash
eas build --platform all --profile preview
```

Builds iOS and Android in parallel.

---

## 📲 iOS Distribution via TestFlight

TestFlight is Apple's official beta testing platform.

### Step 1: Submit Build to TestFlight

After iOS build completes:

```bash
eas submit --platform ios
```

**Prompts:**
1. Choose which build to submit (select your latest)
2. Select "TestFlight"
3. Enter Apple ID credentials
4. Review and confirm app details
5. Wait for Apple to process (usually 30 min - 2 hours)

### Step 2: Create Test Groups

1. Go to **App Store Connect**: https://appstoreconnect.apple.com
2. Sign in with your Apple ID
3. Select your app (Sol Cleaners)
4. Navigate to **TestFlight** → **Internal Testing** or **External Testing**

**Internal Testing** (No app review):
- Add up to 100 testers
- Immediate access
- Great for your team

**External Testing** (Requires review):
- Add up to 10,000 testers
- Apple reviews build (24-48 hours)
- Testers download via public link
- Better for public beta

### Step 3: Add Testers

In App Store Connect:

1. Click **+** next to "Testers"
2. Enter tester email addresses
3. Click **Send Invite**
4. Testers receive email with TestFlight link

### Step 4: Testers Install App

Testers will:
1. Receive email invite from App Store Connect
2. Click link → opens TestFlight app
3. App appears in TestFlight
4. Tap "Install" or "Update"
5. App installs on their iPhone/iPad

---

## 🎮 Android Distribution via Google Play

Google Play Console handles Android beta testing.

### Step 1: Submit Build to Google Play

After Android build completes:

```bash
eas submit --platform android
```

**Prompts:**
1. Choose which build to submit (select your latest)
2. Select "Google Play"
3. Sign in with Google account
4. Authorize EAS to access your developer account
5. Choose release track: **Internal Testing**
6. Review and confirm
7. Build is uploaded to Play Store

### Step 2: Create Internal Testing Track

1. Go to **Google Play Console**: https://play.google.com/console
2. Sign in with your Google account
3. Select your app (Sol Cleaners)
4. Navigate to **Testing** → **Internal Testing**
5. Verify your build is listed

### Step 3: Add Testers

In Google Play Console:

1. Click **Create link** under "Internal Testing"
2. Copy the testing link
3. Share with team members via email/Slack
4. Testers click link → "Join as tester"
5. App appears in their Play Store
6. They tap "Install"

**Alternatively:**
1. Click **+** to add specific email addresses
2. Import from file (CSV)
3. Send invitations automatically

### Step 4: Testers Install App

Testers will:
1. Receive testing link or Play Store notification
2. Click link or search "Sol Cleaners" in Play Store
3. See "Beta" label and "Install" button
4. App installs on their Android device

---

## 📋 Pre-Build Checklist

Before your first build, verify:

### Code Quality
- ✅ No errors: `npm start` runs without warnings
- ✅ All Supabase credentials configured
- ✅ Test registration/login flow works
- ✅ Test order creation works
- ✅ Admin dashboard functional

### App Metadata
- ✅ `app.json` version set correctly
- ✅ `bundleIdentifier` (iOS) unique
- ✅ `package` (Android) unique
- ✅ Icon file exists at `./assets/icon.png`
- ✅ Splash image at `./assets/splash.png`

### Permissions & Privacy
- ✅ Privacy policy written
- ✅ Terms of service prepared
- ✅ Location permission explained (in code: `NSLocationWhenInUseUsageDescription`)
- ✅ Network permission explained (in code: `NSLocalNetworkUsageDescription`)

### Testing
- ✅ Tested on iOS simulator/device
- ✅ Tested on Android emulator/device
- ✅ Tested offline mode
- ✅ Tested order sync
- ✅ Tested SMS notifications

---

## 🔄 Update Workflow

For subsequent builds/updates:

### 1. Make Code Changes
```bash
# Edit files as needed
# Test locally: npx expo start
```

### 2. Increment Version Numbers

Edit `app.json`:
```json
{
  "version": "1.1.0",        // Increment here
  "ios": {
    "buildNumber": "2"        // Always increment
  },
  "android": {
    "versionCode": 2          // Always increment
  }
}
```

**Version number format:** `major.minor.patch`
- `1.0.0` → `1.0.1` (bug fix)
- `1.0.0` → `1.1.0` (new feature)
- `1.0.0` → `2.0.0` (breaking change)

### 3. Build New Versions
```bash
# iOS only
eas build --platform ios --profile preview

# Android only
eas build --platform android --profile preview

# Both
eas build --platform all --profile preview
```

### 4. Submit to Stores
```bash
eas submit --platform ios
eas submit --platform android
```

### 5. Notify Testers
- Manual update notification in TestFlight
- Automatic notification in Google Play
- Or send email with update notes

---

## 📐 Version Management Strategy

### Initial Release
- Version: `1.0.0`
- Build Numbers: iOS `1`, Android `1`

### Bug Fixes
- Version: `1.0.1`
- Build Numbers: iOS `2`, Android `2`

### Feature Updates
- Version: `1.1.0`
- Build Numbers: iOS `3`, Android `3`

### Major Updates
- Version: `2.0.0`
- Build Numbers: iOS `4`, Android `4`

**Always increment build numbers even if version stays same!**

---

## 🧪 Testing Phases

### Phase 1: Internal Closed Beta (Week 1-2)
- Testers: 2-3 core team members
- Platform: TestFlight + Google Play Internal
- Focus: Critical bugs, core functionality
- Feedback: Direct messaging, in-app logs

### Phase 2: Extended Beta (Week 3-4)
- Testers: 5-10 people
- Platform: TestFlight + Google Play
- Focus: User experience, edge cases
- Feedback: Google Form or Slack channel

### Phase 3: Public Beta (Week 5+)
- Testers: 50-100+ people
- Platform: TestFlight External + Google Play Beta
- Focus: Real-world usage patterns
- Feedback: App Store reviews, support email

### Phase 4: Production Release
- Remove beta labels
- Submit to App Store production track
- Make public in Google Play
- Announce to users

---

## 🐛 Common Build Issues & Fixes

### Issue: "Build Failed: Invalid Bundle ID"
**Solution:** Ensure `bundleIdentifier` in `app.json` matches your Apple Developer account

### Issue: "Build Failed: Gradle Error"
**Solution:** Run `eas build:clean` and try again

### Issue: "Submission Failed: Missing Privacy Policy"
**Solution:** Add privacy policy URL in App Store Connect before submission

### Issue: "Testers Can't Download (iOS)"
**Solution:** Ensure tester Apple ID matches TestFlight invite email

### Issue: "Testers Can't Download (Android)"
**Solution:** Ensure they've joined internal testing; Play Store cache may need refresh

---

## 📞 Support & Resources

- **EAS Documentation**: https://docs.expo.dev/build/setup/
- **TestFlight Guide**: https://developer.apple.com/testflight/
- **Google Play Internal Testing**: https://support.google.com/googleplay/android-developer/answer/3131213
- **Expo Support**: https://discord.gg/expo

---

## 📝 Tracking Beta Feedback

Create a simple feedback form:

```markdown
# Beta Feedback Form

**Tester Name:**
**Device:** (iPhone 13, Samsung S23, etc.)
**OS Version:**
**App Version:** (1.0.0, etc.)

## Bug Report
- **Description:**
- **Steps to Reproduce:**
- **Expected Behavior:**
- **Actual Behavior:**

## Feature Feedback
- **What works well:**
- **What needs improvement:**
- **Wishlist features:**

## Performance
- **Speed:** (Fast/Normal/Slow)
- **Crashes:** (Yes/No)
- **Offline sync:** (Works/Issues)
```

---

## ✅ Success Criteria for Beta

Before moving to production, verify:

- ✅ 95%+ successful registration
- ✅ Orders create and sync reliably
- ✅ No crash reports
- ✅ User feedback is positive
- ✅ Admin dashboard fully functional
- ✅ Offline mode works
- ✅ SMS notifications send (if enabled)
- ✅ No security issues reported

---

**Ready to build? Start with:**
```bash
npm install -g eas-cli
eas login
eas build:configure
```

Good luck with your beta launch! 🚀
