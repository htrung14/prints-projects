"use client";

import { useState, useEffect, useCallback } from "react";

const KEY = "at-tamassok-saved";

function read(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function useSaved() {
  const [savedSlugs, setSavedSlugs] = useState<string[]>([]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSavedSlugs(read());
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setSavedSlugs(read());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const toggleSave = useCallback((slug: string) => {
    setSavedSlugs((prev) => {
      const next = prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug];
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const isSaved = useCallback((slug: string) => savedSlugs.includes(slug), [savedSlugs]);

  return { savedSlugs, toggleSave, isSaved };
}
