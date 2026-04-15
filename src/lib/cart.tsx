"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { CartLine, PaperType } from "./types";
import { getAllPhotos } from "./photos";
import { priceCents } from "./pricing";

type CartContextValue = {
  lines: CartLine[];
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  add: (line: CartLine) => void;
  remove: (index: number) => void;
  clear: () => void;
  subtotalCents: number;
  itemCount: number;
};

const STORAGE_KEY = "prints-projects.cart.v1";

const CartContext = createContext<CartContextValue | null>(null);

function readLines(): CartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CartLine[];
  } catch {
    return [];
  }
}

function writeLines(lines: CartLine[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  } catch {
    // ignore quota errors
  }
}

const subscribers = new Set<() => void>();
function notify() {
  subscribers.forEach((fn) => fn());
}

function subscribe(cb: () => void) {
  subscribers.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) cb();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    subscribers.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

function mergeLine(lines: CartLine[], incoming: CartLine): CartLine[] {
  const i = lines.findIndex(
    (l) =>
      l.photoSlug === incoming.photoSlug &&
      l.sizeId === incoming.sizeId &&
      l.paperId === incoming.paperId
  );
  if (i === -1) return [...lines, incoming];
  const next = lines.slice();
  next[i] = { ...next[i], quantity: next[i].quantity + incoming.quantity };
  return next;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const lines = useSyncExternalStore<CartLine[]>(
    subscribe,
    readLines,
    () => [] // server snapshot — empty cart on the first server render
  );
  const [drawerOpen, setDrawerOpen] = useState(false);

  const setLines = useCallback((next: CartLine[]) => {
    writeLines(next);
    notify();
  }, []);

  const add = useCallback(
    (line: CartLine) => {
      setLines(mergeLine(readLines(), line));
      setDrawerOpen(true);
    },
    [setLines]
  );

  const remove = useCallback(
    (index: number) => {
      setLines(readLines().filter((_, i) => i !== index));
    },
    [setLines]
  );

  const clear = useCallback(() => setLines([]), [setLines]);

  const subtotalCents = useMemo(() => {
    const photos = getAllPhotos();
    return lines.reduce((sum, line) => {
      const photo = photos.find((p) => p.slug === line.photoSlug);
      if (!photo) return sum;
      return sum + priceCents(photo, line.sizeId, line.paperId as PaperType) * line.quantity;
    }, 0);
  }, [lines]);

  const itemCount = useMemo(() => lines.reduce((n, l) => n + l.quantity, 0), [lines]);

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      drawerOpen,
      openDrawer: () => setDrawerOpen(true),
      closeDrawer: () => setDrawerOpen(false),
      add,
      remove,
      clear,
      subtotalCents,
      itemCount,
    }),
    [lines, drawerOpen, add, remove, clear, subtotalCents, itemCount]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
