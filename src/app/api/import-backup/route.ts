import { NextRequest, NextResponse } from "next/server";
import {
  db,
  coverTemplates,
  savedSearches,
} from "@/lib/db";
import { newId, nowIso } from "@/lib/ids";
import { importJobs } from "@/lib/discover/import";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "JSON body required" }, { status: 400 });
  }

  let importedOpps = 0;
  let importedTemplates = 0;
  let importedSearches = 0;

  if (Array.isArray(body.opportunities)) {
    const jobs = body.opportunities.map(
      (o: {
        title?: string;
        company?: string;
        url?: string;
        location?: string;
        type?: string;
        jdText?: string;
        jd_text?: string;
        source?: string;
        id?: string;
      }) => ({
        externalId: o.id || o.url || newId(),
        title: o.title || "Untitled",
        company: o.company || "Unknown",
        url: o.url || "",
        location: o.location || "",
        type: o.type || "full-time",
        description: o.jdText || o.jd_text || "",
        source: o.source || "backup",
      })
    );
    importedOpps = importJobs(jobs).imported;
  }

  if (Array.isArray(body.coverTemplates)) {
    const now = nowIso();
    for (const t of body.coverTemplates) {
      if (!t.name || !t.body) continue;
      db.insert(coverTemplates)
        .values({
          id: newId(),
          workspaceId: "local",
          userId: "local",
          name: t.name,
          body: t.body,
          isDefault: 0,
          createdAt: now,
          updatedAt: now,
        })
        .run();
      importedTemplates++;
    }
  }

  if (Array.isArray(body.savedSearches)) {
    const now = nowIso();
    for (const s of body.savedSearches) {
      if (!s.name) continue;
      db.insert(savedSearches)
        .values({
          id: newId(),
          workspaceId: "local",
          userId: "local",
          name: s.name,
          source: s.source || "remotive",
          keywords: s.keywords || "",
          location: s.location || "",
          remoteOnly: s.remoteOnly ? 1 : 0,
          internship: s.internship ? 1 : 0,
          filters: typeof s.filters === "string" ? s.filters : JSON.stringify(s.filters || {}),
          createdAt: now,
        })
        .run();
      importedSearches++;
    }
  }

  return NextResponse.json({ importedOpps, importedTemplates, importedSearches });
}
