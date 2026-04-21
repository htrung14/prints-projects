# Backend Build Plan — 2026-04-16

Source of truth for the backend build. Each subagent reads this first, then
reads `docs/system-design.md` for architectural context, then reads the
relevant Next 16 docs under `node_modules/next/dist/docs/01-app/` before
writing code.

## Locked decisions (from Hai + Notion Decisions Poll, 2026-04-16)

| Topic              | Value                                                                                                                            |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| Release strategy   | All 25 photos at once, 4-week run                                                                                                |
| Pricing            | Flat per photo, $140 base + size multipliers (1× / 1.45× / 2.4× / 3.8×)                                                          |
| Papers             | **2 flat** — Hahnemühle Photo Rag Baryta + Canson Baryta Photographique. No surcharge. Drop "bamboo".                            |
| Fulfillment        | **Rob at Brooklyn Archival drop-ships direct to customer** in Thalia-branded packaging. No studio pickup/inspection/reship step. |
| Business structure | Sole prop on SSN for launch, migrate to LLC after 10–20 sales                                                                    |
| Newsletter         | Buttondown (not implemented in this build — external to shop)                                                                    |
| Sales tax          | Stripe Tax ON                                                                                                                    |
| CMS                | Skip Sanity for v1. Seed `photos` table from `src/data/photos.fixture.json`                                                      |
| Auth               | Magic-link (Supabase) for `/admin` only; allowlist via `ADMIN_EMAILS` env                                                        |
| Customer accounts  | None (guest checkout only)                                                                                                       |
| Editions           | 10 per photo, pooled across size+paper (per design doc §1a / §6)                                                                 |

## Stack

- Next.js 16.2.3, App Router, React 19.2.4, TS strict, Tailwind v4
- Supabase (Postgres + Auth + Storage for preview thumbs)
- Stripe Checkout (hosted) + Stripe Tax
- Resend (transactional) with React Email templates
- Cloudflare R2 (master print files, no egress fees)
- PDF: `@react-pdf/renderer` for COAs
- Validation: `zod`

## File ownership map

Each subagent owns only the paths listed. **Do not touch files outside your
slice** except to read. If you think you need to edit something outside your
slice, stop and report back — do not edit.

### Track A — Supabase (schema + seed + RLS + storage buckets)

Owns:

- `supabase/migrations/*.sql`
- `supabase/seed.sql` (or `scripts/seed.ts`)
- `supabase/config.toml` if needed for local dev
- `src/lib/supabase/queries/*.ts` (typed query helpers)

Do not touch: anything under `src/app/`, `src/components/`, `src/lib/stripe`,
`src/lib/email`, `src/lib/coa`, `src/lib/dispatch`, `src/lib/auth`.

### Track B — Stripe + checkout + thank-you

Owns:

- `src/lib/stripe/*.ts`
- `src/app/api/checkout/route.ts`
- `src/app/api/webhooks/stripe/route.ts`
- `src/app/checkout/page.tsx` (replaces current stub)
- `src/app/thank-you/page.tsx` (new)

May read: `src/lib/supabase/server.ts`, `src/lib/supabase/queries/*`,
`src/lib/cart.tsx` (client-side cart), `src/lib/types.ts`.

Do not touch: `src/lib/email`, `src/lib/dispatch`, `src/app/admin`, `src/app/dispatch`.

### Track C — Emails + COA PDF

Owns:

- `src/lib/email/*.ts`
- `src/lib/email/templates/*.tsx`
- `src/lib/coa/*.ts` and `src/lib/coa/*.tsx`
- `src/app/api/coa/[orderId]/route.ts` (server-signed COA download)
- `src/app/api/email/retry/[orderId]/route.ts` (admin-gated resend)

Must export a stable interface consumed by Tracks B (sendOrderConfirmation,
sendPrintJobEmail) and E (retryEmail) — see "Interfaces between tracks"
below.

Do not touch: `src/app/admin`, `src/app/dispatch`, `src/lib/stripe`, schema.

### Track D — Dispatch (Rob's magic link)

Owns:

- `src/lib/dispatch/*.ts` (HMAC token issue + verify)
- `src/lib/r2/*.ts` (S3-compatible client for Cloudflare R2)
- `src/app/dispatch/[orderId]/page.tsx`
- `src/app/dispatch/batch/page.tsx`
- `src/app/api/dispatch/[orderId]/status/route.ts`
- `src/app/api/dispatch/batch/route.ts`
- `src/app/api/dispatch/print-file/[orderItemId]/route.ts` (R2 signed URL)

Use `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`. R2 endpoint:
`https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`. Region: `auto`.
Signed URL TTL: 7 days (per design doc §1a).

