import type { Alert, AlertChannel } from "../types";

const SEVERITY_EMOJI: Record<string, string> = {
  critical: "\u{1F534}",
  warning: "\u{1F7E1}",
  info: "\u{1F7E2}",
};

function formatMessage(alert: Alert): string {
  const emoji = SEVERITY_EMOJI[alert.severity] ?? "\u{2139}\u{FE0F}";
  const action = alert.actionRequired
    ? `\u{1F6A8} ACTION NEEDED: ${alert.actionInstructions}`
    : `\u{2705} No action needed`;

  return [
    `${emoji} ${alert.severity.toUpperCase()} — ${alert.title}`,
    "",
    alert.whatHappened,
    "",
    `Auto-handled: ${alert.autoHandled}`,
    "",
    action,
  ].join("\n");
}

export function createTelegramChannel(botToken: string, chatId: string): AlertChannel {
  return {
    name: "telegram",
    async send(alert: Alert): Promise<void> {
      const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: formatMessage(alert),
          parse_mode: "HTML",
        }),
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`Telegram send failed (${res.status}): ${body}`);
      }
    },
  };
}
