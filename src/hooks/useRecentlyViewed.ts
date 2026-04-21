"use client";

const KEY = "at-tamassok-recent";
const MAX = 10;

function readSlugs(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === "string") : [];
  } catch {
    return [];
  }
}

export function useRecentlyViewed() {
  const addViewed = (slug: string) => {
    if (typeof window === "undefined") return;
    try {
      const current = readSlugs();
      const next = [slug, ...current.filter((s) => s !== slug)].slice(0, MAX);
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {}
  };

  const getRecent = (exclude: string): string[] => {
    return readSlugs()
      .filter((s) => s !== exclude)
      .slice(0, 4);
  };

  return { addViewed, getRecent };
}
