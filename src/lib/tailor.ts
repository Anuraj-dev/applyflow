import type { Profile, Opportunity } from "./db/schema";
import { parseJson } from "./ids";

const TECH_TERMS = [
  "javascript","typescript","python","java","go","rust","c++","c#","ruby","swift","kotlin",
  "react","next.js","nextjs","vue","angular","svelte","node","nodejs","express","django","flask",
  "fastapi","spring","rails","sql","postgres","postgresql","mysql","mongodb","redis","sqlite",
  "aws","gcp","azure","docker","kubernetes","k8s","terraform","ci/cd","git","linux",
  "machine learning","ml","deep learning","nlp","computer vision","pytorch","tensorflow",
  "pandas","numpy","spark","airflow","graphql","rest","api","microservices","agile","scrum",
  "figma","ui","ux","design","product","data","analytics","tableau","power bi","excel",
  "communication","leadership","collaboration","problem solving","internship","full-stack",
  "frontend","backend","devops","sre","security","mobile","ios","android","tailwind","css","html",
];

export type EducationItem = {
  school?: string;
  degree?: string;
  field?: string;
  year?: string;
};

export type TailorResult = {
  matchedKeywords: string[];
  coverLetter: string;
  tailoredBullets: string[];
  commonAnswers: Record<string, string>;
  checklist: { id: string; label: string; done: boolean }[];
};

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+.#/\s-]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function extractKeywords(jd: string, profileSkills: string[]): string[] {
  const jdLower = jd.toLowerCase();
  const found = new Set<string>();

  for (const skill of profileSkills) {
    const s = skill.trim().toLowerCase();
    if (s.length >= 2 && jdLower.includes(s)) found.add(skill.trim());
  }

  for (const term of TECH_TERMS) {
    if (jdLower.includes(term)) {
      // Prefer matching profile skill casing if present
      const fromProfile = profileSkills.find((p) => p.toLowerCase() === term);
      found.add(fromProfile ?? term);
    }
  }

  // Multi-word / title-ish tokens from JD that also appear in skills
  const tokens = tokenize(jd);
  for (const t of tokens) {
    if (t.length < 3) continue;
    const match = profileSkills.find((p) => p.toLowerCase() === t);
    if (match) found.add(match);
  }

  return Array.from(found).slice(0, 12);
}

function educationSummary(education: EducationItem[]): string {
  if (!education.length) return "";
  return education
    .map((e) => {
      const parts = [e.degree, e.field, e.school, e.year].filter(Boolean);
      return parts.join(", ");
    })
    .filter(Boolean)
    .join("; ");
}

function buildCoverLetter(
  profile: Profile,
  opp: Opportunity,
  matched: string[],
  edu: string
): string {
  const name = profile.name || "[Your Name]";
  const role = opp.title || "the role";
  const company = opp.company || "your company";
  const skillsLine =
    matched.length > 0
      ? matched.slice(0, 6).join(", ")
      : parseJson<string[]>(profile.skills, []).slice(0, 6).join(", ") ||
        "[Add skills to profile]";

  const eduLine = edu
    ? `I bring academic grounding from ${edu}.`
    : "I am eager to contribute and continue learning in this environment.";

  return [
    `Dear ${company} Hiring Team,`,
    ``,
    `I am writing to apply for the ${role} position at ${company}. Based on the job description, I am especially excited about the opportunity to contribute skills in ${skillsLine}.`,
    ``,
    eduLine,
    ``,
    `I have prepared tailored materials for this application and reviewed the requirements carefully. I would welcome the chance to discuss how my background aligns with ${company}'s needs.`,
    ``,
    `Thank you for your time and consideration.`,
    ``,
    `Sincerely,`,
    name,
    profile.email || "",
    profile.phone || "",
  ]
    .filter((line, i, arr) => !(line === "" && arr[i - 1] === ""))
    .join("\n")
    .trim();
}

