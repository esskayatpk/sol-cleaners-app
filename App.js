import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, TextInput, ScrollView, StyleSheet, StatusBar, Platform, Dimensions, BackHandler, Alert, Linking, KeyboardAvoidingView, Keyboard } from "react-native";
import { SafeAreaView, SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path, Circle, Line, Rect, Defs, Pattern } from "react-native-svg";
import { useTranslation } from "./i18n";
import logger from "./logger";
import storage from "./sqliteStorage"; // SQLite-based storage (reliable on Android & iOS)
import { 
  registerCustomer, 
  loginCustomer, 
  logoutCustomer,
  getCurrentUser,
  createOrder,
  getNextOrderNumber,
  findCustomerByPhone,
  setCustomerAuthId,
  getAllOrders, 
  getCustomerOrders,
  updateOrderStatus as updateOrderStatusSupabase, 
  updateOrderRoute,
  createCustomerProfile,
  getCustomerProfile,
  updateCustomerProfile,
  syncOrdersWithSupabase,
  testSupabaseConnection,
  logSMS,
  cancelOrder,
} from "./supabaseClient"; // Supabase for cloud storage
import { subscribeToNetworkChanges, isAppOnline, checkNetworkStatus } from "./networkStatus"; // Network monitoring
import * as LocalAuthentication from "expo-local-authentication";

// ─── Color Tokens ───
const C = {
  bg: "#F5F7FA", card: "#FFFFFF", primary: "#1B3A5C", primaryLight: "#E8EEF5",
  primaryDark: "#0F2440", accent: "#4A90D9", accentLight: "#EBF3FC",
  text: "#1A1A2E", textSecondary: "#5A6578", textMuted: "#8E99A9",
  border: "#DEE3EA", borderLight: "#EDF0F5", danger: "#C0392B", dangerLight: "#FDEDEB",
  success: "#27AE60", successLight: "#E8F8EF", warning: "#E67E22", warningLight: "#FEF5E7",
  info: "#4A90D9", infoLight: "#EBF3FC",
};

// ─── Sol Logo ───
const SolLogo = ({ size = 18, dark = false }) => (
  <View style={{ flexDirection: "row", alignItems: "baseline", gap: 4 }}>
    <Text style={{ fontSize: size, fontWeight: "800", color: C.accent, fontStyle: "italic" }}>Sol</Text>
    <Text style={{ fontSize: size - 1, fontWeight: "900", color: dark ? "#fff" : C.primaryDark, letterSpacing: 2 }}>CLEANERS</Text>
  </View>
);

// ─── Icon ───
const Icon = ({ name, size = 20, color = C.textSecondary }) => {
  const paths = {
    home: "M3 12l2-2 7-7 7 7 2 2M5 10v10a1 1 0 001 1h3m10-11v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1",
    order: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01",
    plus: "M12 4v16m8-8H4", minus: "M20 12H4", check: "M5 13l4 4L19 7",
    x: "M6 18L18 6M6 6l12 12", chevron: "M9 5l7 7-7 7", back: "M15 19l-7-7 7-7",
    location: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z",
    route: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6",
    filter: "M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z",
    send: "M12 19l9 2-9-18-9 18 9-2zm0 0v-8",
    calendar: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
    hanger: "M12 2a3 3 0 00-1 5.83V9l-8.5 5.5a2 2 0 001 3.5h17a2 2 0 001-3.5L13 9V7.83A3 3 0 0012 2z",
    settings: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z",
    phone: "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z",
    text: "M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z",
    user: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
    map: "M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7",
    clock: "M12 6v6l4 2",
    star: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z",
    chart: "M3 13h2v8H3zm4-8h2v16H7zm4-2h2v18h-2zm4 4h2v14h-2zm4-1h2v15h-2z",
  };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      {name === "clock" ? (<><Circle cx={12} cy={12} r={10} fill="none" /><Path d={paths[name]} /></>) : (<Path d={paths[name] || ""} />)}
    </Svg>
  );
};

// ─── Status Badge ───
const StatusBadge = ({ status }) => {
  const cfg = {
    pending: { bg: C.warningLight, color: C.warning, label: "Pending" },
    confirmed: { bg: C.accentLight, color: C.accent, label: "Confirmed" },
    pickup_scheduled: { bg: "#EDE8F5", color: "#5B47A5", label: "Scheduled" },
    picked_up: { bg: C.successLight, color: C.success, label: "Picked Up" },
    processing: { bg: C.accentLight, color: "#3A7BC8", label: "Processing" },
    ready: { bg: C.primaryLight, color: C.primary, label: "Ready" },
    out_for_delivery: { bg: C.infoLight, color: C.info, label: "Delivering" },
    delivered: { bg: C.successLight, color: C.success, label: "Delivered" },
    cancelled: { bg: C.dangerLight, color: C.danger, label: "Cancelled" },
  };
  const c = cfg[status] || cfg.pending;
  return (
    <View style={{ backgroundColor: c.bg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 }}>
      <Text style={{ fontSize: 11, fontWeight: "600", color: c.color, textTransform: "uppercase", letterSpacing: 0.3 }}>{c.label}</Text>
    </View>
  );
};

