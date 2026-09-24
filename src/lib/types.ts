export type EducationItem = {
  school?: string;
  degree?: string;
  field?: string;
  year?: string;
};

export type Profile = {
  id: string;
  name: string;
  email: string;
  phone: string;
  linkedin: string;
  github: string;
  portfolio: string;
  education: EducationItem[];
  skills: string[];
  workAuth: string;
  preferredRoles: string[];
  preferredLocations: string[];
  salaryFloor: number | null;
  notes: string;
  onboardingDone?: boolean;
  createdAt: string | null;
  updatedAt: string | null;
};

export type Resume = {
  id: string;
  label: string;
  filename: string;
  filepath: string;
  isDefault: number;
  notes: string | null;
  uploadedAt: string;
};

export type Opportunity = {
  id: string;
  title: string;
  company: string;
  url: string | null;
  location: string | null;
  type: string;
  notes: string | null;
  jdText: string | null;
  deadline: string | null;
  status: string;
  source: string;
  createdAt: string;
  updatedAt: string;
};

export type ChecklistItem = { id: string; label: string; done: boolean };

export type Application = {
  id: string;
  opportunityId: string;
  resumeId: string | null;
  status: string;
  coverLetter: string | null;
  tailoredBullets: string[];
  commonAnswers: Record<string, string>;
  checklist: ChecklistItem[];
  applyNotes: string | null;
  appliedAt: string | null;
  createdAt: string;
  updatedAt: string;
  opportunity?: Opportunity | null;
  resume?: Resume | null;
};

export type Stats = {
  opportunities: Record<string, number>;
  applications: Record<string, number>;
  bySource?: Record<string, number>;
  funnel?: { stage: string; count: number }[];
  weeklyApplied?: { label: string; count: number }[];
  responseRate?: number;
  totals: {
    opportunities: number;
    applications: number;
    resumes: number;
    profileComplete: boolean;
    onboardingDone?: boolean;
  };
  recent: {
    id: string;
    status: string;
    updatedAt: string;
    title?: string;
    company?: string;
  }[];
  activity?: {
    id: string;
    kind: string;
    message: string;
    createdAt: string;
    opportunityId?: string | null;
  }[];
};

export const OPP_TYPES = ["internship", "full-time", "part-time", "contract", "other"] as const;
export const TRACKER_STATUSES = [
  "saved",
  "queued",
  "applied",
  "interview",
  "offer",
  "rejected",
  "ghosted",
] as const;
export const APP_STATUSES = [
  "queued",
  "ready",
  "applied",
  "interview",
  "offer",
  "rejected",
  "ghosted",
] as const;
