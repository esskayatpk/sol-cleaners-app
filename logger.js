import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import { Platform } from "react-native";

// ─── Logger Utility ───
// Writes structured logs to daily files in the app's document directory.
// Retention: 30 days. Size cap: 50 MB total; oldest files removed first when exceeded.

const LOG_LEVELS = { DEBUG: "DEBUG", INFO: "INFO", WARN: "WARN", ERROR: "ERROR" };

const LOG_DIR = `${FileSystem.documentDirectory}sol_logs/`;
const MAX_AGE_DAYS = 30;
const MAX_TOTAL_BYTES = 50 * 1024 * 1024; // 50 MB

function todayFileName() {
  return `${LOG_DIR}sol_${new Date().toISOString().split("T")[0]}.log`;
}

function dateFromFileName(name) {
  const m = name.match(/sol_(\d{4}-\d{2}-\d{2})\.log$/);
  return m ? new Date(m[1]) : null;
}

class Logger {
  constructor() {
    this.logs = [];           // in-memory ring buffer (latest 1000)
    this.maxLogs = 1000;
    this.isInitialized = false;
    this._writeQueue = Promise.resolve(); // serialize file writes
  }

  // ─── Initialisation ──────────────────────────────────────────────────────────

  async initialize() {
    try {
      // Ensure log directory exists
      const dirInfo = await FileSystem.getInfoAsync(LOG_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(LOG_DIR, { intermediates: true });
      }

      // Load today's log file into memory (for getLogs / export continuity)
      await this._loadTodayIntoMemory();

      // Clean up old / oversized files (non-blocking after init)
      this._runCleanup().catch(() => {});

      this.isInitialized = true;
      console.log("Logger initialised — writing to", LOG_DIR);
    } catch (e) {
      this.isInitialized = true; // still allow in-memory logging
      console.warn("Logger: init error:", e.message);
    }
  }

  async _loadTodayIntoMemory() {
    try {
      const file = todayFileName();
      const info = await FileSystem.getInfoAsync(file);
      if (!info.exists) return;
      const raw = await FileSystem.readAsStringAsync(file, { encoding: FileSystem.EncodingType.UTF8 });
      const lines = raw.split("\n").filter(Boolean);
      // Parse last maxLogs lines to seed the in-memory buffer
      this.logs = lines.slice(-this.maxLogs).map(l => {
        try { return JSON.parse(l); } catch { return null; }
      }).filter(Boolean);
    } catch { /* non-fatal */ }
  }

  // ─── Cleanup ─────────────────────────────────────────────────────────────────

  async _runCleanup() {
    try {
      const files = await FileSystem.readDirectoryAsync(LOG_DIR);
      const logFiles = files.filter(f => f.endsWith(".log")).sort(); // oldest first

      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - MAX_AGE_DAYS);

      let totalSize = 0;
      const fileInfos = await Promise.all(
        logFiles.map(async name => {
          const path = `${LOG_DIR}${name}`;
          const info = await FileSystem.getInfoAsync(path, { size: true });
          return { name, path, date: dateFromFileName(name), size: info.size || 0 };
        })
      );

      // Delete files older than MAX_AGE_DAYS
      for (const f of fileInfos) {
        if (f.date && f.date < cutoff) {
          await FileSystem.deleteAsync(f.path, { idempotent: true });
          console.log("Logger: deleted old log", f.name);
        } else {
          totalSize += f.size;
        }
      }

      // If still over size cap, remove oldest remaining files until under cap
      const remaining = fileInfos
        .filter(f => !(f.date && f.date < cutoff))
        .sort((a, b) => a.name.localeCompare(b.name));

      for (const f of remaining) {
        if (totalSize <= MAX_TOTAL_BYTES) break;
        await FileSystem.deleteAsync(f.path, { idempotent: true });
        totalSize -= f.size;
        console.log("Logger: deleted oversized log", f.name);
      }
    } catch (e) {
      console.warn("Logger cleanup error:", e.message);
    }
  }

  // ─── Write ───────────────────────────────────────────────────────────────────

  _enqueueWrite(line) {
    this._writeQueue = this._writeQueue.then(async () => {
      try {
        await FileSystem.writeAsStringAsync(
          todayFileName(),
          line + "\n",
          { encoding: FileSystem.EncodingType.UTF8, append: true }
        );
      } catch (e) {
        // Fall back silently — AsyncStorage legacy key so logs aren't lost
        AsyncStorage.getItem("sol_log_fallback")
          .then(existing => AsyncStorage.setItem("sol_log_fallback", (existing || "") + line + "\n"))
          .catch(() => {});
      }
    });
  }

  // ─── Core log method ─────────────────────────────────────────────────────────

  addLog(level, message, data = null) {
    const entry = { timestamp: new Date().toISOString(), level, message, data };

    // Update in-memory ring buffer
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) this.logs = this.logs.slice(-this.maxLogs);

    // Write JSON line to today's file (non-blocking)
    if (this.isInitialized) {
      this._enqueueWrite(JSON.stringify(entry));
    }

    // Console output
    const msg = `[${level}] ${entry.timestamp}: ${message}`;
    if (level === LOG_LEVELS.ERROR) console.error(msg, data);
    else if (level === LOG_LEVELS.WARN) console.warn(msg, data);
    else if (level === LOG_LEVELS.INFO) console.log(msg, data);
    // DEBUG: in-memory only, no console noise
  }

  // ─── Public API ──────────────────────────────────────────────────────────────

  debug(message, data = null) { this.addLog(LOG_LEVELS.DEBUG, message, data); }
  info(message, data = null)  { this.addLog(LOG_LEVELS.INFO,  message, data); }
  warn(message, data = null)  { this.addLog(LOG_LEVELS.WARN,  message, data); }
  error(message, data = null) { this.addLog(LOG_LEVELS.ERROR, message, data); }

  getLogs() { return [...this.logs]; }

  getLogsAsString() {
    return this.logs
      .map(l => `[${l.timestamp}] ${l.level}: ${l.message}${l.data ? " " + JSON.stringify(l.data) : ""}`)
      .join("\n");
  }

  /** Returns the path of today's log file (use with expo-sharing if needed). */
  getTodayLogPath() { return todayFileName(); }

  /** Returns paths of all retained log files, newest first. */
  async getAllLogPaths() {
    try {
      const files = await FileSystem.readDirectoryAsync(LOG_DIR);
      return files
        .filter(f => f.endsWith(".log"))
        .sort()
        .reverse()
        .map(f => `${LOG_DIR}${f}`);
    } catch { return []; }
  }

  async clearLogs() {
    try {
      this.logs = [];
      const files = await FileSystem.readDirectoryAsync(LOG_DIR);
      await Promise.all(
        files.filter(f => f.endsWith(".log"))
          .map(f => FileSystem.deleteAsync(`${LOG_DIR}${f}`, { idempotent: true }))
      );
      console.log("Logger: all logs cleared");
    } catch (e) {
      console.error("Logger: clearLogs failed", e.message);
    }
  }

  async exportLogs() {
    const path = todayFileName();
    try {
      const info = await FileSystem.getInfoAsync(path);
      if (!info.exists) return { success: false, error: "No log file for today" };
      const content = await FileSystem.readAsStringAsync(path, { encoding: FileSystem.EncodingType.UTF8 });
      console.log("Logger: exported", path);
      return { success: true, filename: path.split("/").pop(), content, path };
    } catch (e) {
      console.error("Logger: exportLogs failed", e.message);
      return { success: false, error: e.message };
    }
  }
}

export default new Logger();
