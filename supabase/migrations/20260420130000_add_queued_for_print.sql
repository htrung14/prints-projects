BEGIN;

ALTER TABLE public.orders
  DROP CONSTRAINT orders_status_check;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_status_check
  CHECK (status IN (
    'paid',
    'queued_for_print',
    'sent_to_print',
    'printed',
    'shipped',
    'delivered',
    'refunded',
    'cancelled'
  ));

COMMIT;
