import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db, applications, opportunities, resumes } from "@/lib/db";
import { newId, nowIso, parseJson } from "@/lib/ids";

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

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get("status");
  let rows = db.select().from(applications).orderBy(desc(applications.updatedAt)).all();
  if (status) rows = rows.filter((r) => r.status === status);
  return NextResponse.json(rows.map(enrich));
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.opportunityId) {
    return NextResponse.json({ error: "opportunityId required" }, { status: 400 });
  }
  const opp = db.select().from(opportunities).where(eq(opportunities.id, body.opportunityId)).get();
  if (!opp) return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });

  const id = newId();
  const now = nowIso();
  db.insert(applications).values({
    id,
    opportunityId: body.opportunityId,
    resumeId: body.resumeId || null,
    status: body.status || "queued",
    coverLetter: body.coverLetter || "",
    tailoredBullets: JSON.stringify(body.tailoredBullets || []),
    commonAnswers: JSON.stringify(body.commonAnswers || {}),
    checklist: JSON.stringify(body.checklist || []),
    applyNotes: body.applyNotes || "",
    appliedAt: body.appliedAt || null,
    createdAt: now,
    updatedAt: now,
  }).run();

  if (body.status === "queued" || !body.status) {
    db.update(opportunities).set({ status: "queued", updatedAt: now }).where(eq(opportunities.id, body.opportunityId)).run();
  }

  const row = db.select().from(applications).where(eq(applications.id, id)).get()!;
  return NextResponse.json(enrich(row), { status: 201 });
}
