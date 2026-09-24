import { NextRequest, NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db, opportunities } from "@/lib/db";
import { newId, nowIso } from "@/lib/ids";
import { logActivity } from "@/lib/activity";

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get("status");
  const q = (req.nextUrl.searchParams.get("q") || "").toLowerCase();
  let rows = db.select().from(opportunities).orderBy(desc(opportunities.createdAt)).all();
  if (status) rows = rows.filter((r) => r.status === status);
  if (q) {
    rows = rows.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.company.toLowerCase().includes(q) ||
        (r.location || "").toLowerCase().includes(q)
    );
  }
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.title || !body.company) {
    return NextResponse.json({ error: "title and company required" }, { status: 400 });
  }
  const id = newId();
  const now = nowIso();
  db.insert(opportunities)
    .values({
      id,
      workspaceId: "local",
      userId: "local",
      title: String(body.title),
      company: String(body.company),
      url: body.url ?? "",
      location: body.location ?? "",
      type: body.type ?? "full-time",
      notes: body.notes ?? "",
      jdText: body.jdText ?? "",
      deadline: body.deadline || null,
      status: body.status ?? "saved",
      source: body.source ?? "manual",
      createdAt: now,
      updatedAt: now,
    })
    .run();
  logActivity({
    kind: "create",
    message: `Added ${body.title} @ ${body.company}`,
    opportunityId: id,
  });
  const row = db.select().from(opportunities).all().find((r) => r.id === id)!;
  return NextResponse.json(row, { status: 201 });
}
