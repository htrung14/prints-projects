/**
 * /admin/photos - catalog list.
 *
 * Server component. Columns: thumbnail, title, slug, edition_sold/total,
 * publish toggle (client component that POSTs to the publish API route).
 */

import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { listAllPhotosForAdmin } from "@/app/admin/_data";
import PublishToggle from "./PublishToggle";

export const dynamic = "force-dynamic";

export default async function AdminPhotosPage() {
  await requireAdmin("/admin/photos");
  const photos = await listAllPhotosForAdmin();

  return (
    <section className="flex flex-col gap-6">
      <header className="flex items-baseline justify-between">
        <h1 className="h-display">Photos</h1>
        <span className="text-sm text-ink-faint">{photos.length} in catalog</span>
      </header>

      {photos.length === 0 ? (
        <p className="text-sm text-ink-faint">
          No photos yet. Seed the catalog or insert rows directly.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-ink-line text-left">
                <th className="py-2 pr-4 text-xs font-[900] uppercase tracking-wider text-ink-faint">
                  Preview
                </th>
                <th className="py-2 pr-4 text-xs font-[900] uppercase tracking-wider text-ink-faint">
                  Title
                </th>
                <th className="py-2 pr-4 text-xs font-[900] uppercase tracking-wider text-ink-faint">
                  Slug
                </th>
                <th className="py-2 pr-4 text-xs font-[900] uppercase tracking-wider text-ink-faint">
                  Editions
                </th>
                <th className="py-2 pr-4 text-xs font-[900] uppercase tracking-wider text-ink-faint">
                  State
                </th>
                <th className="py-2 pr-4 text-xs font-[900] uppercase tracking-wider text-ink-faint">
                  {""}
                </th>
              </tr>
            </thead>
            <tbody>
              {photos.map((p) => (
                <tr key={p.id} className="border-b border-ink-line align-top hover:bg-bg-soft">
                  <td className="py-3 pr-4">
                    <img src={p.imageUrl} alt={p.imageAlt} className="h-14 w-14 object-cover" />
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex flex-col">
                      <span className="text-ink-strong">{p.title}</span>
                      <span className="text-xs text-ink-faint">{p.referenceNumber}</span>
                    </div>
                  </td>
                  <td className="py-3 pr-4 font-mono text-xs">{p.slug}</td>
                  <td className="py-3 pr-4">
                    {p.editionSold} / {p.editionTotal}
                  </td>
                  <td className="py-3 pr-4">
                    <PublishToggle photoId={p.id} isPublished={p.isPublished} />
                  </td>
                  <td className="py-3 pr-4">
                    <Link
                      href={`/admin/photos/${p.id}`}
                      className="text-xs underline underline-offset-4 text-ink-strong"
                    >
                      edit →
                    </Link>
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
