import { NextRequest, NextResponse } from "next/server";
import { db, opportunities } from "@/lib/db";
import { newId, nowIso } from "@/lib/ids";

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim().split("\n");
  if (lines.length < 2) return [];
  const headers = splitCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
  const rows: Record<string, string>[] = [];
  for (const line of lines.slice(1)) {
    if (!line.trim()) continue;
    const cols = splitCsvLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = (cols[i] ?? "").trim(); });
    rows.push(row);
  }
  return rows;
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
      else inQ = !inQ;
    } else if (c === "," && !inQ) {
      out.push(cur); cur = "";
    } else cur += c;
  }
  out.push(cur);
  return out;
}

export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") || "";
  let csvText = "";
  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const text = form.get("csv") as string | null;
    if (file) csvText = await file.text();
    else if (text) csvText = text;
  } else {
    const body = await req.json().catch(() => ({}));
    csvText = body.csv || "";
  }
  if (!csvText.trim()) {
    return NextResponse.json({ error: "CSV content required" }, { status: 400 });
  }

  const parsed = parseCsv(csvText);
  const now = nowIso();
  const created = [];
  for (const r of parsed) {
    const title = r.title || r.role || r.position;
    const company = r.company || r.org || r.organization;
    if (!title || !company) continue;
    const id = newId();
    db.insert(opportunities).values({
      id,
      title,
      company,
      url: r.url || r.link || "",
      location: r.location || r.loc || "",
      type: r.type || "full-time",
      notes: r.notes || "",
      jdText: r.jd || r.jdtext || r.description || "",
      deadline: r.deadline || null,
      status: "saved",
      source: "csv",
      createdAt: now,
      updatedAt: now,
    }).run();
    created.push(id);
  }
  return NextResponse.json({ imported: created.length, ids: created });
}
