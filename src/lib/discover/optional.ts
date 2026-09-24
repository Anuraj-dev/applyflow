import type { DiscoverFilters, DiscoverJob } from "./types";
import { inferType, matchesJuniorFilter, stripHtml } from "./normalize";
import { cacheGet, cacheSet } from "../cache";

/** USAJobs — requires USAJOBS_API_KEY + USAJOBS_USER_AGENT (email). Skip gracefully without. */
export async function fetchUsaJobs(
  filters: DiscoverFilters = {}
): Promise<DiscoverJob[] | { skipped: string }> {
  const key = process.env.USAJOBS_API_KEY;
  const agent = process.env.USAJOBS_USER_AGENT;
  if (!key || !agent) {
    return {
      skipped:
        "USAJobs needs USAJOBS_API_KEY and USAJOBS_USER_AGENT (email) in .env — free registration at developer.usajobs.gov",
    };
  }
  const cacheKey = `usajobs:${filters.keywords || "software"}:${filters.location || ""}`;
  const cached = cacheGet<DiscoverJob[]>(cacheKey);
  if (cached) return cached;

  const params = new URLSearchParams();
  params.set("Keyword", filters.keywords || "software intern");
  params.set("ResultsPerPage", String(filters.limit || 25));
  if (filters.location) params.set("LocationName", filters.location);

  const res = await fetch(`https://data.usajobs.gov/api/search?${params}`, {
    headers: {
      Host: "data.usajobs.gov",
      "User-Agent": agent,
      "Authorization-Key": key,
    },
  });
  if (!res.ok) throw new Error(`USAJobs error ${res.status}`);
  const data = (await res.json()) as {
    SearchResult?: {
      SearchResultItems?: {
        MatchedObjectId: string;
        MatchedObjectDescriptor: {
          PositionTitle?: string;
          OrganizationName?: string;
          PositionURI?: string;
          QualificationSummary?: string;
          PositionLocation?: { LocationName?: string }[];
        };
      }[];
    };
  };
  const items = data?.SearchResult?.SearchResultItems || [];
  let jobs: DiscoverJob[] = items.map((item) => {
    const d = item.MatchedObjectDescriptor;
    const title = String(d.PositionTitle || "");
    const org = String(d.OrganizationName || "Federal");
    const locArr = d.PositionLocation || [];
    const url = String(d.PositionURI || "");
    const desc = stripHtml(String(d.QualificationSummary || ""));
    return {
      externalId: `usajobs-${item.MatchedObjectId}`,
      title,
      company: org,
      url,
      location: locArr.map((l) => l.LocationName).filter(Boolean).join("; ") || "",
      type: inferType(title),
      description: desc.slice(0, 4000),
      source: "usajobs",
    };
  });
  if (filters.internship) {
    jobs = jobs.filter((j) => matchesJuniorFilter(j.title, j.description));
  }
  cacheSet(cacheKey, jobs);
  return jobs;
}

/** Adzuna — optional ADZUNA_APP_ID + ADZUNA_APP_KEY */
export async function fetchAdzuna(
  filters: DiscoverFilters = {}
): Promise<DiscoverJob[] | { skipped: string }> {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;
  if (!appId || !appKey) {
    return {
      skipped: "Adzuna needs ADZUNA_APP_ID and ADZUNA_APP_KEY in .env (free developer account)",
    };
  }
  const country = process.env.ADZUNA_COUNTRY || "us";
  const cacheKey = `adzuna:${country}:${filters.keywords || ""}:${filters.location || ""}`;
  const cached = cacheGet<DiscoverJob[]>(cacheKey);
  if (cached) return cached;

  const params = new URLSearchParams({
    app_id: appId,
    app_key: appKey,
    results_per_page: String(filters.limit || 25),
    what: filters.keywords || "software engineer intern",
  });
  if (filters.location) params.set("where", filters.location);

  const res = await fetch(
    `https://api.adzuna.com/v1/api/jobs/${country}/search/1?${params}`,
    { headers: { Accept: "application/json" } }
  );
  if (!res.ok) throw new Error(`Adzuna error ${res.status}`);
  const data = (await res.json()) as {
    results?: {
      id: string;
      title: string;
      company?: { display_name?: string };
      redirect_url?: string;
      location?: { display_name?: string };
      description?: string;
      created?: string;
    }[];
  };
  let jobs: DiscoverJob[] = (data.results || []).map((j) => ({
    externalId: `adzuna-${j.id}`,
    title: j.title,
    company: j.company?.display_name || "Unknown",
    url: j.redirect_url || "",
    location: j.location?.display_name || "",
    type: inferType(j.title),
    description: stripHtml(j.description || "").slice(0, 4000),
    source: "adzuna",
    publishedAt: j.created,
  }));
  if (filters.internship) {
    jobs = jobs.filter((j) => matchesJuniorFilter(j.title, j.description));
  }
  cacheSet(cacheKey, jobs);
  return jobs;
}
