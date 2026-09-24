import { db, activities } from "./db";
import { newId, nowIso, toJson } from "./ids";

export function logActivity(opts: {
  kind: string;
  message: string;
  opportunityId?: string | null;
  applicationId?: string | null;
  meta?: unknown;
}) {
  const id = newId();
  db.insert(activities)
    .values({
      id,
      workspaceId: "local",
      userId: "local",
      opportunityId: opts.opportunityId ?? null,
      applicationId: opts.applicationId ?? null,
      kind: opts.kind,
      message: opts.message,
      meta: toJson(opts.meta ?? {}),
      createdAt: nowIso(),
    })
    .run();
  return id;
}
