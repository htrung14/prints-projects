"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "dev-accent";
const DEFAULT = "#2a4d8f";

const PRESETS = [
  { name: "Muted blue", value: "#2a4d8f" },
  { name: "Deep navy", value: "#1b2f5a" },
  { name: "Royal", value: "#1e40ff" },
  { name: "Cobalt", value: "#2250e0" },
  { name: "Slate", value: "#3f4a5a" },
  { name: "Black (default)", value: "rgba(0,0,0,0.95)" },
  { name: "Ink red", value: "#8b2a2a" },
  { name: "Forest", value: "#2a5a3f" },
];

export default function AccentPicker() {
  const [color, setColor] = useState(() => {
    if (typeof window === "undefined") return DEFAULT;
    return window.localStorage.getItem(STORAGE_KEY) ?? DEFAULT;
  });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (color !== DEFAULT) {
      document.documentElement.style.setProperty("--accent", color);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function apply(next: string) {
    setColor(next);
    document.documentElement.style.setProperty("--accent", next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }

  function reset() {
    setColor(DEFAULT);
    document.documentElement.style.removeProperty("--accent");
    window.localStorage.removeItem(STORAGE_KEY);
  }

  return (
    <div
      className="fixed bottom-4 left-4 z-[70]"
      style={{ fontSize: "12px", fontWeight: 400, lineHeight: 1.4 }}
    >
      {open ? (
        <div
          className="flex flex-col gap-3 border border-ink-line bg-bg p-3 shadow-lg"
          style={{ width: 220 }}
        >
          <div className="flex items-center justify-between">
            <span className="label-caps">Dev · Accent</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-ink-faint"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          <label className="flex items-center gap-2">
            <input
              type="color"
              value={color.startsWith("#") ? color : "#2a4d8f"}
              onChange={(e) => apply(e.target.value)}
              className="h-8 w-10 cursor-pointer border border-ink-line"
            />
            <input
              type="text"
              value={color}
              onChange={(e) => apply(e.target.value)}
              className="flex-1 border border-ink-line px-2 py-1"
              style={{ fontFamily: "var(--font-geist-mono)", fontSize: "11px" }}
            />
          </label>

          <div className="grid grid-cols-4 gap-1.5">
            {PRESETS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => apply(p.value)}
                title={`${p.name} · ${p.value}`}
                className="h-7 w-full border border-ink-line transition-transform hover:scale-105"
                style={{ backgroundColor: p.value }}
                aria-label={p.name}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={reset}
            className="border border-ink-line px-2 py-1 text-ink-faint hover:opacity-70"
          >
            Reset to default
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 border border-ink-line bg-bg px-3 py-2 shadow-sm hover:opacity-80"
          aria-label="Open accent picker"
        >
          <span className="h-4 w-4 border border-ink-line" style={{ backgroundColor: color }} />
          <span className="text-ink-faint">Accent</span>
        </button>
      )}
    </div>
  );
}
