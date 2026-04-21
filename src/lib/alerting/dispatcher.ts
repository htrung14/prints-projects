import { createAlertDispatcher } from "./dispatch";
import { createTelegramChannel } from "./channels/telegram";
import { createEmailChannel } from "./channels/email";
import { createTriagedDispatcher } from "./triage";
import { getResend } from "@/lib/email/client";

const ALERT_FROM = "alerts@thaliabassim.com";

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
          from: ALERT_FROM,
          to: opts.to,
          subject: opts.subject,
          text: opts.text,
          html: opts.html,
        });
      }, ADMIN_EMAILS)
    );
  }

  const baseDispatcher = createAlertDispatcher({ channels });
  return createTriagedDispatcher(baseDispatcher);
}
