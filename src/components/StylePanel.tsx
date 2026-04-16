"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "press-style";

type StyleState = {
  accent: string;
  bg: string;
  ink: number;
  headingWeight: number;
  bodyWeight: number;
  headingScale: number;
  sectionPy: number;
  showRules: boolean;
  bgSoft: string;
  footerGap: number;
  footerSize: number;
  footerPy: number;
  footerWeight: number;
  footerBorder: boolean;
};

const DEFAULTS: StyleState = {
  accent: "#1529db",
  bg: "#ffffff",
  ink: 0.78,
  headingWeight: 900,
  bodyWeight: 900,
  headingScale: 1,
  sectionPy: 1,
  showRules: true,
  bgSoft: "#f4f4f0",
  footerGap: 56,
  footerSize: 12,
  footerPy: 32,
  footerWeight: 400,
  footerBorder: false,
};

const BOUNDS = {
  ink: { min: 0.6, max: 1, step: 0.02 },
  headingWeight: { min: 400, max: 900, step: 100 },
  bodyWeight: { min: 400, max: 900, step: 100 },
  headingScale: { min: 0.8, max: 1.4, step: 0.05 },
  sectionPy: { min: 0.6, max: 1.5, step: 0.1 },
  footerGap: { min: 16, max: 80, step: 4 },
  footerSize: { min: 10, max: 16, step: 1 },
  footerPy: { min: 16, max: 64, step: 4 },
  footerWeight: { min: 400, max: 900, step: 100 },
};

const ACCENT_PRESETS = [
  "#1529db",
  "#2a4d8f",
  "#1e40ff",
  "#000000",
  "#8b2a2a",
  "#2a5a3f",
  "#3f4a5a",
  "#c4540a",
];

const BG_PRESETS = [
  "#ffffff",
  "#fafaf7",
  "#f4f4f0",
  "#f0ede6",
  "#e8e4dc",
  "#1a1a1a",
  "#0d0d0d",
  "#f7f3ee",
];

function load(): StyleState {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {}
  return DEFAULTS;
}

function applyToDOM(s: StyleState) {
  const r = document.documentElement;
  r.style.setProperty("--accent", s.accent);
  r.style.setProperty("--bg", s.bg);
  r.style.setProperty("--bg-soft", s.bgSoft);
  r.style.setProperty("--ink", `rgba(0,0,0,${s.ink})`);
  r.style.setProperty("--ink-strong", `rgba(0,0,0,${Math.min(s.ink + 0.17, 1)})`);
  r.style.setProperty("--ink-faint", `rgba(0,0,0,${Math.max(s.ink - 0.28, 0.22)})`);
  r.style.setProperty("--ink-line", `rgba(0,0,0,${Math.max(s.ink - 0.6, 0.08)})`);
  r.style.setProperty("--heading-weight", String(s.headingWeight));
  r.style.setProperty("--body-weight", String(s.bodyWeight));
  r.style.setProperty("--heading-scale", String(s.headingScale));
  r.style.setProperty("--section-py-scale", String(s.sectionPy));
  r.style.setProperty("--footer-gap", `${s.footerGap}px`);
  r.style.setProperty("--footer-size", `${s.footerSize}px`);
  r.style.setProperty("--footer-py", `${s.footerPy}px`);
  r.style.setProperty("--footer-weight", String(s.footerWeight));
  r.style.setProperty("--footer-border", s.footerBorder ? "1px" : "0px");
  document.body.style.background = s.bg;
  document.body.style.color = `rgba(0,0,0,${s.ink})`;
  document.body.style.fontWeight = String(s.bodyWeight);

  const isDark = parseInt(s.bg.replace("#", ""), 16) < 0x888888;
  if (isDark) {
    r.style.setProperty("--ink", `rgba(255,255,255,${s.ink})`);
    r.style.setProperty("--ink-strong", `rgba(255,255,255,${Math.min(s.ink + 0.17, 1)})`);
    r.style.setProperty("--ink-faint", `rgba(255,255,255,${Math.max(s.ink - 0.28, 0.3)})`);
    r.style.setProperty("--ink-line", `rgba(255,255,255,${Math.max(s.ink - 0.6, 0.12)})`);
    document.body.style.color = `rgba(255,255,255,${s.ink})`;
  }
}

