"use client";

import { useEffect, useState } from "react";

/**
 * Floating feedback button — bottom-right.
 * Demo: opens a mailto: with the current page URL and viewport size pre-filled.
 * Upgrade path: POST to /api/feedback once Resend is wired (Phase 2).
 */
export default function FeedbackButton() {
  const [href, setHref] = useState("mailto:");

  useEffect(() => {
    const update = () => {
      const url = window.location.href;
      const viewport = `${window.innerWidth}×${window.innerHeight}`;
      const ua = window.navigator.userAgent;
      const subject = encodeURIComponent("Feedback on prints-projects demo");
      const body = encodeURIComponent(
        `Page: ${url}\nViewport: ${viewport}\nUser agent: ${ua}\n\n--- Comments below ---\n\n`
      );
      // Demo: stakeholder fills FEEDBACK_EMAIL_TO env locally, or we leave the recipient blank.
      setHref(`mailto:?subject=${subject}&body=${body}`);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return (
    <a
      href={href}
      className="fixed bottom-5 right-5 z-50 inline-flex items-center gap-2 border border-[var(--ink)] bg-[var(--bg)] px-3 py-2 text-[var(--ink-strong)] shadow-[0_0_0_1px_var(--ink-line)]"
    >
      <span aria-hidden>✎</span>
      <span>Send feedback</span>
    </a>
  );
}
