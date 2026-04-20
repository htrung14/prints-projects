/**
 * Admin gate.
 *
 * Next 16 renamed `middleware` to `proxy` (see
 * node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md).
 * Filename and exported function both updated (2026-04-20) to clear the
 * deprecation warning surfaced in dev. Internally we use the proxy/ssr
 * refresh pattern the @supabase/ssr docs describe.
 *
 * What this does, per the Track E spec:
 * 1. Refreshes the Supabase session cookie on every matched request. The
 *    whole point of doing this here is that refresh tokens are single-use -
 *    without a per-request refresh, concurrent page loads race and randomly
 *    log users out (@supabase/ssr README "Concurrent requests").
 * 2. Allows `/admin/sign-in` and `/admin/auth/callback` through unauthenticated
 *    so the sign-in flow itself works.
 * 3. Redirects unauthenticated or non-allowlisted visitors to
 *    `/admin/sign-in?next=<original-path>`.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { isAllowlistedEmail } from "@/lib/auth/allowlist";

// Paths that must always be reachable even when the visitor has no session.
const PUBLIC_ADMIN_PATHS = new Set<string>(["/admin/sign-in", "/admin/auth/callback"]);

function isPublicAdminPath(pathname: string): boolean {
  if (PUBLIC_ADMIN_PATHS.has(pathname)) return true;
  // Allow any asset under /admin/auth/callback/* just in case Supabase tacks
  // on trailing segments in future versions of the flow.
  return pathname.startsWith("/admin/auth/callback/");
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // The matcher already scopes us to /admin/:path*, but double-check: this is
  // the last thing standing between the internet and the admin panel.
  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  // Prepare a "pass-through" response up front so the Supabase client can
  // attach refreshed auth cookies to it. This is the pattern in the
  // @supabase/ssr middleware docs: you must wire both request and response
  // cookies so token refreshes propagate to the browser.
  const response = NextResponse.next({
    request: { headers: request.headers },
  });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If Supabase env isn't configured (e.g. a very first clone before env is
  // wired), let public admin paths through so the sign-in page can render its
  // "configuration missing" state. Everything else fails closed.
  if (!url || !anonKey) {
    if (isPublicAdminPath(pathname)) return response;
    return redirectToSignIn(request);
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        // Write refreshed cookies to both the request (so any downstream code
        // in the same tick sees the new session) and the outgoing response.
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  // `getUser()` contacts the Auth server and verifies the JWT - required for
  // authorization decisions. See README "Known patterns and limitations".
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const email = user?.email ?? null;
  const isAuthorized = user !== null && isAllowlistedEmail(email);

  if (isPublicAdminPath(pathname)) {
    // If an allowlisted admin visits /admin/sign-in while already signed in,
    // bounce them to the dashboard to save a click. The callback path must
    // always run its code, regardless of current session state.
    if (pathname === "/admin/sign-in" && isAuthorized) {
      const target = safeNextParam(request.nextUrl.searchParams.get("next"));
      return NextResponse.redirect(new URL(target, request.url));
    }
    return response;
  }

  if (!isAuthorized) {
    return redirectToSignIn(request);
  }

  return response;
}

function safeNextParam(raw: string | null | undefined): string {
  // Only accept same-origin paths. Reject absolute/protocol-relative values to
  // prevent open-redirects.
  if (!raw) return "/admin";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/admin";
  return raw;
}

function redirectToSignIn(request: NextRequest): NextResponse {
  const url = request.nextUrl.clone();
  const next = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  url.pathname = "/admin/sign-in";
  url.search = `?next=${encodeURIComponent(next)}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*"],
};
