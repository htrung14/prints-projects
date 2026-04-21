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
  /**
   * Swap the paper on an existing line (used by the checkout-page paper
   * upsell). If the resulting variant collides with another line, quantities
   * merge; otherwise the line is replaced in-place so the order is stable.
   */
  updatePaper: (index: number, paperId: PaperType) => void;
  clear: () => void;
  subtotalCents: number;
  itemCount: number;
  // Monotonically increasing counter that ticks on each add; components
  // can watch this to trigger transient UI like the add-to-cart toast.
  addedAt: number;
};

const STORAGE_KEY = "prints-projects.cart.v1";

const CartContext = createContext<CartContextValue | null>(null);

// Stable empty-array sentinel so getSnapshot returns the same reference
// across calls when the cart is empty. useSyncExternalStore compares by
// Object.is; returning new arrays from getSnapshot causes React error #185
// ("getSnapshot should be cached") and infinite re-renders.
const EMPTY_LINES: readonly CartLine[] = Object.freeze([]);
const SERVER_SNAPSHOT: CartLine[] = EMPTY_LINES as CartLine[];

let cachedRaw: string | null = null;
let cachedLines: CartLine[] = SERVER_SNAPSHOT;

function readLines(): CartLine[] {
  if (typeof window === "undefined") return SERVER_SNAPSHOT;
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return SERVER_SNAPSHOT;
  }
  if (raw === cachedRaw) return cachedLines;
  cachedRaw = raw;
  if (!raw) {
    cachedLines = SERVER_SNAPSHOT;
    return cachedLines;
  }
  try {
    cachedLines = JSON.parse(raw) as CartLine[];
  } catch {
    cachedLines = SERVER_SNAPSHOT;
  }
  return cachedLines;
}

function getServerSnapshot(): CartLine[] {
  return SERVER_SNAPSHOT;
}

function writeLines(lines: CartLine[]): void {
  try {
    const next = JSON.stringify(lines);
    window.localStorage.setItem(STORAGE_KEY, next);
    cachedRaw = next;
    cachedLines = lines;
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
    if (e.key === STORAGE_KEY) {
      // Force cache invalidation so next read returns a new reference.
      cachedRaw = null;
      cb();
    }
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
  const lines = useSyncExternalStore<CartLine[]>(subscribe, readLines, getServerSnapshot);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [addedAt, setAddedAt] = useState(0);

  const setLines = useCallback((next: CartLine[]) => {
    writeLines(next);
    notify();
  }, []);

  const add = useCallback(
    (line: CartLine) => {
      setLines(mergeLine(readLines(), line));
      setAddedAt(Date.now());
    },
    [setLines]
  );

  const remove = useCallback(
    (index: number) => {
      setLines(readLines().filter((_, i) => i !== index));
    },
    [setLines]
  );

  const updatePaper = useCallback(
    (index: number, paperId: PaperType) => {
      const current = readLines();
      const target = current[index];
      if (!target) return;
      if (target.paperId === paperId) return;
      const swapped: CartLine = { ...target, paperId };
      // Check if an existing line at a different index already has this
      // exact variant - if so, merge quantities; otherwise replace in place.
      const collision = current.findIndex(
        (l, i) =>
          i !== index &&
          l.photoSlug === swapped.photoSlug &&
          l.sizeId === swapped.sizeId &&
          l.paperId === swapped.paperId
      );
      if (collision === -1) {
        const next = current.slice();
        next[index] = swapped;
        setLines(next);
        return;
      }
      const next = current.slice();
      next[collision] = {
        ...next[collision],
        quantity: next[collision].quantity + swapped.quantity,
      };
      next.splice(index, 1);
      setLines(next);
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
      updatePaper,
      clear,
      subtotalCents,
      itemCount,
      addedAt,
    }),
    [lines, drawerOpen, add, remove, updatePaper, clear, subtotalCents, itemCount, addedAt]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
