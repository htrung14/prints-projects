-- Adds `parent_order_id` to orders for the admin reprint/reship flow.
--
-- A reprint is modelled as a new `orders` row with status='paid' that
-- points back to the original via parent_order_id. Using a new row (not
-- a status column) means reprints flow through the normal batch-dispatch
-- pipeline exactly like a fresh order, and preserves the parent order's
-- payment + fulfillment history unmodified.
--
-- The column is nullable (most orders have no parent) and indexed only
-- where non-null — the expected population is sparse (damage + reship
-- cases only). See src/lib/supabase/queries/orders.ts#createReprintOrder.

BEGIN;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS parent_order_id uuid NULL
    REFERENCES public.orders(id);

CREATE INDEX IF NOT EXISTS orders_parent_order_id_idx
  ON public.orders (parent_order_id)
  WHERE parent_order_id IS NOT NULL;

COMMIT;
