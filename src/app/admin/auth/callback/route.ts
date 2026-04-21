/**
 * /admin/auth/callback - magic-link exchange.
 *
 * Supabase redirects here with a `?code=...` (PKCE) query param after the
 * user clicks the magic-link email. We exchange the code for a session;
 * `exchangeCodeForSession` writes the auth cookies via the cookie-backed
 * client, and we redirect to `?next=` (defaulting to `/admin`).
 *
 * If the exchange fails (expired link, already used), bounce back to the
 * sign-in page with an error hint. The allowlist check is deferred to the
 * middleware on the next request - keeping the code/exchange path simple.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { exchangeCodeForSession } from "@/lib/auth/magic-link";

export const dynamic = "force-dynamic";

function safeNext(raw: string | null): string {
  if (!raw) return "/admin";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/admin";
  return raw;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));

  if (!code) {
    const signIn = new URL(
      `/admin/sign-in?next=${encodeURIComponent(next)}&error=missing_code`,
      origin
    );
    return NextResponse.redirect(signIn);
  }

  const result = await exchangeCodeForSession(code);
  if (!result) {
    const signIn = new URL(
      `/admin/sign-in?next=${encodeURIComponent(next)}&error=exchange_failed`,
      origin
    );
    return NextResponse.redirect(signIn);
  }

  // Session cookies are now set on the response by the SSR client's `setAll`
  // hook. Redirect to the target; the middleware will re-verify allowlist.
  return NextResponse.redirect(new URL(next, origin));
}
