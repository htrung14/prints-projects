---
name: backend-dev
description: "Implements server-side logic, databases, and third-party integrations. Triggers on: API, Stripe, checkout, webhook, Supabase, database, email, proxy, backend, server"
---

# Backend Development

## API Route Handlers (Next.js 16)

- All API logic in `src/app/api/.../route.ts`
- Exposed via `src/proxy.ts` (NOT middleware.ts — Next 16 convention)
- Every route handler response must conform to `src/contracts/`

## Stripe Integration

- Checkout: `/api/checkout/route.ts` — never trust client-side price
- Webhook: `/api/webhooks/stripe/route.ts` — verify signature with `stripe.webhooks.constructEvent`
- Idempotency: check event.id against Supabase before processing
- On `checkout.session.completed`: trigger edition register + confirmation email

## Supabase & Edition Register

- Use service role key for backend operations
- Edition register: PostgreSQL RPC `register_sale` with `SELECT ... FOR UPDATE` row lock
- Prevents race conditions and overselling
- Called from Stripe webhook handler

## Email (React Email)

- Templates in `src/lib/email/templates/`
- Reusable components: Header, Footer, OrderLineItem
- Sent via Resend/Nodemailer from webhook handler

## PAL Tools

- `/pal:apilookup` for Stripe/Supabase API reference
- `/pal:thinkdeep` for complex transactional logic
- `/pal:challenge` for edge case stress testing
