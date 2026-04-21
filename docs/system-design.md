# Photo Print Shop, System Design v0.1

A planning doc for a photography sales site that takes orders, stores customer and order data, and hands jobs to an outsourced print shop. Built before any code, intended to be reviewed and edited.

Date: 2026-04-13
Status: Draft, several open questions flagged for stakeholder

---

## 1. Open questions to resolve before build

All architecture-blocking questions have been answered. Remaining items are non-blocking and either need external input (print shop) or stakeholder review (brand, copy, pricing).

**Blocked on outside info:**
- **Print shop lead time.** Get the printing turnaround quote (typically 3 to 7 business days for a NYC pigment printer). Customers need to see lead time before checkout. Note: print shop now ships to studio, not customer, so their carrier and customs handling no longer matter.

**Blocked on stakeholder content:**
- Brand identity (name, logo, copy tone)
- Pricing tiers (size and paper price ladder)
- Legal pages (privacy, terms, returns policy, draft from a generator and review)

## 1a. Decisions log

Things we've already settled, kept here so we don't relitigate.

- **2026-04-13, Tax handling.** Skip Stripe Tax for v1. Either include tax in the listed price or hard-code a single home-state rate at checkout. Revisit if we start shipping to many states or internationally. Reason: 0.5 percent per transaction not worth the cost at launch volume.
- **2026-04-13, Stack.** Next.js on Vercel, Supabase for Postgres + storage, Stripe Checkout (hosted), Resend for email.
- **2026-04-13, Print fulfillment intake.** Token-gated fulfillment page per order. The job email to the print shop contains one link like `https://yourdomain.com/fulfillment/[order-id]?token=xxx`. The page validates the token, renders order details (paper, size, frame, edition number, internal notes), and exposes a "Download print file" button that generates a signed Supabase Storage URL on demand. Print shop never receives the direct file URL by email, so leaked email threads can't expose the master file. The same page hosts status update controls (mark printed, attach tracking number, leave notes), removing the email back-and-forth. Token is a long random string stored on the order row; revocable from admin if needed.
- **2026-04-13, Print file storage.** Print-ready masters live in a private Supabase Storage bucket (`prints/`). One folder per photo, e.g. `prints/{photo_id}/master.tif`. Signed URLs are generated only when the print shop clicks "Download" on the fulfillment page, with a 7 day expiry to cover their printing window. Catalog thumbnails live in a separate public bucket (`previews/`) so they get CDN-cached and don't pay egress per page view.
- **2026-04-13, Supabase hosting.** Hosted Supabase (supabase.com), not self-hosted. Reason: solo operator, no infrastructure team, free tier is sufficient for orders/metadata, and Pro is $25/mo if outgrown. Self-hosting only makes sense for compliance or data-residency requirements that don't apply here. Region pick: US East (closest to Vercel default) unless stakeholder needs otherwise. **Large print files offloaded to Cloudflare R2** instead of Supabase Storage to avoid egress fees: R2 has zero egress charges, 10 GB free, then $0.015/GB/month. Supabase Storage retains the small `previews/` bucket for thumbnails. Schema stores the R2 object key on `photos.print_file_key`; the fulfillment page generates R2 presigned URLs the same way it would Supabase signed URLs.
- **2026-04-13, Order fulfillment model.** Studio handles all shipping. **Studio picks up finished prints from the print shop in person** (no inbound shipping leg). Studio then inspects, packs, and ships to the customer worldwide. Adds two order states (`ready_for_pickup`, `picked_up_from_printer`, `shipped_to_customer`) and removes the customs/CN22 burden from the print shop. Implications: studio must be reasonably local to the print shop. **Studio is in Brooklyn, NY**, so pickup is practical from any NYC pigment print lab (Brooklyn Editions in Gowanus, Brooklyn Archival in Greenpoint, SugarHill Works in Harlem). Saves inbound shipping cost and a transit day; the fulfillment page status "Mark printed, ready for pickup" replaces "Mark printed and shipped to studio"; no studio-bound tracking field needed; studio can batch pickups (e.g. Tuesdays and Fridays) to reduce trips, which sets the customer-facing dispatch window. If the studio ever moves out of the metro, switch back to drop-shipping by adding tracking fields and reverting the status enum.
- **2026-04-13, Visual reference.** Cargo template at https://468414.cargo.site/. ABC Diatype Variable weight 900 across the site, white background, rgba(0,0,0,0.6) text, 3-column photo grid, detail panel with metadata + description + buy UI.
- **2026-04-13, Customer accounts.** Guest checkout only. No login, no account creation, no order history page. Customers get an order confirmation email with a unique link if they want to view status. Reason: simpler schema, no auth surface area, fits the boutique site feel. Revisit if customers start asking for it.
- **2026-04-13, Admin users and roles.** Two roles in the admin app:
  - **admin**: full access. Manages users, role assignments, billing/payouts settings, refunds, deleting orders or photos, anything destructive or money-related.
  - **editor**: catalog access. Can create, edit, publish/unpublish photos and variants. Can view orders and update fulfillment status (mark sent to print, mark shipped, add tracking). Cannot manage users, cannot issue refunds, cannot delete.
  - Roles are assignable and changeable by an admin at any time. Implemented via a `users` table with a `role` enum column and Supabase Row Level Security policies that gate by role. Magic link auth via Supabase, no passwords.
