/**
 * /admin/settings — runtime-editable configuration.
 *
 * Currently just the printer email (sent to Rob when a batch is dispatched).
 * Backed by the `settings` table in Supabase. Falls back to the
 * `PRINT_SHOP_EMAIL` env var when unset, but the UI reflects only what's in
 * the DB so admins can see exactly what the system will use.
 */

import { requireAdmin } from "@/lib/auth/session";
import { getSetting } from "@/lib/supabase/queries/settings";
import SettingsForm from "./SettingsForm";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  await requireAdmin("/admin/settings");
  const printerEmail = await getSetting("print_shop_email");
  const envFallback = process.env.PRINT_SHOP_EMAIL?.trim() || null;

  return (
    <section className="flex flex-col gap-6">
      <header className="flex items-baseline justify-between">
        <h1 className="h-display">Settings</h1>
      </header>

      <div className="flex flex-col gap-8 max-w-xl">
        <SettingsForm initialValue={printerEmail ?? ""} envFallback={envFallback} />
      </div>
    </section>
  );
}
