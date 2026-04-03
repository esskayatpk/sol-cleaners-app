import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import logger from './logger';

// ─── Supabase Configuration ───
// Get these from Supabase Dashboard > Settings > API
const SUPABASE_URL = 'https://rvhpvvffhngxowkjanqz.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2aHB2dmZmaG5neG93a2phbnF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1ODA1MjYsImV4cCI6MjA4ODE1NjUyNn0.fT7VtX1bI9yEtTxt78cN0P4Q1Gn1ILbJXbK7YkfLDxw';

// Validate configuration
if (!SUPABASE_URL || SUPABASE_URL.includes('your-project')) {
  logger.warn('Supabase URL not configured. Using placeholder.');
}

// ─── Create Supabase Client ───
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    storage: AsyncStorage,
  },
});

// ─── Connection Test ───
export const testSupabaseConnection = async () => {
  try {
    logger.info('Testing Supabase connection', { url: SUPABASE_URL });
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    
    logger.info('Supabase connected successfully', {
      url: SUPABASE_URL.split('.')[0],
      hasSession: !!data.session,
    });
    return true;
  } catch (e) {
    console.log('DEBUG: Connection test failed:', e);
    logger.error('Supabase connection failed', { 
      error: e.message,
      url: SUPABASE_URL,
      errorCode: e.code,
      errorStatus: e.status,
    });
    return false;
  }
};

// ─── Customer Auth Functions ───

/**
 * Register a new customer with Supabase Auth
 * @param {string} email - Customer email
 * @param {string} password - Customer password (6+ chars)
 * @returns {Promise<{user: Object, error: string|null}>}
 */
export const registerCustomer = async (email, password) => {
  try {
    logger.info('Attempting to register customer with Supabase', { email, url: SUPABASE_URL });
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;

    logger.info('Customer registered with Supabase Auth', { email });
    return { user: data.user, error: null };
  } catch (e) {
    console.log('DEBUG: Full error object:', e);
    logger.error('Customer registration failed', { 
      error: e.message,
      errorCode: e.code,
      errorStatus: e.status,
      message: e.message,
    });
    return { user: null, error: e.message };
  }
};

/**
 * Login customer with email & password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{user: Object, session: Object, error: string|null}>}
 */
export const loginCustomer = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    logger.info('Customer login successful', { email });
    return { user: data.user, session: data.session, error: null };
  } catch (e) {
    logger.warn('Customer login failed', { error: e.message });
    return { user: null, session: null, error: e.message };
  }
};

/**
 * Restore a persisted Supabase session (no password needed).
 * Uses the refresh token stored in AsyncStorage by the Supabase client.
 */
export const restoreSession = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    if (data.session && data.session.user) {
      logger.info('Supabase session restored from storage', { email: data.session.user.email });
      return { user: data.session.user, session: data.session, error: null };
    }
    // Session expired — attempt a silent refresh
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError) throw refreshError;
    if (refreshData.session && refreshData.user) {
      logger.info('Supabase session refreshed', { email: refreshData.user.email });
      return { user: refreshData.user, session: refreshData.session, error: null };
    }
    return { user: null, session: null, error: 'No active session' };
  } catch (e) {
    logger.warn('Session restore failed', { error: e.message });
    return { user: null, session: null, error: e.message };
  }
};

/**
 * Logout customer
 */
export const logoutCustomer = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    
    logger.info('Customer logged out');
    return { error: null };
  } catch (e) {
    logger.error('Logout failed', { error: e.message });
    return { error: e.message };
  }
};

/**
 * Get current authenticated user
 */
export const getCurrentUser = async () => {
  try {
    const { data, error } = await supabase.auth.getUser();
    // "Auth session missing" is not a real error — user is simply not signed in via Supabase
    if (error) {
      logger.warn('No active Supabase session', { error: error.message });
      return null;
    }
    return data.user ?? null;
  } catch (e) {
    logger.warn('Failed to get current user', { error: e.message });
    return null;
  }
};

// ─── Customer Profile Functions ───

/**
 * Look up an existing customer by phone number (e.g. created in sol-pos).
 * Returns the first match or null.
 * @param {string} phone
 */
