import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, applications, opportunities, profiles, resumes } from "@/lib/db";
import { newId, nowIso, toJson } from "@/lib/ids";
import { tailorApplication } from "@/lib/tailor";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { opportunityId, resumeId, save } = body;
  if (!opportunityId) {
    return NextResponse.json({ error: "opportunityId required" }, { status: 400 });
  }

  const profile = db.select().from(profiles).all()[0];
  if (!profile || !profile.name) {
    return NextResponse.json(
      { error: "Complete your profile (at least name) before tailoring" },
      { status: 400 }
    );
  }

  const opp = db.select().from(opportunities).where(eq(opportunities.id, opportunityId)).get();
  if (!opp) return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });

  let resolvedResumeId = resumeId as string | null | undefined;
  if (!resolvedResumeId) {
    resolvedResumeId = db.select().from(resumes).all().find((r) => r.isDefault === 1)?.id ?? null;
  }

  const result = tailorApplication(profile, opp);

  let application = null;
  if (save !== false) {
    const now = nowIso();
    const existing = db.select().from(applications).all().find((a) => a.opportunityId === opportunityId);
    if (existing) {
      db.update(applications).set({
        resumeId: resolvedResumeId ?? existing.resumeId,
        coverLetter: result.coverLetter,
        tailoredBullets: toJson(result.tailoredBullets),
        commonAnswers: toJson(result.commonAnswers),
        checklist: existing.checklist && existing.checklist !== "[]"
          ? existing.checklist
          : toJson(result.checklist),
        status: existing.status === "saved" ? "queued" : existing.status,
        updatedAt: now,
      }).where(eq(applications.id, existing.id)).run();
      application = db.select().from(applications).where(eq(applications.id, existing.id)).get();
    } else {
      const id = newId();
      db.insert(applications).values({
        id,
        opportunityId,
        resumeId: resolvedResumeId ?? null,
        status: "queued",
        coverLetter: result.coverLetter,
        tailoredBullets: toJson(result.tailoredBullets),
        commonAnswers: toJson(result.commonAnswers),
        checklist: toJson(result.checklist),
        applyNotes: "",
        appliedAt: null,
        createdAt: now,
        updatedAt: now,
      }).run();
      application = db.select().from(applications).where(eq(applications.id, id)).get();
      db.update(opportunities).set({ status: "queued", updatedAt: now }).where(eq(opportunities.id, opportunityId)).run();
    }
  }

  return NextResponse.json({ ...result, application, resumeId: resolvedResumeId });
}
