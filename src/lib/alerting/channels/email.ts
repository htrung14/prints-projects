import type { Alert, AlertChannel } from "../types";

const SEVERITY_PREFIX: Record<string, string> = {
  critical: "[CRITICAL]",
  warning: "[WARNING]",
  info: "[INFO]",
};

export function createEmailChannel(
  sendFn: (opts: { to: string; subject: string; text: string }) => Promise<void>,
  recipientEmail: string
): AlertChannel {
  return {
    name: "email",
    async send(alert: Alert): Promise<void> {
      const prefix = SEVERITY_PREFIX[alert.severity] ?? "[ALERT]";
      const subject = `${prefix} ${alert.title}`;

      const action = alert.actionRequired
        ? `ACTION NEEDED: ${alert.actionInstructions}`
        : "No action needed.";

      const text = [
        alert.whatHappened,
        "",
        `Auto-handled: ${alert.autoHandled}`,
        "",
        action,
        "",
        `Time: ${alert.timestamp}`,
      ].join("\n");

      await sendFn({ to: recipientEmail, subject, text });
    },
  };
}
