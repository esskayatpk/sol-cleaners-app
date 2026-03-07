import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import logger from "./logger";

// ─── Backend Storage Service ───
// Centralized AsyncStorage operations with proper error handling for Android

class Backend {
  constructor() {
    this.initialized = false;
    this.storageUnavailable = false; // Flag if AsyncStorage native module is broken
    this.timeout = 5000; // 5 second timeout for Android
    this.initAttempts = 0;
    this.maxInitAttempts = 3;
  }

  async initialize() {
    try {
      if (this.initialized) return true;
      if (this.storageUnavailable) return false; // Already determined storage is broken
      
      // On Android, wait a bit longer for native modules to be ready
      if (Platform.OS === "android") {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Check if AsyncStorage is actually available
      if (!AsyncStorage || typeof AsyncStorage.getItem !== "function") {
        this.storageUnavailable = true;
        throw new Error("AsyncStorage module not available");
      }

      // Try to access storage with retry logic for Android
      let lastError;
      for (let attempt = 0; attempt < this.maxInitAttempts; attempt++) {
        try {
          this.initAttempts = attempt + 1;
          
          // Don't wait for result, just test if we can call it
          const testPromise = AsyncStorage.getItem("_init_test_");
          
          // Add timeout
          await Promise.race([
            testPromise,
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error("AsyncStorage init timeout")), 2000)
            ),
          ]);
          
          // Success - remove test key
          try {
            await AsyncStorage.removeItem("_init_test_").catch(() => {});
          } catch {
            // Ignore cleanup errors
          }
          
          this.initialized = true;
          logger.info("Backend storage initialized", {
            platform: Platform.OS,
            attempts: this.initAttempts,
          });
          return true;
        } catch (attemptError) {
          lastError = attemptError;
          const errorMsg = attemptError?.message || String(attemptError);
          
          // If it's a native module error, don't retry - just fail fast
          if (errorMsg.includes("Native module") || errorMsg.includes("null")) {
            this.storageUnavailable = true;
            break;
          }
          
          if (attempt < this.maxInitAttempts - 1) {
            // Wait before retry, with exponential backoff
            const delayMs = 100 * Math.pow(2, attempt);
            await new Promise(resolve => setTimeout(resolve, delayMs));
          }
        }
      }

