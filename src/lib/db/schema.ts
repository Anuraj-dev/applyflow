import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const profiles = sqliteTable("profiles", {
  id: text("id").primaryKey(),
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
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const resumes = sqliteTable("resumes", {
  id: text("id").primaryKey(),
  label: text("label").notNull(),
  filename: text("filename").notNull(),
  filepath: text("filepath").notNull(),
  isDefault: integer("is_default").notNull().default(0),
  notes: text("notes").default(""),
  uploadedAt: text("uploaded_at").notNull(),
});

export const opportunities = sqliteTable("opportunities", {
  id: text("id").primaryKey(),
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
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const applications = sqliteTable("applications", {
  id: text("id").primaryKey(),
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
  appliedAt: text("applied_at"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export type Profile = typeof profiles.$inferSelect;
export type Resume = typeof resumes.$inferSelect;
export type Opportunity = typeof opportunities.$inferSelect;
export type Application = typeof applications.$inferSelect;
