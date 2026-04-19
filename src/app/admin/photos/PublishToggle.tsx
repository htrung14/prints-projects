"use client";

/**
 * Publish toggle for a single photo row in the admin list.
 *
 * Small client component - POSTs to the publish API route and refreshes the
 * RSC payload on success. We render the current state as plain text + an
 * underline; no pills per the Cargo aesthetic.
 */

import { useTransition } from "react";
import { useRouter } from "next/navigation";

export default function PublishToggle({
  photoId,
  isPublished,
}: {
  photoId: string;
  isPublished: boolean;
}) {
  const router = useRouter();
  const [isPending, start] = useTransition();

  function handleClick() {
    start(async () => {
      await fetch(`/api/admin/photos/${photoId}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !isPublished }),
      });
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={handleClick}
      className="text-xs underline underline-offset-4 disabled:opacity-50"
    >
      {isPending ? "…" : isPublished ? "published - unpublish" : "draft - publish"}
    </button>
  );
}