- **2026-04-13, Cart vs single buy.** Both, depending on the photo. A `purchase_mode` enum on each photo: `cart` (default, adds to multi-item cart) or `buy_now` (skips the cart, goes straight to Stripe Checkout). Limited editions and special pieces use `buy_now` so two customers don't both add the last edition to their carts and race. Standard prints use `cart`.
- **2026-04-13, Variants.** Photos have size and paper type. **No frames.** Decided 2026-04-13 to drop framing entirely, simplifying the catalog and cutting a fulfillment step (no frame sourcing, no glass packaging, no oversized shipping). Schema keeps a nullable `frame` column in `variants` for future flexibility but the buy UI does not expose it. Each unique combination of (size, paper) is one row in the `variants` table with its own price and `stripe_price_id`. Specific size and paper options to be confirmed with stakeholder when catalog is built.
- **2026-04-13, Editions.** **Every photo is a limited edition of 10 prints total, pooled across all size and paper variants.** No open editions, no exceptions in v1. The 10-print cap is per-photo, not per-variant: an 8x10 matte sale and a 16x20 fine art sale of the same photo both decrement the same pool of 10. Schema puts `edition_total` on `photos` (default 10, nullable for future flexibility), not on `variants`. The buy UI displays "Edition X of 10" on every product and shows a single "prints remaining" count that reflects the pooled state, not a per-variant count. Once 10 prints of a given photo are sold (any combination of sizes/papers), the photo is marked sold out and the buy UI shows the edition-closed state. Edition number assignment uses a row-level lock on the `photos` row at webhook time (SELECT FOR UPDATE), since the pool is at the photo level, not the variant level. Each `order_items` row still carries its own `edition_number` (1 through 10) assigned sequentially as orders complete, regardless of which variant was bought.
- **2026-04-13, Catalog size.** Expecting 100+ photos. Use a real CMS instead of a custom admin form. Recommend Sanity (free for solo, generous limits) or Payload CMS (open source, self-hosted in the same Vercel project). Catalog data lives in the CMS; orders still live in Supabase.
- **2026-04-13, Returns and refunds.** Damage and defect only. Customer-facing language: "Each print is made to order. We replace prints damaged in transit or with production defects within 14 days of delivery; otherwise, all sales are final." Refunds processed via Stripe dashboard, not automated for v1.
- **2026-04-13, CMS.** Sanity. Reason: stakeholders are non-technical, Sanity Studio has the most polished editor UI of the options (drag-and-drop image, real-time preview, simple field editing). Free tier covers a solo shop. Catalog data lives in Sanity, orders live in Supabase, the Next.js app pulls from both.
- **2026-04-13, Email.** Resend. Reason: 3,000 emails/month on the free tier covers the shop indefinitely at expected volume. React Email templates make order confirmation and print job emails quick to write. Easy Next.js integration.
- **2026-04-13, Currency.** Multi-currency display via Stripe Adaptive Pricing. Prices set in USD, Stripe automatically shows the customer's local currency at checkout based on their location and converts on settle. Money settles to the merchant in USD. Zero extra config.
- **2026-04-13, Analytics and error tracking.** Vercel Analytics (free tier, basic page views and core web vitals, integrated with the host) + Sentry (free developer tier, error and performance monitoring). Both zero cost at expected volume. Stakeholder can confirm or override.
- **2026-04-13, Image protection.** Web previews use limited resolution (1500 px on long edge, sRGB, no embedded high-res). Optional subtle bottom-right watermark. No JavaScript-based right-click blocking or devtools blocking; both are trivially bypassed and frustrate legitimate users (accessibility tools, screen readers). High-resolution print files live in a private Supabase Storage bucket and are only fetched server-side via signed URLs that expire.
- **2026-04-13, Brand identity.** TBD. Will revisit before launch. Affects domain mapping, logo, copy tone, social handles.
- **2026-04-13, Pricing tiers.** TBD. Stakeholder needs to provide a price ladder by size (e.g. small/medium/large) and paper modifier. No frame add-on (frames dropped).
- **2026-04-13, Legal and policy pages.** Reference: Loose Joints (loosejoints.biz) shipping and terms pages. Need to draft, in the same matter-of-fact tone:
  - **Shipping and Delivery.** Production lead time, processing window, dispatch confirmation email, tracked vs untracked, free shipping thresholds (TBD), worldwide statement, customs disclaimer (DDU), shipping issue reporting window (suggest 7 business days).
  - **Refund and Returns Policy.** Damage and defect only within 14 days of delivery (already decided). Return shipping address, condition requirements, refund timing.
  - **Terms of Sale (T&Cs).** Definitions, scope, price/payment in USD, delivery, customs, cancellations, intellectual property, force majeure, warranty/liability cap, severance, governing law and jurisdiction.
  - **Privacy Policy.** What data is collected (name, address, email, payment via Stripe), how it's used, third parties (Stripe, Resend, Supabase, Vercel, Sanity), retention, data subject rights, contact for requests.
  - **Legal Notice / Imprint.** Studio legal name, registered address, company number if incorporated, contact email. Required in EU jurisdictions to ship there legitimately.
  - All pages live as Sanity documents so non-developer can edit. Footer link group: Shipping · Returns · Terms · Privacy · Imprint · Contact.
  - Drafting blocked on: studio legal name and address, country of incorporation (decides jurisdiction clause), support/sales email, free shipping thresholds (if any), production lead time from print shop.
