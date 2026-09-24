import type { DiscoverFilters, DiscoverJob } from "./types";
import { inferType, matchesJuniorFilter, stripHtml } from "./normalize";
import { cacheGet, cacheSet } from "../cache";

type RemotiveJob = {
  id: number;
  url: string;
  title: string;
  company_name: string;
  category: string;
  job_type: string;
  candidate_required_location: string;
  description: string;
  publication_date: string;
  tags?: string[];
};

export async function fetchRemotive(filters: DiscoverFilters = {}): Promise<DiscoverJob[]> {
  const cacheKey = `remotive:${filters.keywords || ""}:${filters.category || ""}:${filters.internship ? 1 : 0}`;
  const cached = cacheGet<DiscoverJob[]>(cacheKey);
  if (cached) return cached;

  const params = new URLSearchParams();
  if (filters.keywords) params.set("search", filters.keywords);
  if (filters.category) params.set("category", filters.category);
  params.set("limit", String(filters.limit || 50));

  const res = await fetch(`https://remotive.com/api/remote-jobs?${params}`, {
    next: { revalidate: 0 },
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Remotive error ${res.status}`);
  const data = (await res.json()) as { jobs?: RemotiveJob[] };
  let jobs = (data.jobs || []).map((j) => {
    const tags = j.tags || [];
    return {
      externalId: `remotive-${j.id}`,
      title: j.title,
      company: j.company_name,
      url: j.url,
      location: j.candidate_required_location || "Remote",
      type: inferType(j.title, tags, j.job_type),
      description: stripHtml(j.description || "").slice(0, 4000),
      source: "remotive",
      tags,
      publishedAt: j.publication_date,
    } satisfies DiscoverJob;
  });

  if (filters.internship) {
    jobs = jobs.filter((j) => matchesJuniorFilter(j.title, j.description, j.tags));
  }
  if (filters.location) {
    const loc = filters.location.toLowerCase();
    jobs = jobs.filter(
      (j) => j.location.toLowerCase().includes(loc) || j.location.toLowerCase().includes("worldwide")
    );
  }

  cacheSet(cacheKey, jobs);
  return jobs;
}
