import { NextRequest, NextResponse } from "next/server";
import {
  fetchRemotive,
  fetchArbeitnow,
  fetchGreenhouse,
  fetchLever,
  fetchUsaJobs,
  fetchAdzuna,
  type DiscoverJob,
} from "@/lib/discover";
import { existingUrlSet, normalizeUrl } from "@/lib/discover/import";
import { cacheSweep } from "@/lib/cache";

const rateMap = new Map<string, number>();
const RATE_MS = 1500;

function rateLimit(key: string): boolean {
  const now = Date.now();
  const last = rateMap.get(key) || 0;
  if (now - last < RATE_MS) return false;
  rateMap.set(key, now);
  return true;
}

export async function GET(req: NextRequest) {
  cacheSweep();
  const sp = req.nextUrl.searchParams;
  const source = (sp.get("source") || "remotive").toLowerCase();
  const keywords = sp.get("keywords") || sp.get("q") || "";
  const location = sp.get("location") || "";
  const internship = sp.get("internship") === "1" || sp.get("internship") === "true";
  const remoteOnly = sp.get("remote") !== "0";
  const board = sp.get("board") || sp.get("slug") || "";
  const limit = Math.min(Number(sp.get("limit") || 50), 100);

  if (!rateLimit(`discover:${source}`)) {
    return NextResponse.json(
      { error: "Slow down — wait a moment before searching again." },
      { status: 429 }
    );
  }

  const filters = { keywords, location, internship, remoteOnly, limit };

  try {
    let jobs: DiscoverJob[] = [];
    let note: string | undefined;

    switch (source) {
      case "remotive":
        jobs = await fetchRemotive(filters);
        break;
      case "arbeitnow":
        jobs = await fetchArbeitnow(filters);
        break;
      case "greenhouse": {
        if (!board) {
          return NextResponse.json(
            { error: "Provide board=slug or a Greenhouse boards URL" },
            { status: 400 }
          );
        }
        jobs = await fetchGreenhouse(board, filters);
        break;
      }
      case "lever": {
        if (!board) {
          return NextResponse.json(
            { error: "Provide board=slug or a Lever jobs URL" },
            { status: 400 }
          );
        }
        jobs = await fetchLever(board, filters);
        break;
      }
      case "usajobs": {
        const result = await fetchUsaJobs(filters);
        if ("skipped" in result) {
          return NextResponse.json({ jobs: [], note: result.skipped, source });
        }
        jobs = result;
        break;
      }
      case "adzuna": {
        const result = await fetchAdzuna(filters);
        if ("skipped" in result) {
          return NextResponse.json({ jobs: [], note: result.skipped, source });
        }
        jobs = result;
        break;
      }
      default:
        return NextResponse.json({ error: `Unknown source: ${source}` }, { status: 400 });
    }

    const urls = existingUrlSet();
    const enriched = jobs.map((j) => ({
      ...j,
      alreadySaved: Boolean(j.url && urls.has(normalizeUrl(j.url))),
    }));

    return NextResponse.json({
      source,
      count: enriched.length,
      jobs: enriched,
      note,
      cachedHint: "Responses cached ~20 minutes",
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Discover failed" },
      { status: 502 }
    );
  }
}