      // All attempts failed, but don't block the app
      throw lastError || new Error("AsyncStorage init failed after retries");
    } catch (e) {
      // Non-blocking: allow app to continue even if storage init fails
      const errorMsg = e?.message || String(e);
      this.storageUnavailable = errorMsg.includes("Native module") || errorMsg.includes("null");
      
      logger.warn("Backend storage init failed (non-blocking)", {
        error: errorMsg,
        platform: Platform.OS,
        attempts: this.initAttempts,
        nativeModuleIssue: this.storageUnavailable,
      });
      
      // Mark as "soft initialized" - app can continue but may not have storage
      this.initialized = false;
      return false;
    }
  }

  async withTimeout(fn, timeout = this.timeout) {
    try {
      // Check AsyncStorage availability before attempting operation
      if (!AsyncStorage || typeof fn !== "function") {
        throw new Error("AsyncStorage unavailable or invalid operation");
      }

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`AsyncStorage timeout (${timeout}ms)`)), timeout)
      );
      
      return Promise.race([fn(), timeoutPromise]);
    } catch (e) {
      // Log but don't throw - allow graceful degradation
      console.warn("withTimeout error:", e.message);
      throw e;
    }
  }

  // ─── Customer Data Operations ───
  
  async getCustomer() {
    try {
      // Early exit if we know storage is broken
      if (this.storageUnavailable) {
        logger.debug("AsyncStorage unavailable, skipping getCustomer");
        return null;
      }
      
      if (!AsyncStorage || typeof AsyncStorage.getItem !== "function") {
        logger.debug("AsyncStorage getItem not available");
        return null;
      }
      
      const data = await this.withTimeout(() => 
        AsyncStorage.getItem("sol_customer"), 
        this.timeout
      );
      
      if (!data) return null;
      
      try {
        return JSON.parse(data);
      } catch (parseError) {
        logger.warn("Corrupt customer data, clearing storage", { error: parseError.message });
        await this.clearCustomer().catch(() => {});
        return null;
      }
    } catch (e) {
      const errorMsg = e?.message || String(e);
      if (errorMsg.includes("Native module")) {
        this.storageUnavailable = true;
      }
      logger.error("Failed to get customer", { error: errorMsg, platform: Platform.OS });
      return null;
    }
  }

  async saveCustomer(customerData) {
    try {
      // Early exit if we know storage is broken
      if (this.storageUnavailable) {
        logger.debug("AsyncStorage unavailable, skipping saveCustomer");
        return false;
      }
      
      if (!AsyncStorage || typeof AsyncStorage.setItem !== "function") {
        logger.debug("AsyncStorage setItem not available");
        return false;
      }
      
      if (!customerData || typeof customerData !== "object") {
        throw new Error("Invalid customer data");
      }

      await this.withTimeout(() =>
        AsyncStorage.setItem("sol_customer", JSON.stringify(customerData)),
        this.timeout
      );
      
      logger.info("Customer saved", { name: customerData.name });
      return true;
    } catch (e) {
      const errorMsg = e?.message || String(e);
      if (errorMsg.includes("Native module")) {
        this.storageUnavailable = true;
      }
      logger.error("Failed to save customer", { error: errorMsg, platform: Platform.OS });
      return false;
    }
  }

  async clearCustomer() {
    try {
      // Early exit if we know storage is broken
      if (this.storageUnavailable) {
        logger.debug("AsyncStorage unavailable, skipping clearCustomer");
        return false;
      }
      
      if (!AsyncStorage || typeof AsyncStorage.removeItem !== "function") {
        logger.debug("AsyncStorage removeItem not available");
        return false;
      }
      
      await this.withTimeout(() =>
        AsyncStorage.removeItem("sol_customer"),
        this.timeout
      );
      
      logger.info("Customer data cleared");
      return true;
    } catch (e) {
      const errorMsg = e?.message || String(e);
      if (errorMsg.includes("Native module")) {
        this.storageUnavailable = true;
      }
      logger.error("Failed to clear customer", { error: errorMsg, platform: Platform.OS });
      return false;
    }
  }

  // ─── Customer Credentials Operations ───
  
  async getCustomerCredentials() {
    try {
      if (this.storageUnavailable) {
        logger.debug("AsyncStorage unavailable, skipping getCustomerCredentials");
        return null;
      }
      
      if (!AsyncStorage || typeof AsyncStorage.getItem !== "function") {
        logger.debug("AsyncStorage getItem not available");
        return null;
      }
      
      const data = await this.withTimeout(() =>
        AsyncStorage.getItem("sol_customer_creds"),
        this.timeout
      );
      
      if (!data) return null;
      
      try {
        return JSON.parse(data);
      } catch (parseError) {
        logger.warn("Corrupt credentials data, clearing storage", { error: parseError.message });
        await this.clearCustomerCredentials().catch(() => {});
        return null;
      }
    } catch (e) {
      const errorMsg = e?.message || String(e);
      if (errorMsg.includes("Native module")) {
        this.storageUnavailable = true;
      }
      logger.error("Failed to get credentials", { error: errorMsg, platform: Platform.OS });
      return null;
    }
  }

  async saveCustomerCredentials(email, password) {
    try {
      if (this.storageUnavailable) {
        logger.debug("AsyncStorage unavailable, skipping saveCustomerCredentials");
        return false;
      }
      
      if (!AsyncStorage || typeof AsyncStorage.setItem !== "function") {
        logger.debug("AsyncStorage setItem not available");
        return false;
      }
      
      if (!email || !password) {
        throw new Error("Email and password required");
      }

      const credsData = { email, password };
      await this.withTimeout(() =>
        AsyncStorage.setItem("sol_customer_creds", JSON.stringify(credsData)),
        this.timeout
      );
      
      logger.info("Credentials saved");
      return true;
    } catch (e) {
      const errorMsg = e?.message || String(e);
      if (errorMsg.includes("Native module")) {
        this.storageUnavailable = true;
      }
      logger.error("Failed to save credentials", { error: errorMsg, platform: Platform.OS });
      return false;
    }
  }

  async clearCustomerCredentials() {
    try {
      if (this.storageUnavailable) {
        logger.debug("AsyncStorage unavailable, skipping clearCustomerCredentials");
        return false;
      }
      
      if (!AsyncStorage || typeof AsyncStorage.removeItem !== "function") {
        logger.debug("AsyncStorage removeItem not available");
        return false;
      }
      
      await this.withTimeout(() =>
        AsyncStorage.removeItem("sol_customer_creds"),
        this.timeout
      );
      
      logger.info("Credentials cleared");
      return true;
    } catch (e) {
      const errorMsg = e?.message || String(e);
      if (errorMsg.includes("Native module")) {
        this.storageUnavailable = true;
      }
      logger.error("Failed to clear credentials", { error: errorMsg, platform: Platform.OS });
      return false;
    }
  }

  // ─── Orders Operations ───
  
  async getOrders() {
    try {
      if (this.storageUnavailable) {
        logger.debug("AsyncStorage unavailable, skipping getOrders");
        return [];
      }
      
      if (!AsyncStorage || typeof AsyncStorage.getItem !== "function") {
        logger.debug("AsyncStorage getItem not available");
        return [];
      }
      
      const data = await this.withTimeout(() =>
        AsyncStorage.getItem("sol_orders"),
        this.timeout
      );
      
      if (!data) return [];
      
      try {
        const orders = JSON.parse(data);
        return Array.isArray(orders) ? orders : [];
      } catch (parseError) {
        logger.warn("Corrupt orders data, clearing storage", { error: parseError.message });
        await this.clearOrders().catch(() => {});
        return [];
      }
    } catch (e) {
      const errorMsg = e?.message || String(e);
      if (errorMsg.includes("Native module")) {
        this.storageUnavailable = true;
      }
      logger.error("Failed to get orders", { error: errorMsg, platform: Platform.OS });
      return [];
    }
  }

  async saveOrders(orders) {
    try {
      if (this.storageUnavailable) {
        logger.debug("AsyncStorage unavailable, skipping saveOrders");
        return false;
      }
      
      if (!AsyncStorage || typeof AsyncStorage.setItem !== "function") {
        logger.debug("AsyncStorage setItem not available");
        return false;
      }
      
      if (!Array.isArray(orders)) {
        throw new Error("Orders must be an array");
      }

      await this.withTimeout(() =>
        AsyncStorage.setItem("sol_orders", JSON.stringify(orders)),
        this.timeout
      );
      
      logger.info("Orders saved", { count: orders.length });
      return true;
    } catch (e) {
      const errorMsg = e?.message || String(e);
      if (errorMsg.includes("Native module")) {
        this.storageUnavailable = true;
      }
      logger.error("Failed to save orders", { error: errorMsg, platform: Platform.OS });
      return false;
    }
  }

  async clearOrders() {
    try {
      if (this.storageUnavailable) {
        logger.debug("AsyncStorage unavailable, skipping clearOrders");
        return false;
      }
      
      if (!AsyncStorage || typeof AsyncStorage.removeItem !== "function") {
        logger.debug("AsyncStorage removeItem not available");
        return false;
      }
      
      await this.withTimeout(() =>
        AsyncStorage.removeItem("sol_orders"),
        this.timeout
      );
      
      logger.info("Orders cleared");
      return true;
    } catch (e) {
      const errorMsg = e?.message || String(e);
      if (errorMsg.includes("Native module")) {
        this.storageUnavailable = true;
      }
      logger.error("Failed to clear orders", { error: errorMsg, platform: Platform.OS });
      return false;
    }
  }

  // ─── Admin Data Operations ───
  
  async getAdmin() {
    try {
      if (this.storageUnavailable) {
        logger.debug("AsyncStorage unavailable, skipping getAdmin");
        return null;
      }
      
      if (!AsyncStorage || typeof AsyncStorage.getItem !== "function") {
        logger.debug("AsyncStorage getItem not available");
        return null;
      }
      
      const data = await this.withTimeout(() =>
        AsyncStorage.getItem("sol_admin"),
        this.timeout
      );
      
      if (!data) return null;
      
      try {
        return JSON.parse(data);
      } catch (parseError) {
        logger.warn("Corrupt admin data, clearing storage", { error: parseError.message });
        await this.clearAdmin().catch(() => {});
        return null;
      }
    } catch (e) {
      const errorMsg = e?.message || String(e);
      if (errorMsg.includes("Native module")) {
        this.storageUnavailable = true;
      }
      logger.error("Failed to get admin data", { error: errorMsg, platform: Platform.OS });
      return null;
    }
  }

  async saveAdmin(adminData) {
    try {
      if (this.storageUnavailable) {
        logger.debug("AsyncStorage unavailable, skipping saveAdmin");
        return false;
      }
      
      if (!AsyncStorage || typeof AsyncStorage.setItem !== "function") {
        logger.debug("AsyncStorage setItem not available");
        return false;
      }
      
      if (!adminData || typeof adminData !== "object") {
        throw new Error("Invalid admin data");
      }

      await this.withTimeout(() =>
        AsyncStorage.setItem("sol_admin", JSON.stringify(adminData)),
        this.timeout
      );
      
      logger.info("Admin data saved");
      return true;
    } catch (e) {
      const errorMsg = e?.message || String(e);
      if (errorMsg.includes("Native module")) {
        this.storageUnavailable = true;
      }
      logger.error("Failed to save admin data", { error: errorMsg, platform: Platform.OS });
      return false;
    }
  }

  async clearAdmin() {
    try {
      if (this.storageUnavailable) {
        logger.debug("AsyncStorage unavailable, skipping clearAdmin");
        return false;
      }
      
      if (!AsyncStorage || typeof AsyncStorage.removeItem !== "function") {
        logger.debug("AsyncStorage removeItem not available");
        return false;
      }
      
      await this.withTimeout(() =>
        AsyncStorage.removeItem("sol_admin"),
        this.timeout
      );
      
      logger.info("Admin data cleared");
      return true;
    } catch (e) {
      const errorMsg = e?.message || String(e);
      if (errorMsg.includes("Native module")) {
        this.storageUnavailable = true;
      }
      logger.error("Failed to clear admin data", { error: errorMsg, platform: Platform.OS });
      return false;
    }
  }

  // ─── Generic Storage Operations ───
  
  async setItem(key, value) {
    try {
      if (this.storageUnavailable) {
        logger.debug("AsyncStorage unavailable, skipping setItem", { key });
        return false;
      }
      
      if (!AsyncStorage || typeof AsyncStorage.setItem !== "function") {
        throw new Error("AsyncStorage setItem not available");
      }
      if (!key) throw new Error("Key is required");
      
      const stringValue = typeof value === "string" ? value : JSON.stringify(value);
      
      await this.withTimeout(() =>
        AsyncStorage.setItem(key, stringValue),
        this.timeout
      );
      
      return true;
    } catch (e) {
      const errorMsg = e?.message || String(e);
      if (errorMsg.includes("Native module")) {
        this.storageUnavailable = true;
      }
      logger.error("Failed to set item", { key, error: errorMsg, platform: Platform.OS });
      return false;
    }
  }

  async getItem(key) {
    try {
      if (this.storageUnavailable) {
        logger.debug("AsyncStorage unavailable, skipping getItem", { key });
        return null;
      }
      
      if (!AsyncStorage || typeof AsyncStorage.getItem !== "function") {
        logger.debug("AsyncStorage getItem not available", { key });
        return null;
      }
      if (!key) throw new Error("Key is required");
      
      const data = await this.withTimeout(() =>
        AsyncStorage.getItem(key),
        this.timeout
      );
      
      if (!data) return null;
      
      try {
        return JSON.parse(data);
      } catch {
        return data; // Return as string if not JSON
      }
    } catch (e) {
      const errorMsg = e?.message || String(e);
      if (errorMsg.includes("Native module")) {
        this.storageUnavailable = true;
      }
      logger.error("Failed to get item", { key, error: errorMsg, platform: Platform.OS });
      return null;
    }
  }

  async removeItem(key) {
    try {
      if (this.storageUnavailable) {
        logger.debug("AsyncStorage unavailable, skipping removeItem", { key });
        return false;
      }
      
      if (!AsyncStorage || typeof AsyncStorage.removeItem !== "function") {
        throw new Error("AsyncStorage removeItem not available");
      }
      if (!key) throw new Error("Key is required");
      
      await this.withTimeout(() =>
        AsyncStorage.removeItem(key),
        this.timeout
      );
      
      return true;
    } catch (e) {
      const errorMsg = e?.message || String(e);
      if (errorMsg.includes("Native module")) {
        this.storageUnavailable = true;
      }
      logger.error("Failed to remove item", { key, error: errorMsg, platform: Platform.OS });
      return false;
    }
  }

  async clearAll() {
    try {
      if (this.storageUnavailable) {
        logger.debug("AsyncStorage unavailable, skipping clearAll");
        return false;
      }
      
      if (!AsyncStorage || typeof AsyncStorage.clear !== "function") {
        throw new Error("AsyncStorage clear not available");
      }
      
      await this.withTimeout(() =>
        AsyncStorage.clear(),
        this.timeout * 2 // Give more time for full clear
      );
      
      logger.info("All storage cleared");
      return true;
    } catch (e) {
      const errorMsg = e?.message || String(e);
      if (errorMsg.includes("Native module")) {
        this.storageUnavailable = true;
      }
      logger.error("Failed to clear all storage", { error: errorMsg, platform: Platform.OS });
      return false;
    }
  }

  // ─── Utility Methods ───
  
  isAvailable() {
    return !!AsyncStorage;
  }

  getPlatform() {
    return Platform.OS;
  }

  getStorageStatus() {
    return {
      platform: Platform.OS,
      initialized: this.initialized,
      available: this.isAvailable(),
      storageUnavailable: this.storageUnavailable,
      timeout: this.timeout,
      initAttempts: this.initAttempts,
    };
  }
}

// Export singleton instance
export default new Backend();
