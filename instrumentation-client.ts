import * as Sentry from "@sentry/nextjs";

Sentry.init({
  // Only emit events in production — see sentry.server.config.ts for rationale.
  enabled: process.env.NODE_ENV === "production",
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  sendDefaultPii: false,
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.0,
  replaysOnErrorSampleRate: 1.0,
  integrations: [Sentry.replayIntegration()],
  beforeSend(event) {
    const msg = event.exception?.values?.[0]?.value ?? "";
    if (msg.includes("__firefox__")) return null;
    return event;
  },
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