export const findCustomerByPhone = async (phone) => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('phone', phone)
      .maybeSingle();

    if (error) throw error;
    return { data, error: null };
  } catch (e) {
    logger.warn('findCustomerByPhone failed', { error: e.message });
    return { data: null, error: e.message };
  }
};

/**
 * Link an existing sol-pos customer row to a new Supabase auth user
 * by setting auth_user_id. The customer's original id (and all FK
 * references from orders) is left untouched.
 * @param {string} existingCustomerId - current row id in customers table
 * @param {string} newUserId - new Supabase auth uid
 * @param {Object} profileData - { email, address, city, zip }
 */
export const setCustomerAuthId = async (existingCustomerId, newUserId, profileData) => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .update({
        auth_user_id: newUserId,
        email: profileData.email,
        address: profileData.address,
        city: profileData.city,
        zip: profileData.zip,
      })
      .eq('id', existingCustomerId)
      .select()
      .single();

    if (error) throw error;
    logger.info('auth_user_id linked to existing sol-pos customer', { newUserId, existingCustomerId });
    return { data, error: null };
  } catch (e) {
    logger.error('Failed to set auth_user_id on customer', { error: e.message });
    return { data: null, error: e.message };
  }
};

/**
 * Create customer profile in database
 * @param {string} userId - Auth user ID
 * @param {Object} profileData - { name, phone, address, city, zip }
 */
export const createCustomerProfile = async (userId, profileData) => {
  try {
    // Use upsert so we don't duplicate a customer that already exists in sol-pos.
    // onConflict:'id' — if the row exists, update name/phone/address but leave
    // any sol-pos-only columns untouched.
    const { data, error } = await supabase
      .from('customers')
      .upsert([{
        id: userId,
        auth_user_id: userId,   // for new app-registered customers, both ids match
        email: profileData.email,
        name: profileData.name,
        phone: profileData.phone,
        address: profileData.address,
        city: profileData.city,
        zip: profileData.zip,
      }], { onConflict: 'id' })
      .select()
      .single();

    if (error) throw error;

    logger.info('Customer profile upserted in Supabase', { userId });
    return { data, error: null };
  } catch (e) {
    logger.error('Failed to upsert customer profile', { error: e.message });
    return { data: null, error: e.message };
  }
};

/**
 * Get customer profile.
 * For sol-pos customers the auth uid sits in auth_user_id, not id.
 * We try auth_user_id first, then fall back to id.
 * @param {string} userId - Supabase auth uid
 */
export const getCustomerProfile = async (userId) => {
  try {
    // Try auth_user_id match first (sol-pos linked customers)
    let { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('auth_user_id', userId)
      .maybeSingle();

    if (error) throw error;

    // Fall back to id match (new app-only customers where id === auth uid)
    if (!data) {
      const res = await supabase
        .from('customers')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      if (res.error) throw res.error;
      data = res.data;
    }

    if (!data) return { data: null, error: 'Profile not found' };
    return { data, error: null };
  } catch (e) {
    logger.warn('Failed to get customer profile', { error: e.message });
    return { data: null, error: e.message };
  }
};

/**
 * Update customer profile
 * @param {string} userId
 * @param {Object} updates - Fields to update
 */
export const updateCustomerProfile = async (userId, updates) => {
  try {
    // Prefer matching on auth_user_id so sol-pos-linked customers are found correctly.
    // Try auth_user_id first; if no row updated, fall back to id.
    let { data, error } = await supabase
      .from('customers')
      .update(updates)
      .eq('auth_user_id', userId)
      .select()
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      // New app-only customer where id === auth uid
      const res = await supabase
        .from('customers')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();
      if (res.error) throw res.error;
      data = res.data;
    }

    logger.info('Customer profile updated in Supabase', { userId });
    return { data, error: null };
  } catch (e) {
    logger.error('Failed to update customer profile', { error: e.message });
    return { data: null, error: e.message };
  }
};

// ─── Order Functions ───

/**
 * Get the next available order_number (max in DB + 1).
 * Falls back to the provided localMax if offline or on error.
 * @param {number} localMax - highest order_number known locally
 */
export const getNextOrderNumber = async (localMax = 1000) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('order_number')
      .order('order_number', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
    const dbMax = data?.order_number ?? 0;
    return Math.max(dbMax, localMax) + 1;
  } catch (e) {
    logger.warn('Could not fetch max order_number from Supabase, using local', { error: e.message });
    return localMax + 1;
  }
};

