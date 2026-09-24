import { NextRequest, NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db, activities } from "@/lib/db";
import { parseJson } from "@/lib/ids";

export async function GET(req: NextRequest) {
  const oppId = req.nextUrl.searchParams.get("opportunityId");
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") || 50), 200);
  let rows = db.select().from(activities).orderBy(desc(activities.createdAt)).all();
  if (oppId) rows = rows.filter((r) => r.opportunityId === oppId);
  rows = rows.slice(0, limit);
  return NextResponse.json(
    rows.map((r) => ({
      ...r,
      meta: parseJson(r.meta, {}),
    }))
  );
}
