import type { DiscoverFilters, DiscoverJob } from "./types";
import { inferType, matchesJuniorFilter, stripHtml } from "./normalize";
import { cacheGet, cacheSet } from "../cache";

type GhJob = {
  id: number;
  title: string;
  absolute_url: string;
  location?: { name?: string };
  updated_at?: string;
  content?: string;
  departments?: { name: string }[];
  company_name?: string;
};

function extractSlug(input: string): string {
  const trimmed = input.trim().replace(/\/$/, "");
  const m =
    trimmed.match(/boards\.greenhouse\.io\/([^/?#]+)/i) ||
    trimmed.match(/boards-api\.greenhouse\.io\/v1\/boards\/([^/?#]+)/i) ||
    trimmed.match(/^([a-z0-9_-]+)$/i);
  if (!m) throw new Error("Invalid Greenhouse board URL or slug");
  return m[1];
}

export async function fetchGreenhouse(
  boardOrUrl: string,
  filters: DiscoverFilters = {}
): Promise<DiscoverJob[]> {
  const slug = extractSlug(boardOrUrl);
  const cacheKey = `greenhouse:${slug}:${filters.keywords || ""}:${filters.internship ? 1 : 0}`;
  const cached = cacheGet<DiscoverJob[]>(cacheKey);
  if (cached) return cached;

  const res = await fetch(
    `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(slug)}/jobs?content=true`,
    { headers: { Accept: "application/json" } }
  );
  if (!res.ok) throw new Error(`Greenhouse board "${slug}" returned ${res.status}`);
  const data = (await res.json()) as { jobs?: GhJob[] };
  let jobs = (data.jobs || []).map((j) => {
    const tags = (j.departments || []).map((d) => d.name);
    const desc = stripHtml(j.content || "");
    return {
      externalId: `greenhouse-${slug}-${j.id}`,
      title: j.title,
      company: j.company_name || slug,
      url: j.absolute_url,
      location: j.location?.name || "",
      type: inferType(j.title, tags),
      description: desc.slice(0, 4000),
      source: "greenhouse",
      tags,
      publishedAt: j.updated_at,
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
