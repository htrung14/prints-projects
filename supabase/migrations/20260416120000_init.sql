-- Track A init migration. Mirrors docs-ai/backend-plan.md §"Database schema"
-- and docs/system-design.md §§6 and 7.
--
-- Conventions:
-- * `id` uuid default `gen_random_uuid()` on every table
-- * `created_at timestamptz not null default now()` on every table
-- * snake_case columns; JSON payloads use `jsonb`
-- * service-role client bypasses RLS; all four tables are deny-all public.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- photos
-- ---------------------------------------------------------------------------
create table if not exists public.photos (
    id                  uuid primary key default gen_random_uuid(),
    created_at          timestamptz not null default now(),
    slug                text not null,
    reference_number    text not null,
    title               text not null,
    title_italic        text,
    subtitle            text,
    year                int  not null,
    description         jsonb not null,
    image_url           text not null,
    image_alt           text not null,
    base_price_cents    int  not null check (base_price_cents >= 0),
    sizes               jsonb not null,
    papers              jsonb not null,
    edition_total       int  not null default 10 check (edition_total > 0),
    edition_sold        int  not null default 0  check (edition_sold  >= 0),
    is_published        boolean not null default false,
    sort_order          int  not null default 0,
    print_file_key      text,
    constraint photos_edition_sold_within_total check (edition_sold <= edition_total)
);

create unique index if not exists photos_slug_key on public.photos (slug);
create index if not exists photos_published_sort_idx
    on public.photos (is_published, sort_order);

-- ---------------------------------------------------------------------------
-- orders
-- ---------------------------------------------------------------------------
create table if not exists public.orders (
    id                              uuid primary key default gen_random_uuid(),
    created_at                      timestamptz not null default now(),
    stripe_checkout_session_id      text not null,
    stripe_payment_intent_id        text,
    customer_email                  text not null,
    customer_name                   text not null,
    shipping_address                jsonb not null,
    subtotal_cents                  int  not null check (subtotal_cents >= 0),
    tax_cents                       int  not null default 0 check (tax_cents >= 0),
    shipping_cents                  int  not null default 0 check (shipping_cents >= 0),
    total_cents                     int  not null check (total_cents >= 0),
    currency                        text not null default 'usd',
    status                          text not null default 'paid',
    fulfillment_token               text not null,
    fulfillment_token_revoked_at    timestamptz,
    print_job_email_sent_at         timestamptz,
    tracking_number                 text,
    carrier                         text,
    notes                           text,
    -- OrderStatus enum from src/lib/types.ts
    constraint orders_status_check check (
        status in (
            'paid',
            'sent_to_print',
            'printed',
            'shipped',
            'delivered',
            'refunded',
            'cancelled'
        )
    )
);

create unique index if not exists orders_stripe_checkout_session_id_key
    on public.orders (stripe_checkout_session_id);
create unique index if not exists orders_fulfillment_token_key
    on public.orders (fulfillment_token);

-- ---------------------------------------------------------------------------
-- order_items
-- ---------------------------------------------------------------------------
create table if not exists public.order_items (
    id                          uuid primary key default gen_random_uuid(),
    created_at                  timestamptz not null default now(),
    order_id                    uuid not null references public.orders(id) on delete cascade,
    -- photo_id is restrict to preserve order history if someone tries to
    -- delete a photo that's been sold. Match the denormalized snapshot fields
    -- below so audit survives even if restrict is later relaxed.
    photo_id                    uuid not null references public.photos(id) on delete restrict,
    photo_slug                  text not null,
    photo_title                 text not null,
    size_id                     text not null,
    size_label                  text not null,
    paper_id                    text not null,
    paper_name                  text not null,
    quantity                    int  not null default 1 check (quantity > 0),
    unit_price_cents            int  not null check (unit_price_cents >= 0),
    edition_number              int  not null check (edition_number >= 1),
    edition_total               int  not null check (edition_total > 0),
    print_file_url_snapshot     text,
    constraint order_items_edition_number_within_total
        check (edition_number <= edition_total)
);

create index if not exists order_items_order_id_idx
    on public.order_items (order_id);

-- ---------------------------------------------------------------------------
-- audit_log
-- ---------------------------------------------------------------------------
create table if not exists public.audit_log (
    id          uuid primary key default gen_random_uuid(),
    created_at  timestamptz not null default now(),
    -- on delete set null so deleting an order doesn't nuke the audit trail.
    order_id    uuid references public.orders(id) on delete set null,
    actor       text not null,
    action      text not null,
    meta        jsonb not null default '{}'::jsonb
);

create index if not exists audit_log_order_id_idx
    on public.audit_log (order_id);

