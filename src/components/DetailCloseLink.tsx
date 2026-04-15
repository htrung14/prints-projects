"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

/**
 * Close control for the detail panel.
 * - In modal (intercepted route): calls router.back() to dismiss the overlay.
 * - On the full page: renders a plain Link to "/" so Cmd-click and
 *   right-click behave like normal browser links.
 */
export default function DetailCloseLink({ modal = false }: { modal?: boolean }) {
  const router = useRouter();
  if (modal) {
    return (
      <button
        type="button"
        onClick={() => router.back()}
        className="justify-self-end"
        aria-label="Close"
      >
        Close ✕
      </button>
    );
  }
  return (
    <Link href="/" className="justify-self-end">
      Close ✕
    </Link>
  );
}
