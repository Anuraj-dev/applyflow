import { NextRequest, NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db, coverTemplates, sqlite } from "@/lib/db";
import { newId, nowIso } from "@/lib/ids";

export async function GET() {
  const rows = db.select().from(coverTemplates).orderBy(desc(coverTemplates.updatedAt)).all();
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  if (!body.name || !body.body) {
    return NextResponse.json({ error: "name and body required" }, { status: 400 });
  }
  const now = nowIso();
  const id = newId();
  if (body.isDefault) {
    sqlite.prepare("UPDATE cover_templates SET is_default = 0").run();
  }
  db.insert(coverTemplates)
    .values({
      id,
      workspaceId: "local",
      userId: "local",
      name: body.name,
      body: body.body,
      isDefault: body.isDefault ? 1 : 0,
      createdAt: now,
      updatedAt: now,
    })
    .run();
  return NextResponse.json({ id }, { status: 201 });
}
