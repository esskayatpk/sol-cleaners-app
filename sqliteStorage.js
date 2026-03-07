import { Platform } from "react-native";
import logger from "./logger";

// Only import SQLite on native platforms (iOS/Android)
// Web will use fallback in-memory storage
let SQLite = null;
if (Platform.OS !== "web") {
  SQLite = require("expo-sqlite");
}

// ─── SQLite Storage Service ───
// Reliable local database using Expo's SQLite on native (no native module linking issues)
// Falls back to in-memory storage on web

class SQLiteStorage {
  constructor() {
    this.db = null;
    this.initialized = false;
    this.initPromise = null;
    this.isWeb = Platform.OS === "web";
    this.memoryStore = {}; // Fallback in-memory storage for web
  }

  async initialize() {
    // Prevent multiple initialization attempts
    if (this.initialized) return true;
    if (this.initPromise) return this.initPromise;

    this.initPromise = this._initializeDB();
    try {
      await this.initPromise;
      return true;
    } catch (e) {
      logger.error("SQLite initialization failed", { error: e.message, platform: Platform.OS });
      return false;
    }
  }

  async _initializeDB() {
    try {
      // On web, skip SQLite and use in-memory storage
      if (this.isWeb) {
        this.db = null;
        this.initialized = true;
        logger.info("Web platform detected, using in-memory storage");
        return true;
      }

      // Open or create database (native only)
      this.db = await SQLite.openDatabaseAsync("sol_storage.db");

      // Create storage table if it doesn't exist
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS storage (
          id INTEGER PRIMARY KEY,
          key TEXT UNIQUE NOT NULL,
          value TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_key ON storage(key);
      `);

      this.initialized = true;
      logger.info("SQLite Storage initialized", { platform: Platform.OS });
      return true;
    } catch (e) {
      logger.error("Failed to initialize storage", { error: e.message, platform: Platform.OS });
      throw e;
    }
  }

  async ensureInitialized() {
    if (!this.initialized) {
      await this.initialize();
    }
    // On web, db will be null but that's okay - we use memoryStore instead
  }

  async _getStoredValue(key) {
    if (this.isWeb) {
      return this.memoryStore[key] || null;
    }
    await this.ensureInitialized();
    const result = await this.db.getFirstAsync(
      "SELECT value FROM storage WHERE key = ?",
      [key]
    );
    return result ? result.value : null;
  }

  async _setStoredValue(key, value) {
    if (this.isWeb) {
      this.memoryStore[key] = value;
      return true;
    }
    await this.ensureInitialized();
    await this.db.runAsync(
      "INSERT OR REPLACE INTO storage (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)",
      [key, value]
    );
    return true;
  }

  async _removeStoredValue(key) {
    if (this.isWeb) {
      delete this.memoryStore[key];
      return true;
    }
    await this.ensureInitialized();
    await this.db.runAsync("DELETE FROM storage WHERE key = ?", [key]);
    return true;
  }

  // ─── Customer Data Operations ───

  async getCustomer() {
    try {
      const value = await this._getStoredValue("sol_customer");
      if (!value) return null;

      try {
        return JSON.parse(value);
      } catch (parseError) {
        logger.warn("Corrupt customer data, clearing", { error: parseError.message });
        await this.clearCustomer();
        return null;
      }
    } catch (e) {
      logger.error("Failed to get customer", { error: e.message, platform: Platform.OS });
      return null;
    }
  }

  async saveCustomer(customerData) {
    try {
      if (!customerData || typeof customerData !== "object") {
        throw new Error("Invalid customer data");
      }

      const value = JSON.stringify(customerData);
      await this._setStoredValue("sol_customer", value);

      logger.info("Customer saved", { name: customerData.name });
      return true;
    } catch (e) {
      logger.error("Failed to save customer", { error: e.message, platform: Platform.OS });
      return false;
    }
  }

  async clearCustomer() {
    try {
      await this._removeStoredValue("sol_customer");

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
      const value = await this._getStoredValue("sol_customer_creds");
      if (!value) return null;

      try {
        return JSON.parse(value);
      } catch (parseError) {
        logger.warn("Corrupt credentials data, clearing", { error: parseError.message });
        await this.clearCustomerCredentials();
        return null;
      }
    } catch (e) {
      logger.error("Failed to get credentials", { error: e.message, platform: Platform.OS });
      return null;
    }
  }

  async saveCustomerCredentials(email, password) {
    try {
      if (!email || !password) {
        throw new Error("Email and password required");
      }

      const credsData = { email, password };
      const value = JSON.stringify(credsData);

      await this._setStoredValue("sol_customer_creds", value);

      logger.info("Credentials saved");
      return true;
    } catch (e) {
      logger.error("Failed to save credentials", { error: e.message, platform: Platform.OS });
      return false;
    }
  }

  async clearCustomerCredentials() {
    try {
      await this._removeStoredValue("sol_customer_creds");

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
      const value = await this._getStoredValue("sol_orders");
      if (!value) return [];

      try {
        const orders = JSON.parse(value);
        return Array.isArray(orders) ? orders : [];
      } catch (parseError) {
        logger.warn("Corrupt orders data, clearing", { error: parseError.message });
        await this.clearOrders();
        return [];
      }
    } catch (e) {
      logger.error("Failed to get orders", { error: e.message, platform: Platform.OS });
      return [];
    }
  }

  async saveOrders(orders) {
    try {
      if (!Array.isArray(orders)) {
        throw new Error("Orders must be an array");
      }

      const value = JSON.stringify(orders);
      await this._setStoredValue("sol_orders", value);

      logger.info("Orders saved", { count: orders.length });
      return true;
    } catch (e) {
      logger.error("Failed to save orders", { error: e.message, platform: Platform.OS });
      return false;
    }
  }

  async clearOrders() {
    try {
      await this._removeStoredValue("sol_orders");

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
      const value = await this._getStoredValue("sol_admin");
      if (!value) return null;

      try {
        return JSON.parse(value);
      } catch (parseError) {
        logger.warn("Corrupt admin data, clearing", { error: parseError.message });
        await this.clearAdmin();
        return null;
      }
    } catch (e) {
      logger.error("Failed to get admin data", { error: e.message, platform: Platform.OS });
      return null;
    }
  }

  async saveAdmin(adminData) {
    try {
      if (!adminData || typeof adminData !== "object") {
        throw new Error("Invalid admin data");
      }

      const value = JSON.stringify(adminData);
      await this._setStoredValue("sol_admin", value);

      logger.info("Admin data saved");
      return true;
    } catch (e) {
      logger.error("Failed to save admin data", { error: e.message, platform: Platform.OS });
      return false;
    }
  }

  async clearAdmin() {
    try {
      await this._removeStoredValue("sol_admin");

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
      if (!key) throw new Error("Key is required");

      const stringValue = typeof value === "string" ? value : JSON.stringify(value);
      await this._setStoredValue(key, stringValue);

      return true;
    } catch (e) {
      logger.error("Failed to set item", { key, error: e.message, platform: Platform.OS });
      return false;
    }
  }

  async getItem(key) {
    try {
      if (!key) throw new Error("Key is required");

      const value = await this._getStoredValue(key);
      if (!value) return null;

      try {
        return JSON.parse(value);
      } catch {
        return value; // Return as string if not JSON
      }
    } catch (e) {
      logger.error("Failed to get item", { key, error: e.message, platform: Platform.OS });
      return null;
    }
  }

  async removeItem(key) {
    try {
      if (!key) throw new Error("Key is required");

      await this._removeStoredValue(key);

      return true;
    } catch (e) {
      logger.error("Failed to remove item", { key, error: e.message, platform: Platform.OS });
      return false;
    }
  }

  async clearAll() {
    try {
      await this.ensureInitialized();

      if (this.isWeb) {
        this.memoryStore = {};
      } else {
        await this.db.runAsync("DELETE FROM storage");
      }

      logger.info("All storage cleared");
      return true;
    } catch (e) {
      logger.error("Failed to clear all storage", { error: e.message, platform: Platform.OS });
      return false;
    }
  }

  // ─── Utility Methods ───

  isAvailable() {
    return this.initialized;
  }

  getStorageStatus() {
    return {
      type: this.isWeb ? "Memory" : "SQLite",
      platform: Platform.OS,
      initialized: this.initialized,
      available: this.isAvailable(),
    };
  }
}

// Export singleton instance
export default new SQLiteStorage();
