import assert from "node:assert/strict";
import { createRequire } from "node:module";

// Lightweight pure tests for URL normalize + junior filter (mirror lib logic)
function normalizeUrl(url) {
  try {
    const u = new URL(url.trim());
    u.hash = "";
    ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gh_src"].forEach((p) =>
      u.searchParams.delete(p)
    );
    return u.toString().replace(/\/$/, "").toLowerCase();
  } catch {
    return url.trim().toLowerCase();
  }
}

function matchesJuniorFilter(title, description, tags = []) {
  const hay = `${title} ${description.slice(0, 800)} ${tags.join(" ")}`.toLowerCase();
  return /\b(intern(ship)?|junior|entry[\s-]?level|new grad|graduate|associate)\b/.test(hay);
}

function extractKeywords(jd, profileSkills) {
  const jdLower = jd.toLowerCase();
  const found = new Set();
  for (const skill of profileSkills) {
    const s = skill.trim().toLowerCase();
    if (s.length >= 2 && jdLower.includes(s)) found.add(skill.trim());
  }
  return Array.from(found);
}

assert.equal(
  normalizeUrl("https://Example.com/jobs/1/?utm_source=x#frag"),
  "https://example.com/jobs/1"
);
assert.equal(
  normalizeUrl("https://example.com/jobs/1"),
  normalizeUrl("https://example.com/jobs/1/?utm_campaign=y")
);
assert.ok(matchesJuniorFilter("Software Engineering Intern", "join our team", []));
assert.ok(matchesJuniorFilter("Junior Backend Engineer", "", ["junior"]));
assert.equal(matchesJuniorFilter("Principal Architect", "decade of experience", []), false);

const kws = extractKeywords("We need React and TypeScript experience", ["React", "Go", "TypeScript"]);
assert.deepEqual(kws.sort(), ["React", "TypeScript"].sort());

console.log("ok — dedupe + junior filter + keyword overlap");
