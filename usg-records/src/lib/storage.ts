import path from "path";
import fs from "fs";

/**
 * Resolves the writable storage directory for the application.
 *
 * In Windows production deployments, "C:\Program Files" is write-protected.
 * Therefore, persistent data (SQLite database, video recordings, logs) is placed in
 * "%ProgramData%\USG Recorder\storage" or the path defined by process.env.STORAGE_DIR.
 *
 * In local development mode, it defaults to the local "./storage" directory.
 */
export function getStorageDir(): string {
  if (process.env.STORAGE_DIR) {
    return process.env.STORAGE_DIR;
  }

  if (process.env.PROGRAMDATA && process.env.NODE_ENV === "production") {
    return path.join(process.env.PROGRAMDATA, "USG Recorder", "storage");
  }

  return path.join(process.cwd(), "storage");
}

export const STORAGE_DIR = getStorageDir();
export const DB_PATH = path.join(STORAGE_DIR, "usg_records.db");
export const VIDEOS_DIR = path.join(STORAGE_DIR, "videos");
export const LOGS_DIR = path.join(STORAGE_DIR, "logs");

export function ensureStorageDirs(): void {
  try {
    if (!fs.existsSync(/*turbopackIgnore: true*/ STORAGE_DIR)) {
      fs.mkdirSync(STORAGE_DIR, { recursive: true });
    }
    if (!fs.existsSync(/*turbopackIgnore: true*/ VIDEOS_DIR)) {
      fs.mkdirSync(VIDEOS_DIR, { recursive: true });
    }
    if (!fs.existsSync(/*turbopackIgnore: true*/ LOGS_DIR)) {
      fs.mkdirSync(LOGS_DIR, { recursive: true });
    }
  } catch (err) {
    console.error("[Storage] Failed to create storage directories:", err);
  }
}

// Ensure directories exist immediately when module loads
ensureStorageDirs();
