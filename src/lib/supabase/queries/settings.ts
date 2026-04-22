/**
 * Key-value settings read/write. Backed by the `settings` table.
 *
 * Used for runtime-configurable values the admin can edit without a
 * redeploy (e.g. the print shop email). Unlike env vars, changes take
 * effect immediately for the next webhook/batch call.
 */

import "server-only";
import { serverClient } from "@/lib/supabase/server";

/**
 * Keys stored in the `settings` table. Add here before calling getSetting /
 * setSetting with a new value so the typecheck catches typos.
 *
 * - `print_shop_email`: single string, where the weekly batch goes.
 * - `admin_emails`: comma-separated list of emails allowed into the admin
 *   panel. Merged at runtime with the `ADMIN_EMAILS` env var so a first
 *   deploy still has a bootstrap admin. See `resolveAdminEmails()` below.
 */
export type SettingKey = "print_shop_email" | "admin_emails";

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

/**
 * Parse a comma-separated email list into a lower-cased, deduped array.
 * Shared with the allowlist helpers.
 */
function parseEmailList(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return Array.from(
    new Set(
      raw
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter((s) => s.length > 0)
    )
  );
}

/**
 * Current admin emails stored in the DB (excludes the env fallback).
 * Use for the settings UI so the admin can see what they've configured
 * separately from what the env ships with.
 */
export async function getAdminEmailsFromDb(): Promise<string[]> {
  const raw = await getSetting("admin_emails");
  return parseEmailList(raw);
}

/**
 * Merge env (`ADMIN_EMAILS`) + DB (`admin_emails` setting) into a single
 * lower-cased, deduped allowlist. The env entries stay in the list even
 * if the DB key is set — protects against accidental lockout where the
 * DB row gets wiped.
 */
export async function resolveAdminEmails(): Promise<string[]> {
  const envList = parseEmailList(process.env.ADMIN_EMAILS);
  const dbList = await getAdminEmailsFromDb();
  return Array.from(new Set([...envList, ...dbList]));
}

/**
 * Case-insensitive membership check against the merged allowlist.
 * Use from server components / API routes; the middleware (proxy.ts)
 * has its own resolver that shares the same `settings` table query.
 */
export async function isAllowlistedAdminEmail(email: string | null | undefined): Promise<boolean> {
  if (!email) return false;
  const target = email.trim().toLowerCase();
  if (target.length === 0) return false;
  const all = await resolveAdminEmails();
  return all.includes(target);
}
