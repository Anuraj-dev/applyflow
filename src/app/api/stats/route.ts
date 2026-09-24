import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db, opportunities, applications, resumes, profiles } from "@/lib/db";

export async function GET() {
  const opps = db.select().from(opportunities).all();
  const apps = db.select().from(applications).orderBy(desc(applications.updatedAt)).all();
  const resumeCount = db.select().from(resumes).all().length;
  const profile = db.select().from(profiles).all()[0] || null;

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
    totals: {
      opportunities: opps.length,
      applications: apps.length,
      resumes: resumeCount,
      profileComplete: Boolean(profile?.name && profile?.email),
    },
    recent,
  });
}
