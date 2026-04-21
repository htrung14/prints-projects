/**
 * /admin → /admin/orders.
 *
 * The admin entrypoint redirects to the orders list. The middleware has
 * already verified the caller is allowlisted, so we don't re-check here.
 */

import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function AdminIndex() {
  redirect("/admin/orders");
}
