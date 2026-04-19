# At-Tamassok Prototype Port — Session State (2026-04-19)

## What this project is

A Next.js 16.2.3 print shop for Thalia Bassim's photography series
"At-Tamassok" (التمسّك). Stack: Next.js App Router, React 19, Tailwind 4,
Supabase (orders/auth), AWS S3/R2 (print files), Stripe Hosted Checkout,
Resend (email), Sanity (CMS, planned). 25 photos from roll PL-6604.

## What this session did

Ported two finalized static HTML prototypes — `design-extract-output/frame-prototype.html`
(landing) and `design-extract-output/product-prototype.html` (product detail) —
into the Next.js app, preserving all business logic (cart context, pricing,
Stripe flow).

## The plan (saved)

`docs/superpowers/plans/2026-04-19-port-prototypes-to-nextjs.md` — 11 tasks
across 4 phases. Phases 1-2 executed via 3 parallel subagents. Phase 2d
(frontend-design refinement) and Phase 3 (dual-viewport sweep) pending.

## Commits landed on `design/editorial-refinement` branch

1. `396b926` tokens: prototype warm palette (#faf9f6 bg, rgba(12,11,10,…) ink tiers `--i8/--i5/--i3/--i1/--rule`) + disclosure + `.mat-o/.mat-i` + `.btn-ink` CSS primitives
2. `813b7fa` header: drop middle Arabic span + Essay link; landing reveal-on-scroll by pathname
3. `0df865b` footer: two-row (copyright + 4 links, `gap: 32px 36px`)
4. `24b22ea` cohesion: essay heading → Arabic+English rail pattern; checkout + CartDrawer primary CTA → `.btn-ink`; softened DemoBanner
5. `3002ecd` buy-ui: removed free-ship nudge (prototype rail stays quiet)
6. `3250838` detail: split desktop (plate + 38vw rail, max 520) + stacked mobile
7. `30cf56a` cross-sell: Recently viewed / You may also like tabs + horizontal carousel
8. `b267337` catalog: simple 2-col (3-col at >1400px) grid with cell borders (drop collage + toggle + gray last-row block)
9. `5f86d23` photo-card: serif italic title 21px + mono price + mono edition-of
10. `81cbf28` kill intercepted modal + DetailPanel Close bar removed; LandingHero centering + mobile frame sizing fixed

## Key design decisions baked in

- **No popup UI.** The parallel route `src/app/@modal/(.)photos/[slug]` was deleted. All product clicks go to the full `/photos/[slug]` page. `PhotoModal.tsx` and `DetailCloseLink.tsx` deleted.
- **Landing composition** — sticky-pin hero at 150vh desktop; mobile static stack, all elements left-aligned to the Arabic header (image, excerpt, "Read the essay →" match that left edge); "View prints ↓" intentionally centered with 80px margin-top.
- **Nav** — hidden on `/` until scroll past ~vh\*1.2, opacity-based fade via pathname-aware `isLanding` branch in `Header.tsx`.
- **Product rail** — breadcrumb, Arabic+English title, price, 5 disclosures (Paper, Size, Description, Shipping & returns, Care), solid-ink CTA, mobile sticky bar with dual IntersectionObserver (watches `#addCta` CTA + `[data-related-sentinel]`).
- **Double-rule mat** — CSS primitive `.mat-o` → `.mat-i` → image. Used in both landing hero and product gallery plate.
- **Shipping copy** — "Ships flat in an archival tube within 7 working days via insured courier, worldwide. No returns — a replacement can be arranged if the package arrives damaged or unsealed."
- **Catalog captions** — `Untitled, N` italic serif 21px / `From $N` mono 15px / `Edition of N` mono 14px. Cross-sell panel now only shows price (edition count dropped per user).

## Pending user asks (post-compact)

1. **"make it feel more seamless and less page-loading when you click on something"** — options: View Transitions API (Next 15+ `unstable_ViewTransition`), `next/link` prefetch is already on, add a `main` cross-fade transition, or re-introduce a lighter modal-on-landing that isn't a parallel-route popup.
2. **"it'll be one size (idk what yet)"** — each print becomes a single size (TBD). Collapse/remove the Size disclosure in BuyUI, set a single size value statically. Price becomes a fixed number (no "From $N"). `photo.sizes[]` in the fixture becomes a single-element array.
3. `/frontend-design` **cohesion refinement** — essay, terms, checkout, thank-you, cart drawer, toast still need a design-skill driven refinement pass beyond tokens.

## Known small residuals

- `src/lib/types.ts` has unstaged mods that predate this session (not ours).
- `.env.example`, `package.json`, `pnpm-lock.yaml` also show drift from pre-session state — not modified by this session's work, left alone.
- RelatedPrints cross-sell had `Edition of 10` — removed (uncommitted at session end; ready for next commit).
- Multiple untracked backend directories (`admin/`, `api/`, `dispatch/`, etc.) — not part of the visual port scope; left alone.

## Reference

- System design: `docs/system-design.md` (spec doc, 500 lines)
- Prototypes: `design-extract-output/frame-prototype.html`, `design-extract-output/product-prototype.html`
- Frontend workflow rule (mempalace): "always sweep both desktop AND mobile after any frontend change" (saved 2026-04-19)

### Tags

- at-tamassok
- thalia-bassim
- nextjs
- prototype-port
- frame-prototype
- product-prototype
- landing-hero
- buy-ui
- disclosure
- session-state