- **2026-04-13, Shipping zones.** Worldwide, shipped from studio. Five fulfillment options in the rate table:
  - **Local pickup (Brooklyn, NY only):** $0. Customer picks up from the studio in Brooklyn during a scheduled window after order is ready. Customer-facing copy must explicitly say "Brooklyn, NY pickup only" and never just "NYC pickup" or "local pickup," because the studio is not in Manhattan, Queens, the Bronx, Staten Island, or Long Island and we don't want a customer driving in from Astoria expecting to grab it on the way home and then finding out they have to come to Brooklyn. Pickup address shown only after order is paid (in confirmation email + on the order status page), not on the product page. Pickup window communicated by email when the order is ready (e.g. "Your order is ready, please pick up Tues to Fri 11 to 5 at [address]"). No tracking number, no carrier. Implementation: a special `shipping_rate_id` (`local_pickup_brooklyn`) with $0 cost, surfaced as a checkbox or radio at the shipping step, gated to require the customer to acknowledge "I will pick up in Brooklyn, NY" before it can be selected.
  - **Domestic (US):** flat rate per print size class. USPS Ground Advantage or Priority Mail. Insurance via carrier. **Free shipping when cart contains 2 or more prints (any sizes), US addresses only.**
  - **Canada and Mexico:** flat rate per size class, higher than domestic. USPS International or UPS. Customer pays import duties/taxes on delivery (DDU model). No free shipping tier; charge full rate.
  - **Europe and UK:** flat rate per size class. USPS Priority Mail International or DHL. DDU model. Customer-facing copy notes possible VAT/duties on arrival.
  - **Rest of world:** flat rate per size class, highest tier. USPS or DHL. DDU model.
  - All international orders use HS code 4911.91 (printed pictures, designs, photographs) on the customs declaration. Studio fills these out at shipping time, no print-shop involvement needed.
  - Customer-facing copy at checkout: "International customers: your country may collect VAT, GST, or import duties on delivery. We do not collect these fees at checkout."
  - Implementation: a `shipping_zones` table mapping country to zone, and a `shipping_rates` table with (zone, size_class, price). Free-shipping rule applied at checkout-session creation: if `cart.country == 'US'` and `sum(line_items.quantity) >= 2`, set shipping_rate_id to the $0 rate. Stripe Checkout's `shipping_address_collection.allowed_countries` set to all supported countries; expand or restrict per stakeholder preference.
  - Revisit if a region drives enough volume to justify local VAT registration (e.g. UK and EU IOSS thresholds).

