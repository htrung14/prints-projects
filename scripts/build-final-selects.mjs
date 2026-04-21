#!/usr/bin/env node
/**
 * Build the catalog fixture from Thalia's "final selects" photo folder.
 *
 * Reads the iCloud folder, copy-resizes each photo down to web-preview
 * resolution (2000px longest edge, JPEG q70) into /public/images/catalog/
 * under lowercase .jpg names, and emits a fresh photos.fixture.json with
 * titles derived from the real filenames (location + month/year).
 *
 * Run: `node scripts/build-final-selects.mjs`
 *
 * Why 2000px q70: readable on a 4K monitor, but well below the 3600-4800px
 * 300 DPI we'd need for a 12-16 inch archival print. Anyone pulling the
 * file out of the DOM gets a preview, not a shop-ready master.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileP = promisify(execFile);

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const SRC_DIRS = [
  "/Users/haivo/Library/Mobile Documents/com~apple~CloudDocs/Thalia Final Selects Prints/final slects",
  "/Users/haivo/Library/Mobile Documents/com~apple~CloudDocs/Thalia Final Selects Prints/New Folder With Items",
];
const DEST_DIR = path.join(ROOT, "public/images/catalog");
const FIXTURE_PATH = path.join(ROOT, "src/data/photos.fixture.json");
const LONG_EDGE = 2000;
const JPEG_QUALITY = 70;

/* ---------------------------------------------------------------------- */

// Full month names for the display title (editorial feel), short codes for
// slugs, and a num map for chronological sorting.
const MONTHS_FULL = {
  january: "January", jan: "January",
  february: "February", feburary: "February" /* typo in source */, feb: "February",
  march: "March", mar: "March",
  april: "April", apr: "April",
  may: "May",
  june: "June", jun: "June",
  july: "July", jul: "July",
  august: "August", aug: "August",
  september: "September", sep: "September",
  october: "October", oct: "October",
  november: "November", nov: "November",
  december: "December", dec: "December",
};
const MONTH_SHORT = {
  January: "jan", February: "feb", March: "mar", April: "apr",
  May: "may", June: "jun", July: "jul", August: "aug",
  September: "sep", October: "oct", November: "nov", December: "dec",
};
const MONTH_TO_NUM = {
  January: 1, February: 2, March: 3, April: 4, May: 5, June: 6,
  July: 7, August: 8, September: 9, October: 10, November: 11, December: 12,
};
// Roman numerals for variant suffixes — "North Lebanon (2)" renders as
// "North Lebanon II" in the title. More typographic than "(2)" and matches
// how curated photo series are traditionally labelled.
const ROMAN = { 2: "II", 3: "III", 4: "IV", 5: "V", 6: "VI", 7: "VII", 8: "VIII" };

function parseName(filename) {
  // strip extension + trailing dots/spaces
  const base = filename.replace(/\.(jpe?g|JPE?G|png)$/i, "").trim().replace(/\.+$/, "").trim();

  // "Mount Lebanon (2), February 2025"   → location, variant, month, year
  // "Keserwan, Lebanon. February 2026"   → treat "Keserwan, Lebanon" as location
  // "Norh Lebanon (2), July 2021"        → fix typo to "North"
  let working = base.replace(/^Norh /, "North ");

  // Extract month + year — look for the pattern "<Month>[,]? <YYYY>" near the end
  const dateRe = /([A-Za-z]+)[\s,.]+(\d{4})/;
  const dateMatch = working.match(dateRe);
  if (!dateMatch) {
    return { location: working, variant: null, month: null, year: null };
  }
  const [, monthRaw, yearStr] = dateMatch;
  const monthKey = monthRaw.toLowerCase();
  const month = MONTHS_FULL[monthKey] ?? null;
  const year = Number(yearStr);
  let head = working.slice(0, dateMatch.index).trim().replace(/[,.\s]+$/, "");

  // Variant: trailing "(2)" etc.
  let variant = null;
  const varMatch = head.match(/\((\d+)\)\s*$/);
  if (varMatch) {
    variant = Number(varMatch[1]);
    head = head.slice(0, varMatch.index).trim().replace(/[,.\s]+$/, "");
  }

  // Collapse "Location, Country" → just "Location" for title brevity
  // (Keserwan, Lebanon → Keserwan).
  const location = head.split(",")[0].trim();
  return { location, variant, month, year };
}

function slugify(parts) {
  const { location, variant, month, year } = parts;
  const pieces = [];
  if (location) pieces.push(location.toLowerCase().replace(/\s+/g, "-"));
  if (variant) pieces.push(String(variant));
  if (month) pieces.push(MONTH_SHORT[month] ?? month.toLowerCase().slice(0, 3));
  if (year) pieces.push(String(year));
  return pieces.join("-").replace(/[^a-z0-9-]/g, "");
}

