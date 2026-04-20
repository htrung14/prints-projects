import type { Alert, AlertSeverity } from "./types";

export type TriageResult = {
  shouldNotify: boolean;
  revisedSeverity: AlertSeverity;
  summary: string;
  reasoning: string;
};

export interface IAlertDispatcher {
  send(alert: Alert): Promise<void>;
}

const SYSTEM_PROMPT = `You are an AI triage assistant for an alert system at a small art print shop.
The shop sells 25 limited-edition photo prints ($300 each, edition of 10). Run by one person (Hai).
Hai wants alerts ONLY about genuinely important or actionable things. Filter the noise.

Respond with ONLY a JSON object (no markdown, no explanation):
{"shouldNotify": boolean, "revisedSeverity": "critical"|"warning"|"info", "summary": "string", "reasoning": "string"}

Rules:
1. CRITICAL alerts: Always notify. Rewrite summary in casual direct language.
2. WARNING alerts: Use judgment.
   - "edition_low_stock": Notify first time per photo. "Heads up, 'Title' is down to 2 prints."
   - "webhook_retry": Don't notify unless attempt >= 3.
3. INFO alerts: Almost never notify.
   - "order_completed": Do NOT notify for standard orders.
   - EXCEPTION: If same customer buys 3+ prints, escalate to warning. "FYI, Jane just bought 3 copies — that's 30% of the edition."
4. Tone: Casual, direct, concise. No corporate jargon.`;

const passThrough = (alert: Alert, reasoning: string): TriageResult => ({
  shouldNotify: true,
  revisedSeverity: alert.severity,
  summary: alert.title,
  reasoning,
});

export async function triageAlert(alert: Alert): Promise<TriageResult> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return passThrough(alert, "Triage skipped: OPENROUTER_API_KEY not set.");
  }

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemma-4-31b-it:free",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Triage this alert:\n${JSON.stringify(alert, null, 2)}`,
          },
        ],
        max_tokens: 300,
        temperature: 0.1,
      }),
    });

    if (!res.ok) {
      throw new Error(`OpenRouter ${res.status}: ${await res.text()}`);
    }

    const data = await res.json();
    const text: string = data.choices?.[0]?.message?.content?.trim() ?? "";
    const jsonText = text.replace(/^```json\n?|```$/g, "").trim();
    const result = JSON.parse(jsonText) as TriageResult;

    if (
      typeof result.shouldNotify !== "boolean" ||
      !["critical", "warning", "info"].includes(result.revisedSeverity) ||
      typeof result.summary !== "string"
    ) {
      throw new Error("Invalid triage response shape");
    }

    result.reasoning = result.reasoning ?? "No reasoning provided";
    return result;
  } catch (err) {
    console.error("[triage] LLM call failed:", (err as Error).message);
    return passThrough(alert, `Triage failed: ${(err as Error).message}`);
  }
}

export function createTriagedDispatcher(baseDispatcher: IAlertDispatcher): IAlertDispatcher {
  return {
    async send(alert: Alert): Promise<void> {
      const triage = await triageAlert(alert);

      if (!triage.shouldNotify) return;

      const triagedAlert: Alert = {
        ...alert,
        severity: triage.revisedSeverity,
        title: triage.summary,
        metadata: {
          ...alert.metadata,
          _triageReasoning: triage.reasoning,
          _originalSeverity: alert.severity,
          _originalTitle: alert.title,
        },
      };

      await baseDispatcher.send(triagedAlert);
    },
  };
}
