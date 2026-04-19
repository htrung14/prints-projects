"use client";

/**
 * Admin magic-link sign-in form.
 *
 * Submits to Supabase directly from the browser (so we never round-trip the
 * email through our own server). On success we flip to a "Check your email"
 * state and stay there until the user acts on the link.
 *
 * Auth cookies are set by the callback route (`/admin/auth/callback`), which
 * calls `exchangeCodeForSession` against the server-side cookie-backed
 * client. Nothing here writes the session directly.
 */

import { useState } from "react";
import { adminBrowserClient } from "@/lib/auth/browser-client";

type Props = {
  /** Same-origin path to redirect to after successful auth. */
  nextPath: string;
  /** Absolute URL the magic-link email should send the user to. */
  redirectTo: string;
};

type ViewState =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "sent"; email: string }
  | { kind: "error"; message: string };

export default function SignInForm({ nextPath, redirectTo }: Props) {
  const [view, setView] = useState<ViewState>({ kind: "idle" });
  const [email, setEmail] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = email.trim();
    if (trimmed.length === 0) return;

    setView({ kind: "submitting" });
    try {
      const supabase = adminBrowserClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: trimmed,
        options: {
          emailRedirectTo: redirectTo,
          // `shouldCreateUser: true` is the default and is what we want here:
          // magic link provisions the Supabase user on first sign-in. The
          // allowlist check in middleware still gates access after that.
        },
      });
      if (error) {
        setView({ kind: "error", message: error.message });
        return;
      }
      setView({ kind: "sent", email: trimmed });
    } catch (err) {
      setView({
        kind: "error",
        message: err instanceof Error ? err.message : "Unknown error.",
      });
    }
  }

  if (view.kind === "sent") {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="h-display">Check your email</h1>
        <p className="text-sm text-ink-faint">
          A sign-in link was sent to <span className="text-ink">{view.email}</span>. Open it on this
          device to finish signing in.
        </p>
        <p className="text-xs text-ink-faint">The link redirects to {nextPath}.</p>
        <button
          type="button"
          onClick={() => setView({ kind: "idle" })}
          className="self-start text-sm underline underline-offset-4 hover:opacity-70"
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <h1 className="h-display">Admin sign-in</h1>
      <p className="text-sm text-ink-faint">
        Enter your allowlisted email. We&apos;ll send a one-time sign-in link.
      </p>
      <label className="flex flex-col gap-2">
        <span className="label-caps">Email</span>
        <input
          type="email"
          required
          autoComplete="email"
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={view.kind === "submitting"}
          className="border-b border-ink-line bg-transparent py-2 text-ink-strong outline-none focus:border-ink-strong disabled:opacity-50"
        />
      </label>
      <button
        type="submit"
        disabled={view.kind === "submitting" || email.trim().length === 0}
        className="btn-ghost self-start disabled:cursor-not-allowed"
      >
        {view.kind === "submitting" ? "Sending…" : "Send magic link"}
      </button>
      {view.kind === "error" ? (
        <p className="text-sm" style={{ color: "rgba(160, 0, 0, 0.85)" }}>
          {view.message}
        </p>
      ) : null}
    </form>
  );
}
