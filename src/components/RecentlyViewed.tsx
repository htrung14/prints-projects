"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import Link from "next/link";
import type { Photo } from "@/lib/types";

const KEY = "at-tamassok-recent";
const MAX = 10;

function getSnapshot(): string {
  if (typeof window === "undefined") return "[]";
  return localStorage.getItem(KEY) ?? "[]";
}

function subscribe(cb: () => void) {
  const handler = (e: StorageEvent) => {
    if (e.key === KEY) cb();
  };
  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
}

function addViewed(slug: string) {
  if (typeof window === "undefined") return;
  try {
    const current: string[] = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    const next = [slug, ...current.filter((s) => s !== slug)].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
}

type Props = { currentSlug: string; allPhotos: Photo[] };

export function RecentlyViewed({ currentSlug, allPhotos }: Props) {
  const raw = useSyncExternalStore(subscribe, getSnapshot, () => "[]");
  const registered = useRef(false);

  useEffect(() => {
    if (!registered.current) {
      addViewed(currentSlug);
      registered.current = true;
    }
  }, [currentSlug]);

  const slugs: string[] = (() => {
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  })();

  const photos = slugs
    .filter((s) => s !== currentSlug)
    .slice(0, 4)
    .map((s) => allPhotos.find((p) => p.slug === s))
    .filter((p): p is Photo => !!p);

  if (photos.length < 2) return null;

  return (
    <div style={{ marginTop: 48 }}>
      <span
        className="font-mono"
        style={{ fontSize: 11, color: "var(--i4)", display: "block", marginBottom: 12 }}
      >
        Recently viewed
      </span>
      <div style={{ display: "flex", gap: 8 }}>
        {photos.map((p) => (
          <Link key={p.slug} href={`/photos/${p.slug}`} style={{ display: "block", width: 80 }}>
            <div style={{ aspectRatio: "4/5", background: "#ebe9e4", overflow: "hidden" }}>
              <img
                src={p.imageUrl}
                alt={p.title}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                loading="lazy"
              />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
