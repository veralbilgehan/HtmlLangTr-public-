import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const dbDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, "bigshare.db");
export const db = new Database(dbPath);

// WAL modu — performans için
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// ─── Tabloları oluştur ────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS companies (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    email TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'employee',
    company_id TEXT REFERENCES companies(id),
    department TEXT,
    avatar TEXT
  );

  CREATE TABLE IF NOT EXISTS activity_types (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    company_id TEXT REFERENCES companies(id),
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'activity',
    points INTEGER NOT NULL DEFAULT 1,
    is_default INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS shifts (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL REFERENCES users(id),
    company_id TEXT REFERENCES companies(id),
    start_time TEXT NOT NULL,
    end_time TEXT,
    duration_seconds INTEGER,
    start_latitude REAL,
    start_longitude REAL,
    end_latitude REAL,
    end_longitude REAL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS activities (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL REFERENCES users(id),
    company_id TEXT REFERENCES companies(id),
    shift_id TEXT REFERENCES shifts(id),
    activity_type_id TEXT REFERENCES activity_types(id),
    type TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT,
    duration_minutes INTEGER,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS sales_records (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL REFERENCES users(id),
    company_id TEXT REFERENCES companies(id),
    shift_id TEXT REFERENCES shifts(id),
    activity_type_id TEXT REFERENCES activity_types(id),
    type TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS company_settings (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    company_id TEXT NOT NULL UNIQUE REFERENCES companies(id),
    shift_start_time TEXT NOT NULL DEFAULT '09:00',
    shift_end_time TEXT NOT NULL DEFAULT '18:00',
    late_threshold_minutes INTEGER NOT NULL DEFAULT 15,
    late_warning1 TEXT NOT NULL DEFAULT 'Mesai saatinde işyerinde olmadığınızdan kanuna ilişkin mazeretinizi bildiriniz.',
    late_warning2 TEXT NOT NULL DEFAULT 'Mesai başlangıç saatini geçmenize rağmen mesainizi başlatmadınız. Lütfen durumu yöneticinize bildirin.',
    late_warning3 TEXT NOT NULL DEFAULT 'Devamsızlık tutanağı düzenlenecektir. En kısa sürede işyerinizde bulununuz.',
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS groups (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name TEXT NOT NULL,
    company_id TEXT REFERENCES companies(id),
    created_by TEXT REFERENCES users(id),
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS group_members (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    group_id TEXT NOT NULL REFERENCES groups(id),
    user_id TEXT NOT NULL REFERENCES users(id),
    joined_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS group_messages (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    group_id TEXT NOT NULL REFERENCES groups(id),
    sender_id TEXT NOT NULL REFERENCES users(id),
    content TEXT,
    file_url TEXT,
    file_name TEXT,
    file_size INTEGER,
    file_type TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    sender_id TEXT NOT NULL REFERENCES users(id),
    recipient_id TEXT NOT NULL REFERENCES users(id),
    company_id TEXT REFERENCES companies(id),
    content TEXT,
    file_url TEXT,
    file_name TEXT,
    file_size INTEGER,
    file_type TEXT,
    read INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

console.log("[DB] SQLite veritabanı hazır:", dbPath);
