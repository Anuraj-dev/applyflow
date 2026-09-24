import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, profiles } from "@/lib/db";
import { nowIso, toJson, parseJson } from "@/lib/ids";

const PROFILE_ID = "default";

function serialize(row: typeof profiles.$inferSelect) {
  return {
    ...row,
    education: parseJson(row.education, []),
    skills: parseJson(row.skills, []),
    preferredRoles: parseJson(row.preferredRoles, []),
    preferredLocations: parseJson(row.preferredLocations, []),
  };
}

export async function GET() {
  const rows = db.select().from(profiles).where(eq(profiles.id, PROFILE_ID)).all();
  if (!rows.length) {
    return NextResponse.json({
      id: PROFILE_ID,
      name: "",
      email: "",
      phone: "",
      linkedin: "",
      github: "",
      portfolio: "",
      education: [],
      skills: [],
      workAuth: "",
      preferredRoles: [],
      preferredLocations: [],
      salaryFloor: null,
      notes: "",
      createdAt: null,
      updatedAt: null,
    });
  }
  return NextResponse.json(serialize(rows[0]));
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const now = nowIso();
  const existing = db.select().from(profiles).where(eq(profiles.id, PROFILE_ID)).all();

  const payload = {
    name: body.name ?? "",
    email: body.email ?? "",
    phone: body.phone ?? "",
    linkedin: body.linkedin ?? "",
    github: body.github ?? "",
    portfolio: body.portfolio ?? "",
    education: toJson(body.education ?? []),
    skills: toJson(body.skills ?? []),
    workAuth: body.workAuth ?? "",
    preferredRoles: toJson(body.preferredRoles ?? []),
    preferredLocations: toJson(body.preferredLocations ?? []),
    salaryFloor: body.salaryFloor != null ? Number(body.salaryFloor) : null,
    notes: body.notes ?? "",
    updatedAt: now,
  };

  if (!existing.length) {
    db.insert(profiles).values({
      id: PROFILE_ID,
      ...payload,
      createdAt: now,
    }).run();
  } else {
    db.update(profiles).set(payload).where(eq(profiles.id, PROFILE_ID)).run();
  }

  const row = db.select().from(profiles).where(eq(profiles.id, PROFILE_ID)).get()!;
  return NextResponse.json(serialize(row));
}
