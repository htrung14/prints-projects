/**
 * /admin/settings — runtime-editable configuration.
 *
 * - Printer email (single string): where the weekly batch email goes.
 * - Admin emails (list): who can sign into /admin. Merged at runtime
 *   with the ADMIN_EMAILS env var so a wiped DB row can't lock everyone
 *   out. See `resolveAdminEmails()` in queries/settings.ts.
 *
 * Backed by the `settings` table in Supabase. Values here take effect
 * immediately without a redeploy.
 */

import { requireAdmin } from "@/lib/auth/session";
import { getAdminEmailsFromDb, getSetting } from "@/lib/supabase/queries/settings";
import { adminEmails as envAdminEmails } from "@/lib/auth/allowlist";
import SettingsForm from "./SettingsForm";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const session = await requireAdmin("/admin/settings");
  const [printerEmail, dbAdminEmails] = await Promise.all([
    getSetting("print_shop_email"),
    getAdminEmailsFromDb(),
  ]);
  const envFallback = process.env.PRINT_SHOP_EMAIL?.trim() || null;
  const envAdmins = envAdminEmails();

  return (
    <section className="flex flex-col gap-6">
      <header className="flex items-baseline justify-between">
        <h1 className="h-display">Settings</h1>
      </header>

      <div className="flex max-w-xl flex-col gap-12">
        <SettingsForm
          initialPrinterEmail={printerEmail ?? ""}
          printerEnvFallback={envFallback}
          initialAdminEmails={dbAdminEmails}
          envAdminEmails={envAdmins}
          currentSessionEmail={session.email}
        />
      </div>
    </section>
  );
}
