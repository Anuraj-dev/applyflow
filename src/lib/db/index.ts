import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import fs from "fs";
import path from "path";
import * as schema from "./schema";

const dataDir = path.join(process.cwd(), "data");
const resumesDir = path.join(dataDir, "resumes");

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(resumesDir)) fs.mkdirSync(resumesDir, { recursive: true });

const dbPath = path.join(dataDir, "applyflow.db");

const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

sqlite.exec(`
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  phone TEXT DEFAULT '',
  linkedin TEXT DEFAULT '',
  github TEXT DEFAULT '',
  portfolio TEXT DEFAULT '',
  education TEXT DEFAULT '[]',
  skills TEXT DEFAULT '[]',
  work_auth TEXT DEFAULT '',
  preferred_roles TEXT DEFAULT '[]',
  preferred_locations TEXT DEFAULT '[]',
  salary_floor INTEGER,
  notes TEXT DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS resumes (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  filename TEXT NOT NULL,
  filepath TEXT NOT NULL,
  is_default INTEGER NOT NULL DEFAULT 0,
  notes TEXT DEFAULT '',
  uploaded_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS opportunities (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  url TEXT DEFAULT '',
  location TEXT DEFAULT '',
  type TEXT NOT NULL DEFAULT 'full-time',
  notes TEXT DEFAULT '',
  jd_text TEXT DEFAULT '',
  deadline TEXT,
  status TEXT NOT NULL DEFAULT 'saved',
  source TEXT NOT NULL DEFAULT 'manual',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS applications (
  id TEXT PRIMARY KEY,
  opportunity_id TEXT NOT NULL REFERENCES opportunities(id),
  resume_id TEXT REFERENCES resumes(id),
  status TEXT NOT NULL DEFAULT 'queued',
  cover_letter TEXT DEFAULT '',
  tailored_bullets TEXT DEFAULT '[]',
  common_answers TEXT DEFAULT '{}',
  checklist TEXT DEFAULT '[]',
  apply_notes TEXT DEFAULT '',
  applied_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
`);

export const db = drizzle(sqlite, { schema });
export { sqlite, dataDir, resumesDir, dbPath };
export * from "./schema";
