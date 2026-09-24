import { NextRequest, NextResponse } from "next/server";
import {
  db,
  profiles,
  resumes,
  opportunities,
  applications,
  coverTemplates,
  savedSearches,
  activities,
  settings,
} from "@/lib/db";

export async function GET(req: NextRequest) {
  const format = req.nextUrl.searchParams.get("format") || "json";
  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    profiles: db.select().from(profiles).all(),
    resumes: db.select().from(resumes).all().map((r) => { const { filepath: _fp, ...rest } = r; void _fp; return rest; }),
    opportunities: db.select().from(opportunities).all(),
    applications: db.select().from(applications).all(),
    coverTemplates: db.select().from(coverTemplates).all(),
    savedSearches: db.select().from(savedSearches).all(),
    activities: db.select().from(activities).all(),
    settings: db.select().from(settings).all(),
  };

  if (format === "csv") {
    const opps = payload.opportunities;
    const header = "id,title,company,url,location,type,status,source,created_at\n";
    const lines = opps.map((o) =>
      [o.id, o.title, o.company, o.url, o.location, o.type, o.status, o.source, o.createdAt]
        .map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`)
        .join(",")
    );
    return new NextResponse(header + lines.join("\n"), {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=applyflow-opportunities.csv",
      },
    });
  }

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": "attachment; filename=applyflow-backup.json",
    },
  });
}
