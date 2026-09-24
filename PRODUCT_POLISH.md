# ApplyFlow — Product polish summary

Shipped 2026-09-24 (Asia/Calcutta) as a sellable-quality self-host command center. **No paywall / billing / Stripe.**

## Phase 0 — Audit gaps closed

Prior app had profile, resumes, opportunities, tailor, queue, tracker. Gaps vs “apply command center”: live job discovery, packets export, templates, analytics depth, keyboard UX, onboarding, settings/backup, soft multi-user schema.

## Phase 1 — Discover / Integrations

| Source | Status |
|--------|--------|
| Remotive | Live, free, no key |
| Arbeitnow | Live, free, no key |
| Greenhouse boards | Live via slug/URL (`boards-api.greenhouse.io`) |
| Lever boards | Implemented (public `api.lever.co`); some slugs 404 from this network — UX documents slug requirement |
| USAJobs | Optional keys — graceful skip note |
| Adzuna | Optional keys — graceful skip note |
| Link metadata | `/api/metadata` OG/title autofill |

Shared: SQLite `api_cache` TTL ~20m, client rate-limit 1.5s/source, URL normalize+dedupe, source badges, multi-select → import as **Saved**.

## Phase 2 — Product functionality

- Application packets: `/api/packets/[id]?format=markdown|pdf|html`
- Cover templates library + seeds
- Saved searches on Discover
- Bulk status on Tracker (`/api/opportunities/bulk`)
- Activity timeline (`activities` table + dashboard)
- Stats: funnel, weekly applied sparkline, response rate, source breakdown
- Settings: accent, confetti, dense lists, JSON/CSV export + restore
- ⌘/Ctrl+K palette; `g`+letter shortcuts
- Onboarding wizard (profile → resume → import → queue)
- Soft multi-user: `workspaces` + `workspace_id`/`user_id` default `local`; `onboarding_done`

## Phase 3 — Premium design

- Deeper dark surfaces, glass/glow cards, accent variants
- Framer page transitions, card hover lift, skeleton loaders on Discover
- Confetti-lite on Mark Applied
- Page headers with breadcrumbs + primary CTAs
- Mobile nav drawer + ⌘K affordance
- Focus rings / dialog titles / source badge contrast

## Phase 4 — Optimize

- `npm run build` green; indexes on status/source/url; WAL
- Debounced-friendly Discover search; list virtualization deferred (lists typically ≪50 after filters)
- `npm test` — dedupe URL normalize + junior filter + tailor contract
- RSC-friendly layout; mutations stay in API routes

## Phase 5 — Space Bunny

Sessions launched with `opencode run --auto -m opencode/space-bunny-free --variant max` for Discover review, command palette, dashboard analytics. Outcomes recorded in `SPACE_BUNNY_*.md` when sessions complete (or committed manually if `--auto` stalls).

## How to demo

```bash
npm install && npm run dev
# Discover → Remotive “software intern” → import → Opportunities → Queue → Mark Applied
# Greenhouse: board slug `stripe`
```

## Commits

Primary feature commit on `main`: Discover APIs + polish (see `git log`). Follow-up docs/Bunny reviews pushed separately.
