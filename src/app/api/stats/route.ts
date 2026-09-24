import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db, opportunities, applications, resumes, profiles, activities } from "@/lib/db";

export async function GET() {
  const opps = db.select().from(opportunities).all();
  const apps = db.select().from(applications).orderBy(desc(applications.updatedAt)).all();
  const resumeCount = db.select().from(resumes).all().length;
  const profile = db.select().from(profiles).all()[0] || null;
  const recentActs = db.select().from(activities).orderBy(desc(activities.createdAt)).all().slice(0, 12);

  const byStatus: Record<string, number> = {
    saved: 0,
    queued: 0,
    applied: 0,
    interview: 0,
    offer: 0,
    rejected: 0,
    ghosted: 0,
  };
  for (const o of opps) {
    byStatus[o.status] = (byStatus[o.status] || 0) + 1;
  }

  const appByStatus: Record<string, number> = {};
  for (const a of apps) {
    appByStatus[a.status] = (appByStatus[a.status] || 0) + 1;
  }

  const bySource: Record<string, number> = {};
  for (const o of opps) {
    bySource[o.source || "manual"] = (bySource[o.source || "manual"] || 0) + 1;
  }

  // Weekly applied sparkline (last 8 weeks)
  const weeks: { label: string; count: number; start: number }[] = [];
  const now = new Date();
  for (let i = 7; i >= 0; i--) {
    const start = new Date(now);
    start.setDate(start.getDate() - i * 7);
    start.setHours(0, 0, 0, 0);
    // align to week start roughly
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    const label = `${start.getMonth() + 1}/${start.getDate()}`;
    weeks.push({ label, count: 0, start: start.getTime() });
  }
  for (const a of apps) {
    if (a.status !== "applied" && !a.appliedAt) continue;
    const ts = new Date(a.appliedAt || a.updatedAt).getTime();
    for (let i = 0; i < weeks.length; i++) {
      const start = weeks[i].start;
      const end = i + 1 < weeks.length ? weeks[i + 1].start : Date.now() + 86400000;
      if (ts >= start && ts < end) {
        weeks[i].count++;
        break;
      }
    }
  }

  const applied = byStatus.applied || 0;
  const responses =
    (byStatus.interview || 0) + (byStatus.offer || 0) + (byStatus.rejected || 0);
  const responseRate = applied > 0 ? Math.round((responses / applied) * 100) : 0;

  const funnel = [
    { stage: "saved", count: byStatus.saved || 0 },
    { stage: "queued", count: byStatus.queued || 0 },
    { stage: "applied", count: applied },
    { stage: "interview", count: byStatus.interview || 0 },
    { stage: "offer", count: byStatus.offer || 0 },
  ];

  const recent = apps.slice(0, 8).map((a) => {
    const opp = opps.find((o) => o.id === a.opportunityId);
    return {
      id: a.id,
      status: a.status,
      updatedAt: a.updatedAt,
      title: opp?.title,
      company: opp?.company,
    };
  });

  return NextResponse.json({
    opportunities: byStatus,
    applications: appByStatus,
    bySource,
    funnel,
    weeklyApplied: weeks.map(({ label, count }) => ({ label, count })),
    responseRate,
    totals: {
      opportunities: opps.length,
      applications: apps.length,
      resumes: resumeCount,
      profileComplete: Boolean(profile?.name && profile?.email),
      onboardingDone: Boolean(profile?.onboardingDone),
    },
    recent,
    activity: recentActs.map((a) => ({
      id: a.id,
      kind: a.kind,
      message: a.message,
      createdAt: a.createdAt,
      opportunityId: a.opportunityId,
    })),
  });
}
