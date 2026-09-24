# Space Bunny — Discover review

Session: `opencode run --auto -m opencode/space-bunny-free --variant max` (stalled on Explore; review completed manually with same scope).

## What shipped

- Sources: Remotive, Arbeitnow (free), Greenhouse/Lever boards, optional USAJobs/Adzuna
- UI: filters, multi-select, import, saved searches, source badges, skeletons
- API: `/api/discover`, `/api/discover/import`, SQLite cache ~20m, 1.5s rate limit

## UX polish ideas

1. Persist last source/keywords in `settings.extras`
2. After import, one-click “Queue selected imports” using returned ids
3. Show cache age (“Updated 12m ago”) from `api_cache.created_at`
4. Greenhouse examples chips (`stripe`, `gitlab`, `shopify`)
5. Lever: surface clearer empty/404 copy when slug missing

## Accessibility

- Checkboxes have aria-labels; keep focus order Search → results
- Announce result count via `aria-live="polite"`
- Empty state uses `onAction` (not dead `#` href) ✓

## Caching / rate-limit

- TTL 20m is good; sweep on each Discover GET ✓
- Consider per-IP/session key if multi-user later
- Client should disable Search button while in-flight (already does)

## Greenhouse vs Lever

- Greenhouse Stripe board verified live
- Lever public API returned 404 for several common slugs from this network — keep fetcher, document “jobs.lever.co/{slug}” requirement

## Bugs / nits

- Internship filter on Greenhouse/Lever is title/description heuristic only (fine)
- `queueImported` toast could deep-link to `/opportunities?status=saved`

## Ethics

No scrape of LinkedIn/Indeed; import only; user submits.
