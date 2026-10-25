import Database from "better-sqlite3";
import { DB_PATH, ensureStorageDirs } from "./storage";

ensureStorageDirs();

// Singleton DB connection
let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma("journal_mode = WAL");
    initSchema(_db);
  }
  return _db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS recordings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id TEXT NOT NULL,
      filename TEXT NOT NULL,
      r2_key TEXT,
      r2_url TEXT,
      duration_seconds INTEGER DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'recording',
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      finished_at TEXT
    );
  `);
}

export interface Recording {
  id: number;
  patient_id: string;
  filename: string;
  r2_key: string | null;
  r2_url: string | null;
  duration_seconds: number;
  status: "recording" | "uploading" | "done" | "error";
  created_at: string;
  finished_at: string | null;
}

export function insertRecording(patientId: string, filename: string): number {
  const db = getDb();
  const stmt = db.prepare(
    "INSERT INTO recordings (patient_id, filename) VALUES (?, ?)"
  );
  const result = stmt.run(patientId, filename);
  return result.lastInsertRowid as number;
}

export function updateRecordingFinished(
  id: number,
  durationSeconds: number,
  r2Key: string,
  r2Url: string
) {
  const db = getDb();
  db.prepare(
    `UPDATE recordings SET status = 'done', duration_seconds = ?, r2_key = ?, r2_url = ?, finished_at = datetime('now', 'localtime') WHERE id = ?`
  ).run(durationSeconds, r2Key, r2Url, id);
}

export function updateRecordingStatus(
  id: number,
  status: Recording["status"]
) {
  const db = getDb();
  db.prepare("UPDATE recordings SET status = ? WHERE id = ?").run(status, id);
}

export function getAllRecordings(): Recording[] {
  const db = getDb();
  return db
    .prepare("SELECT * FROM recordings ORDER BY created_at DESC")
    .all() as Recording[];
}

export function getFailedRecordings(): Recording[] {
  const db = getDb();
  return db
    .prepare("SELECT * FROM recordings WHERE status = 'error' ORDER BY created_at ASC")
    .all() as Recording[];
}

export function deleteRecording(id: number) {
  const db = getDb();
  db.prepare("DELETE FROM recordings WHERE id = ?").run(id);
}

