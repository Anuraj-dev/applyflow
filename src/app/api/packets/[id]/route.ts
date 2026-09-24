import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, applications, opportunities, resumes, profiles } from "@/lib/db";
import { parseJson } from "@/lib/ids";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const format = req.nextUrl.searchParams.get("format") || "markdown";
  const app = db.select().from(applications).where(eq(applications.id, id)).get();
  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const opp = db
    .select()
    .from(opportunities)
    .where(eq(opportunities.id, app.opportunityId))
    .get();
  const resume = app.resumeId
    ? db.select().from(resumes).where(eq(resumes.id, app.resumeId)).get()
    : null;
  const profile = db.select().from(profiles).all()[0] || null;
  const bullets = parseJson<string[]>(app.tailoredBullets, []);
  const checklist = parseJson<{ id: string; label: string; done: boolean }[]>(app.checklist, []);
  const answers = parseJson<Record<string, string>>(app.commonAnswers, {});

  const md = `# Application Packet — ${opp?.title || "Role"} @ ${opp?.company || "Company"}

**Candidate:** ${profile?.name || "—"} (${profile?.email || "—"})  
**Resume:** ${resume?.label || "Default / none"}  
**Status:** ${app.status}  
**Apply URL:** ${opp?.url || "—"}  
**Generated:** ${new Date().toISOString()}

---

## Cover letter

${app.coverLetter || "_No cover letter yet — run Tailor._"}

---

## Tailored highlights

${bullets.length ? bullets.map((b) => `- ${b}`).join("\n") : "_None_"}

---

## Common answers

${
  Object.keys(answers).length
    ? Object.entries(answers)
        .map(([k, v]) => `### ${k}\n\n${v}`)
        .join("\n\n")
    : "_None_"
}

---

## Checklist

${checklist.map((c) => `- [${c.done ? "x" : " "}] ${c.label}`).join("\n") || "_Empty_"}

---

## Notes

${app.applyNotes || "_None_"}

---

*Prepared with ApplyFlow — human-in-the-loop. You submit the application yourself.*
`;

  if (format === "json") {
    return NextResponse.json({ app, opportunity: opp, resume, profile, markdown: md });
  }

  // Lightweight HTML that browsers can Print → Save as PDF
  if (format === "pdf" || format === "html") {
    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><title>Packet — ${opp?.title || ""}</title>
<style>
  body{font-family:ui-sans-serif,system-ui,sans-serif;max-width:720px;margin:40px auto;padding:0 24px;color:#111;line-height:1.5}
  h1{font-size:1.5rem} h2{font-size:1.1rem;margin-top:1.5rem;border-bottom:1px solid #ddd;padding-bottom:4px}
  pre,p{white-space:pre-wrap} .meta{color:#555;font-size:0.9rem}
  @media print{body{margin:0}}
</style></head><body>
${md
  .split("\n")
  .map((line) => {
    if (line.startsWith("# ")) return `<h1>${line.slice(2)}</h1>`;
    if (line.startsWith("## ")) return `<h2>${line.slice(3)}</h2>`;
    if (line.startsWith("### ")) return `<h3>${line.slice(4)}</h3>`;
    if (line.startsWith("- [")) return `<div>${line}</div>`;
    if (line.startsWith("- ")) return `<li>${line.slice(2)}</li>`;
    if (line === "---") return "<hr/>";
    if (line.startsWith("*") && line.endsWith("*")) return `<p class="meta"><em>${line.slice(1, -1)}</em></p>`;
    return line ? `<p>${line}</p>` : "";
  })
  .join("\n")}
<script>if(new URLSearchParams(location.search).get('format')==='pdf'){setTimeout(()=>print(),300)}</script>
</body></html>`;
    return new NextResponse(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  return new NextResponse(md, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="packet-${(opp?.company || "app").replace(/\W+/g, "-")}.md"`,
    },
  });
}