function titleCase(s) {
  return s
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function buildEntry(filename, parsed, index) {
  const { location, variant, month, year } = parsed;
  let title, titleItalic, imageAlt, slug;

  if (location && month && year) {
    // Roman numerals for variant — "Mount Lebanon (2)" → "Mount Lebanon II".
    // Matches the typographic style of curated photo series.
    const romanSuffix = variant ? ` ${ROMAN[variant] ?? `(${variant})`}` : "";
    const locDisplay = titleCase(location) + romanSuffix;
    title = `${locDisplay},`;
    titleItalic = `${month} ${year}`;
    imageAlt = `${locDisplay}, ${month} ${year}`;
    slug = slugify(parsed);
  } else {
    // File has no parseable location/date — skip it in the output rather
    // than publishing an untitled placeholder.
    return null;
  }

  // Deterministic but varied price tiers — seed off slug length so reruns
  // produce the same numbers. Keep within the $150-$400 range the shop sits in.
  const basePriceCents = [15000, 18000, 22000, 28000, 32000][slug.length % 5];

  // Seed a plausible remaining count (0-4 sold) so the edition metadata isn't
  // uniformly zero. Deterministic via char-code sum.
  const seed = slug.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const editionSold = seed % 5;

  const monthNum = month ? MONTH_TO_NUM[month] : 1;

  return {
    slug,
    referenceNumber: `AT-${String(index + 1).padStart(3, "0")}`,
    title,
    titleItalic,
    subtitle: location ? `${titleCase(location)}, Lebanon` : "From the At-Tamassok series",
    year: year ?? 2025,
    // Sort key for stable catalog ordering — older first, then by location.
    _sortKey: (year ?? 2000) * 12 + monthNum,
    description: [
      `Photographed in ${location ? titleCase(location) : "Lebanon"}${
        month && year ? `, ${month} ${year}` : ""
      }. Part of At-Tamassok — a series on the small domestic rituals that persist across distance and displacement.`,
      "Printed to order on archival pigment paper with a 1 inch border for handling.",
    ],
    imageUrl: `/images/catalog/${slug}.jpg`,
    imageAlt,
    basePriceCents,
    sizes: [
      { id: "16x20", label: "16 × 20 in", multiplier: 1 },
    ],
    papers: [
      { id: "photo-rag", name: "Hahnemühle Photo Rag", surchargeCents: 0 },
      { id: "baryta", name: "Canson Baryta", surchargeCents: 2000 },
      { id: "bamboo", name: "Hahnemühle Bamboo", surchargeCents: 4000 },
    ],
    editionTotal: 10,
    editionSold,
    _sourceFile: filename,
  };
}

async function collectSourceFiles() {
  const all = [];
  for (const dir of SRC_DIRS) {
    const entries = await fs.readdir(dir).catch(() => []);
    for (const name of entries) {
      if (name.startsWith(".")) continue;
      if (!/\.(jpe?g|JPE?G|png)$/i.test(name)) continue;
      all.push({ dir, name });
    }
  }
  return all;
}

async function main() {
  const sources = await collectSourceFiles();
  console.log(`Found ${sources.length} source photos.`);

  // Parse + build entries. Files without a location/date in the filename
  // return null from buildEntry and get filtered out.
  const parsed = sources
    .map((s, i) => {
      const info = parseName(s.name);
      const entry = buildEntry(s.name, info, i);
      return entry ? { ...s, info, entry } : null;
    })
    .filter(Boolean);

  // De-duplicate slug collisions by appending a discriminator (shouldn't
  // happen with the real folder but guards against reruns on renamed files).
  const slugSeen = new Map();
  for (const p of parsed) {
    let s = p.entry.slug;
    if (slugSeen.has(s)) {
      const n = slugSeen.get(s) + 1;
      slugSeen.set(s, n);
      s = `${s}-${n}`;
      p.entry.slug = s;
      p.entry.imageUrl = `/images/catalog/${s}.jpg`;
    } else {
      slugSeen.set(s, 1);
    }
  }

  // Sort by date so the grid reads chronologically
  parsed.sort((a, b) => a.entry._sortKey - b.entry._sortKey);

  // Wipe the existing catalog dir so we don't leave orphaned pl-6604-* files.
  await fs.rm(DEST_DIR, { recursive: true, force: true });
  await fs.mkdir(DEST_DIR, { recursive: true });

  for (const p of parsed) {
    const src = path.join(p.dir, p.name);
    const dest = path.join(DEST_DIR, `${p.entry.slug}.jpg`);
    // sips: resample to LONG_EDGE on the longest axis, q70, output JPEG.
    await execFileP("sips", [
      "-Z", String(LONG_EDGE),
      "-s", "format", "jpeg",
      "-s", "formatOptions", String(JPEG_QUALITY),
      src,
      "--out", dest,
    ]);
    console.log(`  ✓ ${p.entry.slug}.jpg  (from: ${p.name})`);
  }

  // Strip internal-only fields (prefixed with underscore) from JSON output.
  const fixture = parsed.map(({ entry }) => {
    const rest = { ...entry };
    delete rest._sortKey;
    delete rest._sourceFile;
    return rest;
  });

  await fs.writeFile(FIXTURE_PATH, JSON.stringify(fixture, null, 2) + "\n", "utf8");
  console.log(`\nWrote ${fixture.length} entries to ${path.relative(ROOT, FIXTURE_PATH)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
