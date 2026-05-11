# At-Tamassok Print Shop

A boutique print shop for a Brooklyn, NY photographer. Limited-edition archival prints — 10 per photo, globally shipped.

**Live at [www.thaliabassim.com](https://www.thaliabassim.com)**

---

## Stack

| Layer           | Choice                                          |
| --------------- | ----------------------------------------------- |
| Framework       | Next.js 16 (App Router)                         |
| Language        | TypeScript (strict)                             |
| Styles          | Tailwind v4 (CSS-based config in `globals.css`) |
| Database        | Supabase (Postgres + Row Level Security)        |
| Auth            | Supabase magic link (admin-only)                |
| Payments        | Stripe Checkout + webhooks                      |
| Email           | Resend + React Email templates                  |
| File storage    | Cloudflare R2 (print masters)                   |
| Error tracking  | Sentry                                          |
| Analytics       | Vercel Analytics                                |
| Package manager | pnpm                                            |
| Hosting         | Vercel                                          |

---

## Local development

```sh
nvm use            # Node 20
pnpm install
pnpm dev           # http://localhost:3000
```

Copy `.env.example` to `.env.local` and fill in keys for Supabase, Stripe, Resend, R2, and Sentry before running.

---

## Quality gates

```sh
pnpm lint          # ESLint
pnpm typecheck     # tsc --noEmit
pnpm format:check  # Prettier
pnpm test          # Vitest unit tests
pnpm build         # production build (runs before typecheck in CI)
```

Pre-commit hook (Husky + lint-staged) auto-runs Prettier + ESLint on staged files, then `tsc --noEmit` on the full project.

---

## Folder layout

```
src/
├── app/                         # Next.js App Router
│   ├── layout.tsx               # Root layout — header, footer, providers
│   ├── page.tsx                 # Catalog home (grid + hero)
│   ├── photos/[slug]/           # Print detail page
│   ├── checkout/                # Stripe Checkout entry
│   ├── thank-you/               # Post-payment confirmation
│   ├── track/                   # Order status for customers
│   ├── dispatch/                # Printer-facing fulfillment view
│   ├── admin/                   # Admin panel (orders, catalog, settings, audit)
│   ├── essay/                   # Long-form artist page
│   ├── info/                    # About / contact
│   ├── terms/                   # Terms of sale
│   ├── api/
│   │   ├── webhooks/stripe/     # Stripe webhook handler
│   │   ├── checkout/            # Checkout session creation
│   │   ├── email/               # Transactional email triggers
│   │   ├── dispatch/            # Printer dispatch API
│   │   ├── coa/                 # Certificate of Authenticity generation
│   │   ├── admin/               # Admin-only data endpoints
│   │   └── cron/                # Watchdog and scheduled jobs
│   └── globals.css              # Tailwind + design tokens
├── components/                  # UI components
│   ├── BuyUI.tsx                # Variant picker, pricing, add-to-cart
│   ├── CartDrawer.tsx           # Slide-in cart (saved prints + added items)
│   ├── CatalogGrid.tsx
│   ├── DetailPanel.tsx
│   ├── LandingHero.tsx
│   ├── Header.tsx / Footer.tsx
│   ├── SaveButton.tsx           # Save-for-later (local storage)
│   ├── RecentlyViewed.tsx
│   ├── RelatedPrints.tsx
│   ├── ImageZoom.tsx
│   ├── Toast.tsx
│   └── dispatch/                # Printer dispatch UI
├── lib/
│   ├── types.ts                 # Shared types (Photo, Order, CartLine, …)
│   ├── pricing.ts               # priceCents, formatUsd, edition helpers
│   ├── photos.ts                # Catalog data access
│   ├── cart.tsx                 # CartProvider + useCart (localStorage)
│   ├── stripe/                  # Stripe client + helpers
│   ├── supabase/                # Supabase client (browser + server + admin)
│   ├── email/                   # Resend templates and send helpers
│   ├── r2/                      # R2 presigned URL helpers
│   ├── auth/                    # Session and role utilities
│   ├── dispatch/                # Printer batch dispatch logic
│   ├── coa/                     # COA PDF generation
│   ├── alerting/                # Resend + Telegram alert helpers
│   ├── analytics.ts
│   ├── orderRef.ts              # Human-readable order reference generator
│   └── countries.ts
├── hooks/                       # Custom React hooks
└── __tests__/                   # Vitest unit tests
supabase/
└── migrations/                  # Postgres migration files
scripts/                         # One-off seed and build scripts
docs/
├── system-design.md             # Architecture and decisions log
└── mockups/
```

---

## Key flows

**Checkout**
Customer → `BuyUI` adds to cart → `CartDrawer` → `/checkout` → Stripe Checkout session created → Stripe hosted page → `checkout.session.completed` webhook → order written to Supabase → confirmation email (Resend) + dispatch email to printer.

**Editions**
Each photo has a pool of 10 prints across all size/paper variants. Edition number is assigned in the webhook under a row-level lock (`SELECT FOR UPDATE` on the `photos` row). Once 10 are sold the photo is marked sold out.

**Printer dispatch**
Printer receives a token-gated link to `/dispatch/[order-id]?token=xxx`. The page shows order details and a "Download print file" button that generates an R2 presigned URL on demand. Token is stored on the order row and revocable from admin.

**Admin panel**
Magic-link auth (Supabase). Two roles: `admin` (full access including refunds) and `editor` (catalog + fulfillment status). Route group at `/admin`.

**Certificate of Authenticity**
Generated as a PDF via `@react-pdf/renderer` on demand from the dispatch page and admin panel.

---

## Environment variables

| Variable                                                                         | Purpose                            |
| -------------------------------------------------------------------------------- | ---------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`                                                       | Supabase project URL               |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`                                                  | Supabase anon key                  |
| `SUPABASE_SERVICE_ROLE_KEY`                                                      | Server-side admin operations       |
| `STRIPE_SECRET_KEY`                                                              | Stripe restricted key              |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`                                             | Stripe publishable key             |
| `STRIPE_WEBHOOK_SECRET`                                                          | Webhook signing secret             |
| `RESEND_API_KEY`                                                                 | Transactional email                |
| `R2_ACCOUNT_ID` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `R2_BUCKET_NAME` | Print file storage                 |
| `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN`                                          | Error tracking                     |
| `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID`                                        | Real-time ops alerts               |
| `CRON_SECRET`                                                                    | Authenticates Vercel cron requests |

> **Stripe webhook endpoint must use `www`** — the apex domain redirects with a 307 and Stripe will not follow it. Register `https://www.thaliabassim.com/api/webhooks/stripe`.

---

## Taxes

NY origin-state sales tax is currently **off**. `automatic_tax` will be enabled in Stripe after the NY Certificate of Authority is obtained.
