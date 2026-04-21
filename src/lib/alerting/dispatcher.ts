import * as Sentry from "@sentry/nextjs";
import { createAlertDispatcher } from "./dispatch";
import { createTelegramChannel } from "./channels/telegram";
import { createEmailChannel } from "./channels/email";
import { createTriagedDispatcher } from "./triage";
import { systemErrorAlert } from "./alerts";
import type { Alert } from "./types";
import { getResend } from "@/lib/email/client";
import { audit } from "@/lib/supabase/queries/audit";

const ALERT_FROM = "alerts@thaliabassim.com";

// Module-level guard so we only warn once per process when the dispatcher
// is invisibly no-op (no channels configured). Avoids flooding Sentry on
// every `send` in a misconfigured environment.
let noChannelsWarned = false;

export function getDispatcher() {
  const { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, ADMIN_EMAILS } = process.env;

  const channels = [];

  if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
    channels.push(createTelegramChannel(TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID));
  }

  if (ADMIN_EMAILS) {
    channels.push(
      createEmailChannel(async (opts) => {
        const resend = getResend();
        await resend.emails.send({
          from: ALERT_FROM,
          to: opts.to,
          subject: opts.subject,
          text: opts.text,
          html: opts.html,
        });
      }, ADMIN_EMAILS)
    );
  }

  if (channels.length === 0 && !noChannelsWarned) {
    noChannelsWarned = true;
    Sentry.captureMessage("alerting dispatcher has no channels configured", {
      level: "error",
      tags: { pipeline: "alerting-config" },
    });
  }

  const baseDispatcher = createAlertDispatcher({ channels });
  return createTriagedDispatcher(baseDispatcher);
}

/**
 * Fire-and-forget alert dispatch for code paths that MUST NOT fail their
 * parent operation (Stripe webhook side-effects, email pipeline, admin
 * resend). Replaces the common `getDispatcher().send(...).catch(() => {})`
 * anti-pattern — a bare empty catch silently discards dispatcher failures
 * and hides outages where both Telegram and email are down simultaneously.
 *
 * Behaviour on dispatcher failure:
 *   1. console.error with the context label (Vercel logs)
 *   2. Sentry.captureException with `pipeline: "alerting-dispatch:outer"`
 *      (last-resort signal layer — independent of the alert channels)
 *   3. Swallow the error so callers keep their semantics
 *
 * Note: per-channel (Telegram, email) rejections are already caught inside
 * `createAlertDispatcher` via `Promise.allSettled`. This helper only covers
 * synchronous construction errors, triage failures, or unexpected bugs
 * that propagate out of `dispatcher.send` itself.
 */
export async function alertSafely(context: string, alert: Alert): Promise<void> {
  try {
    await getDispatcher().send(alert);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[alerting] dispatcher.send failed for "${context}":`, msg);
    try {
      Sentry.captureException(err, {
        tags: { pipeline: "alerting-dispatch:outer", context },
        extra: { alertTitle: alert.title, alertSeverity: alert.severity },
      });
    } catch {
      // If Sentry itself throws, we're out of belt-and-braces signals.
    }
  }

  // Audit-log every alertSafely invocation (success OR dispatcher-throw) so
  // /admin/alerts surfaces dispatcher-handled incidents. Without this row,
  // Thalia only sees the 3 hardcoded audit actions and every alertSystemError
  // call is invisible in admin. Belt-and-suspenders try/catch: audit() is
  // already non-throwing, but if it somehow blows up we still must not
  // break the alertSafely contract (fire-and-forget, never throws).
  try {
    await audit({
      orderId: null,
      actor: "system",
      action: "alert_system_error",
      meta: {
        context,
        title: alert.title,
        severity: alert.severity,
        summary: alert.whatHappened?.slice(0, 500),
      },
    });
  } catch (auditErr) {
    // Never throw from alertSafely. Sentry-capture so we know the /admin/alerts
    // feed has gone deaf (no console.error alone per no-silent-failures rule).
    try {
      Sentry.captureException(auditErr, {
        tags: { pipeline: "alerting-audit-write", context },
        extra: { alertTitle: alert.title, alertSeverity: alert.severity },
      });
    } catch {
      // Last-resort: Sentry itself is down. We've already tried every signal.
    }
  }
}

/**
 * Convenience: build a systemErrorAlert and fire it via `alertSafely`.
 * Use in catch blocks that already have a (context, error) pair handy.
 */
export async function alertSystemError(context: string, error: string): Promise<void> {
  await alertSafely(context, systemErrorAlert(context, error));
}