Do not touch: `src/app/admin`, `src/lib/stripe`, `src/lib/email/templates/*`
(you use the dispatch-email sender from Track C via its interface).

### Track E — Admin panel

Owns:

- `src/app/admin/**/*.tsx`
- `src/app/admin/layout.tsx`
- `src/lib/auth/*.ts`
- `src/middleware.ts` (gates `/admin`)
- `src/app/api/admin/**` (admin-authed server actions or routes)

May call the interfaces exported by Tracks B/C/D (refund, resend email,
regenerate token, trigger dispatch). Do not reimplement their logic.

## Interfaces between tracks (stable contracts)

All listed types live in `src/lib/types.ts` unless noted.

### Track A exports

```ts
// src/lib/supabase/queries/photos.ts
export async function listPublishedPhotos(): Promise<Photo[]>;
export async function getPhotoBySlug(slug: string): Promise<Photo | null>;
export async function getPhotoById(id: string): Promise<Photo | null>;

// src/lib/supabase/queries/orders.ts
export async function insertOrderWithItems(args: {
  stripeSessionId: string;
  stripePaymentIntentId: string | null;
  customerEmail: string;
  customerName: string;
  shippingAddress: Address;
  subtotalCents: number;
  taxCents: number;
  shippingCents: number;
  totalCents: number;
  currency: string;
  items: Array<{
    photoId: string;
    sizeId: string;
    paperId: string;
    quantity: number;
    unitPriceCents: number;
  }>;
}): Promise<{ order: Order; items: OrderItem[] }>; // assigns editionNumber inside a transaction with row lock
export async function getOrderById(id: string): Promise<Order | null>;
export async function getOrderByToken(token: string): Promise<Order | null>;
export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
  meta?: Record<string, unknown>
): Promise<void>;
export async function listOrders(filter?: {
  status?: OrderStatus;
  limit?: number;
}): Promise<Order[]>;

// src/lib/supabase/queries/audit.ts
export async function audit(entry: Omit<AuditLogEntry, "id" | "createdAt">): Promise<void>;
```

### Track C exports

```ts
// src/lib/email/send.ts
export async function sendOrderConfirmation(order: Order, items: OrderItem[]): Promise<void>;
export async function sendPrintJobEmail(
  order: Order,
  items: OrderItem[],
  dispatchUrl: string
): Promise<void>; // to Rob; Track B builds the URL via buildDispatchUrl and passes it in
export async function sendShippedNotification(order: Order): Promise<void>; // on tracking submit
export async function schedulePostPurchaseSequence(order: Order): Promise<void>; // 7-touch
export async function sendPostPurchaseTouch(
  order: Order,
  touchNumber: 1 | 2 | 3 | 4 | 5 | 6 | 7
): Promise<void>; // called by a future cron; picks the right template variant

// src/lib/coa/generate.ts
export async function generateCoaPdf(order: Order, item: OrderItem): Promise<Buffer>;
```

### Track D exports

```ts
// src/lib/dispatch/token.ts
export function signDispatchToken(payload: DispatchTokenPayload): string;
export function verifyDispatchToken(token: string): DispatchTokenPayload | null;

// Dispatch URL builder:
export function buildDispatchUrl(
  orderId: string,
  opts?: { kind?: "single" | "batch"; ttlDays?: number }
): string;
```

Track B webhook calls, in order, after Stripe session completed:

1. `insertOrderWithItems(...)` (Track A) — assigns edition numbers atomically
2. `buildDispatchUrl(orderId)` (Track D) — to include in print-job email
3. `sendOrderConfirmation(order, items)` (Track C)
4. `sendPrintJobEmail(order, items)` (Track C) — body includes the dispatch URL
5. `schedulePostPurchaseSequence(order)` (Track C) — day 7/14/30/60 touches
6. `audit({ orderId, actor: "stripe_webhook", action: "paid", meta: {...} })` (Track A)

## Database schema (authoritative — Track A implements)

Postgres (Supabase). All `id` are uuid default `gen_random_uuid()`, all tables
have `created_at timestamptz default now()`.

### photos

- `id uuid pk`
- `slug text unique not null`
- `reference_number text not null`
- `title text not null`
- `title_italic text`
- `subtitle text`
- `year int not null`
- `description jsonb not null` (array of paragraph strings)
- `image_url text not null` (public preview in Supabase Storage or /public)
- `image_alt text not null`
- `base_price_cents int not null`
- `sizes jsonb not null` (array of `{id,label,multiplier}`)
- `papers jsonb not null` (array of `{id,name,surchargeCents}` — surcharge expected 0 post-launch)
- `edition_total int not null default 10`
- `edition_sold int not null default 0`
- `is_published bool not null default false`
- `sort_order int not null default 0`
- `print_file_key text` (R2 object key)

