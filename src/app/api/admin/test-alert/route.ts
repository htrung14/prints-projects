import { NextResponse } from "next/server";
import { triageAlert } from "@/lib/alerting/triage";
import { createTelegramChannel } from "@/lib/alerting/channels/telegram";
import { createEmailChannel } from "@/lib/alerting/channels/email";
import { getResend } from "@/lib/email/client";

const ALERT_FROM = "alerts@thaliabassim.com";

export async function POST(req: Request) {
  const secret = req.headers.get("x-admin-secret");
  if (!secret || secret !== process.env.DISPATCH_SIGNING_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const alert = {
    type: "system_error" as const,
    severity: "info" as const,
    title: "TEST — no action needed",
    whatHappened: "Test alert verifying all channels are working.",
    autoHandled: "Nothing to handle — this is a test.",
    actionRequired: false,
    actionInstructions: "None — this is a test.",
    timestamp: new Date().toISOString(),
  };

  let triageResult;
  try {
    triageResult = await triageAlert(alert);
  } catch (e) {
    return NextResponse.json({
      error: "triage_failed",
      message: (e as Error).message,
    });
  }

  const channelResults: Record<string, string> = {};

  const { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, ADMIN_EMAILS } = process.env;

  if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
    try {
      const tg = createTelegramChannel(TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID);
      await tg.send(alert);
      channelResults.telegram = "ok";
    } catch (e) {
      channelResults.telegram = `error: ${(e as Error).message}`;
    }
  } else {
    channelResults.telegram = `skipped: token=${!!TELEGRAM_BOT_TOKEN}, chatId=${!!TELEGRAM_CHAT_ID}`;
  }

  if (ADMIN_EMAILS) {
    try {
      const resend = getResend();
      const email = createEmailChannel(async (opts) => {
        await resend.emails.send({
          from: ALERT_FROM,
          to: opts.to,
          subject: opts.subject,
          text: opts.text,
          html: opts.html,
        });
      }, ADMIN_EMAILS);
      await email.send(alert);
      channelResults.email = "ok";
    } catch (e) {
      channelResults.email = `error: ${(e as Error).message}`;
    }
  } else {
    channelResults.email = "skipped: ADMIN_EMAILS not set";
  }

  return NextResponse.json({ triageResult, channelResults });
}
