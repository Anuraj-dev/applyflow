import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, savedSearches } from "@/lib/db";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  db.delete(savedSearches).where(eq(savedSearches.id, id)).run();
  return NextResponse.json({ ok: true });
}
