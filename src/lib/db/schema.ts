import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";

/** Soft multi-user readiness — local-first default workspace/user. */
export const workspaces = sqliteTable("workspaces", {
  id: text("id").primaryKey(),
  name: text("name").notNull().default("Local"),
  createdAt: text("created_at").notNull(),
});

export const profiles = sqliteTable("profiles", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id").notNull().default("local"),
  userId: text("user_id").notNull().default("local"),
  name: text("name").notNull().default(""),
  email: text("email").notNull().default(""),
  phone: text("phone").default(""),
  linkedin: text("linkedin").default(""),
  github: text("github").default(""),
  portfolio: text("portfolio").default(""),
  education: text("education").default("[]"),
  skills: text("skills").default("[]"),
  workAuth: text("work_auth").default(""),
  preferredRoles: text("preferred_roles").default("[]"),
  preferredLocations: text("preferred_locations").default("[]"),
  salaryFloor: integer("salary_floor"),
  notes: text("notes").default(""),
  onboardingDone: integer("onboarding_done").notNull().default(0),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const resumes = sqliteTable("resumes", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id").notNull().default("local"),
  userId: text("user_id").notNull().default("local"),
  label: text("label").notNull(),
  filename: text("filename").notNull(),
  filepath: text("filepath").notNull(),
  isDefault: integer("is_default").notNull().default(0),
  notes: text("notes").default(""),
  uploadedAt: text("uploaded_at").notNull(),
});

export const opportunities = sqliteTable(
  "opportunities",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id").notNull().default("local"),
    userId: text("user_id").notNull().default("local"),
    title: text("title").notNull(),
    company: text("company").notNull(),
    url: text("url").default(""),
    location: text("location").default(""),
    type: text("type").notNull().default("full-time"),
    notes: text("notes").default(""),
    jdText: text("jd_text").default(""),
    deadline: text("deadline"),
    status: text("status").notNull().default("saved"),
    source: text("source").notNull().default("manual"),
    templateId: text("template_id"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (t) => ({
    statusIdx: index("opp_status_idx").on(t.status),
    sourceIdx: index("opp_source_idx").on(t.source),
    urlIdx: index("opp_url_idx").on(t.url),
  })
);

export const applications = sqliteTable(
  "applications",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id").notNull().default("local"),
    userId: text("user_id").notNull().default("local"),
    opportunityId: text("opportunity_id")
      .notNull()
      .references(() => opportunities.id),
    resumeId: text("resume_id").references(() => resumes.id),
    status: text("status").notNull().default("queued"),
    coverLetter: text("cover_letter").default(""),
    tailoredBullets: text("tailored_bullets").default("[]"),
    commonAnswers: text("common_answers").default("{}"),
    checklist: text("checklist").default("[]"),
    applyNotes: text("apply_notes").default(""),
    templateId: text("template_id"),
    appliedAt: text("applied_at"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (t) => ({
    statusIdx: index("app_status_idx").on(t.status),
    oppIdx: index("app_opp_idx").on(t.opportunityId),
  })
);

export const activities = sqliteTable(
  "activities",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id").notNull().default("local"),
    userId: text("user_id").notNull().default("local"),
    opportunityId: text("opportunity_id"),
    applicationId: text("application_id"),
    kind: text("kind").notNull(),
    message: text("message").notNull(),
    meta: text("meta").default("{}"),
    createdAt: text("created_at").notNull(),
  },
  (t) => ({
    oppIdx: index("act_opp_idx").on(t.opportunityId),
    createdIdx: index("act_created_idx").on(t.createdAt),
  })
);

export const coverTemplates = sqliteTable("cover_templates", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id").notNull().default("local"),
  userId: text("user_id").notNull().default("local"),
  name: text("name").notNull(),
  body: text("body").notNull(),
  isDefault: integer("is_default").notNull().default(0),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const savedSearches = sqliteTable("saved_searches", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id").notNull().default("local"),
  userId: text("user_id").notNull().default("local"),
  name: text("name").notNull(),
  source: text("source").notNull().default("remotive"),
  keywords: text("keywords").default(""),
  location: text("location").default(""),
  remoteOnly: integer("remote_only").notNull().default(1),
  internship: integer("internship").notNull().default(0),
  filters: text("filters").default("{}"),
  createdAt: text("created_at").notNull(),
});

export const apiCache = sqliteTable("api_cache", {
  key: text("key").primaryKey(),
  payload: text("payload").notNull(),
  expiresAt: integer("expires_at").notNull(),
  createdAt: text("created_at").notNull(),
});

export const settings = sqliteTable("settings", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id").notNull().default("local"),
  userId: text("user_id").notNull().default("local"),
  accent: text("accent").notNull().default("indigo"),
  confetti: integer("confetti").notNull().default(1),
  denseLists: integer("dense_lists").notNull().default(0),
  extras: text("extras").default("{}"),
  updatedAt: text("updated_at").notNull(),
});

export type Profile = typeof profiles.$inferSelect;
export type Resume = typeof resumes.$inferSelect;
export type Opportunity = typeof opportunities.$inferSelect;
export type Application = typeof applications.$inferSelect;
export type Activity = typeof activities.$inferSelect;
export type CoverTemplate = typeof coverTemplates.$inferSelect;
export type SavedSearch = typeof savedSearches.$inferSelect;
export type Settings = typeof settings.$inferSelect;
