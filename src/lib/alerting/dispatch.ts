import * as Sentry from "@sentry/nextjs";
import type { Alert, AlertChannel, AlertSeverity } from "./types";

export type AlertDispatcherConfig = {
  channels: AlertChannel[];
  severityFilter?: Record<string, AlertSeverity[]>;
};

const DEFAULT_SEVERITY_FILTER: Record<string, AlertSeverity[]> = {
  email: ["critical"],
  telegram: ["critical", "warning", "info"],
};

export function createAlertDispatcher(config: AlertDispatcherConfig) {
  const filter = config.severityFilter ?? DEFAULT_SEVERITY_FILTER;

  return {
    async send(alert: Alert): Promise<void> {
      const selected = config.channels.filter((ch) => {
        const allowed = filter[ch.name] ?? ["critical", "warning", "info"];
        return allowed.includes(alert.severity);
      });

      const results = await Promise.allSettled(selected.map((ch) => ch.send(alert)));

      results.forEach((result, idx) => {
        if (result.status === "rejected") {
          const channelName = selected[idx]?.name ?? "unknown";
          // This module is the terminal sink — we can't alert about our own
          // failure via ourselves. Route it to Sentry so the outage is visible
          // even when Telegram + email are both down. console.error alone
          // would be silently discarded in production.
          const err =
            result.reason instanceof Error
              ? result.reason
              : new Error(`Alert channel "${channelName}" failed: ${String(result.reason)}`);
          try {
            Sentry.captureException(err, {
              tags: { pipeline: "alerting-dispatch", channel: channelName },
              extra: { alertTitle: alert.title, alertSeverity: alert.severity },
            });
          } catch {
            // If Sentry itself throws, we're out of belt-and-braces signals.
          }
          console.error(`[alerting] channel "${channelName}" failed:`, err.message);
        }
      });
    },
  };
}
