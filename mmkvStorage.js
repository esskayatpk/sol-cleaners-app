import { MMKV } from "react-native-mmkv";
import { Platform } from "react-native";
import logger from "./logger";

// ─── MMKV Storage Service (Android-Optimized) ───
// MMKV is faster and more reliable than AsyncStorage on Android

class MMKVStorage {
  constructor() {
    try {
      this.storage = new MMKV();
      this.initialized = true;
      logger.info("MMKV Storage initialized", { platform: Platform.OS });
    } catch (e) {
      logger.error("Failed to initialize MMKV", { error: e.message, platform: Platform.OS });
      this.initialized = false;
      this.storage = null;
    }
  }

  isAvailable() {
    return this.initialized && !!this.storage;
  }

  // ─── Customer Data Operations ───

  async getCustomer() {
    try {
      if (!this.isAvailable()) {
        logger.debug("MMKV not available, skipping getCustomer");
        return null;
      }

      const data = this.storage.getString("sol_customer");
      if (!data) return null;

      try {
        return JSON.parse(data);
      } catch (parseError) {
        logger.warn("Corrupt customer data, clearing storage", { error: parseError.message });
        this.clearCustomer();
        return null;
      }
    } catch (e) {
      logger.error("Failed to get customer", { error: e.message, platform: Platform.OS });
      return null;
    }
  }

  async saveCustomer(customerData) {
    try {
      if (!this.isAvailable()) {
        logger.debug("MMKV not available, skipping saveCustomer");
        return false;
      }

      if (!customerData || typeof customerData !== "object") {
        throw new Error("Invalid customer data");
      }

      this.storage.set("sol_customer", JSON.stringify(customerData));
      logger.info("Customer saved", { name: customerData.name });
      return true;
    } catch (e) {
      logger.error("Failed to save customer", { error: e.message, platform: Platform.OS });
      return false;
    }
  }

  async clearCustomer() {
    try {
      if (!this.isAvailable()) {
        logger.debug("MMKV not available, skipping clearCustomer");
        return false;
      }

      this.storage.delete("sol_customer");
      logger.info("Customer data cleared");
      return true;
    } catch (e) {
      logger.error("Failed to clear customer", { error: e.message, platform: Platform.OS });
      return false;
    }
  }

  // ─── Customer Credentials Operations ───

  async getCustomerCredentials() {
    try {
      if (!this.isAvailable()) {
        logger.debug("MMKV not available, skipping getCustomerCredentials");
        return null;
      }

      const data = this.storage.getString("sol_customer_creds");
      if (!data) return null;

      try {
        return JSON.parse(data);
      } catch (parseError) {
        logger.warn("Corrupt credentials data, clearing storage", { error: parseError.message });
        this.clearCustomerCredentials();
        return null;
      }
    } catch (e) {
      logger.error("Failed to get credentials", { error: e.message, platform: Platform.OS });
      return null;
    }
  }

  async saveCustomerCredentials(email, password) {
    try {
      if (!this.isAvailable()) {
        logger.debug("MMKV not available, skipping saveCustomerCredentials");
        return false;
      }

      if (!email || !password) {
        throw new Error("Email and password required");
      }

      const credsData = { email, password };
      this.storage.set("sol_customer_creds", JSON.stringify(credsData));
      logger.info("Credentials saved");
      return true;
    } catch (e) {
      logger.error("Failed to save credentials", { error: e.message, platform: Platform.OS });
      return false;
    }
  }

  async clearCustomerCredentials() {
    try {
      if (!this.isAvailable()) {
        logger.debug("MMKV not available, skipping clearCustomerCredentials");
        return false;
      }

      this.storage.delete("sol_customer_creds");
      logger.info("Credentials cleared");
      return true;
    } catch (e) {
      logger.error("Failed to clear credentials", { error: e.message, platform: Platform.OS });
      return false;
    }
  }

  // ─── Orders Operations ───

  async getOrders() {
    try {
      if (!this.isAvailable()) {
        logger.debug("MMKV not available, skipping getOrders");
        return [];
      }

      const data = this.storage.getString("sol_orders");
      if (!data) return [];

      try {
        const orders = JSON.parse(data);
        return Array.isArray(orders) ? orders : [];
      } catch (parseError) {
        logger.warn("Corrupt orders data, clearing storage", { error: parseError.message });
        this.clearOrders();
        return [];
      }
    } catch (e) {
      logger.error("Failed to get orders", { error: e.message, platform: Platform.OS });
      return [];
    }
  }

