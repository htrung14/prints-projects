import { NextResponse } from "next/server";
import { systemErrorAlert } from "@/lib/alerting";
import { triageAlert } from "@/lib/alerting/triage";
import { createAlertDispatcher } from "@/lib/alerting/dispatch";
import { createTelegramChannel } from "@/lib/alerting/channels/telegram";
import { createEmailChannel } from "@/lib/alerting/channels/email";
import { createNotionChannel } from "@/lib/alerting/channels/notion";
import { getResend, fromAddress } from "@/lib/email/client";

export async function POST(req: Request) {
  const secret = req.headers.get("x-admin-secret");
  if (!secret || secret !== process.env.DISPATCH_SIGNING_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const alert = systemErrorAlert(
    "Test alert — verifying all channels are working",
    "test-alert endpoint"
  );

  // Step 1: Run triage and report what it decided
  let triageResult;
  try {
    triageResult = await triageAlert(alert);
  } catch (e) {
    return NextResponse.json({
      error: "triage_failed",
      message: (e as Error).message,
    });
  }

  // Step 2: Bypass triage — send directly to all channels and report per-channel results
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
          from: fromAddress(),
          to: opts.to,
          subject: opts.subject,
          text: opts.text,
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

  try {
    const notion = createNotionChannel();
    await notion.send(alert);
    channelResults.notion = "ok";
  } catch (e) {
    channelResults.notion = `error: ${(e as Error).message}`;
  }

  return NextResponse.json({
    triageResult,
    channelResults,
  });
}
