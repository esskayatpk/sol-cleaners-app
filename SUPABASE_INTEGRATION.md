# Supabase Integration Guide — Sol Cleaners App

## Overview
This guide integrates Supabase for:
- **Authentication** (customer signup/login)
- **Database** (orders, customers, profiles)
- **SMS via Edge Functions** (Twilio integration)
- **Real-time updates** (live order tracking)

---

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click **"New Project"**
3. Configure:
   - **Name**: `sol-cleaners`
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose closest to your users (e.g., us-east-1)
4. Click **"Create new project"** (takes 2-3 minutes)
5. Note your **Project URL** and **API Key** (anon key) from Settings > API

---

## Step 2: Install Supabase Client

```bash
npm install @supabase/supabase-js
```

---

## Step 3: Create Supabase Service File

Create `supabaseClient.js`:

```javascript
import { createClient } from '@supabase/supabase-js';
import logger from './logger';

const SUPABASE_URL = 'https://your-project.supabase.co'; // Replace with your URL
const SUPABASE_ANON_KEY = 'your-anon-key-here'; // Replace with your anon key

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Test connection
export const testConnection = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    logger.info('Supabase connected', { hasSession: !!data.session });
    return true;
  } catch (e) {
    logger.error('Supabase connection failed', { error: e.message });
    return false;
  }
};

export default supabase;
```

---

## Step 4: Create Database Tables

In Supabase Dashboard → **SQL Editor**, run these queries:

### 4.1 Customers Table
```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  address VARCHAR(500),
  city VARCHAR(100),
  zip VARCHAR(10),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read/update their own profile
CREATE POLICY "Users can view own profile"
ON customers FOR SELECT
USING (auth.uid()::text = id::text OR auth.role() = 'authenticated');
```

### 4.2 Orders Table
```sql
CREATE TABLE orders (
  id VARCHAR(50) PRIMARY KEY,
  order_number INT NOT NULL UNIQUE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  customer_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  address VARCHAR(500) NOT NULL,
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),
  num_items INT NOT NULL,
  note TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  pickup_date DATE NOT NULL,
  pickup_time VARCHAR(50) NOT NULL,
  payment_method VARCHAR(50),
  route_order INT,
  created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own orders, admins can read all
CREATE POLICY "Users can view own orders"
ON orders FOR SELECT
USING (customer_id = auth.uid() OR auth.role() = 'admin');
```

### 4.3 SMS Log Table
```sql
CREATE TABLE sms_log (
  id VARCHAR(50) PRIMARY KEY,
  order_id VARCHAR(50) REFERENCES orders(id) ON DELETE CASCADE,
  to_phone VARCHAR(20) NOT NULL,
  text TEXT NOT NULL,
  status VARCHAR(50),
  method VARCHAR(50),
  delivered BOOLEAN DEFAULT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE sms_log ENABLE ROW LEVEL SECURITY;

-- Policy: Admins only
CREATE POLICY "Admins can view SMS log"
ON sms_log FOR SELECT
USING (auth.role() = 'admin');
```

---

## Step 5: Update App.js for Supabase Auth

### Already in code (Line 309):
```javascript
// Save account locally (in production: Supabase Auth + customers table)
const customerData = { name: custName, phone: custPhone, email: custEmail, address: custAddress, city: custCity, zip: custZip };
await saveCustomer(customerData);
```

**UPDATE this section:**

```javascript
const handleCustRegister = async () => {
  setCustLoginError("");
  if (!custName.trim()) { setCustLoginError("Please enter your full name."); return; }
  if (!custPhone.trim()) { setCustLoginError("Please enter your phone number."); return; }
  if (!custEmail.trim() || !custEmail.includes("@")) { setCustLoginError("Please enter a valid email address."); return; }
  if (custPassword.length < 6) { setCustLoginError("Password must be at least 6 characters."); return; }
  if (!custAddress.trim()) { setCustLoginError("Please enter your street address."); return; }

  try {
    // Sign up with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: custEmail,
      password: custPassword,
    });
    
    if (authError) throw authError;
    
    // Create customer record in Supabase
    const { error: dbError } = await supabase
      .from('customers')
      .insert([{
        id: authData.user.id,
        email: custEmail,
        name: custName,
        phone: custPhone,
        address: custAddress,
        city: custCity,
        zip: custZip,
      }]);
    
    if (dbError) throw dbError;

    // Also save credentials locally for offline access
    await storage.saveCustomerCredentials(custEmail, custPassword);
    const customerData = { name: custName, phone: custPhone, email: custEmail, address: custAddress, city: custCity, zip: custZip };
    await saveCustomer(customerData);

    setCustLoggedIn(true);
    setCustAccountCreated(true);
    setScreen("home");
    logger.info("Customer registered with Supabase", { email: custEmail });
  } catch (e) {
    setCustLoginError(e.message || "Registration failed. Please try again.");
    logger.error("Customer registration failed", { error: e.message });
  }
};
```

