-- create_reprint_order RPC.
--
-- Atomic creation of a reprint `orders` row + its cloned `order_items` in a
-- single transaction. Previously the JS helper (src/lib/supabase/queries/
-- orders.ts#createReprintOrder) inserted the child order row then separately
-- inserted its items; a failure between the two steps left a childless
-- parent-linked order at status='paid' that would be swept into the next
-- batch and emailed to Loupe with zero line items.
--
-- Unlike create_order_with_items (the checkout-path RPC), this function
-- does NOT touch photos.edition_sold and does NOT assign new edition slots:
-- reprints reuse the parent's edition_number because they are a reprint of
-- the SAME edition. Payment fields (stripe_payment_intent_id, *_cents) are
-- hardcoded to NULL/0 because Loupe absorbs the cost for damage claims.
--
-- Parent lookup uses FOR SHARE — just enough to prevent the parent from
-- being deleted mid-transaction, without contending with an in-flight
-- checkout on the same row.
--
-- Parameters:
--   p_parent_order_id   — uuid of the original order
--   p_items             — jsonb array cloned from the parent's order_items
--                         (see createReprintOrder for the expected shape)
--   p_session_id        — synthetic session id (parent session + suffix);
--                         satisfies the orders_stripe_checkout_session_id
--                         unique constraint without colliding with the parent
--   p_fulfillment_token — fresh 64-char token for the child's dispatch link
--   p_notes             — free-text reason ("reprint: <reason>...")
--
-- Returns: uuid of the newly-inserted child order.

BEGIN;

CREATE OR REPLACE FUNCTION public.create_reprint_order(
  p_parent_order_id uuid,
  p_items jsonb,
  p_session_id text,
  p_fulfillment_token text,
  p_notes text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_parent       public.orders%ROWTYPE;
  v_new_order_id uuid;
  v_item         jsonb;
BEGIN
  IF p_items IS NULL
     OR jsonb_typeof(p_items) <> 'array'
     OR jsonb_array_length(p_items) = 0
  THEN
    RAISE EXCEPTION 'create_reprint_order: p_items must be a non-empty jsonb array'
      USING ERRCODE = 'P0001';
  END IF;

  -- FOR SHARE: block concurrent deletes of the parent without blocking
  -- other readers. The parent is not modified; we just need it to still
  -- exist when we INSERT the child (FK: orders.parent_order_id -> orders.id).
  SELECT * INTO v_parent
  FROM public.orders
  WHERE id = p_parent_order_id
  FOR SHARE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'create_reprint_order: parent order % not found', p_parent_order_id
      USING ERRCODE = 'P0002';
  END IF;

  -- Insert the child order row.
  INSERT INTO public.orders (
    parent_order_id,
    status,
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
    fulfillment_token,
    fulfillment_token_revoked_at,
    notes
  ) VALUES (
    p_parent_order_id,
    'paid',
    p_session_id,
    NULL,
    v_parent.customer_email,
    v_parent.customer_name,
    v_parent.shipping_address,
    0,
    0,
    0,
    0,
    v_parent.currency,
    p_fulfillment_token,
    NULL,
    p_notes
  )
  RETURNING id INTO v_new_order_id;

  -- Clone order_items. Edition numbers reuse the parent's values — this is
  -- a reprint of the same piece, not a new edition slot, so photos.
  -- edition_sold is intentionally NOT bumped.
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO public.order_items (
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
    ) VALUES (
      v_new_order_id,
      (v_item ->> 'photo_id')::uuid,
      v_item ->> 'photo_slug',
      v_item ->> 'photo_title',
      v_item ->> 'size_id',
      v_item ->> 'size_label',
      v_item ->> 'paper_id',
      v_item ->> 'paper_name',
      (v_item ->> 'quantity')::int,
      (v_item ->> 'unit_price_cents')::int,
      (v_item ->> 'edition_number')::int,
      (v_item ->> 'edition_total')::int,
      v_item ->> 'print_file_url_snapshot'
    );
  END LOOP;

  RETURN v_new_order_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_reprint_order(uuid, jsonb, text, text, text) FROM public;

COMMIT;