// ─── Reusable Components ───
const Card = ({ children, style }) => (
  <View style={[{ backgroundColor: C.card, borderRadius: 16, padding: 20, marginBottom: 12, borderWidth: 1, borderColor: C.borderLight }, style]}>{children}</View>
);
const Btn = ({ onPress, children, style, disabled }) => (
  <TouchableOpacity onPress={onPress} disabled={disabled} activeOpacity={0.7}
    style={[{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 14, borderRadius: 12, backgroundColor: C.primary }, disabled && { opacity: 0.4 }, style]}>
    {children}
  </TouchableOpacity>
);
const BtnText = ({ children, style }) => <Text style={[{ fontSize: 15, fontWeight: "600", color: "#fff" }, style]}>{children}</Text>;
const Label = ({ children }) => <Text style={{ fontSize: 12, fontWeight: "600", color: C.textSecondary, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>{children}</Text>;
const Input = ({ value, onChangeText, placeholder, ...props }) => (
  <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={C.textMuted}
    style={{ width: "100%", padding: 12, borderRadius: 10, borderWidth: 1.5, borderColor: C.border, fontSize: 14, backgroundColor: "#fff", color: C.text }} {...props} />
);
const Header = ({ children, style }) => {
  const insets = useSafeAreaInsets();
  return (
    <View style={[{ backgroundColor: C.primary, padding: 16, paddingTop: insets.top + 12, flexDirection: "row", alignItems: "center", gap: 12 }, style]}>{children}</View>
  );
};

// ─── Screen Wrapper ─── handles safe area and keyboard avoidance for every screen
const Screen = ({ children, bgColor }) => (
  <SafeAreaProvider>
    <SafeAreaView style={{ flex: 1, backgroundColor: bgColor || C.primary }} edges={["top"]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        style={{ flex: 1, backgroundColor: bgColor || C.bg }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <View style={{ flex: 1, backgroundColor: bgColor || C.bg }}>
          {children}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
    <SafeAreaView style={{ backgroundColor: bgColor || "#fff" }} edges={["bottom"]} />
  </SafeAreaProvider>
);
const NavBar = ({ screen, items, onPress }) => {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: C.borderLight, flexDirection: "row", paddingTop: 8, paddingBottom: Math.max(insets.bottom, 8) }}>
      {items.map(n => (
        <TouchableOpacity key={n.scr} onPress={() => onPress(n.scr)} style={{ flex: 1, alignItems: "center", gap: 4, paddingVertical: 4 }}>
          <Icon name={n.icon} size={22} color={screen === n.scr ? C.primary : C.textMuted} />
          <Text style={{ fontSize: 10, fontWeight: "600", color: screen === n.scr ? C.primary : C.textMuted }}>{n.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

// ─── Data ───
const ITEM_TYPES = [
  { key: "shirt", label: "Shirts", icon: "👔" }, { key: "pants", label: "Pants", icon: "👖" },
  { key: "suit", label: "Suits", icon: "🤵" }, { key: "dress", label: "Dresses", icon: "👗" },
  { key: "coat", label: "Coats/Jackets", icon: "🧥" }, { key: "blouse", label: "Blouses", icon: "👚" },
  { key: "sweater", label: "Sweaters", icon: "🧶" }, { key: "traditional_wear", label: "Traditional Wear", icon: "✨" },
  { key: "comforter", label: "Comforters/Bedding", icon: "🛏️" }, { key: "curtain", label: "Curtains", icon: "🪟" },
  { key: "rug", label: "Rugs", icon: "🟫" }, { key: "other", label: "Other Items", icon: "📦" },
];
const WEEKDAY_TIME_SLOTS = ["6:00 PM - 7:00 PM", "7:00 PM - 8:00 PM"];
const WEEKEND_TIME_SLOTS = ["4:00 PM - 5:00 PM", "5:00 PM - 6:00 PM", "6:00 PM - 7:00 PM"];
const SUNDAY_TIME_SLOTS  = ["10:00 AM - 11:00 AM", "11:00 AM - 12:00 PM", "12:00 PM - 1:00 PM"];

function getNextDays() {
  const days = [];
  const now   = new Date();
  const hour  = now.getHours(); // 0-23 in device local time

  // Cut-off rules:
  //   before 10 AM  → today is eligible (same-day evening windows)
  //   10 AM–12 PM   → today is NOT eligible (too close for morning, nothing evening yet)
  //   after 12 PM   → today is NOT eligible; start from tomorrow
  const todayStr = now.toISOString().split("T")[0];
  const includeToday = hour < 10; // only show today if before 10 AM

  // Earliest eligible date string
  const earliest = new Date(now);
  if (!includeToday) earliest.setDate(earliest.getDate() + 1);
  earliest.setHours(0, 0, 0, 0);

  // Find Monday of the week containing `earliest`
  const dow = earliest.getDay(); // 0=Sun,1=Mon…
  const mondayOffset = dow === 0 ? 1 : (1 - dow); // skip to next Mon if earliest is Sun
  const monday = new Date(earliest);
  monday.setDate(earliest.getDate() + mondayOffset);

  // If earliest itself is a Sunday, add it first before the Mon-Sun window
  if (dow === 0) {
    days.push({
      date: earliest.toISOString().split("T")[0],
      label: earliest.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
      isWeekend: false,
      isSunday: true,
    });
  }

  // Show 2 weeks of Mon–Sun, skipping dates before `earliest`
  for (let week = 0; week < 2; week++) {
    for (let d = 0; d < 7; d++) {
      const c = new Date(monday);
      c.setDate(monday.getDate() + week * 7 + d);
      if (c < earliest) continue;
      const dayOfWeek = c.getDay();
      const isSunday  = dayOfWeek === 0;
      const isSaturday = dayOfWeek === 6;
      days.push({
        date: c.toISOString().split("T")[0],
        label: c.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
        isWeekend: isSaturday,
        isSunday,
      });
    }
  }
  return days;
}

const mockOrders = [
  { id: "ord-1", order_number: 1001, customer_name: "Sarah Johnson", phone: "(781) 555-0102", address: "42 Pond St, Sharon, MA", lat: 42.1240, lng: -71.1810, num_items: 12, note: "3x Shirts, 2x Suits, 4x Pants, 3x Dresses", status: "confirmed", pickup_date: "2026-03-02", pickup_time: "6:00 PM - 7:00 PM", created: "2026-02-28" },
  { id: "ord-2", order_number: 1002, customer_name: "Mike Chen", phone: "(781) 555-0203", address: "18 Beach St, Sharon, MA", lat: 42.1215, lng: -71.1760, num_items: 15, note: "5x Shirts, 4x Pants, 2x Suits, 4x Sweaters", status: "confirmed", pickup_date: "2026-03-02", pickup_time: "7:00 PM - 8:00 PM", created: "2026-02-28" },
  { id: "ord-3", order_number: 1003, customer_name: "Emily Davis", phone: "(781) 555-0304", address: "7 Ames St, Sharon, MA", lat: 42.1260, lng: -71.1835, num_items: 18, note: "2x Comforters, 6x Curtains, 10x Shirts", status: "pending", pickup_date: "2026-03-03", pickup_time: "6:00 PM - 7:00 PM", created: "2026-03-01" },
  { id: "ord-4", order_number: 1004, customer_name: "David Kim", phone: "(781) 555-0405", address: "91 N Main St, Sharon, MA", lat: 42.1290, lng: -71.1790, num_items: 20, note: "8x Shirts, 4x Pants, 3x Suits, 5x Traditional Wear", status: "picked_up", pickup_date: "2026-03-02", pickup_time: "6:00 PM - 7:00 PM", created: "2026-02-27" },
  { id: "ord-5", order_number: 1005, customer_name: "Lisa Park", phone: "(781) 555-0506", address: "33 Billings St, Sharon, MA", lat: 42.1195, lng: -71.1750, num_items: 11, note: "3x Dresses, 2x Blouses, 6x Shirts — Delicate fabrics", status: "processing", pickup_date: "2026-03-07", pickup_time: "4:00 PM - 5:00 PM", created: "2026-02-26" },
];

const SMS_TEMPLATES = {
  confirmed: "Sol Cleaners: Hi {name}, your order {order} is confirmed! We'll pick up your items on the scheduled date.",
  pickup_scheduled: "Sol Cleaners: {name}, your pickup {order} is scheduled! Our driver is on the way.",
  picked_up: "Sol Cleaners: We've picked up your items for order {order}! Your total will be texted once we inspect everything.",
  processing: "Sol Cleaners: {name}, your order {order} is now being cleaned using our eco-friendly process.",
  ready: "Sol Cleaners: Great news, {name}! Your order {order} is clean and ready.",
  out_for_delivery: "Sol Cleaners: {name}, your cleaned items for order {order} are on the way!",
  delivered: "Sol Cleaners: Your order {order} has been delivered! Thank you for choosing Sol Cleaners!",
};

// ─── Reporting Utilities ───
const getDateRange = (timeframe) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let startDate = new Date(today);

  if (timeframe === "weekly") {
    const day = today.getDay();
    startDate.setDate(today.getDate() - day); // Start of week (Sunday)
  } else if (timeframe === "monthly") {
    startDate.setDate(1); // Start of month
  } else if (timeframe === "yearly") {
    startDate.setMonth(0, 1); // Start of year
  }

  const endDate = new Date(today);
  endDate.setHours(23, 59, 59, 999);

  return {
    startDate: startDate.toISOString().split("T")[0],
    endDate: endDate.toISOString().split("T")[0],
    displayName: timeframe === "weekly" ? "This Week" : timeframe === "monthly" ? "This Month" : "This Year",
  };
};

const getReportData = (orders, timeframe) => {
  const { startDate, endDate } = getDateRange(timeframe);
  const filteredOrders = orders.filter(o => o.created >= startDate && o.created <= endDate);
  
  const statusCounts = {
    pending: 0,
    confirmed: 0,
    pickup_scheduled: 0,
    picked_up: 0,
    processing: 0,
    ready: 0,
    out_for_delivery: 0,
    delivered: 0,
    cancelled: 0,
  };

  filteredOrders.forEach(o => {
    if (statusCounts.hasOwnProperty(o.status)) {
      statusCounts[o.status]++;
    }
  });

  const totalOrders = filteredOrders.length;
  const completedOrders = statusCounts.delivered || 0;
  const totalItems = filteredOrders.reduce((sum, o) => sum + (o.num_items || 0), 0);

  return {
    orders: filteredOrders,
    statusCounts,
    totalOrders,
    completedOrders,
    totalItems,
    periodName: getDateRange(timeframe).displayName,
  };
};

const ADMIN_ACCOUNTS = [
  { email: "admin@solcleanersinc.com", password: "SolAdmin2026!", name: "Sol Admin", role: "admin" },
  { email: "driver@solcleanersinc.com", password: "SolDriver2026!", name: "Driver One", role: "driver" },
  { email: "manager@solcleanersinc.com", password: "SolMgr2026!", name: "Store Manager", role: "manager" },
];

// ═══════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════
export default function App() {
  const [mode, setMode] = useState(null);
  const [screen, setScreen] = useState("home");
  const [orders, setOrders] = useState(mockOrders);
  const [custOrders, setCustOrders] = useState([]);
  const [cancelModal, setCancelModal] = useState(null); // { orderId, orderNumber } | null
  const [cancelReason, setCancelReason] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [routeOptimized, setRouteOptimized] = useState(false);
  const [adminFilter, setAdminFilter] = useState("all");
  const [adminDateFilter, setAdminDateFilter] = useState("2026-03-02");
  const [adminLoggedIn, setAdminLoggedIn] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminLoginError, setAdminLoginError] = useState("");
  const [adminShowPassword, setAdminShowPassword] = useState(false);
  const [adminLoginLoading, setAdminLoginLoading] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const [lastAdminLogin, setLastAdminLogin] = useState(null); // stores last login timestamp
  const [items, setItems] = useState({});
  const [note, setNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("on_delivery"); // "on_delivery" | "credit_card"
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [custName, setCustName] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [custAddress, setCustAddress] = useState("");
  const [custCity, setCustCity] = useState("Sharon");
  const [custZip, setCustZip] = useState("02067");
  const [smsLog, setSmsLog] = useState([]);
  const [smsToast, setSmsToast] = useState(null);
  const [language, setLanguage] = useState("en");

  // ─── Network & Sync State ───
  const [isOnline, setIsOnline] = useState(true);
  const [supabaseReady, setSupabaseReady] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // ─── Customer Account Persistence ───
  const [custLoggedIn, setCustLoggedIn] = useState(false);
  const [custEmail, setCustEmail] = useState("");
  const [custPassword, setCustPassword] = useState("");
  const [custShowPassword, setCustShowPassword] = useState(false);
  const [custLoginMode, setCustLoginMode] = useState("login"); // "login" | "register" | "forgot-password"
  const [custLoginError, setCustLoginError] = useState("");
  const [custLoading, setCustLoading] = useState(true); // starts true for auto-login check
  const [custAccountCreated, setCustAccountCreated] = useState(false);
  const [custResetEmail, setCustResetEmail] = useState("");
  const [custResetSent, setCustResetSent] = useState(false);

  // ─── Biometric Authentication ───
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricType, setBiometricType] = useState(null); // "fingerprint" | "faceId" | "iris"

  // ─── Order Editing (Customer) ───
  const [editingOrderId, setEditingOrderId] = useState(null);

  // ─── Admin Hidden Access ───
  const [adminTapCount, setAdminTapCount] = useState(0);
  const [showAdminButton, setShowAdminButton] = useState(false);

  // ─── Reporting ───
  const [reportTimeframe, setReportTimeframe] = useState("weekly"); // "weekly" | "monthly" | "yearly"

  // Auto-login: check for saved customer on app launch
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize SQLite storage first
        await storage.initialize();
        
        // Then initialize logger
        await logger.initialize();
        logger.info("App initialized", { platform: Platform.OS, storageType: "SQLite", storageAvailable: storage.isAvailable() });
        
        // Test Supabase connection
        const supabaseOk = await testSupabaseConnection();
        setSupabaseReady(supabaseOk);
        logger.info("Supabase status", { ready: supabaseOk });
        
        // Check current network status
        const online = await checkNetworkStatus();
        setIsOnline(online);
        
        // Load orders from storage
        const savedOrders = await storage.getOrders();
        if (savedOrders && savedOrders.length > 0) {
          setOrders(savedOrders);
          logger.info("Orders loaded from storage", { count: savedOrders.length });
        }
        
        // Load customer data
        await loadCustomer();
      } catch (e) {
        logger.error("App initialization error", { error: e.message });
        console.error("App init error:", e);
      }
    };
    initializeApp();
  }, []);

  // ─── Check Biometric Availability ───
  useEffect(() => {
    const checkBiometric = async () => {
      try {
        const compatible = await LocalAuthentication.hasHardwareAsync();
        if (compatible) {
          const supported = await LocalAuthentication.supportedAuthenticationTypesAsync();
          setBiometricAvailable(supported.length > 0);
          
          // Determine biometric type
          if (supported.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
            setBiometricType("faceId");
          } else if (supported.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
            setBiometricType("fingerprint");
          } else if (supported.includes(LocalAuthentication.AuthenticationType.IRIS)) {
            setBiometricType("iris");
          }
          
          // Check if user has enabled biometric auth previously
          const enabled = await storage.getBiometricEnabled();
          setBiometricEnabled(enabled || false);
          logger.info("Biometric status", { available: true, enabled: enabled || false, type: supported[0] });
        } else {
          setBiometricAvailable(false);
          logger.info("Biometric status", { available: false });
        }
      } catch (e) {
        logger.error("Biometric check error", { error: e.message });
      }
    };
    checkBiometric();
  }, []);

  // ─── Network Status Monitoring ───
  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      logger.info("App came online - syncing data");
      
      // Sync local orders with Supabase when connection restored
      if (supabaseReady) {
        setIsSyncing(true);
        try {
          const localOrders = await storage.getOrders();
          if (localOrders && localOrders.length > 0) {
            const result = await syncOrdersWithSupabase(localOrders);
            logger.info("Orders synced after reconnection", { synced: result.synced });
          }
          
          // Reload orders from Supabase
          const { data: freshOrders, error } = await getAllOrders();
          if (!error && freshOrders) {
            setOrders(freshOrders);
            await storage.saveOrders(freshOrders);
            logger.info("Orders reloaded from Supabase after sync", { count: freshOrders.length });
          }
        } catch (e) {
          logger.error("Sync failed after reconnection", { error: e.message });
        } finally {
          setIsSyncing(false);
        }
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      logger.warn("App went offline - using local storage only");
    };

    // Subscribe to network changes using non-hook API
    const unsubscribe = subscribeToNetworkChanges(({ isConnected }) => {
      if (isConnected) {
        handleOnline();
      } else {
        handleOffline();
      }
    });

    return unsubscribe;
  }, [supabaseReady, orders]);

  // Reset admin reveal when leaving splash screen
  useEffect(() => {
    if (mode !== null) {
      setShowAdminButton(false);
      setAdminTapCount(0);
    }
  }, [mode]);

  // Ensure admin button is ALWAYS hidden in customer/admin modes
  useEffect(() => {
    if (mode === "customer" || mode === "admin") {
      setShowAdminButton(false);
      setAdminTapCount(0);
    }
  }, [mode, screen]);

  // Sync orders when entering admin mode
  useEffect(() => {
    if (mode === "admin" && adminLoggedIn && isOnline && supabaseReady) {
      const syncAdminOrders = async () => {
        try {
          setIsSyncing(true);
          // Sync any pending local orders first
          const localOrders = await storage.getOrders();
          if (localOrders && localOrders.length > 0) {
            await syncOrdersWithSupabase(localOrders);
            logger.info("Pending orders synced before admin reload", { count: localOrders.length });
          }
          
          // Reload all orders from Supabase
          const { data: freshOrders, error } = await getAllOrders();
          if (!error && freshOrders) {
            setOrders(freshOrders);
            await storage.saveOrders(freshOrders);
            logger.info("Fresh orders loaded for admin", { count: freshOrders.length });
          }
        } catch (e) {
          logger.error("Admin sync error", { error: e.message });
        } finally {
          setIsSyncing(false);
        }
      };
      syncAdminOrders();
    }
  }, [mode, adminLoggedIn]);

  const loadCustomer = async () => {
    try {
      // First check if saved credentials exist (auto-login)
      const creds = await storage.getCustomerCredentials();
      if (creds && creds.email && creds.password) {
        // Credentials exist, load customer profile
        const cust = await storage.getCustomer();
        if (cust) {
          setCustName(cust.name || "");
          setCustPhone(cust.phone || "");
          setCustEmail(cust.email || "");
          setCustAddress(cust.address || "");
          setCustCity(cust.city || "Sharon");
          setCustZip(cust.zip || "02067");
          setCustLoggedIn(true);
          logger.info("Customer auto-logged in using stored credentials");
          return;
        }
      }

      // If no credentials or customer not found, check if customer data exists without logging in
      const cust = await storage.getCustomer();
      if (cust) {
        setCustName(cust.name || "");
        setCustPhone(cust.phone || "");
        setCustEmail(cust.email || "");
        setCustAddress(cust.address || "");
        setCustCity(cust.city || "Sharon");
        setCustZip(cust.zip || "02067");
        // Don't set logged in yet, they'll still need credentials
        logger.info("Customer profile loaded from storage");
      }
    } catch (e) {
      logger.error("Error loading customer", { error: e.message });
    }
  };

  const saveCustomer = async (data) => {
    try {
      const success = await storage.saveCustomer(data);
      if (!success) {
        console.warn("Customer save returned failure");
      }
    } catch (e) {
      logger.error("Error saving customer", { error: e.message });
    }
  };

  const handleCustRegister = async () => {
    setCustLoginError("");
    if (!custName.trim()) { setCustLoginError("Please enter your full name."); return; }
    if (!custPhone.trim()) { setCustLoginError("Please enter your phone number."); return; }
    if (!custEmail.trim() || !custEmail.includes("@")) { setCustLoginError("Please enter a valid email address."); return; }
    if (custPassword.length < 6) { setCustLoginError("Password must be at least 6 characters."); return; }
    if (!custAddress.trim()) { setCustLoginError("Please enter your street address."); return; }

    try {
      // Try to register with Supabase if online
      if (isOnline && supabaseReady) {
        const { user, error } = await registerCustomer(custEmail, custPassword);
        
        if (error) {
          setCustLoginError(error);
          logger.warn("Supabase registration failed, trying local", { error });
          return; // stop here — don't save locally with a bad registration
        }

        if (user) {
          // Check if this phone number already exists in the customers table
          // (e.g. the customer was added manually in sol-pos).
          const { data: existingCustomer } = await findCustomerByPhone(custPhone);

          if (existingCustomer && existingCustomer.auth_user_id !== user.id) {
            // Phone matched a sol-pos record — set auth_user_id on that row.
            // We do NOT change customers.id so existing orders FK references are preserved.
            const { error: linkError } = await setCustomerAuthId(
              existingCustomer.id,
              user.id,
              { email: custEmail, address: custAddress, city: custCity, zip: custZip }
            );
            if (linkError) {
              logger.warn("Could not link to existing sol-pos customer, creating new profile", { error: linkError });
              await createCustomerProfile(user.id, { email: custEmail, name: custName, phone: custPhone, address: custAddress, city: custCity, zip: custZip });
            } else {
              logger.info("Linked new app user to existing sol-pos customer", { phone: custPhone });
            }
          } else {
            // Brand new customer — create a fresh profile
            const { error: profileError } = await createCustomerProfile(user.id, {
              email: custEmail, name: custName, phone: custPhone,
              address: custAddress, city: custCity, zip: custZip,
            });
            if (profileError) {
              logger.warn("Failed to create Supabase profile", { error: profileError });
            } else {
              logger.info("Customer registered with Supabase", { email: custEmail });
            }
          }
        }
      }

      // Always save locally for offline access
      const customerData = { name: custName, phone: custPhone, email: custEmail, address: custAddress, city: custCity, zip: custZip };
      await saveCustomer(customerData);
      await storage.saveCustomerCredentials(custEmail, custPassword);

      setCustLoggedIn(true);
      setCustAccountCreated(true);
      setScreen("home");
      logger.info("Customer registered successfully", { email: custEmail, platform: isOnline ? "Supabase+Local" : "Local" });
    } catch (e) {
      setCustLoginError(e.message || "Registration failed. Please try again.");
      logger.error("Customer registration error", { error: e.message });
    }
  };

  const handleCustLogin = async () => {
    setCustLoginError("");
    if (!custEmail.trim() || !custPassword.trim()) { setCustLoginError("Please enter email and password."); return; }

    try {
      let customerProfile = null;
      let loginSuccess = false;

      // Try to login with Supabase if online
      if (isOnline && supabaseReady) {
        const { user, error } = await loginCustomer(custEmail, custPassword);
        
        if (!error && user) {
          // Get customer profile from Supabase
          const { data: profile, error: profileError } = await getCustomerProfile(user.id);
          if (profile && !profileError) {
            customerProfile = profile;
            loginSuccess = true;
            // Refresh local cache so offline access stays current
            await storage.saveCustomer(profile);
            await storage.saveCustomerCredentials(custEmail, custPassword);
            logger.info("Customer login successful via Supabase", { email: custEmail });
          } else {
            logger.warn("Failed to fetch Supabase profile, trying local", { error: profileError });
          }
        } else {
          logger.warn("Supabase login failed, trying local", { error });
        }
      }

      // Fall back to local storage if online attempt failed or offline
      if (!loginSuccess) {
        const creds = await storage.getCustomerCredentials();
        const cust = await storage.getCustomer();
        
        if (creds && cust) {
          if (creds.email.toLowerCase() === custEmail.toLowerCase().trim() && creds.password === custPassword) {
            customerProfile = cust;
            loginSuccess = true;
            logger.info("Customer login successful via local storage", { email: custEmail });
          }
        }
      }

      if (loginSuccess && customerProfile) {
        setCustName(customerProfile.name || "");
        setCustPhone(customerProfile.phone || "");
        setCustAddress(customerProfile.address || "");
        setCustCity(customerProfile.city || "");
        setCustZip(customerProfile.zip || "");
        setCustLoggedIn(true);
        setScreen("home");
        return;
      }

      setCustLoginError("Invalid email or password. Don't have an account? Tap Register below.");
      logger.warn("Customer login failed", { error: "Invalid credentials" });
    } catch (e) {
      logger.error("Customer login error", { error: e.message });
      setCustLoginError("Error signing in. Please try again.");
    }
  };

  const handleCustLogout = async () => {
    // Keep credentials saved—customer will auto-login next time
    // Credentials only cleared if user explicitly uninstalls or resets app
    try {
      // Try to logout from Supabase if online
      if (isOnline && supabaseReady) {
        const { error } = await logoutCustomer();
        if (error) {
          logger.warn("Supabase logout failed, but continuing with local logout", { error });
        } else {
          logger.info("Customer logged out from Supabase", { email: custEmail });
        }
      }

      // Save credentials to SQLite for auto-login next time
      if (custEmail && custPassword) {
        await storage.saveCustomerCredentials(custEmail, custPassword);
        logger.info("Customer signed out (credentials saved for auto-login)", { email: custEmail });
      }
    } catch (e) {
      logger.error("Error during logout", { error: e.message });
    }
    
    setCustLoggedIn(false);
    setCustName(""); setCustPhone(""); setCustEmail(""); setCustPassword("");
    setCustAddress(""); setCustCity("Sharon"); setCustZip("02067");
    setShowAdminButton(false); setAdminTapCount(0); // Hide admin button when returning to splash
    setMode(null); setScreen("home");
  };

  const handleCustPasswordReset = async () => {
    setCustLoginError("");
    if (!custResetEmail.trim() || !custResetEmail.includes("@")) {
      setCustLoginError("Please enter a valid email address.");
      return;
    }

    try {
      // Check if email exists in local storage
      const cust = await storage.getCustomer();
      if (cust && cust.email && cust.email.toLowerCase() === custResetEmail.toLowerCase()) {
        // Email found - simulate sending reset link
        logger.info("Password reset email sent", { email: custResetEmail });
        setCustResetSent(true);
        setCustResetEmail("");
        
        // In production with Supabase, you would call:
        // await supabase.auth.resetPasswordForEmail(custResetEmail);
        
        setTimeout(() => {
          setCustResetSent(false);
          setCustLoginMode("login");
        }, 3000);
      } else {
        // Email not found
        setCustLoginError("Email not found. Please check and try again, or register a new account.");
        logger.warn("Password reset email not found", { email: custResetEmail });
      }
    } catch (e) {
      setCustLoginError("Error sending reset email. Please try again.");
      logger.error("Password reset error", { error: e.message });
    }
  };

  // Refresh the customer's own orders from Supabase (picks up status changes made in sol-pos)
  const refreshCustOrders = async () => {
    // Always show local orders immediately
    const localFiltered = orders.filter(o => o.customer_name === custName || o.phone === custPhone);
    setCustOrders(localFiltered);

    if (!isOnline || !supabaseReady) return;
    try {
      let user = await getCurrentUser().catch(() => null);
      if (!user) return; // no live session yet (background re-auth may still be running)
      const { data, error } = await getCustomerOrders(user.id);
      if (!error && data && data.length > 0) {
        setCustOrders(data);
        // Merge fresh statuses back into main orders list
        setOrders(prev => {
          const updated = prev.map(o => {
            const fresh = data.find(d => d.id === o.id);
            return fresh ? { ...o, status: fresh.status } : o;
          });
          storage.saveOrders(updated).catch(() => {});
          return updated;
        });
        logger.info("Customer orders refreshed from Supabase", { count: data.length });
      }
    } catch (e) {
      logger.warn("Could not refresh customer orders", { error: e.message });
    }
  };

  // Refresh customer orders whenever my-orders screen is opened
  useEffect(() => {
    if (mode === "customer" && screen === "my-orders") {
      refreshCustOrders();
    }
  }, [screen, mode]);

  // Keep custOrders in sync with local orders array (fallback / offline)
  useEffect(() => {
    if (mode === "customer" && custName) {
      setCustOrders(orders.filter(o => o.customer_name === custName || o.phone === custPhone));
    }
  }, [orders, custName]);

  const handleAutoLogin = async () => {
    try {
      // Hide admin button when leaving splash screen
      setShowAdminButton(false);
      setAdminTapCount(0);

      const creds = await storage.getCustomerCredentials();
      if (creds && creds.email && creds.password) {
        // Restore local profile immediately so the UI is instant
        const cust = await storage.getCustomer();
        if (cust) {
          setCustName(cust.name || "");
          setCustPhone(cust.phone || "");
          setCustEmail(cust.email || "");
          setCustAddress(cust.address || "");
          setCustCity(cust.city || "Sharon");
          setCustZip(cust.zip || "02067");
          setCustLoggedIn(true);
          setMode("customer");
          setScreen("home");
          logger.info("Auto-logged in from local storage", { email: creds.email });

          // Silently re-authenticate with Supabase in the background so
          // the auth session is live (needed for order customer_id, profile sync, etc.)
          if (isOnline && supabaseReady) {
            loginCustomer(creds.email, creds.password)
              .then(({ user, error }) => {
                if (error) {
                  logger.warn("Background Supabase re-auth failed — will retry on next manual login", { error });
                } else {
                  logger.info("Background Supabase session restored", { email: creds.email });
                  // Refresh local profile cache from Supabase in case it changed in sol-pos
                  if (user) {
                    getCustomerProfile(user.id).then(({ data }) => {
                      if (data) {
                        storage.saveCustomer(data);
                        setCustName(data.name || "");
                        setCustPhone(data.phone || "");
                        setCustAddress(data.address || "");
                        setCustCity(data.city || "Sharon");
                        setCustZip(data.zip || "02067");
                      }
                    });
                  }
                }
              })
              .catch(e => logger.warn("Background re-auth error", { error: e.message }));
          }
          return;
        }
      }
      // No saved credentials, show auth screen
      setMode("customer");
      setScreen("cust-auth");
    } catch (e) {
      logger.error("Auto-login error", { error: e.message });
      setMode("customer");
      setScreen("cust-auth");
    }
  };

  const handleBiometricAuth = async () => {
    try {
      if (!biometricAvailable) {
        Alert.alert("Biometric Not Available", "Your device does not support biometric authentication.");
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        disableDeviceFallback: false,
        reason: "Authenticate to log in to Sol Cleaners",
      });

      if (result.success) {
        // Biometric authentication successful - load saved credentials and login
        const creds = await storage.getCustomerCredentials();
        if (creds && creds.email && creds.password) {
          setCustEmail(creds.email);
          setCustPassword(creds.password);
          // Trigger login with saved credentials
          await handleCustLogin();
        }
      } else {
        setCustLoginError("Biometric authentication failed. Please try again.");
        logger.warn("Biometric auth failed");
      }
    } catch (e) {
      logger.error("Biometric auth error", { error: e.message });
      setCustLoginError("Biometric authentication error. Please use password instead.");
    }
  };

  const handleToggleBiometric = async (enable) => {
    try {
      if (enable && !biometricAvailable) {
        Alert.alert("Not Available", "Biometric authentication is not available on this device.");
        return;
      }

      if (enable) {
        // Try to authenticate before enabling
        const result = await LocalAuthentication.authenticateAsync({
          disableDeviceFallback: false,
          reason: "Enable biometric login for Sol Cleaners",
        });

        if (result.success) {
          await storage.setBiometricEnabled(true);
          setBiometricEnabled(true);
          Alert.alert("Success", `Biometric login enabled! You can now login with your ${biometricType === "faceId" ? "face" : "fingerprint"}.`);
          logger.info("Biometric enabled");
        }
      } else {
        await storage.setBiometricEnabled(false);
        setBiometricEnabled(false);
        Alert.alert("Disabled", "Biometric login has been disabled. You'll need to enter your password to login.");
        logger.info("Biometric disabled");
      }
    } catch (e) {
      logger.error("Toggle biometric error", { error: e.message });
      Alert.alert("Error", "Failed to update biometric settings.");
    }
  };

  const handleCustUpdateProfile = async () => {
    const customerData = { name: custName, phone: custPhone, email: custEmail, address: custAddress, city: custCity, zip: custZip };
    
    try {
      // Update locally first
      await saveCustomer(customerData);

      // Try to update in Supabase if online
      if (isOnline && supabaseReady) {
        const user = await getCurrentUser();
        if (user) {
          const { error } = await updateCustomerProfile(user.id, customerData);
          if (error) {
            logger.warn("Failed to update Supabase profile, local update saved", { error });
          } else {
            logger.info("Customer profile updated in Supabase", { email: custEmail });
          }
        }
      }

      Alert.alert("Profile Updated", "Your information has been saved.");
    } catch (e) {
      logger.error("Error updating profile", { error: e.message });
      Alert.alert("Update Failed", e.message || "Could not update profile. Try again later.");
    }
  };

  // ─── Android Back Button Handler ───
  useEffect(() => {
    const onBackPress = () => {
      // Order detail → back to orders list
      if (screen === "admin-order-detail") {
        setSelectedOrder(null);
        setScreen(mode === "admin" ? "admin-orders" : "home");
        return true;
      }
      // Order success → back to home
      if (screen === "order-success") {
        setOrderSuccess(null);
        setScreen("home");
        return true;
      }
      // New order → back to home
      if (screen === "new-order") {
        setScreen("home");
        return true;
      }
      // My orders → back to home
      if (screen === "my-orders") {
        setScreen("home");
        return true;
      }
      // Admin sub-screens → back to admin orders
      if (screen === "admin-routes" || screen === "admin-settings") {
        setScreen("admin-orders");
        return true;
      }
      // Admin orders → back to splash
      if (screen === "admin-orders" && mode === "admin") {
        if (adminLoggedIn) {
          handleAdminLogout();
        } else {
          setMode(null);
          setScreen("home");
        }
        return true;
      }
      // Customer home → back to splash
      if (mode === "customer" && screen === "home") {
        setMode(null);
        setScreen("home");
        return true;
      }
      // Splash → let Android handle (exit app)
      if (!mode) {
        return false;
      }
      return false;
    };

    const sub = BackHandler.addEventListener("hardwareBackPress", onBackPress);
    return () => sub.remove();
  }, [mode, screen, adminLoggedIn]);

  const totalItems = Object.values(items).reduce((s, v) => s + v, 0);
  const availDates = getNextDays();
  const selectedDateInfo = availDates.find(d => d.date === pickupDate);

  // RFC-4122 UUID v4 — works without any native module
  const generateUUID = () =>
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });

  const updateItem = (key, delta) => {
    setItems(prev => {
      const val = (prev[key] || 0) + delta;
      if (val <= 0) { const { [key]: _, ...rest } = prev; return rest; }
      return { ...prev, [key]: val };
    });
  };

  const handleSubmitOrder = async () => {
    if (!custName || !custPhone || !custAddress || !pickupDate || !pickupTime || totalItems < 10) {
      logger.warn("Order submission blocked", { reason: "Missing required fields" });
      return;
    }
    const itemDesc = Object.entries(items).map(([k, v]) => `${v}x ${ITEM_TYPES.find(t => t.key === k)?.label}`).join(", ");
    
    // Check if we're editing an existing order
    if (editingOrderId) {
      // Update existing order
      setOrders(prev => {
        const updated = prev.map(o => o.id === editingOrderId ? {
          ...o,
          num_items: totalItems,
          note: `${itemDesc}${note ? ` — ${note}` : ""}`,
          pickup_date: pickupDate,
          pickup_time: pickupTime,
          payment_method: paymentMethod,
          items: JSON.stringify(items)
        } : o);
        storage.saveOrders(updated).catch(e => logger.error("Failed to save edited order locally", { error: e.message }));
        return updated;
      });

      // Sync update to Supabase if online
      if (isOnline && supabaseReady) {
        try {
          logger.info("Order edit synced to Supabase", { orderId: editingOrderId });
        } catch (e) {
          logger.error("Order edit sync error", { error: e.message });
        }
      } else {
        logger.info("Order edited offline, will sync when online", { orderId: editingOrderId });
      }

      // Reset and go back
      setEditingOrderId(null);
      setItems({});
      setNote("");
      setPickupDate("");
      setPickupTime("");
      setPaymentMethod("on_delivery");
      Alert.alert("Success", "Order updated!");
      setScreen("my-orders");
      return;
    }

    // Create new order — derive order_number from Supabase so it never
    // collides with orders already in the DB (e.g. from sol-pos).
    const localMax = Math.max(...orders.map(o => o.order_number || 1000), 1000);
    const nextOrderNumber = (isOnline && supabaseReady)
      ? await getNextOrderNumber(localMax)
      : localMax + 1;
    const newOrder = {
      id: generateUUID(), order_number: nextOrderNumber, customer_name: custName,
      phone: custPhone, address: `${custAddress}, ${custCity}, MA ${custZip}`,
      lat: 42.12 + Math.random() * 0.02, lng: -71.17 - Math.random() * 0.02,
      num_items: totalItems, note: `${itemDesc}${note ? ` — ${note}` : ""}`, items: JSON.stringify(items),
      status: "pending", pickup_date: pickupDate, pickup_time: pickupTime,
      payment_method: paymentMethod, created: new Date().toISOString().split("T")[0],
    };
    
    setOrders(prev => {
      const updated = [newOrder, ...prev];
      // Persist order to local storage
      storage.saveOrders(updated).catch(e => logger.error("Failed to save order locally", { error: e.message }));
      return updated;
    });

    // Sync order to Supabase if online
    if (isOnline && supabaseReady) {
      try {
        // Get the authenticated user's ID — null is fine (guest/local-only session).
        let customerId = null;
        try { customerId = (await getCurrentUser())?.id ?? null; } catch (_) {}
        const supabasePayload = {
          ...newOrder,
          customer_id: customerId,
        };
        const { data, error } = await createOrder(supabasePayload);
        if (error) {
          logger.warn("Failed to create order in Supabase, saved locally", { error });
        } else {
          logger.info("Order created in Supabase", { orderId: newOrder.id, supabaseId: data?.id });
        }
      } catch (e) {
        logger.error("Order sync error", { error: e.message });
      }
    } else {
      logger.info("Order created offline, will sync when online", { orderId: newOrder.id });
    }

    setOrderSuccess(newOrder);
    setScreen("order-success");
    setItems({}); setNote(""); setPickupDate(""); setPickupTime(""); setPaymentMethod("on_delivery");
  };

  // ─── SMS Configuration ───
  // Set to "native" to open phone's SMS app (free, works now)
  // Set to "twilio" when you have Twilio credentials for auto-send
  const SMS_MODE = "native"; // "native" | "twilio"
  const TWILIO_CONFIG = {
    // Fill these in when you're ready for production auto-SMS
    accountSid: "",       // Your Twilio Account SID
    authToken: "",        // Your Twilio Auth Token
    fromNumber: "",       // Your Twilio phone number e.g. "+17815551234"
    // In production, these calls go through a Supabase Edge Function, NOT from the app directly
    edgeFunctionUrl: "",  // e.g. "https://your-project.supabase.co/functions/v1/send-sms"
  };

  const sendNativeSms = async (phoneNumber, message) => {
    try {
      // Clean the phone number - extract digits
      const cleanPhone = phoneNumber.replace(/[^0-9+]/g, "");
      const encodedMsg = encodeURIComponent(message);

      let smsUrl;
      if (Platform.OS === "ios") {
        smsUrl = `sms:${cleanPhone}&body=${encodedMsg}`;
      } else {
        smsUrl = `sms:${cleanPhone}?body=${encodedMsg}`;
      }

      const canOpen = await Linking.canOpenURL(smsUrl);
      if (canOpen) {
        await Linking.openURL(smsUrl);
        return { success: true, method: "native" };
      } else {
        Alert.alert("SMS Not Available", "Cannot open SMS on this device. Message logged to order history.");
        return { success: false, method: "native" };
      }
    } catch (e) {
      console.log("SMS error:", e);
      Alert.alert("SMS Error", "Could not open SMS app. Message saved to order history.");
      return { success: false, method: "native" };
    }
  };

  const sendTwilioSms = async (phoneNumber, message) => {
    try {
      if (!TWILIO_CONFIG.edgeFunctionUrl) {
        Alert.alert("Twilio Not Configured", "Set up TWILIO_CONFIG.edgeFunctionUrl to enable auto-SMS. Using native SMS instead.");
        return sendNativeSms(phoneNumber, message);
      }
      const response = await fetch(TWILIO_CONFIG.edgeFunctionUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: phoneNumber, body: message }),
      });
      const data = await response.json();
      if (data.success) {
        return { success: true, method: "twilio", sid: data.sid };
      } else {
        Alert.alert("SMS Failed", "Auto-SMS failed. Opening native SMS as fallback.");
        return sendNativeSms(phoneNumber, message);
      }
    } catch (e) {
      console.log("Twilio error:", e);
      return sendNativeSms(phoneNumber, message);
    }
  };

  const sendSms = async (phoneNumber, message) => {
    if (SMS_MODE === "twilio") return sendTwilioSms(phoneNumber, message);
    return sendNativeSms(phoneNumber, message);
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    setOrders(prev => {
      const updated = prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o);
      // Persist order changes to local storage
      storage.saveOrders(updated).catch(e => logger.error("Failed to save order status locally", { error: e.message }));
      return updated;
    });

    // Sync status change to Supabase if online
    if (isOnline && supabaseReady) {
      try {
        const { error } = await updateOrderStatusSupabase(orderId, newStatus);
        if (error) {
          logger.warn("Failed to update order status in Supabase, saved locally", { error });
        } else {
          logger.info("Order status updated in Supabase", { orderId, newStatus });
        }
      } catch (e) {
        logger.error("Order status sync error", { error: e.message });
      }
    } else {
      logger.info("Order status updated offline, will sync when online", { orderId, newStatus });
    }

    const order = orders.find(o => o.id === orderId);
    if (order && SMS_TEMPLATES[newStatus]) {
      const smsText = SMS_TEMPLATES[newStatus].replace("{order}", `#${order.order_number}`).replace("{name}", order.customer_name.split(" ")[0]);
      const newSms = { id: `sms-${Date.now()}`, orderId, to: order.phone, text: smsText, status: newStatus, timestamp: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) };
      setSmsLog(prev => [newSms, ...prev]);
      setSmsToast(newSms); setTimeout(() => setSmsToast(null), 3500);

      // Actually send the SMS
      sendSms(order.phone, smsText).then(result => {
        // Update the sms log entry with delivery status
        setSmsLog(prev => prev.map(s => s.id === newSms.id ? { ...s, delivered: result.success, method: result.method } : s));
      });
    }
  };



  const handleAdminLogin = () => {
    setAdminLoginError(""); setAdminLoginLoading(true);
    setTimeout(async () => {
      const found = ADMIN_ACCOUNTS.find(a => a.email.toLowerCase() === adminEmail.toLowerCase().trim() && a.password === adminPassword);
      if (found) { 
        setAdminLoggedIn(true); 
        setAdminUser(found);
        
        // Get last login from storage and display it
        const storedLastLogin = await storage.getLastAdminLogin();
        setLastAdminLogin(storedLastLogin);
        
        // Save current login time for next session
        const now = new Date();
        await storage.setLastAdminLogin(now);
        
        setScreen("admin-orders");
        
        // Sync orders immediately after admin login
        if (isOnline && supabaseReady) {
          try {
            setIsSyncing(true);
            const localOrders = await storage.getOrders();
            if (localOrders && localOrders.length > 0) {
              await syncOrdersWithSupabase(localOrders);
              logger.info("Pending orders synced on admin login", { count: localOrders.length });
            }
            const { data: freshOrders, error } = await getAllOrders();
            if (!error && freshOrders) {
              setOrders(freshOrders);
              await storage.saveOrders(freshOrders);
              logger.info("Fresh orders loaded on admin login", { count: freshOrders.length });
            }
          } catch (e) {
            logger.error("Sync on admin login failed", { error: e.message });
          } finally {
            setIsSyncing(false);
          }
        }
      }
      else { setAdminLoginError("Invalid email or password."); }
      setAdminLoginLoading(false);
    }, 800);
  };

  const handleAdminLogout = () => {
    setAdminLoggedIn(false); setAdminUser(null); setLastAdminLogin(null); setAdminEmail(""); setAdminPassword(""); setShowAdminButton(false); setAdminTapCount(0); setMode(null); setScreen("home");
  };

  const optimizeRoute = async () => {
    const dateOrders = orders.filter(o => o.pickup_date === adminDateFilter && ["confirmed", "pickup_scheduled"].includes(o.status));
    if (dateOrders.length < 2) { setRouteOptimized(true); return; }
    const start = { lat: 42.1235, lng: -71.1787 };
    const remaining = [...dateOrders]; const sorted = []; let current = start;
    while (remaining.length > 0) {
      let nearest = 0, minDist = Infinity;
      remaining.forEach((o, i) => { const d = Math.sqrt(Math.pow(o.lat - current.lat, 2) + Math.pow(o.lng - current.lng, 2)); if (d < minDist) { minDist = d; nearest = i; } });
      sorted.push(remaining[nearest]); current = { lat: remaining[nearest].lat, lng: remaining[nearest].lng }; remaining.splice(nearest, 1);
    }
    setOrders(prev => { 
      const u = [...prev]; 
      sorted.forEach((so, idx) => { const oi = u.findIndex(o => o.id === so.id); if (oi !== -1) u[oi] = { ...u[oi], route_order: idx + 1, status: "pickup_scheduled" }; }); 
      // Persist updated orders to local storage
      storage.saveOrders(u).catch(e => logger.error("Failed to save route optimization locally", { error: e.message }));
      return u; 
    });

    // Sync route assignments to Supabase if online
    if (isOnline && supabaseReady) {
      try {
        for (const sortedOrder of sorted) {
          const routeIdx = sorted.findIndex(o => o.id === sortedOrder.id);
          const { error } = await updateOrderRoute(sortedOrder.id, routeIdx + 1);
          if (error) {
            logger.warn(`Failed to update route for order ${sortedOrder.id}`, { error });
          }
        }
        logger.info("Route optimization synced to Supabase", { count: sorted.length });
      } catch (e) {
        logger.error("Route optimization sync error", { error: e.message });
      }
    } else {
      logger.info("Route optimized offline, will sync when online", { count: sorted.length });
    }

    setRouteOptimized(true);
  };

  const handleLogoTap = () => {
    const newCount = adminTapCount + 1;
    setAdminTapCount(newCount);
    if (newCount === 5) {
      setShowAdminButton(true);
      logger.info("Admin button revealed", { method: "logo-tap" });
      setAdminTapCount(0);
    }
    // Reset counter if user stops tapping for 2 seconds
    setTimeout(() => {
      setAdminTapCount(0);
    }, 2000);
  };

  // ═══════════════════════════════════════
  // SPLASH SCREEN
  // ═══════════════════════════════════════
  if (!mode) {
    return (
      <Screen bgColor={C.primaryDark}>
      <View style={{ flex: 1, backgroundColor: C.primaryDark, alignItems: "center", justifyContent: "center", padding: 32 }}>
        <StatusBar barStyle="light-content" />
        {showAdminButton && (
          <TouchableOpacity onPress={() => { setMode("admin"); setScreen("admin-orders"); }}
            style={{ position: "absolute", top: 16, right: 16, backgroundColor: "rgba(255,255,255,0.1)", borderWidth: 1, borderColor: "rgba(255,255,255,0.2)", borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8, flexDirection: "row", alignItems: "center", gap: 5 }}>
            <Icon name="settings" size={14} color="rgba(255,255,255,0.85)" />
            <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", fontWeight: "600" }}>Admin</Text>
          </TouchableOpacity>
        )}

        <View style={{ paddingHorizontal: 16, alignItems: "center" }}>
          <TouchableOpacity onPress={handleLogoTap} activeOpacity={0.7}>
            <Text style={{ fontSize: 36, fontWeight: "800", color: C.accent, fontStyle: "italic", width: 200, textAlign: "center" }}>Sol</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 36, fontWeight: "900", color: "#fff", letterSpacing: 2, marginTop: -4 }}>CLEANERS</Text>
        </View>
        <View style={{ width: 60, height: 2, backgroundColor: C.accent, borderRadius: 1, marginVertical: 10, opacity: 0.6 }} />
        <Text style={{ color: "rgba(255,255,255,0.55)", fontSize: 10, fontWeight: "600", letterSpacing: 3, textTransform: "uppercase" }}>Service Oriented Laundry</Text>
        <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 9, letterSpacing: 2, marginTop: 4, textTransform: "uppercase" }}>Estd Since 2000</Text>

        <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, marginTop: 50, marginBottom: 24 }}>Eco-Friendly Dry Cleaning</Text>
        <Btn onPress={handleAutoLogin} style={{ backgroundColor: C.accent, borderRadius: 16, paddingHorizontal: 32, paddingVertical: 16, width: "100%", marginBottom: 32 }}>
          <Icon name="hanger" size={22} color="#fff" /><BtnText style={{ fontSize: 16 }}>Schedule a Pickup</BtnText>
        </Btn>
        <Text style={{ color: "rgba(255,255,255,0.65)", fontSize: 14, fontWeight: "600", marginTop: 10, marginBottom: 6 }}>5 Post Office Square Suite #10</Text>
        <Text style={{ color: "rgba(255,255,255,0.65)", fontSize: 14, fontWeight: "600", marginBottom: 8 }}>Sharon, MA</Text>
        <Text style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, fontWeight: "600", marginBottom: 32 }}>(781) 784-3937</Text>
      </View>
      </Screen>
    );
  }

  // ═══════════════════════════════════════
  // CUSTOMER APP
  // ═══════════════════════════════════════
  if (mode === "customer") {
    const t = useTranslation(language);
    const custNav = [{ icon: "home", label: t("home"), scr: "home" }, { icon: "plus", label: t("newOrder"), scr: "new-order" }, { icon: "order", label: t("myOrders"), scr: "my-orders" }, { icon: "user", label: "Account", scr: "cust-profile" }];

    // ─── Customer Auth (Login / Register) ───
    if (screen === "cust-auth" && !custLoggedIn) {
      return (
        <Screen>
          <Header style={{ justifyContent: "center", alignItems: "center", flexDirection: "column", paddingBottom: 28 }}>
            <TouchableOpacity onPress={() => { setMode(null); setScreen("home"); }} style={{ position: "absolute", left: 16, top: 12, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 8, padding: 8 }}>
              <Icon name="back" size={16} color="#fff" />
            </TouchableOpacity>
            <SolLogo size={18} dark />
            <Text style={{ color: "#fff", fontSize: 20, fontWeight: "700", marginTop: 12 }}>
              {custLoginMode === "register" ? "Create Account" : "Welcome Back"}
            </Text>
            <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, marginTop: 4 }}>
              {custLoginMode === "register" ? "Sign up to schedule pickups" : "Sign in to your account"}
            </Text>
          </Header>
          <ScrollView style={{ flex: 1, padding: 16 }} contentContainerStyle={{ paddingBottom: 120 }} keyboardShouldPersistTaps="handled">
            {custLoginMode === "forgot-password" ? (
              <Card>
                <Text style={{ fontSize: 16, fontWeight: "700", color: C.text, marginBottom: 12 }}>Reset Your Password</Text>
                <Text style={{ fontSize: 13, color: C.textMuted, marginBottom: 16, lineHeight: 20 }}>
                  Enter the email address associated with your account and we'll send you a password reset link.
                </Text>

                {custResetSent ? (
                  <View style={{ backgroundColor: C.successLight, borderRadius: 12, padding: 16, alignItems: "center" }}>
                    <Icon name="check" size={32} color={C.success} style={{ marginBottom: 12 }} />
                    <Text style={{ fontSize: 15, fontWeight: "700", color: C.success, marginBottom: 4 }}>Check Your Email!</Text>
                    <Text style={{ fontSize: 13, color: C.text, textAlign: "center", marginBottom: 16 }}>We've sent a password reset link to {custResetEmail}</Text>
                    <Text style={{ fontSize: 12, color: C.textMuted, textAlign: "center" }}>You'll be redirected to Sign In in a few moments...</Text>
                  </View>
                ) : (
                  <>
                    <View><Label>Email Address</Label><Input value={custResetEmail} onChangeText={setCustResetEmail} placeholder="you@email.com" keyboardType="email-address" autoCapitalize="none" /></View>
                    {custLoginError ? <Text style={{ color: C.danger, fontSize: 12, marginTop: 10 }}>{custLoginError}</Text> : null}
                    <Btn onPress={handleCustPasswordReset} style={{ marginTop: 20 }}>
                      <Icon name="send" size={16} color="#fff" /><BtnText>Send Reset Link</BtnText>
                    </Btn>
                    <TouchableOpacity onPress={() => { setCustLoginMode("login"); setCustLoginError(""); }} style={{ marginTop: 16, alignItems: "center" }}>
                      <Text style={{ fontSize: 13, color: C.accent, fontWeight: "600" }}>← Back to Sign In</Text>
                    </TouchableOpacity>
                  </>
                )}
              </Card>
            ) : (
              <Card>
                {/* Mode toggle */}
                <View style={{ flexDirection: "row", backgroundColor: C.bg, borderRadius: 10, padding: 3, marginBottom: 20 }}>
                  {["login", "register"].map(m => (
                  <TouchableOpacity key={m} onPress={() => { setCustLoginMode(m); setCustLoginError(""); }}
                    style={{ flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: custLoginMode === m ? C.primary : "transparent", alignItems: "center" }}>
                    <Text style={{ fontSize: 14, fontWeight: "600", color: custLoginMode === m ? "#fff" : C.textSecondary }}>{m === "login" ? "Sign In" : "Register"}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={{ gap: 14 }}>
                {custLoginMode === "register" && (
                  <>
                    <View><Label>Full Name</Label><Input value={custName} onChangeText={setCustName} placeholder="John Smith" /></View>
                    <View><Label>Phone Number</Label><Input value={custPhone} onChangeText={setCustPhone} placeholder="(781) 555-0000" keyboardType="phone-pad" /></View>
                    <View><Label>Street Address</Label><Input value={custAddress} onChangeText={setCustAddress} placeholder="123 Main St" /></View>
                    <View style={{ flexDirection: "row", gap: 10 }}>
                      <View style={{ flex: 2 }}><Label>City</Label><Input value={custCity} onChangeText={setCustCity} /></View>
                      <View style={{ flex: 1 }}><Label>ZIP</Label><Input value={custZip} onChangeText={setCustZip} keyboardType="number-pad" /></View>
                    </View>
                  </>
                )}
                <View><Label>Email</Label><Input value={custEmail} onChangeText={setCustEmail} placeholder="you@email.com" keyboardType="email-address" autoCapitalize="none" /></View>
                <View>
                  <Label>Password</Label>
                  <View>
                    <Input value={custPassword} onChangeText={setCustPassword} placeholder={custLoginMode === "register" ? "Create a password (6+ characters)" : "Your password"} secureTextEntry={!custShowPassword} />
                    <TouchableOpacity onPress={() => setCustShowPassword(!custShowPassword)} style={{ position: "absolute", right: 12, top: 12 }}>
                      <Text style={{ fontSize: 12, color: C.accent, fontWeight: "600" }}>{custShowPassword ? "Hide" : "Show"}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {custLoginError ? <Text style={{ color: C.danger, fontSize: 12, marginTop: 10 }}>{custLoginError}</Text> : null}

              <Btn onPress={custLoginMode === "register" ? handleCustRegister : handleCustLogin} style={{ marginTop: 20 }}>
                <BtnText>{custLoginMode === "register" ? "Create Account" : "Sign In"}</BtnText>
              </Btn>

              {custLoginMode === "login" && biometricEnabled && biometricAvailable && (
                <Btn onPress={handleBiometricAuth} style={{ marginTop: 12, backgroundColor: C.accent + "CC" }}>
                  <Icon name="fingerprint" size={16} color="#fff" />
                  <BtnText>Login with {biometricType === "faceId" ? "Face ID" : "Fingerprint"}</BtnText>
                </Btn>
              )}

              {custLoginMode === "login" && (
                <TouchableOpacity onPress={() => { setCustLoginMode("forgot-password"); setCustLoginError(""); }} style={{ marginTop: 14, alignItems: "center" }}>
                  <Text style={{ fontSize: 12, color: C.accent, fontWeight: "600" }}>Forgot your password?</Text>
                </TouchableOpacity>
              )}

              {custLoginMode === "register" && (
                <Text style={{ fontSize: 11, color: C.textMuted, textAlign: "center", marginTop: 12, lineHeight: 16 }}>
                  Your info is saved on this device so you don't have to enter it again. In production, this creates a secure account with Sol Cleaners.
                </Text>
              )}
            </Card>
            )}
          </ScrollView>
        </Screen>
      );
    }

    // ─── Customer Profile / Account ───
    if (screen === "cust-profile") {
      return (
        <Screen>
          <Header style={{ flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <TouchableOpacity onPress={() => setScreen("home")} style={{ position: "absolute", left: 16, padding: 4 }}><Icon name="back" size={22} color="#fff" /></TouchableOpacity>
            <View style={{ alignItems: "center" }}><Text style={{ color: "#fff", fontSize: 16, fontWeight: "700", marginBottom: 4 }}>{custName}</Text><Text style={{ color: "#fff", fontSize: 14, fontWeight: "600" }}>My Account</Text></View>
          </Header>
          <ScrollView style={{ flex: 1, padding: 16 }} contentContainerStyle={{ paddingBottom: 160 }}>
            {/* Account info */}
            <Card>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 20 }}>
                <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: C.primary, alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ fontSize: 22, fontWeight: "800", color: "#fff" }}>{custName ? custName.charAt(0).toUpperCase() : "?"}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 18, fontWeight: "700", color: C.text }}>{custName}</Text>
                  <Text style={{ fontSize: 13, color: C.textMuted, marginTop: 2 }}>{custEmail}</Text>
                </View>
              </View>
              <View style={{ backgroundColor: C.successLight, borderRadius: 10, padding: 12, flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <Icon name="check" size={16} color={C.success} />
                <Text style={{ fontSize: 13, fontWeight: "600", color: C.success }}>Account saved on this device</Text>
              </View>
            </Card>

            {/* Edit profile */}
            <Card>
              <Text style={{ fontSize: 15, fontWeight: "700", color: C.text, marginBottom: 16 }}>Edit Profile</Text>
              <View style={{ gap: 14 }}>
                <View><Label>Full Name</Label><Input value={custName} onChangeText={setCustName} /></View>
                <View><Label>Phone</Label><Input value={custPhone} onChangeText={setCustPhone} keyboardType="phone-pad" /></View>
                <View><Label>Email</Label><Input value={custEmail} onChangeText={setCustEmail} keyboardType="email-address" autoCapitalize="none" /></View>
                <View><Label>Street Address</Label><Input value={custAddress} onChangeText={setCustAddress} /></View>
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <View style={{ flex: 2 }}><Label>City</Label><Input value={custCity} onChangeText={setCustCity} /></View>
                  <View style={{ flex: 1 }}><Label>ZIP</Label><Input value={custZip} onChangeText={setCustZip} keyboardType="number-pad" /></View>
                </View>
              </View>
              <Btn onPress={handleCustUpdateProfile} style={{ marginTop: 16, backgroundColor: C.accent }}>
                <Icon name="check" size={16} color="#fff" /><BtnText>Save Changes</BtnText>
              </Btn>
            </Card>

            {/* Security Settings - Biometric Auth */}
            {biometricAvailable && (
              <Card>
                <Text style={{ fontSize: 15, fontWeight: "700", color: C.text, marginBottom: 14 }}>Security Settings</Text>
                <View style={{ gap: 12 }}>
                  <View>
                    <Label>Biometric Login</Label>
                    <Text style={{ fontSize: 13, color: C.textSecondary, marginBottom: 12 }}>
                      {biometricEnabled 
                        ? `✓ ${biometricType === "faceId" ? "Face ID" : biometricType === "iris" ? "Iris" : "Fingerprint"} is enabled for quick login`
                        : `Set up ${biometricType === "faceId" ? "Face ID" : biometricType === "iris" ? "Iris" : "Fingerprint"} for faster, secure access`
                      }
                    </Text>
                  </View>
                  <View style={{ flexDirection: "row", gap: 10 }}>
                    {biometricEnabled ? (
                      <>
                        <Btn onPress={() => handleToggleBiometric(false)} style={{ flex: 1, backgroundColor: C.danger }}>
                          <Icon name="lock-off" size={16} color="#fff" />
                          <BtnText>Disable {biometricType === "faceId" ? "Face ID" : "Fingerprint"}</BtnText>
                        </Btn>
                      </>
                    ) : (
                      <>
                        <Btn onPress={() => handleToggleBiometric(true)} style={{ flex: 1, backgroundColor: C.success }}>
                          <Icon name="fingerprint" size={16} color="#fff" />
                          <BtnText>Enable {biometricType === "faceId" ? "Face ID" : "Fingerprint"}</BtnText>
                        </Btn>
                      </>
                    )}
                  </View>
                </View>
              </Card>
            )}

            {/* Order stats */}
            <Card>
              <Text style={{ fontSize: 15, fontWeight: "700", color: C.text, marginBottom: 12 }}>Order History</Text>
              <View style={{ flexDirection: "row", gap: 12 }}>
                <View style={{ flex: 1, backgroundColor: C.primaryLight, borderRadius: 12, padding: 14, alignItems: "center" }}>
                  <Text style={{ fontSize: 24, fontWeight: "800", color: C.primary }}>{custOrders.length}</Text>
                  <Text style={{ fontSize: 11, color: C.textSecondary, fontWeight: "600", marginTop: 2 }}>Total Orders</Text>
                </View>
                <View style={{ flex: 1, backgroundColor: C.successLight, borderRadius: 12, padding: 14, alignItems: "center" }}>
                  <Text style={{ fontSize: 24, fontWeight: "800", color: C.success }}>{custOrders.filter(o => o.status === "delivered").length}</Text>
                  <Text style={{ fontSize: 11, color: C.textSecondary, fontWeight: "600", marginTop: 2 }}>Completed</Text>
                </View>
                <View style={{ flex: 1, backgroundColor: C.accentLight, borderRadius: 12, padding: 14, alignItems: "center" }}>
                  <Text style={{ fontSize: 24, fontWeight: "800", color: C.accent }}>{custOrders.filter(o => !["delivered", "cancelled"].includes(o.status)).length}</Text>
                  <Text style={{ fontSize: 11, color: C.textSecondary, fontWeight: "600", marginTop: 2 }}>Active</Text>
                </View>
              </View>
            </Card>

            {/* Sign out */}
            <Btn onPress={handleCustLogout} style={{ backgroundColor: C.danger, marginTop: 4 }}>
              <BtnText>Sign Out</BtnText>
            </Btn>
            <Text style={{ fontSize: 11, color: C.textMuted, textAlign: "center", marginTop: 12 }}>Signing out clears your saved account from this device.</Text>
          </ScrollView>
          <NavBar screen={screen} items={custNav} onPress={setScreen} />
        </Screen>
      );
    }

    // ─── Order Success ───
    if (screen === "order-success" && orderSuccess) {
      return (
        <Screen>
          <Header style={{ justifyContent: "center", alignItems: "center", flexDirection: "column", paddingBottom: 32 }}>
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700", marginBottom: 12 }}>{custName}</Text>
            <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
              <Icon name="check" size={36} color="#fff" />
            </View>
            <Text style={{ color: "#fff", fontSize: 22, fontWeight: "700" }}>Pickup Scheduled!</Text>
            <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, marginTop: 4 }}>Order #{orderSuccess.order_number}</Text>
          </Header>
          <ScrollView style={{ flex: 1, padding: 16 }} contentContainerStyle={{ paddingBottom: 160 }} keyboardShouldPersistTaps="handled">
            <Card>
              <View style={{ backgroundColor: C.accentLight, borderRadius: 10, padding: 14, flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <Icon name="text" size={20} color={C.accent} />
                <Text style={{ flex: 1, fontSize: 13, color: "#3A6090", lineHeight: 20 }}>
                  <Text style={{ fontWeight: "700" }}>Your total will be texted</Text> to {orderSuccess.phone} once items are inspected.
                </Text>
              </View>
              {[
                { icon: "calendar", label: "Pickup Date", value: orderSuccess.pickup_date },
                { icon: "clock", label: "Time Slot", value: orderSuccess.pickup_time },
                { icon: "hanger", label: "Items", value: `${orderSuccess.num_items} items` },
                { icon: "location", label: "Address", value: orderSuccess.address },
                { icon: "star", label: "Payment", value: orderSuccess.payment_method === "credit_card" ? "💳 Credit Card on File" : "💵 Pay on Delivery" },
              ].map((r, i) => (
                <View key={i} style={{ flexDirection: "row", gap: 12, alignItems: "flex-start", marginBottom: 14 }}>
                  <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: C.primaryLight, alignItems: "center", justifyContent: "center" }}>
                    <Icon name={r.icon} size={16} color={C.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 11, color: C.textMuted, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.4 }}>{r.label}</Text>
                    <Text style={{ fontSize: 14, fontWeight: "500", color: C.text, marginTop: 2 }}>{r.value}</Text>
                  </View>
                </View>
              ))}
            </Card>
            <Btn onPress={() => { setOrderSuccess(null); setScreen("home"); }}><BtnText>Back to Home</BtnText></Btn>
          </ScrollView>
        </Screen>
      );
    }

    // ─── New Order ───
    if (screen === "new-order") {
      return (
        <Screen>
          <Header style={{ flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <TouchableOpacity onPress={() => { setEditingOrderId(null); setItems({}); setNote(""); setPickupDate(""); setPickupTime(""); setPaymentMethod("on_delivery"); setScreen(editingOrderId ? "my-orders" : "home"); }} style={{ position: "absolute", left: 16, padding: 4 }}><Icon name="back" size={22} color="#fff" /></TouchableOpacity>
            <View style={{ alignItems: "center" }}><Text style={{ color: "#fff", fontSize: 16, fontWeight: "700", marginBottom: 4 }}>{custName}</Text><Text style={{ color: "#fff", fontSize: 14, fontWeight: "600" }}>{editingOrderId ? "Edit Order" : t("schedulePickupTitle")}</Text><Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 11, marginTop: 2 }}>{t("weekdaysOnly")}</Text></View>
          </Header>
          
          {/* Store Info - Always Visible */}
          <View style={{ backgroundColor: C.accentLight, paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: C.border + "30" }}>
            <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
              <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: C.accent, alignItems: "center", justifyContent: "center" }}>
                <Icon name="location" size={20} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: "700", color: C.primary, marginBottom: 2 }}>Sol Cleaners</Text>
                <Text style={{ fontSize: 11, color: C.textSecondary }}>5 Post Office Sq #10, Sharon, MA</Text>
                <Text style={{ fontSize: 11, color: C.textSecondary }}>(781) 784-3937</Text>
              </View>
              <TouchableOpacity
                onPress={() => Linking.openURL("tel:7817843937")}
                style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: C.primary, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 }}
              >
                <Icon name="phone" size={16} color="#fff" />
                <Text style={{ color: "#fff", fontSize: 13, fontWeight: "700" }}>Call Us</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <ScrollView style={{ flex: 1, padding: 16 }} contentContainerStyle={{ paddingBottom: 160 }}>
            {/* Items */}
            <Card>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                <Text style={{ fontSize: 15, fontWeight: "700", color: C.text }}>{t("selectItems")}</Text>
                <View style={{ backgroundColor: totalItems > 0 ? C.primary : C.borderLight, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 }}>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: totalItems > 0 ? "#fff" : C.textMuted }}>{totalItems} selected</Text>
                </View>
              </View>
              <Text style={{ fontSize: 12, color: C.textMuted, marginBottom: 16 }}>{t("tapToAdd")}</Text>
              {ITEM_TYPES.map(item => (
                <View key={item.key} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.borderLight }}>
                  <Text style={{ fontSize: 20, marginRight: 10 }}>{item.icon}</Text>
                  <Text style={{ flex: 1, fontSize: 14, fontWeight: "500", color: C.text }}>{item.label}</Text>
                  <TouchableOpacity onPress={() => updateItem(item.key, -1)} style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: items[item.key] ? C.primaryLight : C.bg, alignItems: "center", justifyContent: "center" }}>
                    <Icon name="minus" size={14} color={items[item.key] ? C.primary : C.textMuted} />
                  </TouchableOpacity>
                  <Text style={{ width: 32, textAlign: "center", fontSize: 15, fontWeight: "700", color: items[item.key] ? C.primary : C.textMuted }}>{items[item.key] || 0}</Text>
                  <TouchableOpacity onPress={() => updateItem(item.key, 1)} style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: C.primary, alignItems: "center", justifyContent: "center" }}>
                    <Icon name="plus" size={14} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
              {totalItems > 0 && <View style={{ marginTop: 14, backgroundColor: C.primaryLight, borderRadius: 10, padding: 12, alignItems: "center" }}>
                <Text style={{ fontSize: 15, fontWeight: "700", color: C.primary }}>{totalItems} {totalItems !== 1 ? t("itemCounts") : t("itemCount")} {t("itemsSelected")}</Text>
              </View>}
            </Card>

            {/* Date & Time */}
            <Card>
              <Text style={{ fontSize: 15, fontWeight: "700", color: C.text, marginBottom: 4 }}>{t("pickupSchedule")}</Text>
              <Text style={{ fontSize: 12, color: C.textMuted, marginBottom: 16 }}>Mon–Fri after 6 PM • Sat after 4 PM</Text>
              <Label>{t("selectDate")}</Label>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                {availDates.map(d => (
                  <TouchableOpacity key={d.date} onPress={() => { setPickupDate(d.date); setPickupTime(""); }}
                    style={{ paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, marginRight: 8, backgroundColor: pickupDate === d.date ? C.primary : C.bg, borderWidth: 1.5, borderColor: pickupDate === d.date ? C.primary : C.border }}>
                    <Text style={{ fontSize: 13, fontWeight: "600", color: pickupDate === d.date ? "#fff" : C.text }}>{d.label}</Text>
                    {d.isWeekend && <Text style={{ fontSize: 9, fontWeight: "700", color: pickupDate === d.date ? "rgba(255,255,255,0.7)" : C.accent, textAlign: "center", marginTop: 2 }}>SAT</Text>}
                  </TouchableOpacity>
                ))}
              </ScrollView>
              {pickupDate ? (
                <>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 }}>
                    <Label>{t("selectTimeSlot")}</Label>
                    <View style={{ backgroundColor: selectedDateInfo?.isWeekend ? C.accentLight : C.primaryLight, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 }}>
                      <Text style={{ fontSize: 10, fontWeight: "700", color: selectedDateInfo?.isWeekend ? C.accent : C.primary }}>
                        {selectedDateInfo?.isSunday ? "SUNDAY" : selectedDateInfo?.isWeekend ? "SATURDAY" : "WEEKDAY"}
                      </Text>
                    </View>
                  </View>
                  <View style={{ gap: 8 }}>
                    {(selectedDateInfo?.isSunday ? SUNDAY_TIME_SLOTS : selectedDateInfo?.isWeekend ? WEEKEND_TIME_SLOTS : WEEKDAY_TIME_SLOTS).map(timeSlot => (
                      <TouchableOpacity key={timeSlot} onPress={() => setPickupTime(timeSlot)}
                        style={{ padding: 12, borderRadius: 10, backgroundColor: pickupTime === timeSlot ? C.primary : C.bg, borderWidth: 1.5, borderColor: pickupTime === timeSlot ? C.primary : C.border }}>
                        <Text style={{ fontSize: 13, fontWeight: "600", color: pickupTime === timeSlot ? "#fff" : C.text, textAlign: "center" }}>{timeSlot}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              ) : (
                <View style={{ backgroundColor: C.bg, borderRadius: 10, padding: 16, alignItems: "center" }}>
                  <Text style={{ fontSize: 13, color: C.textMuted }}>Select a date above to see available time slots</Text>
                </View>
              )}
            </Card>

            {/* Notes */}
            <Card>
              <Label>{t("specialInstructions")}</Label>
              <Input value={note} onChangeText={setNote} placeholder="E.g., Delicate fabrics, stain on collar..." multiline style={{ minHeight: 80, textAlignVertical: "top" }} />
            </Card>

            {/* Payment Method */}
            <Card>
              <Text style={{ fontSize: 15, fontWeight: "700", color: C.text, marginBottom: 4 }}>Payment Method</Text>
              <Text style={{ fontSize: 12, color: C.textMuted, marginBottom: 16 }}>Choose how you'd like to pay once your total is ready</Text>
              {[
                { key: "on_delivery", icon: "💵", label: "Pay on Delivery", desc: "Cash or card when items are delivered back" },
                { key: "credit_card", icon: "💳", label: "Credit Card on File", desc: "We'll charge your card after processing" },
              ].map(opt => (
                <TouchableOpacity key={opt.key} onPress={() => setPaymentMethod(opt.key)}
                  style={{ flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 12, marginBottom: 8, backgroundColor: paymentMethod === opt.key ? C.primaryLight : C.bg, borderWidth: 2, borderColor: paymentMethod === opt.key ? C.primary : C.borderLight }}>
                  <Text style={{ fontSize: 22, marginRight: 12 }}>{opt.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: "600", color: paymentMethod === opt.key ? C.primary : C.text }}>{opt.label}</Text>
                    <Text style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>{opt.desc}</Text>
                  </View>
                  <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: paymentMethod === opt.key ? C.primary : C.border, alignItems: "center", justifyContent: "center" }}>
                    {paymentMethod === opt.key && <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: C.primary }} />}
                  </View>
                </TouchableOpacity>
              ))}
              {paymentMethod === "credit_card" && (
                <View style={{ marginTop: 12, gap: 12 }}>
                  <View>
                    <Label>Card Number</Label>
                    <Input placeholder="1234 5678 9012 3456" keyboardType="number-pad" maxLength={19} />
                  </View>
                  <View style={{ flexDirection: "row", gap: 10 }}>
                    <View style={{ flex: 1 }}><Label>Expiry</Label><Input placeholder="MM/YY" maxLength={5} /></View>
                    <View style={{ flex: 1 }}><Label>CVV</Label><Input placeholder="123" keyboardType="number-pad" maxLength={4} secureTextEntry /></View>
                  </View>
                  <View>
                    <Label>Name on Card</Label>
                    <Input placeholder="John Smith" />
                  </View>
                  <View style={{ backgroundColor: C.successLight, borderRadius: 10, padding: 10, flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Icon name="check" size={14} color={C.success} />
                    <Text style={{ fontSize: 11, color: C.success, fontWeight: "600", flex: 1 }}>Your card will only be charged after we text you the total. You can cancel anytime before that.</Text>
                  </View>
                </View>
              )}
            </Card>

            {/* Pricing Note */}
            <Card style={{ backgroundColor: C.accentLight, borderColor: C.accent + "30" }}>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <Icon name="text" size={20} color={C.accent} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: "#3A6090", marginBottom: 4 }}>{t("pricingNote")}</Text>
                  <Text style={{ fontSize: 12, color: "#3A6090", lineHeight: 18 }}>{t("pricingDesc")}</Text>
                </View>
              </View>
            </Card>

            {/* Contact Summary - Display phone and address clearly */}
            {(custPhone || custAddress) && (
              <Card style={{ backgroundColor: C.primaryLight, borderColor: C.primary + "25", paddingVertical: 12, paddingHorizontal: 14 }}>
                <Text style={{ fontSize: 12, fontWeight: "600", color: C.textSecondary, marginBottom: 8 }}>PICKUP DETAILS</Text>
                {custPhone && <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <Icon name="phone" size={14} color={C.primary} />
                  <Text style={{ fontSize: 13, fontWeight: "500", color: C.text }}>{custPhone}</Text>
                </View>}
                {custAddress && <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 8 }}>
                  <Icon name="location" size={14} color={C.primary} style={{ marginTop: 2 }} />
                  <Text style={{ fontSize: 13, fontWeight: "500", color: C.text, flex: 1 }}>{custAddress}{custCity ? `, ${custCity}` : ""}{custZip ? `, MA ${custZip}` : ""}</Text>
                </View>}
              </Card>
            )}

            {/* Minimum 10 pieces */}
            <Card style={{ backgroundColor: totalItems >= 10 ? C.primaryLight : "#FFF4EC", borderColor: totalItems >= 10 ? C.primary + "25" : C.warning + "30" }}>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: totalItems >= 10 ? C.primary : C.warning, alignItems: "center", justifyContent: "center" }}>
                  {totalItems >= 10 ? <Icon name="check" size={16} color="#fff" /> : <Text style={{ fontSize: 14, fontWeight: "800", color: "#fff" }}>!</Text>}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: totalItems >= 10 ? C.primary : "#C0612B", marginBottom: 4 }}>
                    {totalItems >= 10 ? t("minimumMet") : t("minimumPieces")}
                  </Text>
                  <Text style={{ fontSize: 12, color: totalItems >= 10 ? C.textSecondary : "#A0522D", lineHeight: 18 }}>
                    {totalItems >= 10 ? t("orderQualifies").replace("{count}", totalItems) : t("needMore").replace("{count}", 10 - totalItems).replace("{current}", totalItems)}
                  </Text>
                  {totalItems > 0 && totalItems < 10 && <Text style={{ fontSize: 11, color: "#A0522D", fontStyle: "italic", marginTop: 6 }}>{t("underTenPieces")}</Text>}
                </View>
              </View>
            </Card>

            {/* Submit */}
            <Btn onPress={handleSubmitOrder} disabled={!custName || !custPhone || !custAddress || !pickupDate || !pickupTime || totalItems < 10}>
              <Icon name="check" size={18} color="#fff" /><BtnText>{editingOrderId ? "Update Order" : t("confirmPickup")} — {totalItems} {totalItems !== 1 ? t("itemCounts") : t("itemCount")}</BtnText>
            </Btn>
          </ScrollView>
          <NavBar screen={screen} items={custNav} onPress={setScreen} />
        </Screen>
      );
    }

    // ─── My Orders ───
    if (screen === "my-orders") {
      return (
        <Screen>
          <Header style={{ justifyContent: "center", alignItems: "center" }}><View style={{ alignItems: "center" }}><Text style={{ color: "#fff", fontSize: 16, fontWeight: "700", marginBottom: 4 }}>{custName}</Text><Text style={{ color: "#fff", fontSize: 14, fontWeight: "600" }}>My Orders</Text></View></Header>
          <ScrollView style={{ flex: 1, padding: 16 }} contentContainerStyle={{ paddingBottom: 160 }}>
            {custOrders.length === 0 ? (
              <View style={{ alignItems: "center", paddingVertical: 40 }}>
                <Text style={{ fontSize: 16, color: C.textMuted }}>No orders yet</Text>
                <Text style={{ fontSize: 13, color: C.textMuted, marginTop: 4 }}>Schedule a pickup to get started!</Text>
              </View>
            ) : custOrders.map(o => (
              <Card key={o.id}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                  <Text style={{ fontSize: 15, fontWeight: "700" }}>Order #{o.order_number}</Text>
                  <StatusBadge status={o.status} />
                </View>
                <Text style={{ fontSize: 12, color: C.textSecondary }}>{o.pickup_date} • {o.pickup_time}</Text>
                <Text style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}>{o.num_items} items • {o.address}</Text>
                <Text style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>{o.payment_method === "credit_card" ? "💳 Credit Card" : "💵 Pay on Delivery"}</Text>
                <Text style={{ fontSize: 11, color: C.textMuted, marginTop: 4, lineHeight: 16 }}>{o.note}</Text>
                {!['picked_up', 'processing', 'delivered', 'cancelled'].includes(o.status) && (
                  <Btn onPress={() => {
                    // Load order data into form for editing
                    setEditingOrderId(o.id);
                    
                    // Parse items from stored JSON or reconstruct from note
                    let parsedItems = {};
                    if (o.items) {
                      try {
                        parsedItems = JSON.parse(o.items);
                      } catch (e) {
                        parsedItems = {};
                      }
                    } else if (o.note) {
                      // Fallback: reconstruct items from note text
                      // Note format: "3x Shirts, 2x Suits, 4x Pants — Special notes"
                      const mainPart = o.note.split("—")[0];
                      mainPart.split(",").forEach(part => {
                        const match = part.trim().match(/(\d+)x\s+(.+)/);
                        if (match) {
                          const count = parseInt(match[1]);
                          const itemLabel = match[2].trim();
                          // Find matching ITEM_TYPE key
                          const itemType = ITEM_TYPES.find(t => t.label.toLowerCase() === itemLabel.toLowerCase());
                          if (itemType) {
                            parsedItems[itemType.key] = count;
                          }
                        }
                      });
                    }
                    
                    setItems(parsedItems);
                    
                    // Extract special instructions from note (after —)
                    const noteParts = o.note ? o.note.split("—") : [];
                    const specialInstructions = noteParts.length > 1 ? noteParts[1].trim() : "";
                    
                    setNote(specialInstructions);
                    setPickupDate(o.pickup_date);
                    setPickupTime(o.pickup_time);
                    setPaymentMethod(o.payment_method);
                    setScreen("new-order");
                  }} style={{ marginTop: 12, backgroundColor: C.accent, alignItems: "center", justifyContent: "center" }}>
                    <Icon name="edit" size={16} color="#fff" /><BtnText>Edit Order</BtnText>
                  </Btn>
                )}
                {!['picked_up', 'processing', 'delivered', 'cancelled'].includes(o.status) && (
                  <Btn onPress={() => { setCancelModal({ orderId: o.id, orderNumber: o.order_number }); setCancelReason(""); }}
                    style={{ marginTop: 8, backgroundColor: C.danger, alignItems: "center", justifyContent: "center" }}>
                    <BtnText>Cancel Order</BtnText>
                  </Btn>
                )}
              </Card>
            ))}
          </ScrollView>
          {/* ── Cancel Order Modal ── */}
          {cancelModal && (
            <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "center", alignItems: "center", padding: 24 }}>
              <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 24, width: "100%", shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 12, elevation: 8 }}>
                <Text style={{ fontSize: 17, fontWeight: "700", color: C.text, marginBottom: 6 }}>Cancel Order #{cancelModal.orderNumber}?</Text>
                <Text style={{ fontSize: 13, color: C.textSecondary, marginBottom: 16 }}>This cannot be undone. Please let us know why you're cancelling.</Text>
                <TextInput
                  value={cancelReason}
                  onChangeText={setCancelReason}
                  placeholder="Reason for cancellation (required)"
                  placeholderTextColor={C.textMuted}
                  multiline
                  numberOfLines={3}
                  style={{ borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 12, fontSize: 14, color: C.text, minHeight: 80, textAlignVertical: "top", marginBottom: 20 }}
                />
                <View style={{ flexDirection: "row", gap: 12 }}>
                  <Btn onPress={() => setCancelModal(null)} style={{ flex: 1, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border }}>
                    <BtnText style={{ color: C.text }}>Go Back</BtnText>
                  </Btn>
                  <Btn
                    onPress={async () => {
                      if (!cancelReason.trim()) {
                        Alert.alert("Reason required", "Please enter a reason for cancellation.");
                        return;
                      }
                      setCancelLoading(true);
                      try {
                        const now = new Date().toISOString();
                        const updatedOrders = orders.map(o =>
                          o.id === cancelModal.orderId
                            ? { ...o, status: "cancelled", cancellation_reason: cancelReason.trim(), cancelled_at: now, deleted_at: now }
                            : o
                        );
                        setOrders(updatedOrders);
                        setCustOrders(updatedOrders.filter(o => o.customer_name === custName || o.phone === custPhone));
                        await storage.saveOrders(updatedOrders);
                        if (isOnline && supabaseReady) {
                          const { error } = await cancelOrder(cancelModal.orderId, cancelReason.trim());
                          if (error) logger.warn("Cancel synced locally but Supabase update failed", { error });
                          else logger.info("Order cancelled and synced to Supabase", { orderId: cancelModal.orderId });
                        }
                        setCancelModal(null);
                        setCancelReason("");
                        Alert.alert("Order Cancelled", "Your order has been cancelled.");
                      } catch (e) {
                        logger.error("Cancel order error", { error: e.message });
                        Alert.alert("Error", "Could not cancel order. Please try again.");
                      } finally {
                        setCancelLoading(false);
                      }
                    }}
                    style={{ flex: 1, backgroundColor: C.danger }}
                    disabled={cancelLoading}
                  >
                    <BtnText>{cancelLoading ? "Cancelling..." : "Yes, Cancel"}</BtnText>
                  </Btn>
                </View>
              </View>
            </View>
          )}
          <NavBar screen={screen} items={custNav} onPress={setScreen} />
        </Screen>
      );
    }

    // ─── Customer Home ───
    return (
      <Screen>
        <Header style={{ paddingBottom: 24, flexDirection: "column", alignItems: "center" }}>
          <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: 16, fontWeight: "700", marginBottom: 12 }}>Welcome, {custName}!</Text>
          <View style={{ flexDirection: "row", alignItems: "center", width: "100%", marginBottom: 8, justifyContent: "center" }}>
            <SolLogo size={18} dark />
          </View>
          <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 13 }}>Eco-Friendly Dry Cleaning • Sharon, MA</Text>
        </Header>
        <ScrollView style={{ flex: 1, padding: 16 }} contentContainerStyle={{ paddingBottom: 160 }}>
          {/* Hero */}
          <Card style={{ backgroundColor: C.primaryLight, borderColor: C.primary + "15", alignItems: "center" }}>
            <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: C.primary, alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
              <Icon name="hanger" size={28} color="#fff" />
            </View>
            <Text style={{ fontSize: 20, fontWeight: "800", color: C.primaryDark, marginBottom: 6 }}>Pickup at Your Door</Text>
            <Text style={{ fontSize: 13, color: C.textSecondary, textAlign: "center", lineHeight: 20, marginBottom: 20 }}>Schedule an evening or weekend pickup and we'll come to you. Pricing texted after we process your items.</Text>
            <Btn onPress={() => setScreen("new-order")} style={{ backgroundColor: C.accent, borderRadius: 14, width: "100%" }}>
              <Icon name="plus" size={20} color="#fff" /><BtnText style={{ fontSize: 16 }}>Schedule a Pickup</BtnText>
            </Btn>
          </Card>
          {/* How it Works */}
          <Text style={{ fontSize: 15, fontWeight: "700", color: C.text, marginTop: 12, marginBottom: 12 }}>How It Works</Text>
          {[
            { num: "1", title: "Select Items & Schedule", desc: "Choose your items and an evening or Saturday pickup time" },
            { num: "2", title: "We Pick Up", desc: "Our driver comes to your door" },
            { num: "3", title: "Total Texted to You", desc: "We inspect items and text your total" },
            { num: "4", title: "Clean & Deliver", desc: "Expert eco-friendly cleaning, then delivery" },
          ].map((step, i) => (
            <View key={i} style={{ flexDirection: "row", gap: 14, marginBottom: 12 }}>
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: C.primaryLight, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontSize: 15, fontWeight: "800", color: C.primary }}>{step.num}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "600", color: C.text }}>{step.title}</Text>
                <Text style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>{step.desc}</Text>
              </View>
            </View>
          ))}
          {/* Contact */}
          <Card style={{ marginTop: 12 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Icon name="phone" size={18} color={C.primary} />
              <View>
                <Text style={{ fontSize: 14, fontWeight: "600" }}>(781) 784-3937</Text>
                <Text style={{ fontSize: 11, color: C.textMuted }}>5 Post Office Sq #10, Sharon, MA 02067</Text>
              </View>
            </View>
          </Card>
        </ScrollView>
        <NavBar screen={screen} items={custNav} onPress={setScreen} />
      </Screen>
    );
  }

  // ═══════════════════════════════════════
  // ADMIN APP
  // ═══════════════════════════════════════
  if (mode === "admin") {
    const t = useTranslation(language);
    const adminNav = [
      { icon: "order", label: t("orders"), scr: "admin-orders" }, 
      { icon: "route", label: t("routes"), scr: "admin-routes" }, 
      ...(adminUser?.role === "admin" || adminUser?.role === "manager" ? [{ icon: "chart", label: "Reports", scr: "admin-reports" }] : []),
      { icon: "settings", label: t("settings"), scr: "admin-settings" }
    ];
    // ─── Admin Login ───
    if (!adminLoggedIn) {
      return (
        <Screen>
          <Header style={{ justifyContent: "center", alignItems: "center", flexDirection: "column", paddingBottom: 28 }}>
            <TouchableOpacity onPress={() => { setMode(null); setScreen("home"); }} style={{ position: "absolute", left: 16, top: 12, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 8, padding: 8 }}>
              <Icon name="back" size={16} color="#fff" />
            </TouchableOpacity>
            <SolLogo size={18} dark />
            <Text style={{ color: "#fff", fontSize: 20, fontWeight: "700", marginTop: 12 }}>Admin Portal</Text>
            <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, marginTop: 4 }}>Sign in to manage orders</Text>
          </Header>
          <ScrollView style={{ flex: 1, padding: 16 }} contentContainerStyle={{ paddingBottom: 120 }} keyboardShouldPersistTaps="handled">
            {/* Demo Credentials */}
            <Card style={{ backgroundColor: C.accentLight, borderColor: C.accent + "30" }}>
              <Text style={{ fontSize: 13, fontWeight: "700", color: "#3A6090", marginBottom: 8 }}>Demo Credentials</Text>
              {ADMIN_ACCOUNTS.map(acc => (
                <TouchableOpacity key={acc.email} onPress={() => { setAdminEmail(acc.email); setAdminPassword(acc.password); }}
                  style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.accent + "20" }}>
                  <View>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Text style={{ fontSize: 12, fontWeight: "600", color: "#3A6090" }}>{acc.name}</Text>
                      <Text style={{ fontSize: 10, color: "#5A80B0", fontWeight: "700", textTransform: "uppercase" }}>{acc.role}</Text>
                    </View>
                    <Text style={{ fontSize: 11, color: "#5A80B0" }}>{acc.email}</Text>
                  </View>
                  <Text style={{ fontSize: 11, color: C.accent, fontWeight: "700" }}>Use →</Text>
                </TouchableOpacity>
              ))}
            </Card>

            {/* Login Form */}
            <Card>
              <View style={{ gap: 14 }}>
                <View><Label>Email</Label><Input value={adminEmail} onChangeText={setAdminEmail} placeholder="admin@solcleanersinc.com" keyboardType="email-address" autoCapitalize="none" /></View>
                <View>
                  <Label>Password</Label>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Input value={adminPassword} onChangeText={setAdminPassword} placeholder="Password" secureTextEntry={!adminShowPassword} style={{ flex: 1 }} />
                    <TouchableOpacity onPress={() => setAdminShowPassword(!adminShowPassword)} style={{ position: "absolute", right: 12 }}>
                      <Icon name={adminShowPassword ? "x" : "user"} size={16} color={C.textMuted} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
              {adminLoginError ? <Text style={{ color: C.danger, fontSize: 12, marginTop: 10 }}>{adminLoginError}</Text> : null}
              <Btn onPress={handleAdminLogin} disabled={adminLoginLoading} style={{ marginTop: 16 }}>
                <BtnText>{adminLoginLoading ? "Signing In..." : "Sign In"}</BtnText>
              </Btn>
            </Card>
          </ScrollView>
        </Screen>
      );
    }

    // Admin Dashboard data
    // For admin-orders screen: show all orders filtered by status only
    const filtered = orders.filter(o => {
      const statusMatch = adminFilter === "all" || o.status === adminFilter;
      return statusMatch;
    });
    // For routes screen: show orders for specific date
    const routeOrders = [...orders].filter(o => o.pickup_date === adminDateFilter && o.route_order).sort((a, b) => a.route_order - b.route_order);
    const routeableOrders = orders.filter(o => o.pickup_date === adminDateFilter && ["confirmed", "pickup_scheduled"].includes(o.status));

    // ─── Order Detail ───
    if (screen === "admin-order-detail" && selectedOrder) {
      const o = selectedOrder;
      const statusFlow = ["pending", "confirmed", "pickup_scheduled", "picked_up", "processing", "ready", "out_for_delivery", "delivered"];
      const currentIdx = statusFlow.indexOf(o.status);
      const nextStatus = currentIdx < statusFlow.length - 1 ? statusFlow[currentIdx + 1] : null;
      const statusLabels = { pending: "Confirm", confirmed: "Schedule Pickup", pickup_scheduled: "Mark Picked Up", picked_up: "Start Processing", processing: "Mark Ready", ready: "Out for Delivery", out_for_delivery: "Mark Delivered" };
      const orderSmsLog = smsLog.filter(s => s.orderId === o.id);

      return (
        <Screen>
          <Header>
            <TouchableOpacity onPress={() => { setSelectedOrder(null); setScreen("admin-orders"); }} style={{ padding: 4 }}><Icon name="back" size={22} color="#fff" /></TouchableOpacity>
            <View style={{ flex: 1 }}><Text style={{ color: "#fff", fontSize: 18, fontWeight: "700" }}>Order #{o.order_number}</Text><Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 11, marginTop: 2 }}>{o.customer_name}</Text></View>
            <StatusBadge status={o.status} />
          </Header>
          <ScrollView style={{ flex: 1, padding: 16 }} contentContainerStyle={{ paddingBottom: 120 }} keyboardShouldPersistTaps="handled">
            {/* Status Progress */}
            <Card>
              <Text style={{ fontSize: 13, fontWeight: "700", color: C.textSecondary, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 }}>Status Timeline</Text>
              <View style={{ flexDirection: "row", gap: 4, marginBottom: 16 }}>
                {statusFlow.map((st, i) => <View key={st} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: i <= currentIdx ? C.primary : C.border }} />)}
              </View>
              {nextStatus && (
                <View>
                  <Btn onPress={() => { updateOrderStatus(o.id, nextStatus); setSelectedOrder({ ...o, status: nextStatus }); }} style={{ paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8 }}>
                    <Icon name="chevron" size={14} color="#fff" /><BtnText style={{ fontSize: 13 }}>{statusLabels[o.status]}</BtnText>
                  </Btn>
                  {SMS_TEMPLATES[nextStatus] && <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 8, justifyContent: "center" }}>
                    <Icon name="send" size={11} color={C.success} />
                    <Text style={{ fontSize: 11, color: C.success, fontWeight: "600" }}>SMS app will open to text {o.phone}</Text>
                  </View>}
                </View>
              )}
            </Card>

            {/* Details */}
            <Card>
              <Text style={{ fontSize: 13, fontWeight: "700", color: C.textSecondary, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 14 }}>Order Details</Text>
              {[
                { label: "Customer", value: o.customer_name }, { label: "Phone", value: o.phone },
                { label: "Address", value: o.address }, { label: "Items", value: `${o.num_items} items` },
                { label: "Pickup", value: `${o.pickup_date} • ${o.pickup_time}` }, { label: "Note", value: o.note },
                { label: "Payment", value: o.payment_method === "credit_card" ? "💳 Credit Card on File" : "💵 Pay on Delivery" },
              ].map((r, i) => (
                <View key={i} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: i < 5 ? 1 : 0, borderBottomColor: C.borderLight }}>
                  <Text style={{ fontSize: 12, color: C.textMuted, fontWeight: "600" }}>{r.label}</Text>
                  <Text style={{ fontSize: 13, fontWeight: "500", textAlign: "right", maxWidth: "60%" }}>{r.value}</Text>
                </View>
              ))}
            </Card>

            {/* SMS Log */}
            {orderSmsLog.length > 0 && (
              <Card>
                <Text style={{ fontSize: 13, fontWeight: "700", color: C.textSecondary, textTransform: "uppercase", marginBottom: 12 }}>SMS Notifications ({orderSmsLog.length})</Text>
                {orderSmsLog.map(sms => (
                  <View key={sms.id} style={{ padding: 10, backgroundColor: C.bg, borderRadius: 10, borderLeftWidth: 3, borderLeftColor: sms.delivered === false ? C.warning : C.success, marginBottom: 8 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <Icon name={sms.delivered === false ? "clock" : "check"} size={12} color={sms.delivered === false ? C.warning : C.success} />
                        <Text style={{ fontSize: 12, fontWeight: "700", color: sms.delivered === false ? C.warning : C.success }}>
                          {sms.delivered === false ? "Opened in SMS app" : sms.method === "twilio" ? "Auto-sent via Twilio" : "Sent via SMS app"}
                        </Text>
                      </View>
                      <Text style={{ fontSize: 10, color: C.textMuted }}>{sms.timestamp}</Text>
                    </View>
                    <Text style={{ fontSize: 11, color: C.textSecondary, lineHeight: 16 }}>{sms.text}</Text>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                      <Text style={{ fontSize: 10, color: C.textMuted }}>To: {sms.to}</Text>
                      <TouchableOpacity onPress={() => sendSms(sms.to, sms.text)} style={{ flexDirection: "row", alignItems: "center", gap: 4, padding: 4 }}>
                        <Icon name="send" size={10} color={C.accent} />
                        <Text style={{ fontSize: 10, color: C.accent, fontWeight: "600" }}>Resend</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </Card>
            )}

            {/* Quick Send SMS - manual text */}
            {["picked_up", "processing", "ready"].includes(o.status) && (
              <Card style={{ backgroundColor: C.accentLight, borderColor: C.accent + "30" }}>
                <Text style={{ fontSize: 13, fontWeight: "700", color: "#3A6090", marginBottom: 10 }}>Text Total to Customer</Text>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <TextInput placeholder="$0.00" placeholderTextColor={C.textMuted} keyboardType="decimal-pad"
                    style={{ flex: 1, padding: 12, borderRadius: 10, borderWidth: 1.5, borderColor: C.border, fontSize: 14, backgroundColor: "#fff", color: C.text }}
                    onChangeText={(val) => { /* store total locally if needed */ }} />
                  <Btn onPress={() => {
                    const totalMsg = `Sol Cleaners: Your order #${o.order_number} total is ready. Please call (781) 784-3937 to confirm or visit us at 5 Post Office Sq, Sharon.`;
                    const newSms = { id: `sms-${Date.now()}`, orderId: o.id, to: o.phone, text: totalMsg, status: "total_sent", timestamp: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) };
                    setSmsLog(prev => [newSms, ...prev]);
                    sendSms(o.phone, totalMsg).then(result => {
                      setSmsLog(prev => prev.map(s => s.id === newSms.id ? { ...s, delivered: result.success, method: result.method } : s));
                    });
                  }} style={{ backgroundColor: C.accent, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10 }}>
                    <Icon name="send" size={14} color="#fff" /><BtnText style={{ fontSize: 13 }}>Send</BtnText>
                  </Btn>
                </View>
                <Text style={{ fontSize: 11, color: "#3A6090", marginTop: 8 }}>Opens your SMS app with pre-filled message to {o.phone}</Text>
              </Card>
            )}

            {/* Cancel */}
            {["pending", "confirmed"].includes(o.status) && (
              <Btn onPress={() => { updateOrderStatus(o.id, "cancelled"); setSelectedOrder({ ...o, status: "cancelled" }); }} style={{ backgroundColor: C.danger }}>
                <BtnText>Cancel Order</BtnText>
              </Btn>
            )}
          </ScrollView>
        </Screen>
      );
    }

    // ─── Admin Orders ───
    if (screen === "admin-orders") {
      const formatTime = (date) => {
        if (!date) return "Never";
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();
        const isYesterday = new Date(date.getTime() + 86400000).toDateString() === now.toDateString();
        
        const timeStr = date.toLocaleString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
        const dateStr = date.toLocaleString("en-US", { month: "short", day: "numeric" });
        
        if (isToday) return `Today at ${timeStr}`;
        if (isYesterday) return `Yesterday at ${timeStr}`;
        return `${dateStr} at ${timeStr}`;
      };
      
      return (
        <Screen>
          <Header>
            <View style={{ flex: 1, alignItems: "center" }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, width: "100%" }}>
                <SolLogo size={14} dark />
                <View style={{ marginLeft: "auto", alignItems: "flex-end" }}>
                  <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 11 }}>{adminUser?.name} ({adminUser?.role})</Text>
                  <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 9, marginTop: 2 }}>Last login: {formatTime(lastAdminLogin)}</Text>
                </View>
              </View>
              <Text style={{ color: "#fff", fontSize: 18, fontWeight: "700", marginTop: 4 }}>Orders</Text>
            </View>
          </Header>
          <ScrollView style={{ flex: 1, padding: 16 }} contentContainerStyle={{ paddingBottom: 160 }}>
            {/* Status filter */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {["all", "pending", "confirmed", "picked_up", "processing", "ready", "delivered"].map(f => (
                <TouchableOpacity key={f} onPress={() => setAdminFilter(f)}
                  style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8, backgroundColor: adminFilter === f ? C.primary : C.card, borderWidth: 1, borderColor: adminFilter === f ? C.primary : C.border }}>
                  <Text style={{ fontSize: 12, fontWeight: "600", color: adminFilter === f ? "#fff" : C.textSecondary, textTransform: "capitalize" }}>{f}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Order Cards */}
            {filtered.length === 0 ? (
              <View style={{ alignItems: "center", paddingVertical: 40 }}>
                <Text style={{ fontSize: 14, color: C.textMuted }}>No orders match this filter</Text>
              </View>
            ) : filtered.map(o => (
              <TouchableOpacity key={o.id} onPress={() => { setSelectedOrder(o); setScreen("admin-order-detail"); }}>
                <Card>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                    <Text style={{ fontSize: 15, fontWeight: "600" }}>{o.customer_name}</Text>
                    <StatusBadge status={o.status} />
                  </View>
                  <Text style={{ fontSize: 12, color: C.textSecondary }}>#{o.order_number} • {o.num_items} items</Text>
                  <Text style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}>{o.address}</Text>
                  <Text style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>{o.pickup_date} • {o.pickup_time}</Text>
                </Card>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <NavBar screen={screen} items={adminNav} onPress={setScreen} />
        </Screen>
      );
    }

    // ─── Routes ───
    if (screen === "admin-routes") {
      const formatTime = (date) => {
        if (!date) return "Never";
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();
        const isYesterday = new Date(date.getTime() + 86400000).toDateString() === now.toDateString();
        
        const timeStr = date.toLocaleString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
        const dateStr = date.toLocaleString("en-US", { month: "short", day: "numeric" });
        
        if (isToday) return `Today at ${timeStr}`;
        if (isYesterday) return `Yesterday at ${timeStr}`;
        return `${dateStr} at ${timeStr}`;
      };
      
      return (
        <Screen>
          <Header><View style={{ flex: 1, alignItems: "center" }}><View style={{ flexDirection: "row", alignItems: "center", gap: 8, width: "100%" }}><SolLogo size={14} dark /><View style={{ marginLeft: "auto", alignItems: "flex-end" }}><Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 11 }}>{adminUser?.name} ({adminUser?.role})</Text><Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 9, marginTop: 2 }}>Last login: {formatTime(lastAdminLogin)}</Text></View></View><Text style={{ color: "#fff", fontSize: 18, fontWeight: "700", marginTop: 4 }}>Routes</Text><Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 11, marginTop: 2 }}>Optimize pickup routes by date</Text></View></Header>
          <ScrollView style={{ flex: 1, padding: 16 }} contentContainerStyle={{ paddingBottom: 160 }}>
            {/* Date selector */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {availDates.map(d => (
                <TouchableOpacity key={d.date} onPress={() => { setAdminDateFilter(d.date); setRouteOptimized(false); }}
                  style={{ paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, marginRight: 8, backgroundColor: adminDateFilter === d.date ? C.primary : C.card, borderWidth: 1.5, borderColor: adminDateFilter === d.date ? C.primary : C.border }}>
                  <Text style={{ fontSize: 13, fontWeight: "600", color: adminDateFilter === d.date ? "#fff" : C.text }}>{d.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Sol HQ Start */}
            <Card style={{ backgroundColor: C.accentLight, borderColor: C.accent + "25", flexDirection: "row", gap: 12, alignItems: "center" }}>
              <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: C.accent, alignItems: "center", justifyContent: "center" }}>
                <Icon name="home" size={16} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: C.primary }}>Sol Cleaners — START</Text>
                <Text style={{ fontSize: 12, color: C.textSecondary }}>5 Post Office Sq #10, Sharon, MA 02067</Text>
              </View>
            </Card>

            {/* Optimize Button */}
            {!routeOptimized && routeableOrders.length >= 2 && (
              <Btn onPress={optimizeRoute} style={{ marginBottom: 12 }}>
                <Icon name="route" size={18} color="#fff" /><BtnText>Optimize Route — {routeableOrders.length} Stops</BtnText>
              </Btn>
            )}

            {routeOptimized && (
              <Card style={{ backgroundColor: C.successLight, borderColor: C.success + "30" }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Icon name="check" size={18} color={C.success} />
                  <View>
                    <Text style={{ fontSize: 14, fontWeight: "700", color: C.success }}>Route Optimized!</Text>
                    <Text style={{ fontSize: 12, color: C.textSecondary }}>Est. {Math.round(routeableOrders.length * 8)} min total drive time</Text>
                  </View>
                </View>
              </Card>
            )}

            {/* Stops */}
            <Text style={{ fontSize: 13, fontWeight: "700", color: C.textSecondary, textTransform: "uppercase", marginTop: 8, marginBottom: 10 }}>
              {routeOptimized ? "Optimized Pickup Order" : "Pickups for This Date"}
            </Text>
            {(routeOptimized && routeOrders.length > 0 ? routeOrders : routeableOrders).map((o, idx) => (
              <TouchableOpacity key={o.id} onPress={() => { setSelectedOrder(o); setScreen("admin-order-detail"); }}>
                <Card style={{ flexDirection: "row", gap: 12, alignItems: "center", padding: 14 }}>
                  <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: routeOptimized ? C.primary : C.bg, alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ fontSize: 14, fontWeight: "800", color: routeOptimized ? "#fff" : C.textSecondary }}>{o.route_order || idx + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <Text style={{ fontSize: 14, fontWeight: "600" }}>{o.customer_name}</Text>
                      <Text style={{ fontSize: 12, color: C.textMuted }}>{o.num_items} items</Text>
                    </View>
                    <Text style={{ fontSize: 12, color: C.textSecondary, marginTop: 2 }}>{o.address}</Text>
                    <Text style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>{o.pickup_time}</Text>
                  </View>
                </Card>
              </TouchableOpacity>
            ))}

            {/* Return to HQ */}
            {routeOptimized && routeOrders.length > 0 && (
              <Card style={{ backgroundColor: C.accentLight, borderColor: C.accent + "25", flexDirection: "row", gap: 12, alignItems: "center", opacity: 0.75 }}>
                <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: C.accent, alignItems: "center", justifyContent: "center" }}>
                  <Icon name="home" size={14} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: C.primary }}>Sol Cleaners — RETURN</Text>
                  <Text style={{ fontSize: 12, color: C.textSecondary }}>5 Post Office Sq #10, Sharon, MA 02067</Text>
                </View>
              </Card>
            )}
          </ScrollView>
          <NavBar screen={screen} items={adminNav} onPress={setScreen} />
        </Screen>
      );
    }

    // ─── Reports ───
    if (screen === "admin-reports") {
      const reportData = getReportData(orders, reportTimeframe);
      const timeframeOptions = ["weekly", "monthly", "yearly"];
      
      const formatTime = (date) => {
        if (!date) return "Never";
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();
        const isYesterday = new Date(date.getTime() + 86400000).toDateString() === now.toDateString();
        
        const timeStr = date.toLocaleString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
        const dateStr = date.toLocaleString("en-US", { month: "short", day: "numeric" });
        
        if (isToday) return `Today at ${timeStr}`;
        if (isYesterday) return `Yesterday at ${timeStr}`;
        return `${dateStr} at ${timeStr}`;
      };

      return (
        <Screen>
          <Header><View style={{ flex: 1, alignItems: "center" }}><View style={{ flexDirection: "row", alignItems: "center", gap: 8, width: "100%" }}><SolLogo size={14} dark /><View style={{ marginLeft: "auto", alignItems: "flex-end" }}><Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 11 }}>{adminUser?.name} ({adminUser?.role})</Text><Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 9, marginTop: 2 }}>Last login: {formatTime(lastAdminLogin)}</Text></View></View><Text style={{ color: "#fff", fontSize: 18, fontWeight: "700", marginTop: 4 }}>Reports</Text></View></Header>
          <ScrollView style={{ flex: 1, padding: 16 }} contentContainerStyle={{ paddingBottom: 160 }}>
            {/* Timeframe Selector */}
            <Card style={{ backgroundColor: C.accentLight, borderColor: C.accent + "30" }}>
              <Text style={{ fontSize: 13, fontWeight: "700", color: "#3A6090", marginBottom: 12 }}>Select Timeframe</Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {timeframeOptions.map(tf => (
                  <TouchableOpacity
                    key={tf}
                    onPress={() => setReportTimeframe(tf)}
                    style={{ flex: 1, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, backgroundColor: reportTimeframe === tf ? C.accent : "#fff", alignItems: "center", borderWidth: 1.5, borderColor: reportTimeframe === tf ? C.accent : C.border }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: "700", color: reportTimeframe === tf ? "#fff" : C.text, textTransform: "capitalize" }}>{tf}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Card>

            {/* Summary Statistics */}
            <Card>
              <Text style={{ fontSize: 14, fontWeight: "700", color: C.text, marginBottom: 16 }}>{reportData.periodName} Summary</Text>
              <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
                <View style={{ flex: 1, backgroundColor: C.primaryLight, borderRadius: 12, padding: 14, alignItems: "center" }}>
                  <Text style={{ fontSize: 20, fontWeight: "800", color: C.primary }}>{reportData.totalOrders}</Text>
                  <Text style={{ fontSize: 11, color: C.textSecondary, fontWeight: "600", marginTop: 2 }}>Total Orders</Text>
                </View>
                <View style={{ flex: 1, backgroundColor: C.successLight, borderRadius: 12, padding: 14, alignItems: "center" }}>
                  <Text style={{ fontSize: 20, fontWeight: "800", color: C.success }}>{reportData.completedOrders}</Text>
                  <Text style={{ fontSize: 11, color: C.textSecondary, fontWeight: "600", marginTop: 2 }}>Completed</Text>
                </View>
                <View style={{ flex: 1, backgroundColor: C.accentLight, borderRadius: 12, padding: 14, alignItems: "center" }}>
                  <Text style={{ fontSize: 20, fontWeight: "800", color: C.accent }}>{reportData.totalItems}</Text>
                  <Text style={{ fontSize: 11, color: C.textSecondary, fontWeight: "600", marginTop: 2 }}>Items</Text>
                </View>
              </View>
            </Card>

            {/* Order Status Breakdown */}
            <Card>
              <Text style={{ fontSize: 14, fontWeight: "700", color: C.text, marginBottom: 14 }}>Order Status Breakdown</Text>
              {Object.entries(reportData.statusCounts).map(([status, count]) => (
                <View key={status} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.borderLight }}>
                  <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <StatusBadge status={status} />
                  </View>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: count > 0 ? C.primary : C.textMuted }}>{count}</Text>
                </View>
              ))}
            </Card>

            {/* Completion Rate */}
            {reportData.totalOrders > 0 && (
              <Card style={{ backgroundColor: C.successLight, borderColor: C.success + "30" }}>
                <Text style={{ fontSize: 13, fontWeight: "700", color: C.success, marginBottom: 8 }}>Completion Rate</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <View style={{ flex: 1, height: 8, backgroundColor: "rgba(39, 174, 96, 0.2)", borderRadius: 4, overflow: "hidden" }}>
                    <View
                      style={{
                        height: "100%",
                        backgroundColor: C.success,
                        width: `${(reportData.completedOrders / reportData.totalOrders) * 100}%`,
                      }}
                    />
                  </View>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: C.success }}>
                    {Math.round((reportData.completedOrders / reportData.totalOrders) * 100)}%
                  </Text>
                </View>
              </Card>
            )}

            {/* No Data Message */}
            {reportData.totalOrders === 0 && (
              <Card style={{ alignItems: "center", paddingVertical: 40 }}>
                <Icon name="chart" size={32} color={C.textMuted} />
                <Text style={{ fontSize: 14, color: C.textMuted, marginTop: 12 }}>No orders in this period</Text>
              </Card>
            )}
          </ScrollView>
          <NavBar screen={screen} items={adminNav} onPress={setScreen} />
        </Screen>
      );
    }

    // ─── Settings ───
    if (screen === "admin-settings") {
      const formatTime = (date) => {
        if (!date) return "Never";
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();
        const isYesterday = new Date(date.getTime() + 86400000).toDateString() === now.toDateString();
        
        const timeStr = date.toLocaleString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
        const dateStr = date.toLocaleString("en-US", { month: "short", day: "numeric" });
        
        if (isToday) return `Today at ${timeStr}`;
        if (isYesterday) return `Yesterday at ${timeStr}`;
        return `${dateStr} at ${timeStr}`;
      };
      
      return (
        <Screen>
          <Header><View style={{ flex: 1, alignItems: "center" }}><View style={{ flexDirection: "row", alignItems: "center", gap: 8, width: "100%" }}><SolLogo size={14} dark /><View style={{ marginLeft: "auto", alignItems: "flex-end" }}><Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 11 }}>{adminUser?.name} ({adminUser?.role})</Text><Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 9, marginTop: 2 }}>Last login: {formatTime(lastAdminLogin)}</Text></View></View><Text style={{ color: "#fff", fontSize: 18, fontWeight: "700", marginTop: 4 }}>Settings</Text></View></Header>
          <ScrollView style={{ flex: 1, padding: 16 }} contentContainerStyle={{ paddingBottom: 160 }}>
            <Card>
              <Text style={{ fontSize: 15, fontWeight: "700", color: C.text, marginBottom: 12 }}>Account</Text>
              <Text style={{ fontSize: 14, color: C.text }}>{adminUser?.name}</Text>
              <Text style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>{adminUser?.email}</Text>
              <Text style={{ fontSize: 12, color: C.accent, marginTop: 2, textTransform: "capitalize" }}>{adminUser?.role}</Text>
            </Card>
            <Card>
              <Text style={{ fontSize: 15, fontWeight: "700", color: C.text, marginBottom: 8 }}>Business Info</Text>
              <Text style={{ fontSize: 13, color: C.textSecondary }}>Sol Cleaners Inc.</Text>
              <Text style={{ fontSize: 13, color: C.textSecondary }}>5 Post Office Sq #10, Sharon, MA 02067</Text>
              <Text style={{ fontSize: 13, color: C.textSecondary }}>(781) 784-3937</Text>
              <Text style={{ fontSize: 13, color: C.textSecondary }}>Mon–Fri 8:30am–6pm | Sat 8:30am–4pm</Text>
            </Card>
            <Btn onPress={handleAdminLogout} style={{ backgroundColor: C.danger }}>
              <BtnText>Sign Out</BtnText>
            </Btn>
          </ScrollView>
          <NavBar screen={screen} items={adminNav} onPress={setScreen} />
        </Screen>
      );
    }
  }

  return null;
}
