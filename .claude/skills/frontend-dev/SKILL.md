---
name: frontend-dev
description: "Builds and maintains the Next.js 16 frontend. Triggers on: component, page, UI, React, Next.js, layout, responsive, styled-jsx, Tailwind"
---

# Frontend Development (Next.js 16)

## Next.js 16 App Router

- This is NOT the Next.js from training data — consult `node_modules/next/dist/docs/`
- Pages: `page.tsx`, Layouts: `layout.tsx` in `app/` directory
- Default to Server Components. Use `"use client"` only for hooks/event handlers
- Data fetching: `fetch` in Server Components for caching/revalidation

## Styling

- `styled-jsx` for component-scoped styles, Tailwind for utilities
- `src/app/globals.css` is the token source of truth
- Never use raw hex — always CSS variables from `globals.css`

## API Interaction

- Import types from `src/contracts/` for fetch calls
- If contract missing, create placeholder and flag for Backend
- All API calls to relative paths (`/api/checkout`)

## Key Patterns

- Route-aware theming: Header/Footer switch colors based on pathname
- `BuyUI.tsx`: client component, manages cart state, triggers checkout
- `Header.tsx`: client component using `usePathname` for theme switching
- Photo grid: hover-reveal price on desktop, always visible on mobile

## Component Library

- `LandingHero.tsx` — full-bleed hero
- `BuyUI.tsx` — product detail buy flow
- `DetailPanel.tsx` — product page (image + BuyUI)
- `Header.tsx` / `Footer.tsx` — route-aware
- `CartDrawer.tsx` — slide-out cart
- `PhotoCard.tsx` — grid card