/**
 * Create new order
 * @param {Object} orderData
 */
export const createOrder = async (orderData) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .insert([orderData])
      .select()
      .single();

    if (error) throw error;

    logger.info('Order created in Supabase', { orderId: data.id });
    return { data, error: null };
  } catch (e) {
    logger.error('Failed to create order', { error: e.message });
    return { data: null, error: e.message };
  }
};

/**
 * Get all orders (admin only)
 */
export const getAllOrders = async () => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created', { ascending: false });

    if (error) throw error;

    logger.info('All orders fetched from Supabase', { count: data.length });
    return { data, error: null };
  } catch (e) {
    logger.error('Failed to fetch all orders', { error: e.message });
    return { data: null, error: e.message };
  }
};

/**
 * Get customer's orders
 * @param {string} userId - Supabase auth uid
 */
export const getCustomerOrders = async (userId) => {
  try {
    // For sol-pos-linked customers, orders are stored under the original customers.id,
    // not the auth uid. Resolve the actual customer row id first.
    let customerId = userId;
    const { data: profile } = await supabase
      .from('customers')
      .select('id')
      .or(`auth_user_id.eq.${userId},id.eq.${userId}`)
      .maybeSingle();
    if (profile?.id) customerId = profile.id;

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('customer_id', customerId)
      .order('created', { ascending: false });

    if (error) throw error;

    logger.info('Customer orders fetched from Supabase', { userId, customerId, count: data.length });
    return { data, error: null };
  } catch (e) {
    logger.error('Failed to fetch customer orders', { error: e.message });
    return { data: null, error: e.message };
  }
};

/**
 * Update order status
 * @param {string} orderId
 * @param {string} newStatus
 */
export const updateOrderStatus = async (orderId, newStatus) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw error;

    logger.info('Order status updated in Supabase', { orderId, status: newStatus });
    return { data, error: null };
  } catch (e) {
    logger.error('Failed to update order status', { error: e.message });
    return { data: null, error: e.message };
  }
};

/**
 * Soft-cancel an order: sets status='cancelled', records reason and timestamps.
 * deleted_at marks it as soft-deleted so the POS can filter/display accordingly.
 * @param {string} orderId
 * @param {string} reason - customer-provided cancellation reason
 */
export const appendOrderNote = async (orderId, note) => {
  try {
    const { error } = await supabase
      .from('orders')
      .update({ note, updated_at: new Date().toISOString() })
      .eq('id', orderId);
    if (error) throw error;
    logger.info('Order note updated', { orderId });
    return { error: null };
  } catch (e) {
    logger.warn('Failed to update order note', { error: e.message });
    return { error: e.message };
  }
};

export const cancelOrder = async (orderId, reason) => {
  try {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('orders')
      .update({
        status: 'cancelled',
        cancellation_reason: reason || null,
        cancelled_at: now,
        deleted_at: now,
        updated_at: now,
      })
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw error;

    logger.info('Order cancelled', { orderId, reason });
    return { data, error: null };
  } catch (e) {
    logger.error('Failed to cancel order', { error: e.message });
    return { data: null, error: e.message };
  }
};

/**
 * Update order route information
 * @param {string} orderId
 * @param {number} routeOrder
 * @param {string} status
 */
export const updateOrderRoute = async (orderId, routeOrder, status = 'pickup_scheduled') => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .update({
        route_order: routeOrder,
        status: status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw error;

    logger.info('Order route updated in Supabase', { orderId, routeOrder });
    return { data, error: null };
  } catch (e) {
    logger.error('Failed to update order route', { error: e.message });
    return { data: null, error: e.message };
  }
};

/**
 * Get orders for a specific pickup date
 * @param {string} pickupDate - Format: "2026-03-02"
 */
export const getOrdersByDate = async (pickupDate) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('pickup_date', pickupDate)
      .order('route_order', { ascending: true, nullsFirst: false });

    if (error) throw error;

    return { data, error: null };
  } catch (e) {
    logger.error('Failed to fetch orders by date', { error: e.message });
    return { data: null, error: e.message };
  }
};

// ─── SMS Log Functions ───

