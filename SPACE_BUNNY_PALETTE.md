# Space Bunny — Command palette & shortcuts

Session: `opencode run --auto` stalled; review + notes below.

## Present

- ⌘/Ctrl+K palette with filter, arrow keys, Enter
- `g` then `d/i/o/p/r/q/k/t/s` navigation
- DialogTitle sr-only ✓; role=listbox/option ✓

## Quick wins (optional follow-ups)

1. Add “Recent” section (sessionStorage last 5 routes)
2. Show shortcut hints in each row (`g o`)
3. Escape closes (Dialog default) — verify focus restore to trigger
4. Mobile: sticky ⌘K already in header ✓

## A11y

- Don’t trap focus incorrectly when nested with Sheet
- Ignore shortcuts when typing in inputs ✓ (`KeyboardShortcuts`)

## Verdict

Ship-quality for v1; palette is a premium differentiator vs checklist apps.
