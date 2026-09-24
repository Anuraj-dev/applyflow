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
    onboardingDone: Boolean(row.onboardingDone),
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
      onboardingDone: false,
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

  const payload: Record<string, unknown> = {
    updatedAt: now,
  };

  // Allow partial updates (e.g. onboarding dismiss)
  const fields = [
    "name",
    "email",
    "phone",
    "linkedin",
    "github",
    "portfolio",
    "workAuth",
    "notes",
  ] as const;
  for (const f of fields) {
    if (body[f] !== undefined) payload[f] = body[f] ?? "";
  }
  if (body.education !== undefined) payload.education = toJson(body.education ?? []);
  if (body.skills !== undefined) payload.skills = toJson(body.skills ?? []);
  if (body.preferredRoles !== undefined) payload.preferredRoles = toJson(body.preferredRoles ?? []);
  if (body.preferredLocations !== undefined)
    payload.preferredLocations = toJson(body.preferredLocations ?? []);
  if (body.salaryFloor !== undefined)
    payload.salaryFloor = body.salaryFloor != null ? Number(body.salaryFloor) : null;
  if (body.onboardingDone !== undefined)
    payload.onboardingDone = body.onboardingDone ? 1 : 0;

  // Full form save from profile page sends name/email always
  if (!existing.length) {
    db.insert(profiles)
      .values({
        id: PROFILE_ID,
        workspaceId: "local",
        userId: "local",
        name: String(body.name ?? ""),
        email: String(body.email ?? ""),
        phone: String(body.phone ?? ""),
        linkedin: String(body.linkedin ?? ""),
        github: String(body.github ?? ""),
        portfolio: String(body.portfolio ?? ""),
        education: toJson(body.education ?? []),
        skills: toJson(body.skills ?? []),
        workAuth: String(body.workAuth ?? ""),
        preferredRoles: toJson(body.preferredRoles ?? []),
        preferredLocations: toJson(body.preferredLocations ?? []),
        salaryFloor: body.salaryFloor != null ? Number(body.salaryFloor) : null,
        notes: String(body.notes ?? ""),
        onboardingDone: body.onboardingDone ? 1 : 0,
        createdAt: now,
        updatedAt: now,
      })
      .run();
  } else {
    // If classic full save (has name key), merge all common fields
    if (body.name !== undefined || body.email !== undefined) {
      db.update(profiles)
        .set({
          name: body.name ?? existing[0].name,
          email: body.email ?? existing[0].email,
          phone: body.phone ?? existing[0].phone,
          linkedin: body.linkedin ?? existing[0].linkedin,
          github: body.github ?? existing[0].github,
          portfolio: body.portfolio ?? existing[0].portfolio,
          education: body.education !== undefined ? toJson(body.education) : existing[0].education,
          skills: body.skills !== undefined ? toJson(body.skills) : existing[0].skills,
          workAuth: body.workAuth ?? existing[0].workAuth,
          preferredRoles:
            body.preferredRoles !== undefined
              ? toJson(body.preferredRoles)
              : existing[0].preferredRoles,
          preferredLocations:
            body.preferredLocations !== undefined
              ? toJson(body.preferredLocations)
              : existing[0].preferredLocations,
          salaryFloor:
            body.salaryFloor !== undefined
              ? body.salaryFloor != null
                ? Number(body.salaryFloor)
                : null
              : existing[0].salaryFloor,
          notes: body.notes ?? existing[0].notes,
          onboardingDone:
            body.onboardingDone !== undefined
              ? body.onboardingDone
                ? 1
                : 0
              : existing[0].onboardingDone,
          updatedAt: now,
        })
        .where(eq(profiles.id, PROFILE_ID))
        .run();
    } else {
      db.update(profiles).set(payload).where(eq(profiles.id, PROFILE_ID)).run();
    }
  }

  const row = db.select().from(profiles).where(eq(profiles.id, PROFILE_ID)).get()!;
  return NextResponse.json(serialize(row));
}
