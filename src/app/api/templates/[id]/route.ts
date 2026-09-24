import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, coverTemplates, sqlite } from "@/lib/db";
import { nowIso } from "@/lib/ids";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const existing = db.select().from(coverTemplates).where(eq(coverTemplates.id, id)).get();
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (body.isDefault) {
    sqlite.prepare("UPDATE cover_templates SET is_default = 0").run();
  }
  db.update(coverTemplates)
    .set({
      name: body.name ?? existing.name,
      body: body.body ?? existing.body,
      isDefault: body.isDefault !== undefined ? (body.isDefault ? 1 : 0) : existing.isDefault,
      updatedAt: nowIso(),
    })
    .where(eq(coverTemplates.id, id))
    .run();
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  db.delete(coverTemplates).where(eq(coverTemplates.id, id)).run();
  return NextResponse.json({ ok: true });
}