---

## Step 6: Update Login to Use Supabase

**Find this in App.js (around line 326):**
```javascript
const handleCustLogin = async () => {
  setCustLoginError("");
  if (!custEmail.trim() || !custPassword.trim()) { setCustLoginError("Please enter email and password."); return; }

  try {
    const creds = await storage.getCustomerCredentials();
    const cust = await storage.getCustomer();
    
    if (creds && cust) {
      if (creds.email.toLowerCase() === custEmail.toLowerCase().trim() && creds.password === custPassword) {
        setCustName(cust.name);
        setCustPhone(cust.phone);
        setCustAddress(cust.address);
        setCustCity(cust.city);
        setCustZip(cust.zip);
        setCustLoggedIn(true);
        logger.info("Customer login successful", { email: custEmail });
        setScreen("home");
        return;
      }
    }
    setCustLoginError("Invalid email or password. Don't have an account? Tap Register below.");
```

**UPDATE to:**
```javascript
const handleCustLogin = async () => {
  setCustLoginError("");
  if (!custEmail.trim() || !custPassword.trim()) { setCustLoginError("Please enter email and password."); return; }

  try {
    // Try Supabase first
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: custEmail,
      password: custPassword,
    });

    if (!authError && authData.user) {
      // Get customer profile from Supabase
      const { data: custData, error: dbError } = await supabase
        .from('customers')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (dbError) throw dbError;

      setCustName(custData.name);
      setCustPhone(custData.phone);
      setCustAddress(custData.address);
      setCustCity(custData.city);
      setCustZip(custData.zip);
      setCustLoggedIn(true);
      
      // Save locally for offline access
      await storage.saveCustomer(custData);
      await storage.saveCustomerCredentials(custEmail, custPassword);
      
      logger.info("Customer login successful with Supabase", { email: custEmail });
      setScreen("home");
      return;
    }

    // Fallback to local storage
    const creds = await storage.getCustomerCredentials();
    const cust = await storage.getCustomer();
    
    if (creds && cust && creds.email.toLowerCase() === custEmail.toLowerCase().trim() && creds.password === custPassword) {
      setCustName(cust.name);
      setCustPhone(cust.phone);
      setCustAddress(cust.address);
      setCustCity(cust.city);
      setCustZip(cust.zip);
      setCustLoggedIn(true);
      logger.info("Customer login successful (local fallback)", { email: custEmail });
      setScreen("home");
      return;
    }

    setCustLoginError("Invalid email or password. Don't have an account? Tap Register below.");
    logger.warn("Login failed", { error: authError?.message || "Invalid credentials" });
  } catch (e) {
    logger.error("Login error", { error: e.message });
    setCustLoginError("Error signing in. Please try again.");
  }
};
```

---

## Step 7: Save Orders to Supabase

**Find this in App.js (around line 443):**
```javascript
setOrders(prev => [newOrder, ...prev]);
setOrderSuccess(newOrder);
```

**UPDATE to:**
```javascript
const saveOrderToSupabase = async () => {
  try {
    const { error } = await supabase
      .from('orders')
      .insert([{
        id: newOrder.id,
        order_number: newOrder.order_number,
        customer_id: (await supabase.auth.getSession()).data.session?.user.id,
        customer_name: newOrder.customer_name,
        phone: newOrder.phone,
        address: newOrder.address,
        lat: newOrder.lat,
        lng: newOrder.lng,
        num_items: newOrder.num_items,
        note: newOrder.note,
        status: newOrder.status,
        pickup_date: newOrder.pickup_date,
        pickup_time: newOrder.pickup_time,
        payment_method: newOrder.payment_method,
      }]);
    
    if (error) throw error;
    logger.info("Order saved to Supabase", { orderId: newOrder.id });
  } catch (e) {
    logger.error("Failed to save order to Supabase", { error: e.message });
  }
};

setOrders(prev => {
  const updated = [newOrder, ...prev];
  storage.saveOrders(updated).catch(e => logger.error("Failed to save order locally", { error: e.message }));
  saveOrderToSupabase();
  return updated;
});
```

---

## Step 8: Setup SMS via Supabase Edge Function

### Already in code (Line 478):
```javascript
// In production, these calls go through a Supabase Edge Function, NOT from the app directly
edgeFunctionUrl: "",  // e.g. "https://your-project.supabase.co/functions/v1/send-sms"
```

**Create Edge Function:**

1. In Supabase Dashboard → **Edge Functions** → **Create Function**
2. Name it `send-sms`
3. Replace code with:

