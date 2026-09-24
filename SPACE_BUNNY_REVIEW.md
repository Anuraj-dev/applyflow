# Space Bunny UI/UX Review

Ten concrete improvements for ApplyFlow, an ethical, local-first job-apply workspace.

1. **Add a first-run setup path.** Show a persistent setup checklist for profile, resume, and first opportunity, with one primary “Next best action” button on the dashboard.
2. **Make opportunity capture forgiving.** Mark required fields, validate the apply URL, show a JD character count/preview, and preserve an unsaved draft when the dialog closes.
3. **Turn the opportunity list into a work queue.** Add search, deadline/source filters, sorting, and a sticky bulk-action bar that explains what “Queue & tailor” will do before it runs.
4. **Show tailoring evidence.** Pair each matched keyword with the profile fact behind it, surface missing keywords, and label generated copy as draft-only so users can review before saving.
5. **Improve packet review.** Use a two-column review layout with checklist, resume, cover letter, and answers in clear tabs; preserve scroll position and show completion progress.
6. **Strengthen the human-submit guardrail.** Require the checklist to be complete and a final confirmation before “Mark as Applied,” with an undo window and plain-language confirmation.
7. **Make resume selection visual.** Add PDF thumbnails or file metadata, a clear “used for” count, and inline guidance explaining when the default resume is selected.
8. **Support follow-through in the tracker.** Add follow-up dates, overdue indicators, interview-stage notes, and quick status changes without forcing a visit to the full kanban board.
9. **Raise resilience and accessibility.** Use skeletons, inline errors with retry, unsaved-change protection, visible focus states, keyboard navigation, reduced-motion support, and stronger contrast in the dark theme.
10. **Make privacy and ethics discoverable.** Add a settings/control center for local-data export and deletion, explain what is never auto-submitted, and show a persistent, non-blocking “review before you apply” reminder.

These ideas prioritize clarity, user control, and transparent human-in-the-loop decisions without introducing scraping or silent submission.

## Accessibility

- Increase muted text, secondary labels, and status-chip contrast against the dark indigo surfaces.
- Keep focus states obvious and support a logical keyboard path through the dashboard, dialogs, review tabs, and tracker controls.
- Pair status colors with text or icons so deadlines, success, warnings, and errors never rely on color alone.
- Respect reduced-motion preferences and provide clear non-motion loading and confirmation feedback.
- Add explicit form labels, inline error summaries, and screen-reader names for icon buttons and tooltips.
