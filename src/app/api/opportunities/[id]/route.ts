import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, opportunities, applications } from "@/lib/db";
import { nowIso } from "@/lib/ids";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const row = db.select().from(opportunities).where(eq(opportunities.id, id)).get();
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(row);
}

export async function PUT(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const row = db.select().from(opportunities).where(eq(opportunities.id, id)).get();
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = await req.json();
  const updates: Record<string, unknown> = { updatedAt: nowIso() };
  for (const key of ["title","company","url","location","type","notes","jdText","deadline","status","source"] as const) {
    if (body[key] !== undefined) updates[key] = body[key];
  }
  db.update(opportunities).set(updates).where(eq(opportunities.id, id)).run();
  return NextResponse.json(db.select().from(opportunities).where(eq(opportunities.id, id)).get());
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const row = db.select().from(opportunities).where(eq(opportunities.id, id)).get();
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  db.delete(applications).where(eq(applications.opportunityId, id)).run();
  db.delete(opportunities).where(eq(opportunities.id, id)).run();
  return NextResponse.json({ ok: true });
}
