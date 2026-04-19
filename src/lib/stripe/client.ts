/**
 * Stripe Node SDK singleton.
 *
 * Server-only. Uses `STRIPE_SECRET_KEY` from the environment; never import
 * this from a client component. Use `@stripe/stripe-js` for the browser-side
 * publishable key (not needed in v1 since we're using hosted Checkout).
 *
 * `apiVersion` is pinned to the SDK's declared latest (pinning insulates us
 * from silent Stripe API behavior changes between SDK bumps).
 */

import "server-only";
import Stripe from "stripe";

// Pinned to the SDK's declared `ApiVersion` constant. Upgrade deliberately
// by bumping the `stripe` package, not by drifting. See
// `node_modules/stripe/esm/apiVersion.d.ts`.
const API_VERSION = "2026-03-25.dahlia";

let cached: Stripe | null = null;

/**
 * Lazily-constructed Stripe client. We don't instantiate at module load so
 * that build-time type-checking of code paths that never hit Stripe (e.g.
 * unrelated Next.js routes) doesn't fail if the env is absent.
 */
export function stripeClient(): Stripe {
  if (cached) return cached;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("Stripe client unavailable: set STRIPE_SECRET_KEY in the environment.");
  }
  cached = new Stripe(key, {
    apiVersion: API_VERSION,
    typescript: true,
    // Helpful for debugging webhook retries in dev; no cost to leaving on.
    appInfo: {
      name: "prints-projects",
      version: "0.1.0",
    },
  });
  return cached;
}

/**
 * Webhook signing secret. Read lazily and validated at call time (not at
 * module load) so that unrelated code paths don't fail when the secret is
 * intentionally unset in a preview environment.
 */
export function webhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("Stripe webhook secret unavailable: set STRIPE_WEBHOOK_SECRET.");
  }
  return secret;
}
