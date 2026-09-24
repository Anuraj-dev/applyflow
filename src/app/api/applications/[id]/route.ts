import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, applications, opportunities, resumes } from "@/lib/db";
import { nowIso, parseJson, toJson } from "@/lib/ids";
import { logActivity } from "@/lib/activity";

type Ctx = { params: Promise<{ id: string }> };

function enrich(app: typeof applications.$inferSelect) {
  const opp = db.select().from(opportunities).where(eq(opportunities.id, app.opportunityId)).get();
  const resume = app.resumeId
    ? db.select().from(resumes).where(eq(resumes.id, app.resumeId)).get()
    : null;
  return {
    ...app,
    tailoredBullets: parseJson(app.tailoredBullets, []),
    commonAnswers: parseJson(app.commonAnswers, {}),
    checklist: parseJson(app.checklist, []),
    opportunity: opp || null,
    resume: resume || null,
  };
}

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const row = db.select().from(applications).where(eq(applications.id, id)).get();
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(enrich(row));
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const row = db.select().from(applications).where(eq(applications.id, id)).get();
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = await req.json();
  const now = nowIso();
  const updates: Record<string, unknown> = { updatedAt: now };

  if (body.status != null) {
    updates.status = body.status;
    if (body.status === "applied" && !row.appliedAt) updates.appliedAt = now;
  }
  if (body.resumeId !== undefined) updates.resumeId = body.resumeId;
  if (body.coverLetter !== undefined) updates.coverLetter = body.coverLetter;
  if (body.tailoredBullets !== undefined) updates.tailoredBullets = toJson(body.tailoredBullets);
  if (body.commonAnswers !== undefined) updates.commonAnswers = toJson(body.commonAnswers);
  if (body.checklist !== undefined) updates.checklist = toJson(body.checklist);
  if (body.applyNotes !== undefined) updates.applyNotes = body.applyNotes;
  if (body.appliedAt !== undefined) updates.appliedAt = body.appliedAt;

  db.update(applications).set(updates).where(eq(applications.id, id)).run();

  if (body.status) {
    logActivity({
      kind: "status",
      message: `Application → ${body.status}`,
      opportunityId: row.opportunityId,
      applicationId: id,
      meta: { status: body.status },
    });
    const map: Record<string, string> = {
      queued: "queued",
      ready: "queued",
      applied: "applied",
      interview: "interview",
      offer: "offer",
      rejected: "rejected",
      ghosted: "ghosted",
    };
    const oppStatus = map[body.status];
    if (oppStatus) {
      db.update(opportunities)
        .set({ status: oppStatus, updatedAt: now })
        .where(eq(opportunities.id, row.opportunityId))
        .run();
    }
  }

  return NextResponse.json(enrich(db.select().from(applications).where(eq(applications.id, id)).get()!));
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const row = db.select().from(applications).where(eq(applications.id, id)).get();
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  db.delete(applications).where(eq(applications.id, id)).run();
  return NextResponse.json({ ok: true });
}
