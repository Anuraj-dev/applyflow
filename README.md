# ApplyFlow

**Ethical apply command center** — discover openings from public APIs, prepare profile & resumes, auto-tailor packets from *your* facts, review in batch, submit yourself, and track outcomes.

> ApplyFlow is **not** a silent spam bot. It never auto-submits to LinkedIn, Indeed, or other boards. You always open the apply URL and choose to send.

Self-host today. Soft multi-user schema (`workspace_id` / `user_id` = `local`) so you can sell or SaaS later — **no paywall, no billing, no Stripe in this build**.

## Vision

1. Durable **profile** (skills, education, work auth, preferences)
2. Labeled **resume PDFs**
3. **Discover** live roles (Remotive, Arbeitnow, Greenhouse/Lever boards) + manual/CSV
4. **Tailor** cover letters, highlights, FAQ answers — never invent credentials
5. **Queue** packets with checklists → confirm → Mark Applied
6. **Track** Saved → Queued → Applied → Interview → Offer / Rejected / Ghosted
7. **Export** packets (Markdown / print-PDF) and full JSON/CSV backups

## Stack

- Next.js 15 (App Router) + TypeScript + Tailwind CSS v4 + shadcn/ui
- SQLite via better-sqlite3 + Drizzle ORM (`data/applyflow.db`, WAL)
- Framer Motion + Lucide + Geist
- Dark-first indigo / violet (accent switcher in Settings)

## Setup

```bash
# Node 20+ recommended
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Optional keys (all Discover free sources work without them):

```bash
cp .env.example .env
# OPENAI_API_KEY=          # optional LLM polish; deterministic tailor always works
# USAJOBS_API_KEY= + USAJOBS_USER_AGENT=
# ADZUNA_APP_ID= + ADZUNA_APP_KEY=
```

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Dev server |
| `npm run build` / `start` | Production |
| `npm test` | Unit tests (dedupe + tailor contract) |
| `npm run db:studio` | Drizzle Studio |

## Features

- **Discover** — Remotive & Arbeitnow (free), Greenhouse/Lever company boards, optional USAJobs/Adzuna; 20m cache; URL dedupe; saved searches; multi-select import → Saved
- **Opportunities** — manual add, CSV, OG metadata autofill from URL, source badges
- **Templates** — editable cover letter library with `{{name}}` / `{{title}}` / `{{company}}` / `{{skills}}`
- **Tailor + Queue** — human confirm before Mark Applied; confetti-lite; packet MD/PDF export
- **Tracker** — kanban + bulk status changes
- **Dashboard** — funnel, weekly applied sparkline, response rate, source breakdown, activity timeline
- **Settings** — accent theme, JSON/CSV export, restore
- **⌘K** command palette · `g` then `d/i/o/q/k/s` jumps · first-run onboarding checklist

## Demo: Discover → Queue

1. Open **Discover** → source **Remotive**, keywords `software intern`, enable internship filter → Search
2. Multi-select roles → **Import selected** (lands as Saved, deduped by URL)
3. Or paste Greenhouse board `stripe` → Search → import
4. **Opportunities** → select → Queue & tailor
5. **Queue** → Review packet → Open apply URL yourself → checklist → **Mark Applied**

## Ethics

- No LinkedIn / Indeed scraping
- No auto-submit to third-party job boards
- Tailoring only uses facts from your profile + JD text
- You remain accountable for every application you send

## Data

All data stays under `data/` (gitignored). Soft SaaS-ready columns default to `local`.

## License

MIT — built for Raja (Anuraj-dev).
