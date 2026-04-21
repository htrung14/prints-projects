# At-Tamassok — Shipping + Admin + Reprint Overhaul (2026-04-21)

## What this session was about

Pre-launch hardening pass before broad promotion. Started with a consensus-driven punch list (consensus ran 2026-04-21 earlier: Gemini 2.5 Pro 9/10 + GPT-5.2 8/10, both "conditional go" pending shipping enforcement + copy reconciliation + admin edge cases). Ended with a 38-file changeset covering shipping model overhaul, admin operational UX, reprint flow, `/admin/alerts` feed, and a no-silent-failures sweep.

## What shipped (uncommitted at session end)

**Shipping — 4-tier regional model** (replaces binary US/INTL):

- US free · Canada $35 · UK+EU $50 (31 countries) · AU+ROW $65 (20 countries).
- `/checkout` has a 4-option destination picker; API validates destination; `allowed_countries` narrowed per tier at Stripe session creation.
- New `expectedShippingCentsFor(country)` exported from `src/lib/stripe/checkout.ts`. Webhook uses it as defense-in-depth — fires `alertSystemError` on under-payment. 8 new unit tests in `src/__tests__/unit/shipping-mismatch-guard.test.ts` cover all tiers + mismatch scenarios (with strict regex assertions, not substring — the earlier substring version false-passed against the static tier legend in the error message).

**Copy contradictions resolved** (3-persona buyer simulation surfaced these):

