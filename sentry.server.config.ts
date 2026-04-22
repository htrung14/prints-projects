import * as Sentry from "@sentry/nextjs";

Sentry.init({
  // Only emit events in production. Local dev + tests don't push to the
  // shared prod Sentry project — otherwise a localhost crash (e.g. missing
  // RESEND_API_KEY while iterating on a dev route) fans out through the
  // alerting pipeline as if it were a live incident.
  enabled: process.env.NODE_ENV === "production",
  dsn: process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN,
  sendDefaultPii: false,
  tracesSampleRate: 0.1,
  includeLocalVariables: true,
});
