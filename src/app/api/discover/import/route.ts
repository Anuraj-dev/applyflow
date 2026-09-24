import { NextRequest, NextResponse } from "next/server";
import { importJobs } from "@/lib/discover/import";
import type { DiscoverJob } from "@/lib/discover";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const jobs = (body.jobs || []) as DiscoverJob[];
  if (!Array.isArray(jobs) || !jobs.length) {
    return NextResponse.json({ error: "jobs array required" }, { status: 400 });
  }
  const cleaned = jobs
    .filter((j) => j && j.title && j.company)
    .map((j) => ({
      externalId: j.externalId || `${j.source}-${j.url}`,
      title: String(j.title),
      company: String(j.company),
      url: String(j.url || ""),
      location: String(j.location || ""),
      type: String(j.type || "full-time"),
      description: String(j.description || ""),
      source: String(j.source || "discover"),
      tags: j.tags,
    }));

  const result = importJobs(cleaned);
  return NextResponse.json(result);
}
