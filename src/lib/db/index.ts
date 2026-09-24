import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import fs from "fs";
import path from "path";
import * as schema from "./schema";
import { newId, nowIso } from "../ids";

const dataDir = path.join(process.cwd(), "data");
const resumesDir = path.join(dataDir, "resumes");

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(resumesDir)) fs.mkdirSync(resumesDir, { recursive: true });

const dbPath = path.join(dataDir, "applyflow.db");

const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");
sqlite.pragma("synchronous = NORMAL");

sqlite.exec(`
CREATE TABLE IF NOT EXISTS workspaces (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'Local',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL DEFAULT 'local',
  user_id TEXT NOT NULL DEFAULT 'local',
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
  onboarding_done INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS resumes (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL DEFAULT 'local',
  user_id TEXT NOT NULL DEFAULT 'local',
  label TEXT NOT NULL,
  filename TEXT NOT NULL,
  filepath TEXT NOT NULL,
  is_default INTEGER NOT NULL DEFAULT 0,
  notes TEXT DEFAULT '',
  uploaded_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS opportunities (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL DEFAULT 'local',
  user_id TEXT NOT NULL DEFAULT 'local',
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
  template_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS applications (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL DEFAULT 'local',
  user_id TEXT NOT NULL DEFAULT 'local',
  opportunity_id TEXT NOT NULL REFERENCES opportunities(id),
  resume_id TEXT REFERENCES resumes(id),
  status TEXT NOT NULL DEFAULT 'queued',
  cover_letter TEXT DEFAULT '',
  tailored_bullets TEXT DEFAULT '[]',
  common_answers TEXT DEFAULT '{}',
  checklist TEXT DEFAULT '[]',
  apply_notes TEXT DEFAULT '',
  template_id TEXT,
  applied_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS activities (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL DEFAULT 'local',
  user_id TEXT NOT NULL DEFAULT 'local',
  opportunity_id TEXT,
  application_id TEXT,
  kind TEXT NOT NULL,
  message TEXT NOT NULL,
  meta TEXT DEFAULT '{}',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS cover_templates (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL DEFAULT 'local',
  user_id TEXT NOT NULL DEFAULT 'local',
  name TEXT NOT NULL,
  body TEXT NOT NULL,
  is_default INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS saved_searches (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL DEFAULT 'local',
  user_id TEXT NOT NULL DEFAULT 'local',
  name TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'remotive',
  keywords TEXT DEFAULT '',
  location TEXT DEFAULT '',
  remote_only INTEGER NOT NULL DEFAULT 1,
  internship INTEGER NOT NULL DEFAULT 0,
  filters TEXT DEFAULT '{}',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS api_cache (
  key TEXT PRIMARY KEY,
  payload TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL DEFAULT 'local',
  user_id TEXT NOT NULL DEFAULT 'local',
  accent TEXT NOT NULL DEFAULT 'indigo',
  confetti INTEGER NOT NULL DEFAULT 1,
  dense_lists INTEGER NOT NULL DEFAULT 0,
  extras TEXT DEFAULT '{}',
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS opp_status_idx ON opportunities(status);
CREATE INDEX IF NOT EXISTS opp_source_idx ON opportunities(source);
CREATE INDEX IF NOT EXISTS opp_url_idx ON opportunities(url);
CREATE INDEX IF NOT EXISTS app_status_idx ON applications(status);
CREATE INDEX IF NOT EXISTS app_opp_idx ON applications(opportunity_id);
CREATE INDEX IF NOT EXISTS act_opp_idx ON activities(opportunity_id);
CREATE INDEX IF NOT EXISTS act_created_idx ON activities(created_at);
`);

function hasColumn(table: string, column: string): boolean {
  const cols = sqlite.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  return cols.some((c) => c.name === column);
}

function addColumn(table: string, column: string, ddl: string) {
  if (!hasColumn(table, column)) {
    sqlite.exec(`ALTER TABLE ${table} ADD COLUMN ${ddl}`);
  }
}

addColumn("profiles", "workspace_id", "workspace_id TEXT NOT NULL DEFAULT 'local'");
addColumn("profiles", "user_id", "user_id TEXT NOT NULL DEFAULT 'local'");
addColumn("profiles", "onboarding_done", "onboarding_done INTEGER NOT NULL DEFAULT 0");
addColumn("resumes", "workspace_id", "workspace_id TEXT NOT NULL DEFAULT 'local'");
addColumn("resumes", "user_id", "user_id TEXT NOT NULL DEFAULT 'local'");
addColumn("opportunities", "workspace_id", "workspace_id TEXT NOT NULL DEFAULT 'local'");
addColumn("opportunities", "user_id", "user_id TEXT NOT NULL DEFAULT 'local'");
addColumn("opportunities", "template_id", "template_id TEXT");
addColumn("applications", "workspace_id", "workspace_id TEXT NOT NULL DEFAULT 'local'");
addColumn("applications", "user_id", "user_id TEXT NOT NULL DEFAULT 'local'");
addColumn("applications", "template_id", "template_id TEXT");

const ws = sqlite.prepare("SELECT id FROM workspaces WHERE id = ?").get("local");
if (!ws) {
  sqlite
    .prepare("INSERT INTO workspaces (id, name, created_at) VALUES (?, ?, ?)")
    .run("local", "Local", nowIso());
}

const settingsRow = sqlite.prepare("SELECT id FROM settings WHERE id = ?").get("local");
if (!settingsRow) {
  sqlite
    .prepare(
      "INSERT INTO settings (id, workspace_id, user_id, accent, confetti, dense_lists, extras, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    )
    .run("local", "local", "local", "indigo", 1, 0, "{}", nowIso());
}

const templateCount = (
  sqlite.prepare("SELECT COUNT(*) as c FROM cover_templates").get() as { c: number }
).c;
if (templateCount === 0) {
  const defaults = [
    {
      name: "Internship — curious & concrete",
      body: `Dear {{company}} Hiring Team,

I am writing to apply for the {{title}} role. I bring {{skills}} and am eager to contribute while learning from your team.

In my studies and projects I have focused on practical outcomes — not just coursework. I would welcome the chance to discuss how I can support {{company}}.

Thank you for your time,
{{name}}`,
    },
    {
      name: "New grad — skills match",
      body: `Dear {{company}} Hiring Team,

I am excited to apply for {{title}}. My background in {{skills}} aligns with what you are building, and I am ready to contribute from day one.

I have prepared materials tailored to this role and would love to share more in an interview.

Best regards,
{{name}}`,
    },
    {
      name: "Career switch — bridge narrative",
      body: `Dear {{company}} Hiring Team,

I am applying for {{title}} at {{company}}. I am intentionally moving toward this work, drawing on transferable strengths in {{skills}}.

I care about craft, clarity, and shipping. I would appreciate the opportunity to discuss fit.

Sincerely,
{{name}}`,
    },
  ];
  const now = nowIso();
  const stmt = sqlite.prepare(
    "INSERT INTO cover_templates (id, workspace_id, user_id, name, body, is_default, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
  );
  defaults.forEach((t, i) => {
    stmt.run(newId(), "local", "local", t.name, t.body, i === 0 ? 1 : 0, now, now);
  });
}

export const db = drizzle(sqlite, { schema });
export { sqlite, dataDir, resumesDir, dbPath };
export * from "./schema";
