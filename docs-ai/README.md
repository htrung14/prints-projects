# docs-ai

Source of truth for AI-assisted development on this repo.

Per the user's global `CLAUDE.md`:

> If a `docs-ai` folder exists, treat it as source of truth. Read before changes, update after.

## Pointers

- **System design:** [`docs/system-design.md`](../docs/system-design.md) — v0.1, 2026-04-13. Stack, data model, order flow, visual design notes.
- **Buy UI mockup:** [`docs/mockups/buy-ui-mockup.html`](../docs/mockups/buy-ui-mockup.html) — vanilla HTML/JS reference implementation for the buy panel, cart, and pricing math.
- **Visual reference:** https://468414.cargo.site/ (Thalia Bassim, Cargo template). ABC Diatype Variable weight 900, white bg, rgba(0,0,0,0.6) text, 3-col grid, 16/30/50 detail panel.

## Current phase

Phase 0, static shell demo. No Supabase, no Stripe, no CMS. Data comes from `src/data/photos.fixture.json`.

## Decisions worth re-reading before editing

See `docs/system-design.md` Section 1a (Decisions log). Key ones that shape the code:

- Every photo is an edition of 10 prints total, pooled across all size and paper variants. `edition_total` lives on `photos`, not on `variants`.
- No frames in v1. Buy UI does not expose a frame option.
- Cargo template aesthetic is strict: single font, weight 900, white bg, `rgba(0,0,0,0.6)` text, no shadows, no rounded buttons, no fills on CTAs.
- Local pickup copy must say "Brooklyn, NY", never "NYC" or "local pickup".
