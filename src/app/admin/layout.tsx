/**
 * Admin shell.
 *
 * Renders a minimal header (nav + signed-in email + sign-out form) above the
 * page body. Uses the same Cargo visual language as the customer app: white
 * background, single typeface at weight 900, 1px ink-line borders, no pills.
 * Slightly denser than the public site since this is a working tool.
 *
 * The shell does not re-check auth - the middleware in `src/middleware.ts`
 * gates `/admin/*`. Each mutating page or API route also calls
 * `requireAdmin()` defense-in-depth because Server Functions can bypass the
 * middleware matcher (see Next 16 proxy.md "Execution order" good-to-know).
 */

import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/session";
import { adminServerClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

async function signOutAction() {
  "use server";
  const supabase = await adminServerClient();
  await supabase.auth.signOut();
  redirect("/admin/sign-in");
}

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  // Read the session here so the header can show the signed-in email. The
  // layout is also rendered under /admin/sign-in (inside the same segment),
  // so we don't require a session - if there's none, we render the children
  // without the signed-in chrome.
  const session = await getAdminSession();

  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-40 border-b border-ink-line bg-bg px-6 py-4 md:px-10">
        {/* flex-wrap lets the right-side chrome drop to a second row on narrow
            viewports instead of overflowing. The email is hidden below md so
            "Sign out" doesn't collide with the nav on phones. */}
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-3">
          <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
            <Link href="/admin" className="text-ink-strong">
              Admin
            </Link>
            {session ? (
              <nav className="flex flex-wrap items-baseline gap-x-5 gap-y-2 text-sm">
                <Link href="/admin/orders">Orders</Link>
                <Link href="/admin/photos">Photos</Link>
                <Link href="/admin/alerts">Alerts</Link>
                <Link href="/admin/audit">Audit</Link>
              </nav>
            ) : null}
          </div>
          {session ? (
            <form action={signOutAction} className="flex items-baseline gap-4 text-sm">
              <span className="hidden text-ink-faint md:inline">{session.email}</span>
              <button type="submit" className="underline underline-offset-4 hover:opacity-70">
                Sign out
              </button>
            </form>
          ) : (
            <Link href="/" className="text-sm text-ink-faint">
              ← Back to shop
            </Link>
          )}
        </div>
      </header>
      <main className="px-6 py-8 md:px-10 md:py-10">{children}</main>
    </div>
  );
}
