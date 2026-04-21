import { createAlertDispatcher } from "./dispatch";
import { createTelegramChannel } from "./channels/telegram";
import { createEmailChannel } from "./channels/email";
import { createNotionChannel } from "./channels/notion";
import { createTriagedDispatcher } from "./triage";
import { getResend, fromAddress } from "@/lib/email/client";

export function getDispatcher() {
  const { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, ADMIN_EMAILS } = process.env;

  const channels = [];

  if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
    channels.push(createTelegramChannel(TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID));
  }

  if (ADMIN_EMAILS) {
    channels.push(
      createEmailChannel(async (opts) => {
        const resend = getResend();
        await resend.emails.send({
          from: fromAddress(),
          to: opts.to,
          subject: opts.subject,
          text: opts.text,
        });
      }, ADMIN_EMAILS)
    );
  }

  channels.push(createNotionChannel());

  const baseDispatcher = createAlertDispatcher({ channels });
  return createTriagedDispatcher(baseDispatcher);
}
