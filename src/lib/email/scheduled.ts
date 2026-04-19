/**
 * Insert rows into `scheduled_emails` for the 7-touch post-purchase sequence.
 *
 * Touch cadence (day offsets from order creation, per the research report
 * referenced in backend-plan.md "Locked decisions"):
 *   1 - day  0  (confirmation follow-up)
 *   2 - day  3  (dispatch)       // approximate; Stripe webhook + lab lead
 *   3 - day 10  (delivery)       // typical arrival
 *   4 - day  7  (care note)
 *   5 - day 14  (referral)
 *   6 - day 30  (check-in)
 *   7 - day 60  (next drop)
 *
 * NB the numbering and ordering don't match exactly - touch 2 fires before
 * touch 4 in wall-clock terms. We keep the 1–7 identifier stable because the
 * template variant-switches on it; the cron sorts by `send_at`, not touch
 * number, so real order is preserved.
 *
 * Server-only. Uses the service-role Supabase client to bypass RLS.
 */

import "server-only";
import type { Order } from "@/lib/types";
import { serverClient } from "@/lib/supabase/server";
import type { PostPurchaseTouchNumber } from "./templates/PostPurchase";

type Schedule = { touch: PostPurchaseTouchNumber; offsetDays: number };

const TOUCH_SCHEDULE: Schedule[] = [
  { touch: 1, offsetDays: 0 },
  { touch: 2, offsetDays: 3 },
  { touch: 3, offsetDays: 10 },
  { touch: 4, offsetDays: 7 },
  { touch: 5, offsetDays: 14 },
  { touch: 6, offsetDays: 30 },
  { touch: 7, offsetDays: 60 },
];

function addDays(iso: string, days: number): Date {
  const base = new Date(iso);
  if (!Number.isFinite(base.getTime())) {
    // Fall back to now so we never generate NaN dates.
    const now = new Date();
    now.setUTCDate(now.getUTCDate() + days);
    return now;
  }
  base.setUTCDate(base.getUTCDate() + days);
  return base;
}

export async function schedulePostPurchaseInserts(order: Order): Promise<void> {
  const db = serverClient();
  const rows = TOUCH_SCHEDULE.map(({ touch, offsetDays }) => ({
    order_id: order.id,
    touch_number: touch,
    send_at: addDays(order.createdAt, offsetDays).toISOString(),
  }));

  const { error } = await db.from("scheduled_emails").insert(rows);
  if (error) {
    throw new Error(`schedulePostPurchaseInserts(${order.id}) failed: ${error.message}`);
  }
}
