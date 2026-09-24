import type { DiscoverFilters, DiscoverJob } from "./types";
import { inferType, matchesJuniorFilter, stripHtml } from "./normalize";
import { cacheGet, cacheSet } from "../cache";

type LeverJob = {
  id: string;
  text: string;
  hostedUrl: string;
  applyUrl?: string;
  categories?: { location?: string; team?: string; commitment?: string; department?: string };
  descriptionPlain?: string;
  description?: string;
  createdAt?: number;
};

function extractSlug(input: string): string {
  const trimmed = input.trim().replace(/\/$/, "");
  const m =
    trimmed.match(/jobs\.lever\.co\/([^/?#]+)/i) ||
    trimmed.match(/api\.lever\.co\/v0\/postings\/([^/?#]+)/i) ||
    trimmed.match(/^([a-z0-9_-]+)$/i);
  if (!m) throw new Error("Invalid Lever board URL or slug");
  return m[1];
}

export async function fetchLever(
  boardOrUrl: string,
  filters: DiscoverFilters = {}
): Promise<DiscoverJob[]> {
  const slug = extractSlug(boardOrUrl);
  const cacheKey = `lever:${slug}:${filters.keywords || ""}:${filters.internship ? 1 : 0}`;
  const cached = cacheGet<DiscoverJob[]>(cacheKey);
  if (cached) return cached;

  const res = await fetch(
    `https://api.lever.co/v0/postings/${encodeURIComponent(slug)}?mode=json`,
    { headers: { Accept: "application/json" } }
  );
  if (!res.ok) {
    throw new Error(
      `Lever board "${slug}" returned ${res.status}. Use a public Lever jobs site slug (jobs.lever.co/{slug}).`
    );
  }
  const raw = await res.json();
  const list: LeverJob[] = Array.isArray(raw) ? raw : [];
  let jobs = list.map((j) => {
    const tags = [
      j.categories?.team,
      j.categories?.department,
      j.categories?.commitment,
    ].filter(Boolean) as string[];
    const desc = j.descriptionPlain || stripHtml(j.description || "");
    return {
      externalId: `lever-${slug}-${j.id}`,
      title: j.text,
      company: slug,
      url: j.hostedUrl || j.applyUrl || "",
      location: j.categories?.location || "",
      type: inferType(j.text, tags, j.categories?.commitment),
      description: desc.slice(0, 4000),
      source: "lever",
      tags,
      publishedAt: j.createdAt ? new Date(j.createdAt).toISOString() : undefined,
    } satisfies DiscoverJob;
  });

  if (filters.keywords) {
    const kw = filters.keywords.toLowerCase();
    jobs = jobs.filter(
      (j) =>
        j.title.toLowerCase().includes(kw) ||
        j.location.toLowerCase().includes(kw) ||
        j.description.toLowerCase().includes(kw)
    );
  }
  if (filters.internship) {
    jobs = jobs.filter((j) => matchesJuniorFilter(j.title, j.description, j.tags));
  }
  jobs = jobs.slice(0, filters.limit || 100);
  cacheSet(cacheKey, jobs);
  return jobs;
}