-- ---------------------------------------------------------------------------
-- RLS — deny-all.
-- The app calls Supabase with the service-role key only (v1 has no browser
-- reads and no public anon grants). Enabling RLS without policies blocks
-- anon+authenticated; service-role bypasses RLS automatically.
-- ---------------------------------------------------------------------------
alter table public.photos       enable row level security;
alter table public.orders       enable row level security;
alter table public.order_items  enable row level security;
alter table public.audit_log    enable row level security;

comment on table public.photos is
    'Print catalog. v1 app reads via service-role server code only; no public/anon grants.';
comment on table public.orders is
    'Customer orders. v1 app reads/writes via service-role server code only.';
comment on table public.order_items is
    'Line items with denormalized photo/variant snapshot for audit survival.';
comment on table public.audit_log is
    'Append-only log of order-related actions (status changes, email sends, token events).';

-- ---------------------------------------------------------------------------
-- create_order_with_items
--
-- Edition-lock RPC. Single transaction:
--   1. SELECT ... FOR UPDATE on each distinct photo_id in the order
--   2. For each, verify edition_sold + sum(quantity) <= edition_total
--   3. Assign edition_number sequentially starting at edition_sold + 1
--   4. INSERT into orders
--   5. INSERT into order_items with the per-unit edition numbers
--   6. UPDATE photos SET edition_sold = edition_sold + sum(quantity)
--   7. Return { order, items } as JSON
--
-- Error codes raised (so the webhook can map to user-visible error states):
--   * EDITION_EXCEEDED  — a photo would go past edition_total
--   * PHOTO_NOT_FOUND   — a referenced photo_id does not exist
--   * BAD_PAYLOAD       — required field missing / wrong shape
-- ---------------------------------------------------------------------------
create or replace function public.create_order_with_items(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_order_id                    uuid;
    v_stripe_session_id           text;
    v_stripe_payment_intent_id    text;
    v_customer_email              text;
    v_customer_name               text;
    v_shipping_address            jsonb;
    v_subtotal_cents              int;
    v_tax_cents                   int;
    v_shipping_cents              int;
    v_total_cents                 int;
    v_currency                    text;
    v_status                      text;
    v_fulfillment_token           text;

    v_items                       jsonb;
    v_item                        jsonb;
    v_photo_id                    uuid;
    v_photo_rec                   public.photos%rowtype;

    v_quantity                    int;
    v_assigned_base               int;
    v_next_edition                int;
    v_unit_index                  int;

    v_new_order                   jsonb;
    v_inserted_items              jsonb;

    v_photo_totals                jsonb := '{}'::jsonb;
    v_photo_cursor                record;
begin
    -- --- unpack required fields --------------------------------------------
    v_stripe_session_id        := payload ->> 'stripeCheckoutSessionId';
    v_stripe_payment_intent_id := payload ->> 'stripePaymentIntentId';
    v_customer_email           := payload ->> 'customerEmail';
    v_customer_name            := payload ->> 'customerName';
    v_shipping_address         := payload -> 'shippingAddress';
    v_subtotal_cents           := (payload ->> 'subtotalCents')::int;
    v_tax_cents                := coalesce((payload ->> 'taxCents')::int, 0);
    v_shipping_cents           := coalesce((payload ->> 'shippingCents')::int, 0);
    v_total_cents              := (payload ->> 'totalCents')::int;
    v_currency                 := coalesce(payload ->> 'currency', 'usd');
    v_status                   := coalesce(payload ->> 'status', 'paid');
    v_fulfillment_token        := payload ->> 'fulfillmentToken';
    v_items                    := payload -> 'items';

    if v_stripe_session_id is null
       or v_customer_email is null
       or v_customer_name is null
       or v_shipping_address is null
       or v_subtotal_cents is null
       or v_total_cents is null
       or v_fulfillment_token is null
       or v_items is null
       or jsonb_typeof(v_items) <> 'array'
       or jsonb_array_length(v_items) = 0
    then
        raise exception 'BAD_PAYLOAD: required fields missing or items empty'
            using errcode = 'P0001';
    end if;

    -- --- compute per-photo totals (for lock + edition check) ---------------
    for v_photo_cursor in
        select
            (elem ->> 'photoId')::uuid as photo_id,
            sum((elem ->> 'quantity')::int) as qty
        from jsonb_array_elements(v_items) as elem
        group by (elem ->> 'photoId')::uuid
        order by (elem ->> 'photoId')::uuid   -- stable order avoids deadlock
    loop
        -- Lock the photos row first. This is the critical section per
        -- docs/system-design.md §7 (edition pool is per-photo).
        select * into v_photo_rec
        from public.photos
        where id = v_photo_cursor.photo_id
        for update;

        if not found then
            raise exception 'PHOTO_NOT_FOUND: %', v_photo_cursor.photo_id
                using errcode = 'P0002';
        end if;

        if v_photo_rec.edition_sold + v_photo_cursor.qty > v_photo_rec.edition_total then
            raise exception
                'EDITION_EXCEEDED: photo % has % of % sold, cannot add %',
                v_photo_rec.id,
                v_photo_rec.edition_sold,
                v_photo_rec.edition_total,
                v_photo_cursor.qty
                using errcode = 'P0003';
        end if;

        -- Remember: base = current edition_sold; assignments start at base+1.
        v_photo_totals := v_photo_totals || jsonb_build_object(
            v_photo_rec.id::text,
            jsonb_build_object(
                'base',         v_photo_rec.edition_sold,
                'total',        v_photo_rec.edition_total,
                'assigned',     0
            )
        );
    end loop;

    -- --- insert order -------------------------------------------------------
    insert into public.orders (
        stripe_checkout_session_id,
        stripe_payment_intent_id,
        customer_email,
        customer_name,
        shipping_address,
        subtotal_cents,
        tax_cents,
        shipping_cents,
        total_cents,
        currency,
        status,
        fulfillment_token
    ) values (
        v_stripe_session_id,
        v_stripe_payment_intent_id,
        v_customer_email,
        v_customer_name,
        v_shipping_address,
        v_subtotal_cents,
        v_tax_cents,
        v_shipping_cents,
        v_total_cents,
        v_currency,
        v_status,
        v_fulfillment_token
    )
    returning id into v_order_id;

    -- --- insert each item, expanding quantity>1 into sequential editions ---
    v_inserted_items := '[]'::jsonb;

    for v_item in select * from jsonb_array_elements(v_items)
    loop
        v_photo_id      := (v_item ->> 'photoId')::uuid;
        v_quantity      := (v_item ->> 'quantity')::int;
        v_assigned_base := ((v_photo_totals -> v_photo_id::text) ->> 'base')::int;
        v_next_edition  := v_assigned_base
                           + ((v_photo_totals -> v_photo_id::text) ->> 'assigned')::int
                           + 1;

        -- One order_items row represents the purchase row but may cover
        -- multiple units. Edition numbers are consecutive; we store the
        -- first edition number and the quantity so downstream consumers
        -- (COA generation, emails) can render all edition numbers in the run.
        -- Rationale: collapsing N units into N rows bloats the schema and the
        -- OrderItem shape in src/lib/types.ts carries a single editionNumber.
        -- Tracks B/C treat editionNumber as the first in a run of `quantity`.
        insert into public.order_items (
            order_id,
            photo_id,
            photo_slug,
            photo_title,
            size_id,
            size_label,
            paper_id,
            paper_name,
            quantity,
            unit_price_cents,
            edition_number,
            edition_total,
            print_file_url_snapshot
        )
        values (
            v_order_id,
            v_photo_id,
            v_item ->> 'photoSlug',
            v_item ->> 'photoTitle',
            v_item ->> 'sizeId',
            v_item ->> 'sizeLabel',
            v_item ->> 'paperId',
            v_item ->> 'paperName',
            v_quantity,
            (v_item ->> 'unitPriceCents')::int,
            v_next_edition,
            ((v_photo_totals -> v_photo_id::text) ->> 'total')::int,
            v_item ->> 'printFileUrlSnapshot'
        )
        returning to_jsonb(order_items.*) into v_item;

        v_inserted_items := v_inserted_items || jsonb_build_array(v_item);

        -- Bump assigned counter by quantity.
        v_photo_totals := jsonb_set(
            v_photo_totals,
            array[v_photo_id::text, 'assigned'],
            to_jsonb(
                ((v_photo_totals -> v_photo_id::text) ->> 'assigned')::int + v_quantity
            )
        );

        -- Sanity: ensure the running sum of assigned units did not exceed
        -- the per-photo check. The per-photo lock above already guarantees
        -- this, but belt-and-suspenders protects against caller bugs that
        -- split a photo across multiple items with a bad total.
        v_unit_index := ((v_photo_totals -> v_photo_id::text) ->> 'assigned')::int;
        if v_assigned_base + v_unit_index > ((v_photo_totals -> v_photo_id::text) ->> 'total')::int then
            raise exception
                'EDITION_EXCEEDED: photo % post-split check failed at %',
                v_photo_id, v_unit_index
                using errcode = 'P0003';
        end if;
    end loop;

    -- --- bump edition_sold per photo ---------------------------------------
    for v_photo_cursor in
        select key::uuid as photo_id, (value ->> 'assigned')::int as assigned
        from jsonb_each(v_photo_totals)
    loop
        update public.photos
           set edition_sold = edition_sold + v_photo_cursor.assigned
         where id = v_photo_cursor.photo_id;
    end loop;

    -- --- return the order and its items -------------------------------------
    select to_jsonb(orders.*) into v_new_order
    from public.orders
    where id = v_order_id;

    return jsonb_build_object(
        'order', v_new_order,
        'items', v_inserted_items
    );
end;
$$;

revoke all on function public.create_order_with_items(jsonb) from public;
-- Service role still has access via `grant` inherited from supabase defaults.
