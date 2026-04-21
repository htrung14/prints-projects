/**
 * /admin/alerts - in-admin alerts feed.
 *
 * Thalia checks admin once a day; Telegram/email alerts that arrive overnight
 * get missed. This page surfaces the same events from the existing `audit_log`
 * table so she can review them without leaving the dashboard.
 *
 * Source: `audit_log` only — no new table, no Notion dep. Filter captures
 * every alert-shaped row written by the webhook/batch/dispatcher audit paths:
 *   - actor = 'system'                       (automatic refunds, system writes)
 *   - action ILIKE 'alert_%'                 (dispatcher writes, primary source —
 *                                             see src/lib/alerting/dispatcher.ts:alertSafely)
 *   - action ILIKE '%_error' / '%_failed'    (*_error / *_failed audit actions)
 *   - action = 'order_refunded_edition_exceeded' (critical refund path)
 *
 * Auth: handled upstream by `src/middleware.ts` + the admin layout. No
 * `requireAdmin()` call here — the layout doesn't call it either and
 * re-checking would be inconsistent with /admin and /admin/orders.
 */

import Link from "next/link";
import { serverClient } from "@/lib/supabase/server";
import { alertSafely, systemErrorAlert } from "@/lib/alerting";

export const dynamic = "force-dynamic";

const RECENT_LIMIT = 50;
const META_SNIPPET_CHARS = 200;

type Window = "24h" | "7d" | "all";

function parseWindow(raw: unknown): Window {
  // Default = 7d. Thalia checks once a day, so a week of history is the
  // useful-by-default view; 24h still available via the filter links.
  return raw === "24h" || raw === "7d" || raw === "all" ? raw : "7d";
}

function countLabel(w: Window): string {
  if (w === "24h") return "in last 24 hours";
  if (w === "7d") return "in last 7 days";
  return "total";
}

function windowCutoffIso(w: Window): string | null {
  if (w === "all") return null;
  const ms = w === "24h" ? 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;
  return new Date(Date.now() - ms).toISOString();
}

function formatDateTime(iso: string): string {
  return new Date(iso).toISOString().replace("T", " ").slice(0, 19) + " UTC";
}

function metaSnippet(meta: unknown): string {
  if (!meta || typeof meta !== "object") return "";
  const obj = meta as Record<string, unknown>;
  if (Object.keys(obj).length === 0) return "";
  const s = JSON.stringify(obj);
  return s.length > META_SNIPPET_CHARS ? s.slice(0, META_SNIPPET_CHARS) + "…" : s;
}

type AlertRow = {
  id: string;
  createdAt: string;
  action: string;
  actor: string;
  orderId: string | null;
  meta: string;
};

// Shared `.or()` predicate — applied to both the windowed list and the
// windowed count so the filter shape stays in lockstep.
//
// `action.ilike.alert_%` is now the PRIMARY source of dispatcher-handled
// incidents: `src/lib/alerting/dispatcher.ts:alertSafely` writes
// `action = "alert_system_error"` on every invocation (success or
// dispatcher-throw). Without this branch the feed would miss every
// alertSystemError call — only the 3 hardcoded audit actions would show.
const ALERT_OR_PREDICATE =
  "actor.eq.system,action.ilike.alert_%,action.ilike.%_error,action.ilike.%_failed,action.eq.order_refunded_edition_exceeded";

type Loaded = { kind: "ok"; rows: AlertRow[]; count: number } | { kind: "error"; message: string };