---

## 2. Functional requirements

- Browse a catalog of photographs with detail pages
- Buy a print (variant selection if applicable)
- Pay with Stripe
- Receive an order confirmation email
- Order data is captured and queryable
- A print job request is sent to the outsourced print shop with the file and order details
- Order status can be tracked and updated (pending, sent to print, printed, shipped)
- Customer receives shipping notification

## 3. Non-functional assumptions

These are guesses, correct as needed.

- Traffic: low, under 1k visits per day at launch
- Orders: under 50 per week at launch
- Photo catalog: under 200 items
- Print-ready file size: 50 to 500 MB per file (high-res TIFF or JPEG)
- Latency: not critical, this is a boutique site not a marketplace
- Uptime: 99 percent is fine, no on-call

These numbers fit comfortably inside free or near-free tiers across the stack.

---

## 4. High-level architecture

```
                    Customer browser
                          |
                          v
              +------------------------+
              |  Next.js app (Vercel)  |
              |  - Catalog pages       |
              |  - Photo detail pages  |
              |  - Checkout init       |
              |  - Admin pages         |
              +-----------+------------+
                          |
            +-------------+--------------+
            |                            |
            v                            v
   +------------------+        +-----------------------+
   | Stripe Checkout  |        | Supabase              |
   | (hosted page)    |        | - Postgres (orders)   |
   +--------+---------+        | - Storage (photos +   |
            |                  |   print files)        |
            | webhook          | - Auth (admin only)   |
            v                  +-----------+-----------+
   +-------------------+                   ^
   | Next.js API route |  reads/writes     |
   | /api/stripe-hook  +-------------------+
   +--------+----------+
            |
            +-----> Email service (Resend or Postmark)
            |       - Customer confirmation
            |       - Print shop job email with file link
            |
            +-----> Optional: post to Slack channel
                    for order monitoring
```

## 5. Stack choices and why

| Layer | Choice | Reason |
|---|---|---|
| Frontend framework | Next.js 14+ (App Router) | Largest ecosystem, official Stripe examples, deploys to Vercel in one click |
| Hosting | Vercel | Free hobby tier covers this scale, custom domain support, built-in analytics, edge functions for webhooks |
| Database | Supabase (Postgres) | Free tier, has Stripe sync engine, file storage included, good DX |
| File storage | Supabase Storage | Same vendor as DB, signed URLs for print shop, no separate S3 bill |
| Payments | Stripe Checkout (hosted) | Already have Stripe, hosted page is PCI-light, fastest to ship |
| Email | Resend | Cheap, React Email templates, easy from Next.js |
| Auth (admin) | Supabase Auth, magic link | One admin user to start, no password reset hassle |
| CMS for catalog | Supabase tables + small admin UI | If catalog grows past ~50 items or non-technical edits needed, swap to Sanity |

Trade-offs to revisit:
- If you outgrow Supabase free tier, Neon plus Cloudflare R2 is cheaper but more glue code.
- If catalog editing becomes painful, move catalog to Sanity (free tier covers small shops) and keep Supabase for orders.

---

## 6. Data model (v0)

Postgres tables. `id` is uuid, `created_at` is timestamptz default now() everywhere. Variants modeled as a separate table so we can add them later without migration pain.

### `photos`
- id
- slug (unique, used in URL)
- title
- description
- year
- location (optional)
- hero_image_url (web preview, hosted in Supabase Storage)
- print_file_url (high-res for printing, private bucket)
- is_published (bool)
- sort_order (int)
- edition_total (int, default 10, nullable for future flexibility)
- edition_sold (int, default 0, incremented atomically at webhook time)

