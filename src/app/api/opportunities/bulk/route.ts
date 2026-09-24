import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, opportunities, applications } from "@/lib/db";
import { nowIso } from "@/lib/ids";
import { logActivity } from "@/lib/activity";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const ids: string[] = body.ids || [];
  const status: string = body.status;
  if (!ids.length || !status) {
    return NextResponse.json({ error: "ids and status required" }, { status: 400 });
  }
  const now = nowIso();
  let updated = 0;
  for (const id of ids) {
    db.update(opportunities)
      .set({ status, updatedAt: now })
      .where(eq(opportunities.id, id))
      .run();
    updated++;
    logActivity({
      kind: "status",
      message: `Bulk moved opportunity to ${status}`,
      opportunityId: id,
      meta: { status },
    });
    if (["applied", "interview", "offer", "rejected", "ghosted", "queued"].includes(status)) {
      const apps = db
        .select()
        .from(applications)
        .where(eq(applications.opportunityId, id))
        .all();
      for (const a of apps) {
        db.update(applications)
          .set({
            status: status === "queued" ? "queued" : status,
            updatedAt: now,
            ...(status === "applied" ? { appliedAt: a.appliedAt || now } : {}),
          })
          .where(eq(applications.id, a.id))
          .run();
      }
    }
  }
  return NextResponse.json({ updated });
}
