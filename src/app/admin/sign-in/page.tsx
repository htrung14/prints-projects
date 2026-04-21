/**
 * /admin/sign-in - magic-link form.
 *
 * This is an allow-public page in the admin area (see PUBLIC_ADMIN_PATHS in
 * `src/middleware.ts`). The middleware still runs and, if you arrive here
 * while already signed in and allowlisted, bounces you to the dashboard.
 *
 * The form itself is a client component so it can call the browser Supabase
 * SDK; the page just resolves `?next=` and builds the absolute redirect URL.
 */

import SignInForm from "./SignInForm";
import { magicLinkRedirectUrl } from "@/lib/auth/magic-link";

export const dynamic = "force-dynamic";

function normalizeNext(raw: string | string[] | undefined): string {
  if (typeof raw !== "string") return "/admin";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/admin";
  return raw;
}

export default async function SignInPage({ searchParams }: PageProps<"/admin/sign-in">) {
  const q = await searchParams;
  const nextPath = normalizeNext(q.next);
  const redirectTo = magicLinkRedirectUrl(nextPath);

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6">
      <SignInForm nextPath={nextPath} redirectTo={redirectTo} />
    </div>
  );
}