export default function StylePanel() {
  const [s, setS] = useState<StyleState>(() => load());
  const [open, setOpen] = useState(false);

  useEffect(() => {
    applyToDOM(s);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function update(patch: Partial<StyleState>) {
    setS((prev) => {
      const next = { ...prev, ...patch };
      applyToDOM(next);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }

  function reset() {
    setS(DEFAULTS);
    applyToDOM(DEFAULTS);
    localStorage.removeItem(STORAGE_KEY);
  }

  return (
    <div
      className="fixed bottom-4 right-4 z-[70]"
      style={{ fontSize: "11px", fontWeight: 400, lineHeight: 1.4, color: "#333" }}
    >
      {open ? (
        <div
          className="flex flex-col gap-3 border bg-white p-4 shadow-lg"
          style={{ width: 260, borderColor: "#ddd", maxHeight: "80vh", overflowY: "auto" }}
        >
          <div className="flex items-center justify-between">
            <span
              style={{
                fontWeight: 700,
                fontSize: "12px",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              Style panel
            </span>
            <button type="button" onClick={() => setOpen(false)} style={{ color: "#999" }}>
              ✕
            </button>
          </div>

          {/* Accent color */}
          <Label text="Accent color" />
          <div className="grid grid-cols-8 gap-1">
            {ACCENT_PRESETS.map((c) => (
              <Swatch
                key={c}
                color={c}
                active={s.accent === c}
                onClick={() => update({ accent: c })}
              />
            ))}
          </div>
          <input
            type="color"
            value={s.accent}
            onChange={(e) => update({ accent: e.target.value })}
            className="h-6 w-full cursor-pointer"
          />

          {/* Background */}
          <Label text="Background" />
          <div className="grid grid-cols-8 gap-1">
            {BG_PRESETS.map((c) => (
              <Swatch key={c} color={c} active={s.bg === c} onClick={() => update({ bg: c })} />
            ))}
          </div>

          {/* Ink darkness */}
          <Slider
            label={`Ink darkness (${s.ink.toFixed(2)})`}
            value={s.ink}
            {...BOUNDS.ink}
            onChange={(v) => update({ ink: v })}
          />

          {/* Heading weight */}
          <Slider
            label={`Heading weight (${s.headingWeight})`}
            value={s.headingWeight}
            {...BOUNDS.headingWeight}
            onChange={(v) => update({ headingWeight: v })}
          />

          {/* Body weight */}
          <Slider
            label={`Body weight (${s.bodyWeight})`}
            value={s.bodyWeight}
            {...BOUNDS.bodyWeight}
            onChange={(v) => update({ bodyWeight: v })}
          />

          {/* Heading scale */}
          <Slider
            label={`Heading scale (${s.headingScale.toFixed(2)}×)`}
            value={s.headingScale}
            {...BOUNDS.headingScale}
            onChange={(v) => update({ headingScale: v })}
          />

          {/* Section spacing */}
          <Slider
            label={`Section spacing (${s.sectionPy.toFixed(1)}×)`}
            value={s.sectionPy}
            {...BOUNDS.sectionPy}
            onChange={(v) => update({ sectionPy: v })}
          />

          {/* Show/hide section rules */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={s.showRules}
              onChange={(e) => update({ showRules: e.target.checked })}
            />
            Section divider lines
          </label>

          {/* FOOTER */}
          <div style={{ borderTop: "1px solid #ddd", paddingTop: "8px", marginTop: "4px" }}>
            <Label text="Footer" />
          </div>

          <Slider
            label={`Link gap (${s.footerGap}px)`}
            value={s.footerGap}
            {...BOUNDS.footerGap}
            onChange={(v) => update({ footerGap: v })}
          />

          <Slider
            label={`Font size (${s.footerSize}px)`}
            value={s.footerSize}
            {...BOUNDS.footerSize}
            onChange={(v) => update({ footerSize: v })}
          />

          <Slider
            label={`Padding (${s.footerPy}px)`}
            value={s.footerPy}
            {...BOUNDS.footerPy}
            onChange={(v) => update({ footerPy: v })}
          />

          <Slider
            label={`Weight (${s.footerWeight})`}
            value={s.footerWeight}
            {...BOUNDS.footerWeight}
            onChange={(v) => update({ footerWeight: v })}
          />

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={s.footerBorder}
              onChange={(e) => update({ footerBorder: e.target.checked })}
            />
            Top border line
          </label>

          <button
            type="button"
            onClick={reset}
            className="mt-1 border px-2 py-1 hover:opacity-70"
            style={{ borderColor: "#ddd", color: "#999" }}
          >
            Reset all
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="border bg-white px-3 py-2 shadow-sm hover:opacity-80"
          style={{ borderColor: "#ddd" }}
        >
          <span style={{ fontWeight: 700, fontSize: "11px" }}>Style</span>
        </button>
      )}
    </div>
  );
}

function Label({ text }: { text: string }) {
  return (
    <div
      style={{
        fontWeight: 700,
        fontSize: "10px",
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        color: "#888",
        marginTop: "4px",
      }}
    >
      {text}
    </div>
  );
}

function Swatch({
  color,
  active,
  onClick,
}: {
  color: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-6 w-full border"
      style={{
        backgroundColor: color,
        borderColor: active ? "#1529db" : "#ddd",
        borderWidth: active ? "2px" : "1px",
      }}
    />
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div
        style={{
          fontSize: "10px",
          fontWeight: 700,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          color: "#888",
        }}
      >
        {label}
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full cursor-pointer"
        style={{ accentColor: "#1529db" }}
      />
    </div>
  );
}
