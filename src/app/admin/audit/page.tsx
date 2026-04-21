/**
 * /admin/audit - audit log.
 *
 * Last 100 entries by default. `?orderId=...` narrows to one order.
 * Entries are immutable (append-only per Track A).
 */

import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { listAuditEntries } from "@/app/admin/_data";

export const dynamic = "force-dynamic";

function formatDateTime(iso: string): string {
  return new Date(iso).toISOString().replace("T", " ").slice(0, 19) + " UTC";
}

export default async function AuditPage({ searchParams }: PageProps<"/admin/audit">) {
  await requireAdmin("/admin/audit");
  const q = await searchParams;
  const orderId = typeof q.orderId === "string" ? q.orderId : undefined;
  const entries = await listAuditEntries({ orderId, limit: 100 });

  return (
    <section className="flex flex-col gap-6">
      <header className="flex items-baseline justify-between">
        <h1 className="h-display">Audit log</h1>
        <span className="text-sm text-ink-faint">{entries.length} entries</span>
      </header>

      {orderId ? (
        <p className="text-sm text-ink-faint">
          Filtered to order{" "}
          <Link
            href={`/admin/orders/${orderId}`}
            className="text-ink-strong underline underline-offset-4"
          >
            {orderId.slice(0, 8)}
          </Link>
          {" · "}
          <Link href="/admin/audit" className="underline underline-offset-4">
            Clear filter
          </Link>
        </p>
      ) : null}

      {entries.length === 0 ? (
        <p className="text-sm text-ink-faint">No audit entries found.</p>
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
                  Actor
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
              {entries.map((e) => (
                <tr key={e.id} className="border-b border-ink-line align-top hover:bg-bg-soft">
                  <td className="py-2 pr-4 font-mono text-xs">{formatDateTime(e.createdAt)}</td>
                  <td className="py-2 pr-4">{e.action}</td>
                  <td className="py-2 pr-4">{e.actor}</td>
                  <td className="py-2 pr-4">
                    {e.orderId ? (
                      <Link
                        href={`/admin/orders/${e.orderId}`}
                        className="text-ink-strong underline underline-offset-4"
                      >
                        {e.orderId.slice(0, 8)}
                      </Link>
                    ) : (
                      <span className="text-ink-faint">-</span>
                    )}
                  </td>
                  <td className="py-2 pr-4">
                    {Object.keys(e.meta).length > 0 ? (
                      <pre className="max-w-md overflow-x-auto whitespace-pre-wrap break-all text-xs text-ink-faint">
                        {JSON.stringify(e.meta)}
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
