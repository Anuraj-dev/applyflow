import { db, opportunities } from "../db";
import { newId, nowIso } from "../ids";
import { logActivity } from "../activity";
import type { DiscoverJob } from "./types";

export function normalizeUrl(url: string): string {
  try {
    const u = new URL(url.trim());
    u.hash = "";
    // strip common tracking params
    ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gh_src"].forEach((p) =>
      u.searchParams.delete(p)
    );
    return u.toString().replace(/\/$/, "").toLowerCase();
  } catch {
    return url.trim().toLowerCase();
  }
}

export function importJobs(
  jobs: DiscoverJob[],
  opts?: { workspaceId?: string; userId?: string }
): { imported: number; skipped: number; ids: string[] } {
  const workspaceId = opts?.workspaceId || "local";
  const userId = opts?.userId || "local";
  const existing = db.select().from(opportunities).all();
  const urlSet = new Set(
    existing.map((o) => normalizeUrl(o.url || "")).filter(Boolean)
  );

  const now = nowIso();
  const ids: string[] = [];
  let skipped = 0;

  for (const job of jobs) {
    const url = job.url || "";
    const norm = normalizeUrl(url);
    if (norm && urlSet.has(norm)) {
      skipped++;
      continue;
    }
    const id = newId();
    db.insert(opportunities)
      .values({
        id,
        workspaceId,
        userId,
        title: job.title.slice(0, 300),
        company: job.company.slice(0, 200),
        url,
        location: job.location || "",
        type: job.type || "full-time",
        notes: "",
        jdText: job.description || "",
        deadline: null,
        status: "saved",
        source: job.source,
        createdAt: now,
        updatedAt: now,
      })
      .run();
    if (norm) urlSet.add(norm);
    ids.push(id);
    logActivity({
      kind: "import",
      message: `Imported ${job.title} @ ${job.company} from ${job.source}`,
      opportunityId: id,
      meta: { source: job.source, externalId: job.externalId },
    });
  }

  return { imported: ids.length, skipped, ids };
}

export function findByUrl(url: string) {
  const norm = normalizeUrl(url);
  if (!norm) return null;
  return (
    db
      .select()
      .from(opportunities)
      .all()
      .find((o) => normalizeUrl(o.url || "") === norm) || null
  );
}

export function existingUrlSet(): Set<string> {
  return new Set(
    db
      .select()
      .from(opportunities)
      .all()
      .map((o) => normalizeUrl(o.url || ""))
      .filter(Boolean)
  );
}
