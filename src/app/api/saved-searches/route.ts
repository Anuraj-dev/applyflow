import { NextRequest, NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db, savedSearches } from "@/lib/db";
import { newId, nowIso, toJson, parseJson } from "@/lib/ids";

export async function GET() {
  const rows = db.select().from(savedSearches).orderBy(desc(savedSearches.createdAt)).all();
  return NextResponse.json(
    rows.map((r) => ({
      ...r,
      filters: parseJson(r.filters, {}),
      remoteOnly: Boolean(r.remoteOnly),
      internship: Boolean(r.internship),
    }))
  );
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  if (!body.name) return NextResponse.json({ error: "name required" }, { status: 400 });
  const id = newId();
  db.insert(savedSearches)
    .values({
      id,
      workspaceId: "local",
      userId: "local",
      name: body.name,
      source: body.source || "remotive",
      keywords: body.keywords || "",
      location: body.location || "",
      remoteOnly: body.remoteOnly === false ? 0 : 1,
      internship: body.internship ? 1 : 0,
      filters: toJson(body.filters || {}),
      createdAt: nowIso(),
    })
    .run();
  return NextResponse.json({ id }, { status: 201 });
}
