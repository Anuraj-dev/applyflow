# Space Bunny — Dashboard analytics

Session: `opencode run --auto` inspected pages then stalled; polish notes below.

## Present

- Funnel bars (saved → offer)
- Weekly applied sparkline (8 weeks)
- Response rate = (interview+offer+rejected) / applied
- Source breakdown + activity timeline + next-best-action

## Polish ideas

1. Tooltips on sparkline bars (`title` already partial)
2. `aria-label` on funnel track for screen readers
3. Empty funnel: illustrate with dashed placeholder heights
4. Link each funnel stage to Tracker filtered column
5. Timezone: labels use local date — document IST for Raja

## Small CSS/a11y

- Gradient bars have adequate contrast on dark card ✓
- Consider `role="img"` + text alternative summarizing weekly counts

## Verdict

Analytics layer is sellable for a self-host product; no billing UI present (correct).
