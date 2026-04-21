/**
 * Countries we ship to, with flag + display name, keyed by ISO 3166-1 alpha-2.
 *
 * Single source of truth for the UI (`/checkout` country dropdown + admin
 * `/admin/orders` list column). Mirrors the tier arrays declared in
 * `src/lib/stripe/checkout.ts`; if you add a country here, add it to the
 * matching tier array there too.
 */

export type CountryEntry = { flag: string; name: string };

export const COUNTRY_MAP: Record<string, CountryEntry> = {
  US: { flag: "🇺🇸", name: "United States" },
  CA: { flag: "🇨🇦", name: "Canada" },
  GB: { flag: "🇬🇧", name: "United Kingdom" },
  IE: { flag: "🇮🇪", name: "Ireland" },
  DE: { flag: "🇩🇪", name: "Germany" },
  FR: { flag: "🇫🇷", name: "France" },
  NL: { flag: "🇳🇱", name: "Netherlands" },
  BE: { flag: "🇧🇪", name: "Belgium" },
  LU: { flag: "🇱🇺", name: "Luxembourg" },
  IT: { flag: "🇮🇹", name: "Italy" },
  ES: { flag: "🇪🇸", name: "Spain" },
  PT: { flag: "🇵🇹", name: "Portugal" },
  AT: { flag: "🇦🇹", name: "Austria" },
  DK: { flag: "🇩🇰", name: "Denmark" },
  SE: { flag: "🇸🇪", name: "Sweden" },
  FI: { flag: "🇫🇮", name: "Finland" },
  NO: { flag: "🇳🇴", name: "Norway" },
  CH: { flag: "🇨🇭", name: "Switzerland" },
  IS: { flag: "🇮🇸", name: "Iceland" },
  PL: { flag: "🇵🇱", name: "Poland" },
  CZ: { flag: "🇨🇿", name: "Czechia" },
  GR: { flag: "🇬🇷", name: "Greece" },
  HU: { flag: "🇭🇺", name: "Hungary" },
  SK: { flag: "🇸🇰", name: "Slovakia" },
  SI: { flag: "🇸🇮", name: "Slovenia" },
  HR: { flag: "🇭🇷", name: "Croatia" },
  EE: { flag: "🇪🇪", name: "Estonia" },
  LV: { flag: "🇱🇻", name: "Latvia" },
  LT: { flag: "🇱🇹", name: "Lithuania" },
  RO: { flag: "🇷🇴", name: "Romania" },
  BG: { flag: "🇧🇬", name: "Bulgaria" },
  CY: { flag: "🇨🇾", name: "Cyprus" },
  MT: { flag: "🇲🇹", name: "Malta" },
  AU: { flag: "🇦🇺", name: "Australia" },
  NZ: { flag: "🇳🇿", name: "New Zealand" },
  JP: { flag: "🇯🇵", name: "Japan" },
  SG: { flag: "🇸🇬", name: "Singapore" },
  HK: { flag: "🇭🇰", name: "Hong Kong" },
  KR: { flag: "🇰🇷", name: "South Korea" },
  TW: { flag: "🇹🇼", name: "Taiwan" },
  TH: { flag: "🇹🇭", name: "Thailand" },
  MY: { flag: "🇲🇾", name: "Malaysia" },
  IL: { flag: "🇮🇱", name: "Israel" },
  AE: { flag: "🇦🇪", name: "United Arab Emirates" },
  SA: { flag: "🇸🇦", name: "Saudi Arabia" },
  MX: { flag: "🇲🇽", name: "Mexico" },
  BR: { flag: "🇧🇷", name: "Brazil" },
  AR: { flag: "🇦🇷", name: "Argentina" },
  CL: { flag: "🇨🇱", name: "Chile" },
  CO: { flag: "🇨🇴", name: "Colombia" },
  ZA: { flag: "🇿🇦", name: "South Africa" },
  IN: { flag: "🇮🇳", name: "India" },
  PH: { flag: "🇵🇭", name: "Philippines" },
};

export function formatCountry(raw: string | null | undefined): string {
  const code = (raw ?? "").toUpperCase().trim();
  const entry = COUNTRY_MAP[code];
  if (!entry) return code || "—";
  return `${entry.flag} ${entry.name}`;
}

/** ISO codes of every country we ship to, in a stable order for UIs. */
export const SUPPORTED_COUNTRY_CODES: ReadonlyArray<string> = Object.keys(COUNTRY_MAP);

/** Country entries sorted alphabetically by display name, US pinned first. */
export const COUNTRY_OPTIONS: ReadonlyArray<{ code: string; flag: string; name: string }> = (() => {
  const all = SUPPORTED_COUNTRY_CODES.map((code) => ({
    code,
    flag: COUNTRY_MAP[code]!.flag,
    name: COUNTRY_MAP[code]!.name,
  }));
  const us = all.find((c) => c.code === "US");
  const rest = all.filter((c) => c.code !== "US").sort((a, b) => a.name.localeCompare(b.name));
  return us ? [us, ...rest] : rest;
})();
