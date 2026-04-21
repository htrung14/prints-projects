/**
 * POST /api/checkout
 *
 * Accepts a cart payload from the browser, creates a Stripe Checkout
 * Session on the server, and returns `{ url }` for the client to redirect
 * to. Hosted Stripe Checkout - we never touch card data.
 *
 * Request body:
 *   { lines: CartLine[] }
 *
 * Response:
 *   200 { url: string }
 *   400 { error: string } - malformed body, empty cart, unknown slug
 *   500 { error: string } - Stripe SDK or upstream failure
 */

import { after, type NextRequest } from "next/server";
import type { CartLine } from "@/lib/types";
import { createCheckoutSession } from "@/lib/stripe/checkout";
import { softInventoryCheck } from "@/lib/stripe/inventory-check";
import { getDispatcher } from "@/lib/alerting/dispatcher";
import { systemErrorAlert } from "@/lib/alerting";

// Force the Node runtime - the Stripe SDK and Supabase service-role client
// rely on Node-only APIs (crypto, Buffer). Edge would silently fail at runtime.
export const runtime = "nodejs";
// Route is mutating and depends on an env-loaded Stripe client; skip any
// framework caching.
export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Body validation
// ---------------------------------------------------------------------------

type CheckoutRequestBody = { lines: CartLine[] };

function parseBody(body: unknown): CheckoutRequestBody {
  if (typeof body !== "object" || body === null) {
    throw new BadRequest("body must be a JSON object");
  }
  const rec = body as Record<string, unknown>;
  const lines = rec.lines;
  if (!Array.isArray(lines) || lines.length === 0) {
    throw new BadRequest("body.lines must be a non-empty array");
  }
  return { lines: lines as CartLine[] };
}

class BadRequest extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = "BadRequest";
  }
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest): Promise<Response> {
  // Parse JSON up-front with a concrete error message; Next's default
  // Request#json throws a generic SyntaxError that's opaque in logs.
  let body: unknown;
  try {
    body = await req.json();
  } catch (err) {
    return Response.json({ error: `invalid JSON: ${(err as Error).message}` }, { status: 400 });
  }

  let parsed: CheckoutRequestBody;
  try {
    parsed = parseBody(body);
  } catch (err) {
    if (err instanceof BadRequest) {
      return Response.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }

  // Soft inventory check — non-blocking best-effort to avoid sending
  // customers to checkout for sold-out editions
  const stockIssue = await softInventoryCheck(parsed.lines);
  if (stockIssue) {
    return Response.json({ error: stockIssue }, { status: 409 });
  }

  try {
    const session = await createCheckoutSession({ lines: parsed.lines });
    if (!session.url) {
      // `url` is null only for embedded/custom UI modes; we always use hosted.
      throw new Error("Stripe did not return a Checkout URL");
    }
    // 200 + JSON - the client page does the redirect. Returning 303 would
    // only work from a form POST, not from a fetch() in JS.
    return Response.json({ url: session.url }, { status: 200 });
  } catch (err) {
    const msg = (err as Error).message ?? String(err);

    // Catalog-resolution errors are client-caused (unknown slug, bad
    // quantity). Everything else (Stripe SDK, DB) is 500.
    if (
      /resolveCartLines:|unknown photo|unknown sizeId|unknown paperId|invalid quantity|missing (photoSlug|sizeId|paperId)/.test(
        msg
      )
    ) {
      return Response.json({ error: msg }, { status: 400 });
    }

    console.error("POST /api/checkout failed:", err);
    after(() => {
      getDispatcher()
        .send(systemErrorAlert("POST /api/checkout", msg))
        .catch(() => {});
    });
    return Response.json(
      { error: "Checkout session creation failed. Please retry." },
      { status: 500 }
    );
  }
}
