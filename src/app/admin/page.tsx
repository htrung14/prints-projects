/**
 * /admin — operator dashboard.
 *
 * Thalia checks this once a day: how many orders sit in each state, anything
 * stuck with the printer, and a tail of system activity so she can tell at a
 * glance whether anything broke overnight. Deeper digging happens at
 * /admin/orders.
 *
 * Server component, service-role reads. The middleware + admin layout have
 * already gated the session, so we don't re-check here.
 */

import Link from "next/link";
import { serverClient } from "@/lib/supabase/server";
import { alertSystemError } from "@/lib/alerting";
import type { OrderStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

// Loupe quotes a ~5-day turnaround; 7 days (queue -> sent -> printed) is the
// buffer before we treat an order as stuck. Matches /api/cron/watchdog.
const STUCK_THRESHOLD_DAYS = 7;
const RECENT_WINDOW_DAYS = 30;
const AUDIT_TAIL_LIMIT = 10;

type CountResult = { label: string; count: number | null; href?: string; cta?: string };

async function safeCount(
  label: string,
  promise: PromiseLike<{ count: number | null; error: { message: string } | null }>,
  opts: { href?: string; cta?: string } = {}
): Promise<CountResult> {
  const { count, error } = await promise;
  if (error) {
    const msg = `count(${label}) failed: ${error.message}`;
    console.error(`[admin/dashboard] ${msg}`);
    await alertSystemError("GET /admin (dashboard count)", msg);
    return { label, count: null, ...opts };
  }
  return { label, count: count ?? 0, ...opts };
}

function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

type StuckOrder = { id: string; daysStuck: number };

async function loadStuckOrders(): Promise<StuckOrder[] | null> {
  const db = serverClient();
  const cutoff = daysAgoIso(STUCK_THRESHOLD_DAYS);
  const { data, error } = await db
    .from("orders")
    .select("id, created_at")
    .eq("status", "sent_to_print" satisfies OrderStatus)
    .lt("created_at", cutoff)
    .order("created_at", { ascending: true })
    .limit(20);
  if (error) {
    const msg = `loadStuckOrders failed: ${error.message}`;
    console.error(`[admin/dashboard] ${msg}`);
    await alertSystemError("GET /admin (stuck orders)", msg);
    return null;
  }
  const now = Date.now();
  return (data ?? []).map((r) => {
    const age = now - new Date(r.created_at as string).getTime();
    return { id: r.id as string, daysStuck: Math.floor(age / (24 * 60 * 60 * 1000)) };
  });
}

type AuditEntry = { id: string; createdAt: string; action: string; actor: string; meta: string };

async function loadRecentActivity(): Promise<AuditEntry[] | null> {
  const db = serverClient();
  // Either system-actor rows or any `alert_*` action — covers automated
  // webhook/batch writes and every alert the dispatcher emits.
  const { data, error } = await db
    .from("audit_log")
    .select("id, created_at, actor, action, meta")
    .or("actor.eq.system,action.ilike.alert_%")
    .order("created_at", { ascending: false })
    .limit(AUDIT_TAIL_LIMIT);
  if (error) {
    const msg = `loadRecentActivity failed: ${error.message}`;
    console.error(`[admin/dashboard] ${msg}`);
    await alertSystemError("GET /admin (audit tail)", msg);
    return null;
  }
  return (data ?? []).map((row) => {
    const meta =
      row.meta && typeof row.meta === "object" ? (row.meta as Record<string, unknown>) : {};
    const snippet = Object.keys(meta).length > 0 ? JSON.stringify(meta).slice(0, 120) : "";
    return {
      id: row.id as string,
      createdAt: row.created_at as string,
      actor: row.actor as string,
      action: row.action as string,
      meta: snippet,
    };
  });
}

function formatDateTime(iso: string): string {
  return new Date(iso).toISOString().replace("T", " ").slice(0, 16) + " UTC";
}

export default async function AdminDashboardPage() {
  const db = serverClient();
  const recentCutoff = daysAgoIso(RECENT_WINDOW_DAYS);
  const countQ = () => db.from("orders").select("*", { count: "exact", head: true });

  const [
    paidTile,
    reprintsWaitingTile,
    inPrintTile,
    shippedTile,
    deliveredTile,
    refundedTile,
    stuck,
    activity,
  ] = await Promise.all([
    safeCount("Paid, not batched", countQ().eq("status", "paid"), {
      href: "/admin/orders?status=paid",
      cta: "Send to printer",
    }),
    // Reprints sit in status='paid' until the next batch dispatch sweeps
    // them. Surfacing the count separately makes it obvious when a reprint
    // is lagging — customer already got a "replacement is on the way"
    // email, so every day waiting is a day of silence they didn't expect.
    safeCount(
      "Reprints waiting for batch",
      countQ().eq("status", "paid").not("parent_order_id", "is", null),
      {
        href: "/admin/orders?status=paid",
        cta: "Run batch dispatch",
      }
    ),
    safeCount("In print", countQ().in("status", ["queued_for_print", "sent_to_print", "printed"])),
    safeCount("Shipped, not delivered", countQ().eq("status", "shipped")),
    safeCount(
      `Delivered — ordered in last ${RECENT_WINDOW_DAYS} days`,
      countQ().eq("status", "delivered").gte("created_at", recentCutoff)
    ),
    safeCount(
      `Refunded — ordered in last ${RECENT_WINDOW_DAYS} days`,
      countQ().eq("status", "refunded").gte("created_at", recentCutoff)
    ),
    loadStuckOrders(),
    loadRecentActivity(),
  ]);

  const tiles: CountResult[] = [
    paidTile,
    reprintsWaitingTile,
    inPrintTile,
    shippedTile,
    deliveredTile,
    refundedTile,
  ];

  return (
    <section className="flex flex-col gap-10">
      <header className="flex items-baseline justify-between">
        <h1 className="h-display">Dashboard</h1>
        <span className="text-sm text-ink-faint">{formatDateTime(new Date().toISOString())}</span>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map((t) => (
          <Tile key={t.label} {...t} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        <Panel title="Stuck with printer">
          {stuck === null ? (
            <p className="text-sm text-ink-faint">Could not load stuck orders. Alert dispatched.</p>
          ) : stuck.length === 0 ? (
            <p className="text-sm text-ink-faint">
              No orders stuck in print for more than {STUCK_THRESHOLD_DAYS} days. Clear.
            </p>
          ) : (
            <ul className="flex flex-col gap-2 text-sm">
              {stuck.map((o) => (
                <li
                  key={o.id}
                  className="flex items-baseline justify-between border-b border-ink-line pb-2"
                >
                  <Link
                    href={`/admin/orders/${o.id}`}
                    className="text-ink-strong underline underline-offset-4"
                  >
                    {o.id.slice(0, 8)}
                  </Link>
                  <span className="text-ink-faint">{o.daysStuck} days</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Recent system activity">
          {activity === null ? (
            <p className="text-sm text-ink-faint">Could not load audit tail. Alert dispatched.</p>
          ) : activity.length === 0 ? (
            <p className="text-sm text-ink-faint">Nothing new from system / alerts.</p>
          ) : (
            <ul className="flex flex-col gap-2 text-sm">
              {activity.map((e) => (
                <li key={e.id} className="flex flex-col border-b border-ink-line pb-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-ink-strong">{e.action}</span>
                    <span className="font-mono text-xs text-ink-faint">
                      {formatDateTime(e.createdAt)}
                    </span>
                  </div>
                  {e.meta ? (
                    <span className="truncate font-mono text-xs text-ink-faint">{e.meta}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <nav className="flex flex-wrap gap-6 border-t border-ink-line pt-6 text-sm">
        <Link href="/admin/orders" className="text-ink-strong underline underline-offset-4">
          Orders
        </Link>
        <Link href="/admin/photos" className="text-ink-strong underline underline-offset-4">
          Photos
        </Link>
        <Link href="/admin/audit" className="text-ink-strong underline underline-offset-4">
          Audit
        </Link>
        <Link href="/admin/settings" className="text-ink-strong underline underline-offset-4">
          Settings
        </Link>
      </nav>
    </section>
  );
}

function Tile({ label, count, href, cta }: CountResult) {
  const displayCount = count === null ? "—" : String(count);
  return (
    <div className="flex flex-col justify-between gap-4 border border-ink-line p-5">
      <span className="label-caps text-ink-faint">{label}</span>
      <span className="text-4xl font-[900] text-ink-strong">{displayCount}</span>
      {href ? (
        <Link
          href={href}
          className="text-sm underline underline-offset-4"
          style={{ color: "var(--btn-accent)" }}
        >
          {cta ?? "View"} →
        </Link>
      ) : null}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="label-caps text-ink-faint">{title}</h2>
      {children}
    </div>
  );
}