### orders

- `id uuid pk`
- `stripe_checkout_session_id text unique not null`
- `stripe_payment_intent_id text`
- `customer_email text not null`
- `customer_name text not null`
- `shipping_address jsonb not null`
- `subtotal_cents int not null`
- `tax_cents int not null default 0`
- `shipping_cents int not null default 0`
- `total_cents int not null`
- `currency text not null default 'usd'`
- `status text not null default 'paid'` check in enum
- `fulfillment_token text unique not null`
- `fulfillment_token_revoked_at timestamptz`
- `print_job_email_sent_at timestamptz`
- `tracking_number text`
- `carrier text`
- `notes text`

### order_items

- `id uuid pk`
- `order_id uuid fk orders(id) on delete cascade`
- `photo_id uuid fk photos(id)`
- `photo_slug text not null` (denormalized)
- `photo_title text not null`
- `size_id text not null`
- `size_label text not null`
- `paper_id text not null`
- `paper_name text not null`
- `quantity int not null default 1`
- `unit_price_cents int not null`
- `edition_number int not null`
- `edition_total int not null`
- `print_file_url_snapshot text`

### audit_log

- `id uuid pk`
- `order_id uuid fk orders(id)`
- `actor text not null`
- `action text not null`
- `meta jsonb not null default '{}'`

### Edition assignment (critical correctness)

The `insertOrderWithItems` RPC must run in a transaction that:

1. `SELECT ... FOR UPDATE` on each distinct `photo_id` in the order
2. For each row, verify `edition_sold + sum(quantity for that photo) <= edition_total`; if not, raise and rollback
3. Assign `edition_number` to each `order_items` row sequentially starting at `edition_sold + 1`
4. `UPDATE photos SET edition_sold = edition_sold + n` per photo

Implement as a Postgres function callable via `supabase.rpc('create_order_with_items', ...)`.

### RLS

- `photos`, `orders`, `order_items`, `audit_log`: deny-all by default.
- Service-role client bypasses RLS (used in webhook + admin server code).
- Public reads of published photos are done via service-role-backed server components (no public RLS grant needed since the app never calls Supabase from the browser for catalog reads in v1).
- Admin is authenticated via Supabase Auth (magic link); Track E gates routes via middleware + allowlist.

### Storage buckets

- `previews` (public): web thumbnails, published with catalog
- `prints` (private): not used in v1 (master files live in R2)

## Required reading (per subagent, before writing code)

Every subagent:

1. `AGENTS.md` — Next 16 has breaking changes.
2. `docs/system-design.md` Sections 1a, 6, 7, 8.
3. This file.
4. `node_modules/next/dist/docs/01-app/01-getting-started/` skim.
5. Track-specific:
   - **Track A:** Supabase docs — run `npx supabase --help` (if installed) or treat migrations as plain `.sql`.
   - **Track B:** `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route.md`, Stripe docs: Checkout Sessions + Webhooks + Tax. The webhook MUST verify the signature using the raw body — in App Router use `await req.text()` and `stripe.webhooks.constructEvent`.
   - **Track C:** Resend Node SDK, `@react-email/components` quickstart, `@react-pdf/renderer` quickstart.
   - **Track D:** Node `crypto.createHmac` for token signing. Constant-time compare.
   - **Track E:** `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/draft-mode.md` (not used), `middleware.md`, `@supabase/ssr` quickstart.

## Verification before reporting done

Each subagent runs these and includes the output in their report:

```sh
corepack pnpm typecheck
corepack pnpm lint
corepack pnpm build    # only if you added routes; slow but catches build-time errors
```

If any fail: **do not report success**. Fix, re-run, then report.

## What is explicitly out of scope for this build

- Buttondown integration (external newsletter)
- Sanity CMS (deferred — using JSON fixture → Supabase seed)
- Next/image migration (TODO when real photos land in /public/images/)
- Inventory for non-edition products (everything is 10-edition)
- Multi-currency (Stripe Adaptive Pricing auto; no UI)
- Customer accounts, order history page
- Discount codes (Stripe handles later)
- Framing (dropped in design doc)
- Physical studio pickup (drop-ship model only)

## Post-build checklist (coordinator, not subagents)

- [ ] Wire env values for dev
- [ ] Run migrations against a staging Supabase project
- [ ] Smoke test checkout in Stripe test mode
- [ ] Verify webhook signature verification with `stripe listen`
- [ ] Visual check of COA PDF
- [ ] Email preview with real order payload
- [ ] Dispatch link round-trip test
- [ ] Admin magic-link sign-in
