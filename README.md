# prints-projects

Demo build for a Brooklyn, NY photographer's print shop. This is the Phase 0 static shell — chrome, catalog grid, detail panel, buy UI, cart drawer, stubbed checkout. No Stripe, no database, no CMS yet.

System design and decisions live in [`docs/system-design.md`](docs/system-design.md).
Visual reference: [468414.cargo.site](https://468414.cargo.site/) (Thalia Bassim, At-Tamassok template).
Buy UI mockup (vanilla HTML/JS, source of truth for pricing math): [`docs/mockups/buy-ui-mockup.html`](docs/mockups/buy-ui-mockup.html).

## Stack

- Next.js 16 (App Router)
- TypeScript, strict
- Tailwind v4 (CSS-based config in `src/app/globals.css`)
- Geist (free, MIT) standing in for licensed Diatype until brand is locked
- pnpm

## Local development

```sh
nvm use            # Node 20
pnpm install
pnpm dev           # http://localhost:3000
```

## Quality gates

```sh
pnpm lint          # ESLint
pnpm typecheck     # tsc --noEmit
pnpm format:check  # Prettier check
pnpm build         # production build
```

Pre-commit hook (Husky + lint-staged) runs `prettier --write`, `eslint --fix` on staged files, then `pnpm typecheck` on the full project. To bypass in an emergency: `git commit --no-verify` — but the user's instructions explicitly forbid this without sign-off.

## Folder layout

```
src/
├── app/                     # Next.js App Router routes
│   ├── layout.tsx           # Header, Footer, CartProvider, FeedbackButton mount
│   ├── page.tsx             # Catalog home (grid)
│   ├── photos/[slug]/       # Detail panel route (statically generated per slug)
│   ├── checkout/            # Stub "demo, real checkout coming soon" page
│   ├── about/               # Info page
│   └── globals.css          # Tailwind + design tokens
├── components/
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── CatalogGrid.tsx
│   ├── PhotoCard.tsx
│   ├── DetailPanel.tsx      # 16/30/50 layout per design doc Section 10
│   ├── BuyUI.tsx            # Variant picker, live pricing, add-to-cart
│   ├── CartDrawer.tsx       # Slides in from right
│   └── FeedbackButton.tsx   # Floating bottom-right, mailto: for now
├── lib/
│   ├── types.ts             # Photo, CartLine, etc.
│   ├── pricing.ts           # priceCents, formatUsd, edition helpers
│   ├── photos.ts            # Reads from src/data/photos.fixture.json
│   └── cart.tsx             # CartProvider + useCart (localStorage-backed)
└── data/
    └── photos.fixture.json  # 8 placeholder photos with Unsplash URLs
docs/
├── system-design.md         # Source of truth for the overall design
└── mockups/buy-ui-mockup.html
docs-ai/                     # AI-assistant working notes (per global CLAUDE.md)
```

## Stakeholder feedback channels

The demo ships with multiple ways for a stakeholder to leave comments on the live preview:

1. **Floating "Send feedback" button** (bottom-right of every page) — opens a `mailto:` with the page URL and viewport size pre-filled. Zero setup for the reviewer.
2. **MarkUp.io overlay** — paste the Vercel preview URL into <https://markup.io> to drop pinned annotations on the page. No login required for the reviewer. Free for 1–2 projects.
3. _Optional:_ **Vercel Comments** (built into Vercel's Pro plan, $20/user/month or 14-day free team trial). Adds a click-anywhere comment overlay on the preview itself. Decision deferred to deploy time.

## What is intentionally missing

- No Stripe, no payment. Cart "Checkout" goes to a stub page.
- No database, no auth. Photos load from the JSON fixture.
- No Sanity CMS. Catalog edits require a code change in this phase.
- No order email, no print-shop fulfillment page. Phase 2.
- No tests. Add Vitest + Playwright before Phase 1 features land.

## Next phases

See [`docs/system-design.md` Section 11](docs/system-design.md) for the full build phase plan. Phase 0 is the work in this README.
