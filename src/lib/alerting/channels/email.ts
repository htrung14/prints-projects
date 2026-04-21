import type { Alert, AlertChannel } from "../types";

const SEVERITY_PREFIX: Record<string, string> = {
  critical: "[CRITICAL]",
  warning: "[WARNING]",
  info: "[INFO]",
};

const SEVERITY_COLOR: Record<string, string> = {
  critical: "#b91c1c",
  warning: "#b45309",
  info: "#0072BB",
};

function buildHtml(alert: Alert): string {
  const color = SEVERITY_COLOR[alert.severity] ?? "#0072BB";
  const action = alert.actionRequired
    ? `<div style="margin-top:18px;padding:12px 16px;background:#fef2f2;border-left:3px solid #b91c1c;font-size:14px;color:#111"><strong>Action needed:</strong> ${escape(alert.actionInstructions)}</div>`
    : `<div style="margin-top:18px;font-size:14px;color:#6b7280">No action needed.</div>`;

  const metadataEntries = Object.entries(alert.metadata ?? {}).filter(([k]) => !k.startsWith("_"));
  const metadataHtml = metadataEntries.length
    ? `<table style="margin-top:18px;font-size:13px;color:#374151;border-collapse:collapse">${metadataEntries
        .map(
          ([k, v]) =>
            `<tr><td style="padding:4px 12px 4px 0;color:#6b7280">${escape(k)}</td><td style="padding:4px 0;font-family:ui-monospace,monospace">${escape(String(v))}</td></tr>`
        )
        .join("")}</table>`
    : "";

  const triageReasoning = alert.metadata?._triageReasoning
    ? `<div style="margin-top:18px;padding-top:14px;border-top:1px solid #e5e7eb;font-size:12px;color:#9ca3af;font-style:italic">Triage: ${escape(String(alert.metadata._triageReasoning))}</div>`
    : "";

  return `<!doctype html><html><body style="margin:0;padding:24px;background:#faf9f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#111">
<div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:6px;overflow:hidden">
  <div style="background:${color};color:#fff;padding:14px 20px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;font-weight:600">${alert.severity} — ${escape(alert.type)}</div>
  <div style="padding:24px 20px">
    <h1 style="margin:0 0 14px;font-size:20px;line-height:1.3;color:#111">${escape(alert.title)}</h1>
    <div style="font-size:15px;line-height:1.55;color:#374151">${escape(alert.whatHappened)}</div>
    <div style="margin-top:14px;font-size:14px;color:#6b7280"><strong style="color:#374151">Auto-handled:</strong> ${escape(alert.autoHandled)}</div>
    ${action}
    ${metadataHtml}
    ${triageReasoning}
    <div style="margin-top:22px;font-size:11px;color:#9ca3af;font-family:ui-monospace,monospace">${escape(alert.timestamp)}</div>
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

      const html = buildHtml(alert);

      await sendFn({ to: recipientEmail, subject, text, html });
    },
  };
}
