import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import fs from "fs";
import path from "path";
import { db, resumes, resumesDir } from "@/lib/db";
import { newId, nowIso } from "@/lib/ids";

export async function GET() {
  const rows = db.select().from(resumes).orderBy(desc(resumes.uploadedAt)).all();
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get("file") as File | null;
  const label = String(form.get("label") || "Resume");
  const notes = String(form.get("notes") || "");
  const makeDefault = String(form.get("isDefault") || "") === "true";

  if (!file) {
    return NextResponse.json({ error: "PDF file required" }, { status: 400 });
  }
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    return NextResponse.json({ error: "Only PDF resumes are supported" }, { status: 400 });
  }

  const id = newId();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filename = `${id}-${safeName}`;
  const filepath = path.join(resumesDir, filename);
  const buf = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(filepath, buf);

  const count = db.select().from(resumes).all().length;
  const isDefault = makeDefault || count === 0 ? 1 : 0;
  if (isDefault) {
    db.update(resumes).set({ isDefault: 0 }).run();
  }

  const now = nowIso();
  db.insert(resumes).values({
    id,
    label,
    filename: file.name,
    filepath,
    isDefault,
    notes,
    uploadedAt: now,
  }).run();

  const row = db.select().from(resumes).where(eq(resumes.id, id)).get();
  return NextResponse.json(row, { status: 201 });
}
