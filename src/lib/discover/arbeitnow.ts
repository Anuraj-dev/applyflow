import type { DiscoverFilters, DiscoverJob } from "./types";
import { inferType, matchesJuniorFilter, stripHtml } from "./normalize";
import { cacheGet, cacheSet } from "../cache";

type ArbeitnowJob = {
  slug: string;
  company_name: string;
  title: string;
  description: string;
  remote: boolean;
  url: string;
  tags: string[];
  job_types: string[];
  location: string;
  created_at: number;
};

export async function fetchArbeitnow(filters: DiscoverFilters = {}): Promise<DiscoverJob[]> {
  const cacheKey = `arbeitnow:${filters.keywords || ""}:${filters.internship ? 1 : 0}:${filters.remoteOnly ? 1 : 0}`;
  const cached = cacheGet<DiscoverJob[]>(cacheKey);
  if (cached) return cached;

  const res = await fetch("https://www.arbeitnow.com/api/job-board-api", {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Arbeitnow error ${res.status}`);
  const data = (await res.json()) as { data?: ArbeitnowJob[] };
  let jobs = (data.data || []).map((j) => {
    const tags = [...(j.tags || []), ...(j.job_types || [])];
    return {
      externalId: `arbeitnow-${j.slug}`,
      title: j.title,
      company: j.company_name,
      url: j.url,
      location: j.remote ? `Remote — ${j.location || ""}`.trim() : j.location || "",
      type: inferType(j.title, tags),
      description: stripHtml(j.description || "").slice(0, 4000),
      source: "arbeitnow",
      tags,
      publishedAt: j.created_at ? new Date(j.created_at * 1000).toISOString() : undefined,
    } satisfies DiscoverJob;
  });

  if (filters.keywords) {
    const kw = filters.keywords.toLowerCase();
    jobs = jobs.filter(
      (j) =>
        j.title.toLowerCase().includes(kw) ||
        j.company.toLowerCase().includes(kw) ||
        j.description.toLowerCase().includes(kw) ||
        (j.tags || []).some((t) => t.toLowerCase().includes(kw))
    );
  }
  if (filters.remoteOnly) {
    jobs = jobs.filter((j) => /remote/i.test(j.location) || (j.tags || []).includes("remote"));
  }
  if (filters.internship) {
    jobs = jobs.filter((j) => matchesJuniorFilter(j.title, j.description, j.tags));
  }
  if (filters.location) {
    const loc = filters.location.toLowerCase();
    jobs = jobs.filter((j) => j.location.toLowerCase().includes(loc));
  }

  jobs = jobs.slice(0, filters.limit || 50);
  cacheSet(cacheKey, jobs);
  return jobs;
}
