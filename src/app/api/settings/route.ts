import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, settings } from "@/lib/db";
import { nowIso, parseJson, toJson } from "@/lib/ids";

export async function GET() {
  let row = db.select().from(settings).where(eq(settings.id, "local")).get();
  if (!row) {
    db.insert(settings)
      .values({
        id: "local",
        workspaceId: "local",
        userId: "local",
        accent: "indigo",
        confetti: 1,
        denseLists: 0,
        extras: "{}",
        updatedAt: nowIso(),
      })
      .run();
    row = db.select().from(settings).where(eq(settings.id, "local")).get()!;
  }
  return NextResponse.json({
    ...row,
    confetti: Boolean(row.confetti),
    denseLists: Boolean(row.denseLists),
    extras: parseJson(row.extras, {}),
  });
}

export async function PUT(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const existing = db.select().from(settings).where(eq(settings.id, "local")).get();
  if (!existing) {
    return NextResponse.json({ error: "Settings missing" }, { status: 404 });
  }
  db.update(settings)
    .set({
      accent: body.accent ?? existing.accent,
      confetti: body.confetti !== undefined ? (body.confetti ? 1 : 0) : existing.confetti,
      denseLists: body.denseLists !== undefined ? (body.denseLists ? 1 : 0) : existing.denseLists,
      extras: body.extras !== undefined ? toJson(body.extras) : existing.extras,
      updatedAt: nowIso(),
    })
    .where(eq(settings.id, "local"))
    .run();
  return NextResponse.json({ ok: true });
}
