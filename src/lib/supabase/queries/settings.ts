/**
 * Key-value settings read/write. Backed by the `settings` table.
 *
 * Used for runtime-configurable values the admin can edit without a
 * redeploy (e.g. the print shop email). Unlike env vars, changes take
 * effect immediately for the next webhook/batch call.
 */

import "server-only";
import { serverClient } from "@/lib/supabase/server";

export type SettingKey = "print_shop_email";

export async function getSetting(key: SettingKey): Promise<string | null> {
  const db = serverClient();
  const { data, error } = await db.from("settings").select("value").eq("key", key).maybeSingle();
  if (error) {
    console.error(`[settings] getSetting(${key}) failed: ${error.message}`);
    return null;
  }
  const raw = data?.value;
  if (raw === null || raw === undefined) return null;
  const trimmed = String(raw).trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function setSetting(
  key: SettingKey,
  value: string | null,
  actor: string
): Promise<void> {
  const db = serverClient();
  const normalized = value === null ? null : value.trim().length > 0 ? value.trim() : null;
  const { error } = await db.from("settings").upsert(
    {
      key,
      value: normalized,
      updated_by: actor,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" }
  );
  if (error) {
    throw new Error(`setSetting(${key}) failed: ${error.message}`);
  }
}

/**
 * Resolve the printer email. Prefers the DB setting so the owner can
 * change it from /admin/settings without a redeploy. Falls back to the
 * `PRINT_SHOP_EMAIL` env var for emergency / first-boot scenarios.
 *
 * Returns `null` when neither is configured — callers should degrade
 * gracefully (skip the send, log/alert instead of throwing).
 */
export async function getPrinterEmail(): Promise<string | null> {
  const dbValue = await getSetting("print_shop_email");
  if (dbValue) return dbValue;
  const envValue = process.env.PRINT_SHOP_EMAIL?.trim();
  return envValue && envValue.length > 0 ? envValue : null;
}
