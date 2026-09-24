import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import fs from "fs";
import { db, resumes } from "@/lib/db";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const row = db.select().from(resumes).where(eq(resumes.id, id)).get();
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(row);
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const row = db.select().from(resumes).where(eq(resumes.id, id)).get();
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  try {
    if (row.filepath && fs.existsSync(row.filepath)) fs.unlinkSync(row.filepath);
  } catch {}
  db.delete(resumes).where(eq(resumes.id, id)).run();
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const row = db.select().from(resumes).where(eq(resumes.id, id)).get();
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = await req.json();
  const updates: Partial<typeof resumes.$inferInsert> = {};
  if (body.label != null) updates.label = String(body.label);
  if (body.notes != null) updates.notes = String(body.notes);
  if (Object.keys(updates).length) {
    db.update(resumes).set(updates).where(eq(resumes.id, id)).run();
  }
  return NextResponse.json(db.select().from(resumes).where(eq(resumes.id, id)).get());
}
