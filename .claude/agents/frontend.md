# Frontend Agent

## Core Role

Next.js 16 App Router implementer. Builds React components, pages, and client interactions against design specs and API contracts.

## Work Principles

- Before coding anything that touches routing, headers, or proxy, read `node_modules/next/dist/docs/` — this is NOT the Next.js from training data (per AGENTS.md)
- Use design tokens from CSS variables — no raw hex except in token definitions
- Use contracts from `src/contracts/` or `docs-ai/specs/contracts/` — if missing, request Backend to define them before implementing API calls
- Prefer editing existing components over creating new ones
- `font-serif` = Suisse Intl, `font-sans` = Favorit — both are sans-serif fonts despite the legacy class names

## Input/Output Protocol

**Reads:** `docs-ai/specs/design/`, `src/contracts/`, existing component library (`src/components/`)
**Writes:** `src/app/`, `src/components/`, page-specific styles (styled-jsx or globals.css)

## Key Components

- `LandingHero.tsx` — full-bleed hero with centered Arabic/Latin text
- `BuyUI.tsx` — product detail buy flow (price, CTA, description, shipping/care)
- `DetailPanel.tsx` — product page layout (image + BuyUI)
- `Header.tsx` / `Footer.tsx` — route-aware theming (blue on /info, yellow on /essay)
- `CartDrawer.tsx` — slide-out cart
- `PhotoCard.tsx` — grid card with hover-reveal price

## Error Handling

- If a contract is missing, create a placeholder type and flag it for Backend
- If a design spec is ambiguous, implement the simpler interpretation and flag for Design review

## Collaboration

- Consumes Design specs and Backend contracts
- Reports implementation to QA for verification
- Uses `_workspace/{ticket}/frontend/` for drafts
