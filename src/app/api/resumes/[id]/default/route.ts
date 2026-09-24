import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, resumes } from "@/lib/db";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const row = db.select().from(resumes).where(eq(resumes.id, id)).get();
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  db.update(resumes).set({ isDefault: 0 }).run();
  db.update(resumes).set({ isDefault: 1 }).where(eq(resumes.id, id)).run();
  return NextResponse.json(db.select().from(resumes).where(eq(resumes.id, id)).get());
}
