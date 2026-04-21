-- Track C: scheduled_emails table for the 7-touch post-purchase sequence.
--
-- `schedulePostPurchaseSequence` (src/lib/email/send.ts) inserts 7 rows per
-- order at webhook time. A future cron (out of scope for this build) picks
-- pending rows, calls sendPostPurchaseTouch, then marks `sent_at`.
--
-- Filed numerically after the Track A init migration (20260416120000_init.sql)
-- so references to `orders(id)` resolve.

create table if not exists scheduled_emails (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  touch_number int not null,
  send_at timestamptz not null,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists scheduled_emails_pending_idx
  on scheduled_emails (send_at)
  where sent_at is null;
