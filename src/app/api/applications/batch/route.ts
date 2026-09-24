import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, applications, opportunities, resumes, profiles } from "@/lib/db";
import { newId, nowIso, toJson } from "@/lib/ids";
import { tailorApplication } from "@/lib/tailor";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const opportunityIds: string[] = body.opportunityIds || [];
  const action: string = body.action || "queue";
  let resumeId: string | null = body.resumeId || null;

  if (!opportunityIds.length) {
    return NextResponse.json({ error: "opportunityIds required" }, { status: 400 });
  }

  if (!resumeId) {
    const def = db.select().from(resumes).all().find((r) => r.isDefault === 1);
    resumeId = def?.id ?? null;
  }

  const profile = db.select().from(profiles).all()[0];
  const now = nowIso();
  const results = [];

  for (const opportunityId of opportunityIds) {
    const opp = db.select().from(opportunities).where(eq(opportunities.id, opportunityId)).get();
    if (!opp) continue;

    let app = db.select().from(applications).all().find((a) => a.opportunityId === opportunityId);

    let tailored = null;
    if (profile && (action === "queue" || action === "ready" || body.tailor)) {
      tailored = tailorApplication(profile, opp);
    }

    if (!app) {
      const id = newId();
      const status = action === "applied" ? "applied" : action === "ready" ? "ready" : "queued";
      db.insert(applications).values({
        id,
        opportunityId,
        resumeId,
        status,
        coverLetter: tailored?.coverLetter || "",
        tailoredBullets: toJson(tailored?.tailoredBullets || []),
        commonAnswers: toJson(tailored?.commonAnswers || {}),
        checklist: toJson(tailored?.checklist || []),
        applyNotes: "",
        appliedAt: status === "applied" ? now : null,
        createdAt: now,
        updatedAt: now,
      }).run();
      app = db.select().from(applications).where(eq(applications.id, id)).get()!;
    } else {
      const status = action === "applied" ? "applied" : action === "ready" ? "ready" : action === "queue" ? "queued" : app.status;
      const updates: Record<string, unknown> = {
        status,
        updatedAt: now,
        resumeId: resumeId ?? app.resumeId,
      };
      if (tailored) {
        updates.coverLetter = tailored.coverLetter;
        updates.tailoredBullets = toJson(tailored.tailoredBullets);
        updates.commonAnswers = toJson(tailored.commonAnswers);
        if (!app.checklist || app.checklist === "[]") {
          updates.checklist = toJson(tailored.checklist);
        }
      }
      if (status === "applied" && !app.appliedAt) updates.appliedAt = now;
      db.update(applications).set(updates).where(eq(applications.id, app.id)).run();
      app = db.select().from(applications).where(eq(applications.id, app.id)).get()!;
    }

    const oppStatusMap: Record<string, string> = {
      queued: "queued",
      ready: "queued",
      applied: "applied",
    };
    const oppStatus = oppStatusMap[app.status] || opp.status;
    db.update(opportunities).set({ status: oppStatus, updatedAt: now }).where(eq(opportunities.id, opportunityId)).run();

    results.push(app);
  }

  return NextResponse.json({ count: results.length, applications: results });
}
