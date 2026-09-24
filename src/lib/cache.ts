import { eq, lt } from "drizzle-orm";
import { db, apiCache, sqlite } from "./db";
import { nowIso } from "./ids";

const DEFAULT_TTL_MS = 20 * 60 * 1000; // 20 minutes

export function cacheGet<T>(key: string): T | null {
  const row = db.select().from(apiCache).where(eq(apiCache.key, key)).get();
  if (!row) return null;
  if (Date.now() > row.expiresAt) {
    db.delete(apiCache).where(eq(apiCache.key, key)).run();
    return null;
  }
  try {
    return JSON.parse(row.payload) as T;
  } catch {
    return null;
  }
}

export function cacheSet(key: string, value: unknown, ttlMs = DEFAULT_TTL_MS) {
  const expiresAt = Date.now() + ttlMs;
  sqlite
    .prepare(
      `INSERT INTO api_cache (key, payload, expires_at, created_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET payload = excluded.payload, expires_at = excluded.expires_at, created_at = excluded.created_at`
    )
    .run(key, JSON.stringify(value), expiresAt, nowIso());
}

export function cacheSweep() {
  db.delete(apiCache).where(lt(apiCache.expiresAt, Date.now())).run();
}
