import type { Alert, AlertChannel } from "../types";

const SEVERITY_PREFIX: Record<string, string> = {
  critical: "🔴",
  warning: "🟡",
  info: "🟢",
};

const SEVERITY_COLOR: Record<string, string> = {
  critical: "#b91c1c",
  warning: "#b45309",
  info: "#0072BB",
};

function friendlyTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
    });
  } catch {
    return iso;
  }
}

function extractUrl(text: string): string | null {
  const match = text.match(/https?:\/\/[^\s"']+/);
  return match ? match[0] : null;
}

function buildHtml(alert: Alert): string {
  const color = SEVERITY_COLOR[alert.severity] ?? "#0072BB";
  const url = extractUrl(alert.whatHappened);

  // Strip "Seen X time(s)..." and URLs from the one-liner so the headline reads clean.
  const headline = alert.whatHappened
    .replace(/\s*Seen \d+ time.*?affected\./, "")
    .replace(/\s*Details:\s*https?:\/\/\S+/, "")
    .trim();

  const actionBlock = alert.actionRequired
    ? `<div style="margin-top:20px;padding:14px 18px;background:#fff;border-left:3px solid ${color};font-size:14px;color:#111;line-height:1.5"><strong style="display:block;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:${color};margin-bottom:4px">Action needed</strong>${escape(alert.actionInstructions)}</div>`
    : "";

  const linkBlock = url
    ? `<div style="margin-top:14px"><a href="${escape(url)}" style="font-size:13px;color:${color};text-decoration:underline">View in Sentry →</a></div>`
    : "";

  return `<!doctype html><html><body style="margin:0;padding:24px;background:#faf9f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#111">
<div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:6px;overflow:hidden">
  <div style="background:${color};color:#fff;padding:10px 20px;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;font-weight:600">${alert.severity}</div>
  <div style="padding:24px 20px 20px">
    <h1 style="margin:0 0 8px;font-size:18px;line-height:1.35;color:#111;font-weight:600">${escape(alert.title)}</h1>
    <div style="font-size:15px;line-height:1.55;color:#374151">${escape(headline)}</div>
    ${linkBlock}
    ${actionBlock}
    <div style="margin-top:22px;font-size:11px;color:#9ca3af">${escape(friendlyTime(alert.timestamp))}</div>
  </div>
</div>
</body></html>`;
}

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function createEmailChannel(
  sendFn: (opts: { to: string; subject: string; text: string; html: string }) => Promise<void>,
  recipientEmail: string
): AlertChannel {
  return {
    name: "email",
    async send(alert: Alert): Promise<void> {
      const prefix = SEVERITY_PREFIX[alert.severity] ?? "⚠";
      const subject = `${prefix} ${alert.title}`;

      const headline = alert.whatHappened
        .replace(/\s*Seen \d+ time.*?affected\./, "")
        .replace(/\s*Details:\s*https?:\/\/\S+/, "")
        .trim();
      const url = extractUrl(alert.whatHappened);

      const text = [
        `[${alert.severity.toUpperCase()}] ${alert.title}`,
        "",
        headline,
        url ? `\nView: ${url}` : "",
        alert.actionRequired ? `\nAction needed: ${alert.actionInstructions}` : "",
        "",
        friendlyTime(alert.timestamp),
      ]
        .filter((l) => l !== null)
        .join("\n");

      const html = buildHtml(alert);

      await sendFn({ to: recipientEmail, subject, text, html });
    },
  };
}