/**
 * Log SMS sent
 * @param {Object} smsData - { orderId, to, text, status, method, delivered }
 */
export const logSMS = async (smsData) => {
  try {
    const { data, error } = await supabase
      .from('sms_log')
      .insert([{
        id: smsData.id,
        order_id: smsData.orderId,
        to_phone: smsData.to,
        text: smsData.text,
        status: smsData.status,
        method: smsData.method,
        delivered: smsData.delivered,
      }])
      .select()
      .single();

    if (error) throw error;

    logger.info('SMS logged in Supabase', { to: smsData.to });
    return { data, error: null };
  } catch (e) {
    logger.error('Failed to log SMS', { error: e.message });
    return { data: null, error: e.message };
  }
};

/**
 * Get SMS log for an order
 * @param {string} orderId
 */
export const getOrderSMSLog = async (orderId) => {
  try {
    const { data, error } = await supabase
      .from('sms_log')
      .select('*')
      .eq('order_id', orderId)
      .order('timestamp', { ascending: false });

    if (error) throw error;

    return { data, error: null };
  } catch (e) {
    logger.error('Failed to fetch SMS log', { error: e.message });
    return { data: null, error: e.message };
  }
};

// ─── Real-time Subscriptions ───

/**
 * Subscribe to orders changes (real-time sync)
 * @param {Function} callback - Called when orders change
 * @returns {Function} Unsubscribe function
 */
export const subscribeToOrders = (callback) => {
  const channel = supabase
    .channel('orders-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'orders',
      },
      (payload) => {
        logger.info('Real-time order update received', {
          event: payload.eventType,
          orderId: payload.new?.id || payload.old?.id,
        });
        callback(payload);
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        logger.info('Subscribed to real-time orders');
      }
    });

  // Return unsubscribe function
  return () => {
    supabase.removeChannel(channel);
    logger.info('Unsubscribed from real-time orders');
  };
};

/**
 * Subscribe to customer profile changes
 * @param {string} userId
 * @param {Function} callback
 * @returns {Function} Unsubscribe function
 */
export const subscribeToCustomerProfile = (userId, callback) => {
  const channel = supabase
    .channel(`customer-${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'customers',
        filter: `id=eq.${userId}`,
      },
      (payload) => {
        logger.info('Real-time profile update received');
        callback(payload.new);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

// ─── Offline Sync Helper ───

/**
 * Sync local orders with Supabase
 * Called when app goes online to sync any pending changes
 * @param {Array} localOrders - Orders from SQLite
 */
export const syncOrdersWithSupabase = async (localOrders) => {
  try {
    if (!localOrders || localOrders.length === 0) {
      logger.info('No local orders to sync');
      return { synced: 0, error: null };
    }

    let synced = 0;

    for (const order of localOrders) {
      // Check if order exists in Supabase
      const { data: existing, error: checkError } = await supabase
        .from('orders')
        .select('id')
        .eq('id', order.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        // Error other than "not found"
        logger.warn('Error checking order in Supabase', { orderId: order.id, error: checkError.message });
        continue;
      }

      if (!existing) {
        // Order doesn't exist, insert it
        const { error } = await supabase
          .from('orders')
          .insert([order]);

        if (error) {
          logger.warn('Failed to sync order', { orderId: order.id, error: error.message });
          continue;
        }
        synced++;
      }
    }

    logger.info('Orders synced with Supabase', { synced, total: localOrders.length });
    return { synced, error: null };
  } catch (e) {
    logger.error('Sync failed', { error: e.message });
    return { synced: 0, error: e.message };
  }
};

// ─── Error Handling Helper ───

/**
 * Handle Supabase errors gracefully
 * @param {Error} error - Supabase error
 * @returns {string} User-friendly error message
 */
export const getErrorMessage = (error) => {
  if (!error) return 'Unknown error';

  const message = error.message || error.msg || String(error);

  if (message.includes('invalid_grant')) return 'Invalid email or password';
  if (message.includes('User already registered')) return 'Email already in use';
  if (message.includes('Invalid URL')) return 'Supabase not configured';
  if (message.includes('fetch')) return 'Network connection failed. Using offline mode.';
  if (message.includes('PGRST')) return 'Database error. Please try again.';

  return message;
};

export default supabase;