async function loadAlerts(window: Window): Promise<Loaded> {
  const db = serverClient();
  const cutoff = windowCutoffIso(window);

  // List query: filtered by window + alert predicate, newest first, capped.
  let listQ = db
    .from("audit_log")
    .select("id, created_at, actor, action, order_id, meta")
    .or(ALERT_OR_PREDICATE)
    .order("created_at", { ascending: false })
    .limit(RECENT_LIMIT);
  if (cutoff) listQ = listQ.gte("created_at", cutoff);

  // Count query for the header — uses the SAME window as the list so the
  // header count and the visible rows stay consistent ("12 in last 7 days"
  // when window=7d, "N total" when window=all, etc.).
  let countQ = db
    .from("audit_log")
    .select("id", { count: "exact", head: true })
    .or(ALERT_OR_PREDICATE);
  if (cutoff) countQ = countQ.gte("created_at", cutoff);

  const [listRes, countRes] = await Promise.all([listQ, countQ]);

  if (listRes.error) {
    const msg = `audit_log list (window=${window}) failed: ${listRes.error.message}`;
    console.error(`[admin/alerts] ${msg}`);
    await alertSafely("admin/alerts:list", systemErrorAlert("admin/alerts:list", msg));
    return { kind: "error", message: listRes.error.message };
  }
  if (countRes.error) {
    // Non-fatal: we can still render the list without the header count.
    const msg = `audit_log count (window=${window}) failed: ${countRes.error.message}`;
    console.error(`[admin/alerts] ${msg}`);
    await alertSafely("admin/alerts:count", systemErrorAlert("admin/alerts:count", msg));
  }

  const rows: AlertRow[] = (listRes.data ?? []).map((r) => ({
    id: r.id as string,
    createdAt: r.created_at as string,
    actor: r.actor as string,
    action: r.action as string,
    orderId: (r.order_id as string | null) ?? null,
    meta: metaSnippet(r.meta),
  }));

  return { kind: "ok", rows, count: countRes.count ?? 0 };
}

function WindowLinks({ active }: { active: Window }) {
  const items: Array<{ key: Window; label: string }> = [
    { key: "24h", label: "Last 24 h" },
    { key: "7d", label: "Last 7 days" },
    { key: "all", label: "All" },
  ];
  return (
    <nav className="flex items-baseline gap-4 text-sm" aria-label="Time window">
      {items.map((it, i) => {
        const isActive = it.key === active;
        return (
          <span key={it.key} className="flex items-baseline gap-4">
            {i > 0 ? <span className="text-ink-faint">·</span> : null}
            {isActive ? (
              <span className="text-ink-strong underline underline-offset-4">{it.label}</span>
            ) : (
              <Link
                href={`/admin/alerts?window=${it.key}`}
                className="text-ink-faint hover:text-ink-strong"
              >
                {it.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}

export default async function AlertsPage({ searchParams }: PageProps<"/admin/alerts">) {
  const q = await searchParams;
  const window = parseWindow(q.window);
  const loaded = await loadAlerts(window);

  return (
    <section className="flex flex-col gap-6">
      <header className="flex items-baseline justify-between">
        <h1 className="h-display">Alerts</h1>
        <span className="text-sm text-ink-faint">
          {loaded.kind === "ok" ? `${loaded.count} ${countLabel(window)}` : "count unavailable"}
        </span>
      </header>

      <WindowLinks active={window} />

      {loaded.kind === "error" ? (
        <div
          role="alert"
          className="border border-ink-line bg-bg-soft px-4 py-3 text-sm text-ink-strong"
        >
          <strong className="label-caps">Query failed.</strong>{" "}
          <span className="text-ink-faint">
            The audit log could not be read: {loaded.message}. Try reloading the page or narrowing
            the window.
          </span>
        </div>
      ) : loaded.rows.length === 0 ? (
        <p className="text-sm text-ink-faint">No recent alerts.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-ink-line text-left">
                <th className="py-2 pr-4 text-xs font-[900] uppercase tracking-wider text-ink-faint">
                  Time
                </th>
                <th className="py-2 pr-4 text-xs font-[900] uppercase tracking-wider text-ink-faint">
                  Action
                </th>
                <th className="py-2 pr-4 text-xs font-[900] uppercase tracking-wider text-ink-faint">
                  Order
                </th>
                <th className="py-2 pr-4 text-xs font-[900] uppercase tracking-wider text-ink-faint">
                  Meta
                </th>
              </tr>
            </thead>
            <tbody>
              {loaded.rows.map((row) => (
                <tr key={row.id} className="border-b border-ink-line align-top hover:bg-bg-soft">
                  <td className="py-2 pr-4 font-mono text-xs">{formatDateTime(row.createdAt)}</td>
                  <td className="py-2 pr-4">{row.action}</td>
                  <td className="py-2 pr-4">
                    {row.orderId ? (
                      <Link
                        href={`/admin/orders/${row.orderId}`}
                        className="text-ink-strong underline underline-offset-4"
                      >
                        {row.orderId.slice(0, 8)}
                      </Link>
                    ) : (
                      <span className="text-ink-faint">-</span>
                    )}
                  </td>
                  <td className="py-2 pr-4">
                    {row.meta ? (
                      <pre className="max-w-md overflow-x-auto whitespace-pre-wrap break-all text-xs text-ink-faint">
                        {row.meta}
                      </pre>
                    ) : (
                      <span className="text-ink-faint">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