### `variants` (one row per buyable SKU)
- id
- photo_id (fk)
- name (e.g. "8x10 matte")
- size (e.g. "8x10")
- paper_type (e.g. "matte", "fine art")
- frame (nullable)
- price_cents
- stripe_price_id (so we don't recreate prices)
- inventory_remaining (nullable, null means unlimited)

Note: `edition_total` lives on `photos`, not on `variants`, because the 10-print cap is pooled across all variants of a photo. A variant is just a price/format choice for the same edition pool.

### `orders`
- id
- stripe_checkout_session_id (unique)
- stripe_payment_intent_id
- customer_email
- customer_name
- shipping_address (jsonb)
- subtotal_cents
- tax_cents
- shipping_cents
- total_cents
- currency
- status (enum: 'paid', 'sent_to_print', 'printed', 'ready_for_pickup', 'picked_up_from_printer', 'shipped_to_customer', 'delivered', 'refunded', 'cancelled')
- fulfillment_token (text, unique, used in print-shop link)
- fulfillment_token_revoked_at (timestamptz, nullable)
- print_job_email_sent_at
- tracking_number (nullable)
- carrier (nullable)
- notes (text, internal)

### `order_items`
- id
- order_id (fk)
- variant_id (fk)
- photo_id (fk, denormalized for safety if variant deleted)
- quantity
- unit_price_cents
- edition_number (nullable, assigned at order time for limited editions)
- print_file_signed_url_snapshot (the URL the print shop got, kept for audit)

### `audit_log`
- id
- order_id (fk, nullable)
- actor (email or 'system')
- action (text)
- meta (jsonb)

Why a denormalized `photo_id` on `order_items`: if you ever delete or re-edit a variant, the order history still shows what was sold.

---

## 7. Order flow (the critical path)

```
1. Customer lands on /photos/[slug]
2. Picks a variant (if any), clicks Buy
3. Frontend calls POST /api/checkout
   - server creates a Stripe Checkout Session with line items,
     metadata { variant_id, photo_id }, and tax + shipping configured
   - returns the session URL
4. Browser redirects to Stripe Checkout (hosted)
5. Customer pays
6. Stripe redirects back to /thank-you?session_id=...
   - this page shows a soft success message
   - it does NOT trust the redirect alone
7. Stripe sends checkout.session.completed webhook to /api/webhooks/stripe
   - verify signature
   - idempotency check (have we seen this session_id before?)
   - create order row, create order_items rows
   - for each order_item, lock the parent `photos` row (SELECT FOR UPDATE), read `edition_sold`, reject if `edition_sold + quantity > edition_total`, otherwise assign `edition_number` sequentially and increment `edition_sold` (pooled across all variants of the photo)
   - generate signed URL for each print file (expires in 30 days)
   - send customer confirmation email via Resend
   - send print-shop job email via Resend with file links and spec
   - update status to 'paid'
   - log to audit_log
8. Print shop fulfills, you mark order 'printed' then 'shipped' in admin
9. On 'shipped' transition, send shipping notification with tracking
```

### Webhook reliability rules
- Always return 200 fast. Do heavy work in a background queue if it grows. For now, inline is fine because volume is low.
- Idempotency by `stripe_checkout_session_id` unique constraint on `orders`.
- If sending email fails, mark `print_job_email_sent_at` null and surface a "needs resend" badge in admin. Do NOT fail the webhook.
- Stripe retries failed webhooks for up to 3 days.

### Failure modes to handle explicitly
- Email to print shop bounces: admin sees "not delivered" status, can resend.
- Print file URL expired before print shop downloaded: regenerate from admin.
- Customer paid but webhook never fires: nightly reconciliation job lists Stripe Checkout sessions and compares to `orders` table.
- Inventory race on limited editions: row-level lock on the `photos` row (not the variant) when assigning edition number, since the 10-print pool is per-photo.

---

## 8. Print shop hand-off, detailed

The print shop receives one email per order with a single link to a token-gated fulfillment page. They never receive the print file URL by email.

### The job email
- Subject: `[Order TB-2026-0418] New print job, ready to fulfill`
- Body: short, one paragraph, pointing them at the link
- One link: `https://yourdomain.com/fulfillment/TB-2026-0418?token={random_64_char}`
- Reply-to: a dedicated address that threads to the studio inbox
- No attachments, no direct file links

### The fulfillment page
When the print shop opens the link, the page validates the token against `orders.fulfillment_token` and renders:
- Order ID and date
- Each line item:
  - Photo title and reference number
  - Print size, paper, quantity
  - Edition number if applicable
  - Inline preview thumbnail (web-res, sanity check only)
  - "Download print file" button that calls a server route which generates a fresh signed URL (7 day expiry) and 302-redirects to it
- Ship-to address: **studio address** (not the customer). Not because the address is secret, but because it removes the temptation to ship direct and skip the studio inspection step.
- Internal notes field (e.g. "use mat board sample sent on 4/2")
- Status update controls:
  - Mark "sent to print" (auto-set when first opened)
  - Mark "printed, ready for studio pickup"
  - Optional pickup-ready notes (e.g. "ask for Maria at the front desk", "tube needs a label")
- Optional message field that posts back to the studio inbox

### Why this beats emailing files
- The master print file URL never lives in an email thread. If a forward leaks the email, the most an attacker gets is a download button that requires a valid token.
- Tokens are revocable from admin, in case a print shop relationship ends or an email is forwarded outside the trusted vendor.
- Status updates flow back through the same page, removing the need for a status email back-and-forth.
- The studio always has the latest state because the print shop is updating the same source of truth, not pasting tracking numbers into reply emails.

### Token security details
- 64 character URL-safe random string, generated server-side via crypto.randomBytes
- Stored on `orders.fulfillment_token`, indexed for lookup
- Never displayed in admin UI by default (only "regenerate" button)
- Expiry: indefinite by default, but admin can revoke. Optional auto-expire 90 days after order delivery
- Page rate-limits attempts per IP to slow brute force (token space is large enough that this is belt-and-suspenders)

---

## 9. Admin operations (small but real)

A simple `/admin` area, magic link auth via Supabase, with:
- Orders list with status filter
- Order detail page: line items, file links, customer info, status transitions, "resend print job email" button, "mark shipped" with tracking
- Photos list: add, edit, publish/unpublish, upload hero and print file, manage variants
- Audit log view per order

This is the smallest possible admin. Shopify-style polish is out of scope for v1.

---

## 10. Visual design notes from the Cargo reference

Captured live from https://468414.cargo.site/ (Thalia Bassim, At-Tamassok template).

### Page chrome
- Background: pure white (#ffffff). No gradients, no border treatment. Anything peachy in screenshots was a capture artifact.
- Text color everywhere: rgba(0, 0, 0, 0.6), a 60 percent opacity black. This is the warm dark grey look. Don't use solid #000.
- Header: fixed, full width, three groups laid out edge to edge.
  - Left: artist name, weight 900, ~22.7 px
  - Center: project mark in two scripts (Arabic title, then Latin transliteration), separated by a generous space, plus a sibling link like "Essay"
  - Right: utility nav, "Info", "Cart", "Contact" with a small "↗" arrow on external links
- Footer: minimal, "© 2026 Rights Reserved" in the same type at small size, bottom-left.

### Typography
- Single typeface across the whole site: **ABC Diatype Variable** by Dinamo. Weight 900 used everywhere from the header to captions. This unified weight is the look.
- Sizes are tight: header items, photo captions, and footer all sit around 22 to 24 px. The detail panel uses a slightly smaller body size for paragraphs.
- Italic is used selectively inside titles (e.g. one word italicized in a phrase) for emphasis.
- Letter spacing is default, no tracking adjustments.
- Line height: ~1.2 for headings, ~1.4 for body paragraphs.

Diatype is a paid commercial typeface. Free near-matches that get you 90 percent of the look:
- **Geist** (Vercel, free, MIT) - the closest free option, modern monospace + sans pair
- **Inter** with weight 900 (Google Fonts, free) - very common, slightly different g and a
- **Mona Sans** (GitHub, free, OFL) - bold geometric grotesque
- If you want exact, license Diatype web from Dinamo, prices vary by traffic

### Catalog page (home)
- Three column CSS grid of photos at desktop width.
- Each cell is one photograph, full width of its column, no internal padding or border.
- Most photos appear to be portrait orientation (taller than wide).
- Below each photo, a single small caption like "Test 001". Same Diatype font, same 60 percent black, no border or background. Generous whitespace between rows.
- Hover state appears to be subtle or none (no shadow, no scale). Click takes you to the detail panel.

### Detail panel (the buy page in your build)
This is where your purchasing UI lives. It opens as a full-page panel over the catalog with this structure:

```
+-----------------------------------------------------------------+
|  Project Reference                #007                Close ✕   |
+-----------------------------------------------------------------+
|                  |                       |                      |
|  Title           |  Description body     |  IMAGE / BUY         |
|  italicized word |  (paragraph 1)        |  (right column,      |
|  Medium info     |                       |   ~50% width)        |
|  Year, edition   |  (paragraph 2)        |                      |
|  reference no.   |                       |                      |
|                  |                       |                      |
+-----------------------------------------------------------------+
```

- Top bar inside the panel: section label left, item index ("#007") centered, "Close ✕" right
- Three column layout:
  - **Left column** (~16% of width): title with italic accent, medium description, year and reference number stacked vertically
  - **Middle column** (~30% of width): two paragraphs of body text (description, statement, provenance)
  - **Right column** (~50% of width): in the reference, this is a placeholder labeled "Cargo® Rectangular Placeholder Image". **In your build, this is the buy UI panel.** Replace the image placeholder with the variant picker, price, and call-to-action.

### Buy UI specification (what goes in the right column)

Match the visual restraint of the rest of the site. No drop shadows, no rounded buttons, no modals. Just stacked text and form controls in the same Diatype 60 percent black.

```
Photograph title
Edition of 10, 3 remaining                (pooled across all sizes and papers)

Size              [ 8x10 ▾ ]              (variant selector)
Paper             [ Matte ▾ ]
Subtotal          $180.00
Shipping          calculated at checkout
Lead time         3 to 4 weeks

[ Add to Cart ]                           (or "Buy Now" if single-item flow)

Print details
Archival pigment print on Hahnemühle Photo Rag
Signed and numbered verso
Made to order, final sale
```

- All text in Diatype Variable, weight 900 like the rest of the site
- Variant selectors styled as plain dropdowns or as click-to-cycle text (more on-brand for Cargo aesthetic)
- The "Add to Cart" button as plain text with a subtle underline or a thin 1px border, no fill color
- Match the same 60 percent black for everything

### Color palette
Almost monochrome:
- Background: #ffffff
- Text: rgba(0, 0, 0, 0.6)
- Accent / interactive: same color, distinguished by underline or italic
- No brand color is used. Photos provide all the color.

### Interactions and motion
- Click photo opens detail panel (likely a route change or full overlay)
- Cart, Info, Contact in header behave as standard links
- Minimal animation. Maybe a fade on panel open. No parallax, no scroll-jacking.

### Responsive behavior (inferred)
- 3 columns at >1100 px
- 2 columns mid range
- 1 column on mobile, header collapses to a single row (probably bumps to a hamburger or just stays inline since there are few items)
- Detail panel: 3 columns desktop, stacks vertically on mobile (image first, then title block, then description, then buy UI)

### Implementation notes for the build
- Use CSS grid not flexbox for the catalog. `grid-template-columns: repeat(3, 1fr)` with a gap.
- Use Next.js `<Image>` for all photos. The site would benefit from priority loading on the first row.
- Detail panel as a route (e.g. `/photos/[slug]`) so it's shareable and SEO-friendly. Cargo's overlay pattern is fine but a real route is better for ecommerce.
- Keep the typography token simple: one font, one weight, two sizes. That's it.
- Arabic text (if you want similar multi-script header) needs `dir="rtl"` on the Arabic span and a font that covers the script. Diatype Arabic is a separate license. Free fallback: Noto Naskh Arabic.

---

## 11. Build phases

**Phase 0, decisions and accounts (1 day)**
- Resolve the remaining open items in Section 1 (print shop lead time, brand, pricing, legal pages)
- Create accounts: Vercel, Supabase, Resend, point domain DNS at Vercel
- Confirm with print shop how they want jobs delivered

**Phase 1, catalog plus checkout (3 to 5 days)**
- Next.js project, Tailwind, basic layout from Cargo reference
- Supabase schema for photos and variants (skip orders table for now)
- Catalog grid and detail pages reading from Supabase
- Stripe Checkout Session creation
- Thank-you page

**Phase 2, orders and webhook (2 to 3 days)**
- Orders and order_items schema
- Stripe webhook handler with signature verification, idempotency
- Customer confirmation email
- Print shop job email
- Reconciliation script for missed webhooks

**Phase 3, admin (2 to 3 days)**
- Magic link auth
- Orders list and detail
- Photo and variant management
- Status transitions, resend buttons

**Phase 4, polish**
- Stripe Tax
- Shipping rates
- Limited editions if applicable
- Sentry for error tracking
- Plausible or Vercel Analytics
- Legal pages: terms, privacy, returns

Total: roughly two to three weeks of focused work, longer if you're juggling other things.

---

## 12. Costs at launch (rough monthly)

- Vercel hobby: $0
- Supabase free: $0 (covers small DB and a few GB of storage; print files might push over, then $25/mo Pro)
- Resend: free up to 3,000 emails/mo, then $20/mo
- Stripe: per transaction, no monthly fee
- Domain: you have it
- Sentry developer: $0

Realistic cold start: $0 to $25 per month.

---

## 13. What I'd revisit as the system grows

- If catalog passes 50 photos or someone non-technical edits it, move catalog to Sanity or Payload CMS.
- If order volume passes ~50/day, move email sending and print-job dispatch to a real queue (Inngest, Trigger.dev, or Supabase queues) so the webhook stays fast.
- If print files get huge (>500 MB), use Cloudflare R2 with public-by-token-URL instead of Supabase Storage.
- If you add international sales, add Stripe Tax and a shipping rate API (Shippo or EasyPost).
- If you add multiple admins with different permissions, add roles in Supabase RLS.

---

## 14. Things explicitly out of scope for v1

- Customer accounts and order history
- Wishlist and favorites
- Reviews
- Discount codes (Stripe handles these natively if needed later)
- Multi-currency
- Newsletter (use a separate tool like Buttondown)
- Print preview tool (mockup of how the print looks on a wall)

---

## Next step

Sit with the stakeholder and answer Section 1. Once those are settled, I'll fill in the schema and flows with concrete values and we can scaffold Phase 1.

---

## 15. 2026-04-15 / 16 session update

Design decisions locked, stakeholder-preview branch cut, backend design finalized. Details live in the plan file and MemPalace drawer; this section is the quick index.

### Design lockdown (on `main`)
- Pastel comment triage complete — all 23 resolved
- Accent color locked at `#1529DB`
- Footer = F2 layout, 80px gap (exposed as CSS var `--footer-gap` in `globals.css`)
- Product detail page = P3 layout: photo left 60%, buy panel right 40%, description below, no sticky
- CTAs use `.btn-ghost` class in variant B style
- Vercel Analytics installed and wired in `layout.tsx` (not yet active on the Vercel dashboard)
- 25 PL-6604 photos in `src/data/photos.fixture.json`, interleaved for visual variety

### Work on `stakeholder-preview` branch (not yet merged)
Kept on a separate branch because the preview deployment should be gate-able. To be merged to `main` after stakeholder review.
- Dispatch mock (`/dispatch-mock`), batch dispatch mock (`/dispatch-batch-mock`), COA mock (`/coa-mock`) — printer-facing flow
- `PreviewBanner` component on all mock pages
- Archival spec block added to `BuyUI` (paper, ink, lifespan, authenticity)
- Remaining "Brooklyn, NY" references stripped from photo descriptions, layout, terms, footer
- "Signed" language removed in favor of COA-based authentication
- `/preview` landing page with links to every mock
- NODE_ENV gates removed from lab/mock routes so they render on the preview deployment

### Backend design (locked)
Full architecture, schema, order flow, print-shop hand-off, and fulfillment token design live in the plan file:

- Plan: `/Users/haivotrung/.claude/plans/adaptive-hopping-snowglobe.md`
- MemPalace drawer: `mempalace search "prints-projects master state"`

### Stakeholder decision poll
Notion: https://www.notion.so/344d02ec20c080e79873eafdb2459a23
