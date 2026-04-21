#!/usr/bin/env node
/**
 * One-shot repo pass: replace every em dash (—, U+2014) with " - " (hyphen)
 * in source files under src/ and src/data/. Keeps comments readable and
 * turns prose dashes into plain ASCII hyphens without changing structure.
 *
 * Runs: `node scripts/strip-em-dashes.mjs`
 */
import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const SCAN = ["src", "public"];
const EXT = new Set([
  ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs",
  ".md", ".mdx", ".json", ".css", ".scss",
]);

async function walk(dir, out) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name.startsWith(".")) continue;
      if (e.name === "node_modules" || e.name === ".next") continue;
      await walk(p, out);
    } else if (EXT.has(path.extname(e.name))) {
      out.push(p);
    }
  }
}

async function main() {
  const files = [];
  for (const d of SCAN) await walk(path.join(ROOT, d), files).catch(() => {});
  let touched = 0;
  for (const f of files) {
    const s = await fs.readFile(f, "utf8");
    if (!s.includes("\u2014")) continue;
    // Collapse " — " (space em-dash space) to " - " (space hyphen space),
    // and any remaining standalone em dashes to a bare hyphen.
    const next = s.replace(/\s+\u2014\s+/g, " - ").replace(/\u2014/g, "-");
    if (next !== s) {
      await fs.writeFile(f, next, "utf8");
      console.log(`  ✓ ${path.relative(ROOT, f)}`);
      touched++;
    }
  }
  console.log(`\nTouched ${touched} files.`);
}

main().catch((err) => { console.error(err); process.exit(1); });
