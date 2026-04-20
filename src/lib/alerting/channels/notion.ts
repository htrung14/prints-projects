import type { Alert, AlertChannel } from "../types";

export type NotionAlertRow = {
  type: string;
  severity: string;
  title: string;
  what_happened: string;
  auto_handled: string;
  action_required: boolean;
  action_instructions: string;
  timestamp: string;
  metadata: string;
  ai_reasoning?: string;
};

const NOTION_DATABASE_ID = "455ac5c2a9f145b9bf8834c4db455306";

export function createNotionChannel(): AlertChannel {
  return {
    name: "notion",
    async send(alert: Alert): Promise<void> {
      const apiKey = process.env.NOTION_API_KEY;
      if (!apiKey) {
        console.log("[ALERT/NOTION] skipped — NOTION_API_KEY not set");
        return;
      }

      const res = await fetch("https://api.notion.com/v1/pages", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "Notion-Version": "2022-06-28",
        },
        body: JSON.stringify({
          parent: { database_id: NOTION_DATABASE_ID },
          properties: {
            Alert: { title: [{ text: { content: alert.title } }] },
            Type: { select: { name: alert.type } },
            Severity: { select: { name: alert.severity } },
            "Action required": { checkbox: alert.actionRequired },
            "What happened": { rich_text: [{ text: { content: truncate(alert.whatHappened) } }] },
            "Auto-handled": { rich_text: [{ text: { content: truncate(alert.autoHandled) } }] },
            "Action instructions": {
              rich_text: [{ text: { content: truncate(alert.actionInstructions) } }],
            },
            "AI reasoning": {
              rich_text: [
                { text: { content: truncate(String(alert.metadata?._triageReasoning ?? "")) } },
              ],
            },
            Timestamp: { date: { start: alert.timestamp } },
            Metadata: {
              rich_text: [{ text: { content: truncate(JSON.stringify(alert.metadata ?? {})) } }],
            },
          },
        }),
      });

      if (!res.ok) {
        const body = await res.text();
        throw new Error(`Notion insert failed (${res.status}): ${body}`);
      }
    },
  };
}

function truncate(s: string, max = 2000): string {
  return s.length > max ? s.slice(0, max - 3) + "..." : s;
}
