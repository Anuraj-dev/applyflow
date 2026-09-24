import { NextRequest, NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db, opportunities } from "@/lib/db";
import { newId, nowIso } from "@/lib/ids";

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get("status");
  let rows = db.select().from(opportunities).orderBy(desc(opportunities.createdAt)).all();
  if (status) rows = rows.filter((r) => r.status === status);
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.title || !body.company) {
    return NextResponse.json({ error: "title and company required" }, { status: 400 });
  }
  const id = newId();
  const now = nowIso();
  db.insert(opportunities).values({
    id,
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
  }).run();
  const row = db.select().from(opportunities).all().find((r) => r.id === id)!;
  return NextResponse.json(row, { status: 201 });
}
