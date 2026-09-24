import { NextRequest, NextResponse } from "next/server";
import { cacheGet, cacheSet } from "@/lib/cache";

function pickMeta(html: string, prop: string): string {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${prop}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${prop}["']`, "i"),
    new RegExp(`<meta[^>]+name=["']${prop}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${prop}["']`, "i"),
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1]) return m[1].trim();
  }
  return "";
}

function pickTitle(html: string): string {
  const og = pickMeta(html, "og:title");
  if (og) return og;
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return m?.[1]?.trim() || "";
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return NextResponse.json({ error: "url required" }, { status: 400 });
  let parsed: URL;
  try {
    parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("bad protocol");
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  const cacheKey = `meta:${parsed.toString()}`;
  const cached = cacheGet<{ title: string; company: string; description: string; image: string }>(cacheKey);
  if (cached) return NextResponse.json({ ...cached, cached: true });

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(parsed.toString(), {
      signal: controller.signal,
      headers: {
        "User-Agent": "ApplyFlow/1.0 (link-metadata; +https://github.com/Anuraj-dev/applyflow)",
        Accept: "text/html",
      },
      redirect: "follow",
    });
    clearTimeout(timer);
    if (!res.ok) {
      return NextResponse.json({ error: `Fetch failed ${res.status}` }, { status: 502 });
    }
    const html = (await res.text()).slice(0, 120_000);
    const title = pickTitle(html);
    const description = pickMeta(html, "og:description") || pickMeta(html, "description");
    const site = pickMeta(html, "og:site_name");
    const image = pickMeta(html, "og:image");
    // Heuristic company from site name or hostname
    const company =
      site ||
      parsed.hostname.replace(/^www\./, "").split(".")[0].replace(/-/g, " ").replace(/\b\w/g, (c) =>
        c.toUpperCase()
      );

    const payload = { title, company, description, image, url: parsed.toString() };
    cacheSet(cacheKey, payload, 60 * 60 * 1000);
    return NextResponse.json(payload);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Metadata fetch failed" },
      { status: 502 }
    );
  }
}
