import type { Alert, AlertChannel, AlertSeverity } from "./types";

export type AlertDispatcherConfig = {
  channels: AlertChannel[];
  severityFilter?: Record<string, AlertSeverity[]>;
};

const DEFAULT_SEVERITY_FILTER: Record<string, AlertSeverity[]> = {
  email: ["critical"],
  telegram: ["critical"],
};

export function createAlertDispatcher(config: AlertDispatcherConfig) {
  const filter = config.severityFilter ?? DEFAULT_SEVERITY_FILTER;

  return {
    async send(alert: Alert): Promise<void> {
      const results = await Promise.allSettled(
        config.channels
          .filter((ch) => {
            const allowed = filter[ch.name] ?? ["critical", "warning", "info"];
            return allowed.includes(alert.severity);
          })
          .map((ch) => ch.send(alert))
      );

      for (const result of results) {
        if (result.status === "rejected") {
          console.error(`Alert channel failed: ${result.reason}`);
        }
      }
    },
  };
}
