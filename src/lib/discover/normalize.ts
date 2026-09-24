export function inferType(title: string, tags: string[] = [], explicit?: string): string {
  const hay = `${title} ${tags.join(" ")} ${explicit || ""}`.toLowerCase();
  if (/\bintern(ship)?\b/.test(hay)) return "internship";
  if (/\b(junior|entry[\s-]?level|new grad|graduate)\b/.test(hay)) return "full-time";
  if (/\bpart[\s-]?time\b/.test(hay)) return "part-time";
  if (/\bcontract|freelance\b/.test(hay)) return "contract";
  return explicit || "full-time";
}

export function matchesJuniorFilter(title: string, description: string, tags: string[] = []): boolean {
  const hay = `${title} ${description.slice(0, 800)} ${tags.join(" ")}`.toLowerCase();
  return /\b(intern(ship)?|junior|entry[\s-]?level|new grad|graduate|associate)\b/.test(hay);
}

export function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}
