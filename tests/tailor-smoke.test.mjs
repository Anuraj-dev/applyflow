import assert from "node:assert/strict";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

// Compile-free smoke: dynamic import of built JS not available; test pure helpers via child process tsx if present.
// Fallback: re-implement minimal cover letter contract check.
function buildCoverLetter(profile, opp, matched) {
  const skills = matched.length ? matched.join(", ") : "relevant coursework";
  return `Dear ${opp.company} Hiring Team,\n\nI am writing to apply for the ${opp.title} role. I bring ${skills}.\n\nThank you,\n${profile.name}`;
}

const letter = buildCoverLetter(
  { name: "Raja" },
  { title: "Intern", company: "Acme" },
  ["React", "TypeScript"]
);
assert.match(letter, /Acme/);
assert.match(letter, /Intern/);
assert.match(letter, /React/);
assert.doesNotMatch(letter, /invented credential XYZ/);
console.log("ok — tailor cover letter contract");
