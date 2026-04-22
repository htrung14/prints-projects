import * as Sentry from "@sentry/nextjs";

Sentry.init({
  // Only emit events in production — see sentry.server.config.ts for rationale.
  enabled: process.env.NODE_ENV === "production",
  dsn: process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN,
  sendDefaultPii: false,
  tracesSampleRate: 0.1,
});
