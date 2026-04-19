"use client";

import { useEffect } from "react";

/**
 * Site-wide image-download deterrent.
 *
 * Mounts once in the root layout. Listens on document for `contextmenu` and
 * `dragstart` and cancels them when the event target is an <img>. Paired with
 * the CSS `.img-protected` class (user-select + user-drag blocks) on the
 * surfaces we especially care about (hero, grid thumbnails, product detail).
 *
 * This does NOT replace server-side controls - anyone in devtools can still
 * pull the 2000px q70 preview bitmap. It just removes the "save image as"
 * one-click on the landing/grid/product pages, which is what casual visitors
 * actually reach for. Real print-quality files live behind signed R2 URLs
 * scoped to the printer's dispatch link.
 */
export default function ImageProtect() {
  useEffect(() => {
    const onContextMenu = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && t.tagName === "IMG") e.preventDefault();
    };
    const onDragStart = (e: DragEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && t.tagName === "IMG") e.preventDefault();
    };
    document.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("dragstart", onDragStart);
    return () => {
      document.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("dragstart", onDragStart);
    };
  }, []);
  return null;
}
