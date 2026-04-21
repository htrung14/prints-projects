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

function parseTriageResponse(text: string): TriageResult {
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
}

export async function triageAlert(alert: Alert): Promise<TriageResult> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    return passThrough(alert, "GOOGLE_AI_API_KEY not set — skipping triage");
  }

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [
            { parts: [{ text: `Triage this alert:\n${JSON.stringify(alert, null, 2)}` }] },
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 500,
            responseMimeType: "application/json",
            thinkingConfig: { thinkingBudget: 0 },
          },
        }),
      }
    );

    if (!res.ok) throw new Error(`Google AI ${res.status}: ${await res.text()}`);

    const data = await res.json();
    const text: string = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
    return parseTriageResponse(text);
  } catch (err) {
    console.error("[triage] Google AI failed:", (err as Error).message);
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
