import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

// ─── Logger Utility ───
// Stores error/message logs with timestamps, saves to AsyncStorage and console

const LOG_LEVELS = {
  DEBUG: "DEBUG",
  INFO: "INFO",
  WARN: "WARN",
  ERROR: "ERROR",
};

const LOG_KEY = `sol_logs_${new Date().toISOString().split("T")[0]}`; // One log per day

class Logger {
  constructor() {
    this.logs = [];
    this.maxLogs = 1000; // Keep max 1000 logs in memory
    this.isInitialized = false;
  }

  async initialize() {
    try {
      // Add a timeout to prevent hanging on Android
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("AsyncStorage timeout")), 5000)
      );

      const loadPromise = (async () => {
        try {
          const saved = await AsyncStorage.getItem(LOG_KEY);
          if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) {
              this.logs = parsed;
            } else {
              console.warn("Logger: Invalid saved logs format, starting fresh");
              this.logs = [];
            }
          }
        } catch (parseError) {
          console.warn("Logger: Failed to parse saved logs, clearing storage", parseError.message);
          try {
            await AsyncStorage.removeItem(LOG_KEY);
          } catch (removeError) {
            console.warn("Logger: Failed to clear corrupted logs", removeError.message);
          }
          this.logs = [];
        }
      })();

      await Promise.race([loadPromise, timeoutPromise]);
      this.isInitialized = true;
      console.log("Logger initialized successfully");
    } catch (e) {
      // Don't block the app if logger initialization fails
      this.isInitialized = true; // Mark as initialized anyway so we can still log to memory/console
      console.warn("Logger: Non-blocking initialization error on", Platform?.OS || "unknown OS", ":", e.message);
    }
  }

  getTimestamp() {
    const now = new Date();
    return now.toISOString();
  }

  async addLog(level, message, data = null) {
    const logEntry = {
      timestamp: this.getTimestamp(),
      level,
      message,
      data,
    };

    this.logs.push(logEntry);

    // Keep only the latest logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Save to AsyncStorage (non-blocking, fire and forget)
    if (this.isInitialized) {
      AsyncStorage.setItem(LOG_KEY, JSON.stringify(this.logs)).catch(e => {
        // Silently fail - don't block logging if save fails
        console.warn("Logger save failed:", e.message);
      });
    }

    // Also log to console with formatting (skip DEBUG to reduce noise)
    const consoleMessage = `[${level}] ${logEntry.timestamp}: ${message}`;
    switch (level) {
      case LOG_LEVELS.ERROR:
        console.error(consoleMessage, data);
        break;
      case LOG_LEVELS.WARN:
        console.warn(consoleMessage, data);
        break;
      case LOG_LEVELS.INFO:
        console.log(consoleMessage, data);
        break;
      case LOG_LEVELS.DEBUG:
        // Store in logs but don't spam console - only log to memory for debugging later
        break;
      default:
        console.log(consoleMessage, data);
    }
  }

  debug(message, data = null) {
    this.addLog(LOG_LEVELS.DEBUG, message, data);
  }

  info(message, data = null) {
    this.addLog(LOG_LEVELS.INFO, message, data);
  }

  warn(message, data = null) {
    this.addLog(LOG_LEVELS.WARN, message, data);
  }

  error(message, data = null) {
    this.addLog(LOG_LEVELS.ERROR, message, data);
  }

  getLogs() {
    return [...this.logs];
  }

  getLogsAsString() {
    return this.logs
      .map(log => `[${log.timestamp}] ${log.level}: ${log.message}${log.data ? ` - ${JSON.stringify(log.data)}` : ""}`)
      .join("\n");
  }

  async clearLogs() {
    try {
      this.logs = [];
      await AsyncStorage.removeItem(LOG_KEY);
      console.log("Logs cleared");
    } catch (e) {
      console.error("Failed to clear logs:", e);
    }
  }

  async exportLogs() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `sol_logs_${timestamp}.txt`;
    const content = this.getLogsAsString();

    try {
      // For web/Expo, we can use a Blob to download
      if (typeof window !== "undefined") {
        const element = document.createElement("a");
        element.setAttribute("href", `data:text/plain;charset=utf-8,${encodeURIComponent(content)}`);
        element.setAttribute("download", filename);
        element.style.display = "none";
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
      }

      console.log(`Logs exported to ${filename}`);
      return { success: true, filename, content };
    } catch (e) {
      console.error("Failed to export logs:", e);
      return { success: false, error: e.message };
    }
  }
}

// Export singleton instance
export default new Logger();
