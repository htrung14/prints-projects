import type { Alert, AlertChannel } from "../types";

const SEVERITY_EMOJI: Record<string, string> = {
  critical: "\u{1F534}",
  warning: "\u{1F7E1}",
  info: "\u{1F7E2}",
};

function extractUrl(text: string): string | null {
  const match = text.match(/https?:\/\/[^\s"']+/);
  return match ? match[0] : null;
}

function formatMessage(alert: Alert): string {
  const emoji = SEVERITY_EMOJI[alert.severity] ?? "\u{2139}\u{FE0F}";
  const url = extractUrl(alert.whatHappened);

  // Clean up the one-liner: strip "Seen X time(s)..." and Details URL so the
  // headline reads naturally. The URL gets promoted to its own line below.
  const headline = alert.whatHappened
    .replace(/\s*Seen \d+ time.*?affected\./, "")
    .replace(/\s*Details:\s*https?:\/\/\S+/, "")
    .trim();

  const lines = [`${emoji} <b>${escape(alert.title)}</b>`, "", escape(headline)];

  if (url) lines.push("", `<a href="${escape(url)}">View in Sentry →</a>`);
  if (alert.actionRequired) lines.push("", `⚠️ ${escape(alert.actionInstructions)}`);

  return lines.join("\n");
}

function escape(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
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
          disable_web_page_preview: true,
        }),
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`Telegram send failed (${res.status}): ${body}`);
      }
    },
  };
}