- `/terms` shipping section was "Domestic $20, Intl $45" — rewrote to match the 4-tier model.
- Damage window: `/terms` said "7 business days"; PostPurchase touch 3 said "fourteen days" — unified on 14 days everywhere.
- "2–3 weeks US / 3–5 weeks international" now explicitly labeled _total from order to delivery (production + shipping combined)_.
- Every "Rob at Brooklyn Archival" reference → "Michael at Loupe Digital" / "the printer" / "Loupe" (comments + user-facing strings across 12 files including `types.ts`, `webhook.ts`, `email/send.ts`, `dispatch/token.ts`, `r2/signed-url.ts`, `PrintJob.tsx`, `admin/settings/page.tsx`, etc.).
- COA line added to `OrderConfirmation.tsx` + `/terms` Authentication paragraph.
- PDP now shows "Hahnemühle Photo Rag 308 gsm · 100+ year archival lightfastness" below the edition meta.
- PDP Shipping accordion mentions 3% processing fee.
- `PrintBatch.tsx` dropped the factually-wrong "links expire in 7 days" footer (actual TTL is 30d and Loupe has all photo files locally — they don't rely on the links for the file).
- PostPurchase touch 1 rewrote as a studio note (was verbatim-duplicate of OrderConfirmation).

**Customer self-serve**:

- `/track` accepts email OR 8-hex order-ref. Privacy-safe collision handling: `getOrderByRefPrefix` fetches `.limit(2)` and returns `null` on ambiguous — avoids showing one stranger's order to another.
- Per-status ETA copy on `/track`.
- `/thank-you` name title-case with mixed-case preservation (`"McDonald"` stays `"McDonald"`; `"mr. j smith"` → `"Mr. J Smith"`).
- `/checkout` has a shipping-address self-check disclaimer.
- `REF_PATTERN` extracted to `src/lib/orderRef.ts` (single source of truth for the 8-hex validator).

**Admin operational UX**:

- `/admin` now a dashboard: status tiles (Paid, In print, Shipped, Delivered+Refunded last-30d), stuck-orders panel (sent_to_print > 7d), recent audit activity (10 rows), quick-link nav. Was previously a hard redirect to `/admin/orders`.
- `/admin/orders`: status filter tabs (with `aria-current`), GET-form search with Unicode-safe sanitization (blocks only `,()*\:` — PostgREST filter-grammar terminators — preserving apostrophes + non-ASCII letters for real customer names), date range with `from > to` validation, country flag column (inline 53-entry ISO→flag map).
- Admin order detail: resend-confirmation now echoes recipient (backend echoes `to` in response) + refreshes audit; **Reprint/reship flow** (see below).
- `/admin/settings`: "Send test email" button + `TestEmail.tsx` template.
- `/admin/alerts` new tab — surfaces `alert_system_error` audit rows with `?window=24h|7d|all` filter (default 7d); `alertSafely` now writes an audit row per call so the feed actually sees real incidents.

**Reprint/reship** (new):

- Migration `20260421120000_add_parent_order_id.sql` — adds nullable `parent_order_id uuid REFERENCES orders(id)` + partial index. Applied to live Supabase.
- Migration `20260421130000_add_create_reprint_order_rpc.sql` — atomic Postgres RPC that creates the child order + clones items in a single transaction. Parent order locked via `FOR SHARE`. Replaces earlier non-atomic `orders.insert` + `order_items.insert` + best-effort rollback (which would orphan a childless paid order on partial failure). Applied to live Supabase.
- `createReprintOrder(parentId, actor, reason)` in `src/lib/supabase/queries/orders.ts` now calls the RPC. Items cloned with the same `edition_number` (no slot re-assignment). Two audit writes: `reprint_created` on parent, `reprint_of` on child.
- API route `POST /api/admin/orders/[id]/reprint` with Zod-validated `{ reason }` (1–200 chars). 401/400/404/500/200. No Stripe involvement.
- Admin UI: "Create reprint" button on order detail with expand-in-place textarea + char counter; success toast names the new order ref + `router.refresh()` to re-fetch audit.
- Parent link + children list rendered on order detail when relationship exists.
- **Batch-side guardrail**: `src/lib/dispatch/batch.ts` filters zero-item orders out of the printer batch email + fires `alertSystemError`. Belt-and-suspenders against any orphan-order pathway.
- `PrintBatch.tsx` renders "REPRINT · <reason>" label (French Blue, all-caps, 11px) above the `Order {ref}` line whenever `order.parentOrderId` is set or `notes.startsWith("reprint:")`.

**Dispatch page security**:

- Email prefetch safe: GET renders the page only; POST form submit transitions status. Outlook SafeLinks / Gmail link scanning can no longer auto-advance `paid → sent_to_print` just by opening the batch email.
- `robots: noindex` on all `/dispatch/*` via `src/app/dispatch/layout.tsx`.
- Audit actor renamed from `printer:${orderId}` to flat `dispatch_mark_sent` (matches sibling convention; `orderId` already lives on the `order_id` FK).

**EDITION_EXCEEDED visibility**:

- Webhook now persists a `status=refunded` stub row via `insertRefundedStub` (tightened to reject shadowing a non-refunded existing row — prevents accidental stubbing over a real paid order that shares session_id on retry).
- `/thank-you` renders apology copy when `order.status === "refunded"` (a buyer who raced and lost sees the right message, not a success screen over a refunded order).
- Admin order detail zero-items fallback gated on `status === "refunded"`; neutral "No items" for other edge cases.
- Subtotal math corrected: `session.amount_subtotal ?? 0` directly (Stripe's `amount_subtotal` is already pre-tax + pre-shipping).

**Global no-silent-failures sweep**:

- Rule: `console.error` alone is forbidden in business paths; every catch routes through `alertSafely`/`alertSystemError` or rethrows.
- Applied to: `src/app/api/checkout/route.ts` (replaced `.catch(() => {})` on dispatcher send), `src/app/api/admin/batch-dispatch/route.ts` (replaced `.catch(console.error)`), `src/app/api/admin/settings/route.ts` (replaced `.catch((alertErr) => console.error(...))`), reprint route, test-email route, /admin/alerts page, admin dashboard page, batch-side guardrail, webhook's handleEditionExceeded.
- `alertSafely` now writes an `alert_system_error` audit row (belt for Sentry + email + Telegram + audit visibility in admin).

## Tests + typecheck

- **73/73 tests passing** (up from 62 at session start).
- `npx tsc --noEmit` clean.
- New test file: `src/__tests__/unit/shipping-mismatch-guard.test.ts` (8 tests, partial-mocks `alertSystemError` via `vi.importActual` + spread).

## Known deferred (user-approved)

- **COA source per-order** (Thalia-supplied paper vs Loupe prints on own stock) — user: "eh not a big deal at this scale."
- **Signature mode per-order** (print-in-border vs hand-sign-after) — user: "pending."

## Pre-deploy checklist (still owned by user)

1. Set `PRINT_SHOP_EMAIL` at `/admin/settings` to `Michael@loupedigital.com`.
2. Live-money E2E test: one real Stripe live-keys purchase (US destination) + one international. Verify confirmation email, order appears in `/admin/orders`, batch dispatch works, tracking page reflects status.
3. Explicit `git push` approval (durable "no push without explicit consent" rule).
4. Commit strategy: bundle the 38 files into a single focused commit ("feat: shipping-tiers, admin dashboard, reprint flow, no-silent-failures sweep") or split by bundle — user's call.

## Consensus artefacts

- Ship-readiness consensus (pre-reprint-fixes): Gemini 9/10 Conditional Go, GPT-5.2 8/10 Conditional Go. Both flagged the 2 reprint issues (invisible marker in PrintBatch, non-atomic creation) as fix-before-ship. Both now fixed.
- Self-critique consensus: Gemini + GPT-5.2 both called the 6/10 self-score generous. Real score ~4-5/10 salvaged by reviewers. Dominant pattern named two ways: "Plan your work before you work your plan" (Gemini) / "Premature closure — stop thinking like an adversary the moment code compiles" (GPT-5.2). Captured in `feedback_plan_then_verify.md` for future sessions.

## Lessons learned (this session, specific)

1. **Shipping enforcement went through two design iterations** because I didn't read the Stripe hosted-checkout docs before implementing the picker. First pass: rename labels + webhook guard (soft). Second pass: country picker + `allowed_countries` narrowing (hard). Third pass: 4-tier pricing. The 3-minute docs read would have collapsed this into one iteration.
2. **Non-atomic reprint** was a classic "insert row then insert related rows" Postgres anti-pattern. Only caught by external code review. The fix (Postgres RPC with `FOR SHARE` + jsonb item loop inside an auto-txn) should have been the first draft.
3. **Test assertions can false-pass on static legends** — the shipping-mismatch-guard tests used `.toContain("CA")` against a message that embedded `"CA=3500"` in every single mismatch alert, regardless of the actual country. Reviewer caught it. Fix: regex anchors like `/shipping country CA expects 3500¢/` that match the dynamic slice, not the static template.
4. **`.limit(1)` on prefix-match queries is a privacy leak** — for a 1-in-4B collision, a stranger's order could surface on `/track` for another stranger. Fix: `.limit(2)` + return `null` on ambiguous.
5. **Agent-generated code isn't audited for banned patterns automatically** — I approved several `.catch(console.error)` patterns from agents until the user reinforced the rule mid-session. Need a pre-done banned-pattern grep.
6. **PrintBatch email factually lied** — "links expire in 7 days" while actual TTL was 30d and Loupe has files locally anyway. Small copy bug but the kind of thing that costs operator trust.

## Files + tests on the merge line

All 38 files uncommitted, all listed via `git status`. 73/73 vitest. Final consolidated code review running at time of journal write — outcome pending.