function buildBullets(
  profile: Profile,
  matched: string[],
  edu: EducationItem[]
): string[] {
  const bullets: string[] = [];
  const skills = parseJson<string[]>(profile.skills, []);

  if (matched.length) {
    bullets.push(
      `Relevant skills aligned to this role: ${matched.slice(0, 5).join(", ")}.`
    );
  } else if (skills.length) {
    bullets.push(`Core skills: ${skills.slice(0, 5).join(", ")}.`);
  }

  for (const e of edu.slice(0, 2)) {
    const deg = [e.degree, e.field].filter(Boolean).join(" in ");
    const where = e.school ? ` at ${e.school}` : "";
    const when = e.year ? ` (${e.year})` : "";
    if (deg || e.school) {
      bullets.push(`Education: ${deg || "Studies"}${where}${when}.`);
    }
  }

  if (profile.workAuth) {
    bullets.push(`Work authorization: ${profile.workAuth}.`);
  }

  const roles = parseJson<string[]>(profile.preferredRoles, []);
  if (roles.length) {
    bullets.push(`Targeting roles such as: ${roles.slice(0, 3).join(", ")}.`);
  }

  if (profile.portfolio) {
    bullets.push(`Portfolio: ${profile.portfolio}.`);
  }

  if (bullets.length === 0) {
    bullets.push(
      "[Complete your profile with skills and education to generate tailored highlights.]"
    );
  }

  return bullets.slice(0, 5);
}

function buildAnswers(
  profile: Profile,
  opp: Opportunity,
  matched: string[]
): Record<string, string> {
  const company = opp.company || "this company";
  const role = opp.title || "this role";
  const skills = matched.length
    ? matched.slice(0, 4).join(", ")
    : parseJson<string[]>(profile.skills, []).slice(0, 4).join(", ");

  return {
    "Why this company?": `I am interested in ${company} because the ${role} aligns with my preferred focus${
      parseJson<string[]>(profile.preferredRoles, []).length
        ? ` on ${parseJson<string[]>(profile.preferredRoles, []).slice(0, 2).join(" and ")}`
        : ""
    }. I reviewed the posting and see a strong match with my background.`,
    "Why you?": skills
      ? `I bring hands-on familiarity with ${skills}, which map directly to keywords in the job description. I have prepared a tailored cover letter and highlights without inventing experience.`
      : "[Add skills to your profile to generate a stronger answer.]",
    "Work authorization": profile.workAuth || "[Add work authorization to profile]",
    "Preferred locations": (() => {
      const locs = parseJson<string[]>(profile.preferredLocations, []);
      return locs.length ? locs.join(", ") : "[Add preferred locations to profile]";
    })(),
    "Salary expectations":
      profile.salaryFloor != null
        ? `Floor: $${profile.salaryFloor.toLocaleString()}`
        : "[Add salary floor to profile]",
  };
}

const DEFAULT_CHECKLIST = [
  { id: "review-jd", label: "Re-read the job description", done: false },
  { id: "review-letter", label: "Review tailored cover letter", done: false },
  { id: "review-bullets", label: "Review bullet highlights", done: false },
  { id: "attach-resume", label: "Confirm correct resume version", done: false },
  { id: "open-url", label: "Open apply URL and submit manually", done: false },
  { id: "mark-applied", label: "Mark as Applied in ApplyFlow", done: false },
];

export function tailorApplication(
  profile: Profile,
  opportunity: Opportunity
): TailorResult {
  const skills = parseJson<string[]>(profile.skills, []);
  const education = parseJson<EducationItem[]>(profile.education, []);
  const jd = `${opportunity.title} ${opportunity.company} ${opportunity.jdText || ""} ${opportunity.notes || ""}`;
  const matched = extractKeywords(jd, skills);
  const eduSummary = educationSummary(education);

  return {
    matchedKeywords: matched,
    coverLetter: buildCoverLetter(profile, opportunity, matched, eduSummary),
    tailoredBullets: buildBullets(profile, matched, education),
    commonAnswers: buildAnswers(profile, opportunity, matched),
    checklist: DEFAULT_CHECKLIST.map((c) => ({ ...c })),
  };
}