  async saveOrders(orders) {
    try {
      if (!this.isAvailable()) {
        logger.debug("MMKV not available, skipping saveOrders");
        return false;
      }

      if (!Array.isArray(orders)) {
        throw new Error("Orders must be an array");
      }

      this.storage.set("sol_orders", JSON.stringify(orders));
      logger.info("Orders saved", { count: orders.length });
      return true;
    } catch (e) {
      logger.error("Failed to save orders", { error: e.message, platform: Platform.OS });
      return false;
    }
  }

  async clearOrders() {
    try {
      if (!this.isAvailable()) {
        logger.debug("MMKV not available, skipping clearOrders");
        return false;
      }

      this.storage.delete("sol_orders");
      logger.info("Orders cleared");
      return true;
    } catch (e) {
      logger.error("Failed to clear orders", { error: e.message, platform: Platform.OS });
      return false;
    }
  }

  // ─── Admin Data Operations ───

  async getAdmin() {
    try {
      if (!this.isAvailable()) {
        logger.debug("MMKV not available, skipping getAdmin");
        return null;
      }

      const data = this.storage.getString("sol_admin");
      if (!data) return null;

      try {
        return JSON.parse(data);
      } catch (parseError) {
        logger.warn("Corrupt admin data, clearing storage", { error: parseError.message });
        this.clearAdmin();
        return null;
      }
    } catch (e) {
      logger.error("Failed to get admin data", { error: e.message, platform: Platform.OS });
      return null;
    }
  }

  async saveAdmin(adminData) {
    try {
      if (!this.isAvailable()) {
        logger.debug("MMKV not available, skipping saveAdmin");
        return false;
      }

      if (!adminData || typeof adminData !== "object") {
        throw new Error("Invalid admin data");
      }

      this.storage.set("sol_admin", JSON.stringify(adminData));
      logger.info("Admin data saved");
      return true;
    } catch (e) {
      logger.error("Failed to save admin data", { error: e.message, platform: Platform.OS });
      return false;
    }
  }

  async clearAdmin() {
    try {
      if (!this.isAvailable()) {
        logger.debug("MMKV not available, skipping clearAdmin");
        return false;
      }

      this.storage.delete("sol_admin");
      logger.info("Admin data cleared");
      return true;
    } catch (e) {
      logger.error("Failed to clear admin data", { error: e.message, platform: Platform.OS });
      return false;
    }
  }

  // ─── Generic Storage Operations ───

  async setItem(key, value) {
    try {
      if (!this.isAvailable()) {
        logger.debug("MMKV not available, skipping setItem", { key });
        return false;
      }

      if (!key) throw new Error("Key is required");

      const stringValue = typeof value === "string" ? value : JSON.stringify(value);
      this.storage.set(key, stringValue);
      return true;
    } catch (e) {
      logger.error("Failed to set item", { key, error: e.message, platform: Platform.OS });
      return false;
    }
  }

  async getItem(key) {
    try {
      if (!this.isAvailable()) {
        logger.debug("MMKV not available, skipping getItem", { key });
        return null;
      }

      if (!key) throw new Error("Key is required");

      const data = this.storage.getString(key);
      if (!data) return null;

      try {
        return JSON.parse(data);
      } catch {
        return data; // Return as string if not JSON
      }
    } catch (e) {
      logger.error("Failed to get item", { key, error: e.message, platform: Platform.OS });
      return null;
    }
  }

  async removeItem(key) {
    try {
      if (!this.isAvailable()) {
        logger.debug("MMKV not available, skipping removeItem", { key });
        return false;
      }

      if (!key) throw new Error("Key is required");

      this.storage.delete(key);
      return true;
    } catch (e) {
      logger.error("Failed to remove item", { key, error: e.message, platform: Platform.OS });
      return false;
    }
  }

  async clearAll() {
    try {
      if (!this.isAvailable()) {
        logger.debug("MMKV not available, skipping clearAll");
        return false;
      }

      this.storage.clearAll();
      logger.info("All storage cleared");
      return true;
    } catch (e) {
      logger.error("Failed to clear all storage", { error: e.message, platform: Platform.OS });
      return false;
    }
  }

  // ─── Utility Methods ───

  getStorageStatus() {
    return {
      type: "MMKV",
      platform: Platform.OS,
      initialized: this.initialized,
      available: this.isAvailable(),
    };
  }
}

// Export singleton instance
export default new MMKVStorage();
