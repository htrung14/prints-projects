/**
 * Countries we ship to, with flag, display name, and shipping tier.
 *
 * Single source of truth for both the UI (`/checkout` country dropdown,
 * admin `/admin/orders` list) AND the Stripe tier arrays in
 * `src/lib/stripe/checkout.ts`. Add a country here and it flows to both.
 */

export type ShippingTier = "US" | "CA" | "EU_UK" | "AU_ROW";
export type CountryEntry = { flag: string; name: string; tier: ShippingTier };

export const COUNTRY_MAP: Record<string, CountryEntry> = {
  US: { flag: "\u{1f1fa}\u{1f1f8}", name: "United States", tier: "US" },
  CA: { flag: "\u{1f1e8}\u{1f1e6}", name: "Canada", tier: "CA" },
  GB: { flag: "\u{1f1ec}\u{1f1e7}", name: "United Kingdom", tier: "EU_UK" },
  IE: { flag: "\u{1f1ee}\u{1f1ea}", name: "Ireland", tier: "EU_UK" },
  DE: { flag: "\u{1f1e9}\u{1f1ea}", name: "Germany", tier: "EU_UK" },
  FR: { flag: "\u{1f1eb}\u{1f1f7}", name: "France", tier: "EU_UK" },
  NL: { flag: "\u{1f1f3}\u{1f1f1}", name: "Netherlands", tier: "EU_UK" },
  BE: { flag: "\u{1f1e7}\u{1f1ea}", name: "Belgium", tier: "EU_UK" },
  LU: { flag: "\u{1f1f1}\u{1f1fa}", name: "Luxembourg", tier: "EU_UK" },
  IT: { flag: "\u{1f1ee}\u{1f1f9}", name: "Italy", tier: "EU_UK" },
  ES: { flag: "\u{1f1ea}\u{1f1f8}", name: "Spain", tier: "EU_UK" },
  PT: { flag: "\u{1f1f5}\u{1f1f9}", name: "Portugal", tier: "EU_UK" },
  AT: { flag: "\u{1f1e6}\u{1f1f9}", name: "Austria", tier: "EU_UK" },
  DK: { flag: "\u{1f1e9}\u{1f1f0}", name: "Denmark", tier: "EU_UK" },
  SE: { flag: "\u{1f1f8}\u{1f1ea}", name: "Sweden", tier: "EU_UK" },
  FI: { flag: "\u{1f1eb}\u{1f1ee}", name: "Finland", tier: "EU_UK" },
  NO: { flag: "\u{1f1f3}\u{1f1f4}", name: "Norway", tier: "EU_UK" },
  CH: { flag: "\u{1f1e8}\u{1f1ed}", name: "Switzerland", tier: "EU_UK" },
  IS: { flag: "\u{1f1ee}\u{1f1f8}", name: "Iceland", tier: "EU_UK" },
  PL: { flag: "\u{1f1f5}\u{1f1f1}", name: "Poland", tier: "EU_UK" },
  CZ: { flag: "\u{1f1e8}\u{1f1ff}", name: "Czechia", tier: "EU_UK" },
  GR: { flag: "\u{1f1ec}\u{1f1f7}", name: "Greece", tier: "EU_UK" },
  HU: { flag: "\u{1f1ed}\u{1f1fa}", name: "Hungary", tier: "EU_UK" },
  SK: { flag: "\u{1f1f8}\u{1f1f0}", name: "Slovakia", tier: "EU_UK" },
  SI: { flag: "\u{1f1f8}\u{1f1ee}", name: "Slovenia", tier: "EU_UK" },
  HR: { flag: "\u{1f1ed}\u{1f1f7}", name: "Croatia", tier: "EU_UK" },
  EE: { flag: "\u{1f1ea}\u{1f1ea}", name: "Estonia", tier: "EU_UK" },
  LV: { flag: "\u{1f1f1}\u{1f1fb}", name: "Latvia", tier: "EU_UK" },
  LT: { flag: "\u{1f1f1}\u{1f1f9}", name: "Lithuania", tier: "EU_UK" },
  RO: { flag: "\u{1f1f7}\u{1f1f4}", name: "Romania", tier: "EU_UK" },
  BG: { flag: "\u{1f1e7}\u{1f1ec}", name: "Bulgaria", tier: "EU_UK" },
  CY: { flag: "\u{1f1e8}\u{1f1fe}", name: "Cyprus", tier: "EU_UK" },
  MT: { flag: "\u{1f1f2}\u{1f1f9}", name: "Malta", tier: "EU_UK" },
  AU: { flag: "\u{1f1e6}\u{1f1fa}", name: "Australia", tier: "AU_ROW" },
  NZ: { flag: "\u{1f1f3}\u{1f1ff}", name: "New Zealand", tier: "AU_ROW" },
  JP: { flag: "\u{1f1ef}\u{1f1f5}", name: "Japan", tier: "AU_ROW" },
  SG: { flag: "\u{1f1f8}\u{1f1ec}", name: "Singapore", tier: "AU_ROW" },
  HK: { flag: "\u{1f1ed}\u{1f1f0}", name: "Hong Kong", tier: "AU_ROW" },
  KR: { flag: "\u{1f1f0}\u{1f1f7}", name: "South Korea", tier: "AU_ROW" },
  TW: { flag: "\u{1f1f9}\u{1f1fc}", name: "Taiwan", tier: "AU_ROW" },
  TH: { flag: "\u{1f1f9}\u{1f1ed}", name: "Thailand", tier: "AU_ROW" },
  MY: { flag: "\u{1f1f2}\u{1f1fe}", name: "Malaysia", tier: "AU_ROW" },
  IL: { flag: "\u{1f1ee}\u{1f1f1}", name: "Israel", tier: "AU_ROW" },
  AE: { flag: "\u{1f1e6}\u{1f1ea}", name: "United Arab Emirates", tier: "AU_ROW" },
  SA: { flag: "\u{1f1f8}\u{1f1e6}", name: "Saudi Arabia", tier: "AU_ROW" },
  MX: { flag: "\u{1f1f2}\u{1f1fd}", name: "Mexico", tier: "AU_ROW" },
  BR: { flag: "\u{1f1e7}\u{1f1f7}", name: "Brazil", tier: "AU_ROW" },
  AR: { flag: "\u{1f1e6}\u{1f1f7}", name: "Argentina", tier: "AU_ROW" },
  CL: { flag: "\u{1f1e8}\u{1f1f1}", name: "Chile", tier: "AU_ROW" },
  CO: { flag: "\u{1f1e8}\u{1f1f4}", name: "Colombia", tier: "AU_ROW" },
  ZA: { flag: "\u{1f1ff}\u{1f1e6}", name: "South Africa", tier: "AU_ROW" },
  IN: { flag: "\u{1f1ee}\u{1f1f3}", name: "India", tier: "AU_ROW" },
  PH: { flag: "\u{1f1f5}\u{1f1ed}", name: "Philippines", tier: "AU_ROW" },
};

/** ISO codes for a given shipping tier, derived from COUNTRY_MAP. */
export function countriesForTier(tier: ShippingTier): ReadonlyArray<string> {
  return Object.entries(COUNTRY_MAP)
    .filter(([, entry]) => entry.tier === tier)
    .map(([code]) => code);
}

/** Look up the shipping tier for an ISO2 country code. Null if unsupported. */
export function tierForCountryCode(country: string): ShippingTier | null {
  const entry = COUNTRY_MAP[country.toUpperCase()];
  return entry?.tier ?? null;
}

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