```typescript
// supabase/functions/send-sms/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
const TWILIO_PHONE = Deno.env.get("TWILIO_PHONE");

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { to, body } = await req.json();

    const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        From: TWILIO_PHONE,
        To: to,
        Body: body,
      }).toString(),
    });

    const data = await response.json();
    return new Response(JSON.stringify({ success: !!data.sid, sid: data.sid }), {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
});
```

4. In Supabase Dashboard → **Settings** → **Secrets** → Add:
   - `TWILIO_ACCOUNT_SID`: Your Twilio SID
   - `TWILIO_AUTH_TOKEN`: Your Twilio token
   - `TWILIO_PHONE`: Your Twilio phone number (e.g., +1234567890)

5. Deploy and copy the function URL

---

## Step 9: Update SMS Configuration in App.js

**Find (Line 473):**
```javascript
const SMS_MODE = "native"; // "native" | "twilio"
const TWILIO_CONFIG = {
  accountSid: "",
  authToken: "",
  fromNumber: "",
  edgeFunctionUrl: "",
};
```

**UPDATE:**
```javascript
const SMS_MODE = "twilio"; // Change to "twilio" for production
const TWILIO_CONFIG = {
  accountSid: "", // No longer needed with Edge Function
  authToken: "", // No longer needed with Edge Function
  fromNumber: "", // No longer needed with Edge Function
  edgeFunctionUrl: "https://your-project.supabase.co/functions/v1/send-sms", // Add your URL here
};
```

---

## Step 10: Load Orders from Supabase on App Start

**Find (Line 224-246):**
```javascript
const initializeApp = async () => {
  try {
    await storage.initialize();
    await logger.initialize();
    
    // Load orders from storage
    const savedOrders = await storage.getOrders();
    if (savedOrders && savedOrders.length > 0) {
      setOrders(savedOrders);
    }
    
    await loadCustomer();
```

**ADD after loadCustomer():**
```javascript
    // Load orders from Supabase
    await loadOrdersFromSupabase();
```

**Add this function:**
```javascript
const loadOrdersFromSupabase = async () => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created', { ascending: false });
    
    if (error) throw error;
    if (data && data.length > 0) {
      setOrders(data);
      logger.info("Orders loaded from Supabase", { count: data.length });
    }
  } catch (e) {
    logger.warn("Failed to load orders from Supabase", { error: e.message });
  }
};
```

---

## Step 11: Admin Functions with Supabase

Update `updateOrderStatus` to save to Supabase:

```javascript
const updateOrderStatus = (orderId, newStatus) => {
  setOrders(prev => {
    const updated = prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o);
    
    // Save to Supabase
    supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId)
      .then(({ error }) => {
        if (error) logger.error("Failed to update order status in Supabase", { error: error.message });
        else logger.info("Order status updated in Supabase", { orderId, status: newStatus });
      });
    
    storage.saveOrders(updated).catch(e => logger.error("Failed to save locally", { error: e.message }));
    return updated;
  });
  
  // ... rest of SMS logic
};
```

---

## Summary of Changes

| Component | Location | Action |
|-----------|----------|--------|
| **Already written** | Line 309 | Comment about Supabase (not implemented yet) |
| **Already written** | Line 478 | TWILIO_CONFIG with Edge Function URL |
| **NEW** | `supabaseClient.js` | Create Supabase client |
| **UPDATE** | `App.js` imports | Add `import supabase from './supabaseClient'` |
| **UPDATE** | Line 309-318 | Implement `handleCustRegister` with Supabase |
| **UPDATE** | Line 326-360 | Implement `handleCustLogin` with Supabase fallback |
| **UPDATE** | Line 443-450 | Save orders to Supabase after creation |
| **UPDATE** | Line 224-230 | Load orders from Supabase on app start |
| **UPDATE** | Line 543-560 | Save order status changes to Supabase |
| **CREATE** | Supabase Dashboard | SMS Edge Function with Twilio |
| **UPDATE** | Line 473-479 | Configure TWILIO_CONFIG with Edge Function URL |

---

## Testing Checklist

- [ ] Supabase project created
- [ ] Database tables created
- [ ] `supabaseClient.js` created
- [ ] Customer signup works (check Supabase `customers` table)
- [ ] Customer login works
- [ ] Orders save to database
- [ ] Admin can view all orders
- [ ] Status updates sync to Supabase
- [ ] SMS sends via Edge Function
- [ ] App works offline with local storage fallback

---

## Security Notes

⚠️ **Never hardcode API keys in client code!** Use environment variables:

```bash
# Create .env.local
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Then in `supabaseClient.js`:
```javascript
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
```

---

## References

- [Supabase Docs](https://supabase.com/docs)
- [React Native + Supabase](https://supabase.com/docs/guides/getting-started/quickstarts/react-native)
- [Edge Functions](https://supabase.com/docs/guides/functions)
- [Twilio SMS Integration](https://www.twilio.com/docs/sms)
