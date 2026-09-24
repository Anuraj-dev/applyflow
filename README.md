# ApplyFlow

**Ethical mass-apply OS** for internships and jobs — prepare your profile and resumes, discover openings, auto-tailor materials from *your* facts, review packets in batch, then submit yourself and track outcomes.

> ApplyFlow is **not** a silent spam bot. It never auto-submits to LinkedIn, Indeed, or other boards. You always open the apply URL and choose to send.

## Vision

Job search at scale should be thoughtful, not spray-and-pray. ApplyFlow gives you one local-first workspace to:

1. Keep a durable **profile** (skills, education, work auth, preferences)
2. Store labeled **resume PDFs**
3. Collect **opportunities** (manual, CSV, pasted JD)
4. **Tailor** cover letters, highlights, and FAQ answers from profile + JD keywords only — never invent credentials
5. **Queue** packets for batch review with checklists
6. **Track** Saved → Queued → Applied → Interview → Offer / Rejected / Ghosted

## Stack

- Next.js 15 (App Router) + TypeScript + Tailwind CSS v4 + shadcn/ui
- SQLite via better-sqlite3 + Drizzle ORM (local-first at `data/applyflow.db`)
- Local PDF storage under `data/resumes/`
- Framer Motion + Lucide icons
- Dark-first indigo / violet UI

## Setup

```bash
# Node 20+ recommended (better-sqlite3@11)
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Optional:

```bash
# Explore DB
npm run db:studio

# Optional LLM enhancement later (deterministic fallback always works)
export OPENAI_API_KEY=sk-...
```

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run db:push` | Push Drizzle schema |
| `npm run db:studio` | Drizzle Studio |

## Features

- **Profile** — name, email, phone, links, education, skills, work auth, roles/locations, salary floor
- **Resume vault** — PDF upload, labels, default selection
- **Opportunities** — manual add, CSV import (`title,company,url,location,type,notes,deadline`), JD paste
- **Tailor** — keyword overlap → cover letter + bullets + common answers (no invented quals)
- **Queue** — multi-select prepare → review dialog → Open apply URL + checklist → Mark Applied
- **Tracker** — kanban-style pipeline with counts

## Ethics

- No LinkedIn / Indeed scraping
- No auto-submit to third-party job boards
- Tailoring only uses facts from your profile + JD text
- You remain accountable for every application you send

## Data

All data stays on disk under `data/` (gitignored). Delete that folder to reset.

## License

MIT — built for Raja (Anuraj-dev).
