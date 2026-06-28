// Author-time image optimizer (`npm run images`).
//
// Matt photographs recipes/projects as multi-MB JPGs/PNGs. Serving files that
// large hurts load time/LCP. This script converts every non-`.webp` image under
// public/images/ into a compressed sibling `.webp` (max 1600px wide, quality 80)
// so adding a photo is just: drop the raw in, run `npm run images`, reference the
// `.webp`. The raw sources are gitignored — only the optimized `.webp` is
// committed (the `content-images.test.ts` guard fails the build if a referenced
// `.webp` is missing).
//
// Rules (deliberately dead-simple):
//   - Every `.jpg/.jpeg/.png` → a sibling `.webp` (compressed from the raw).
//   - `.webp` files are NEVER touched — not read, not re-encoded. A re-run only
//     acts on raw files not yet converted; existing `.webp` stay byte-identical.
//   - To regenerate a `.webp`, delete it and re-run (no `--force` flag).
//
// `sharp` is a native module. Per the CLAUDE.md hard-rule (the better-sqlite3
// lesson) native deps must NOT live in the root package.json or they break the
// frontend `npm ci` / Docker build. So we self-bootstrap it with
// `npm install --no-save sharp` (mirroring the playwright-core pattern in
// scripts/screenshot.mjs) — it never enters package.json.

import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const IMAGES_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'images');
const MAX_WIDTH = 1600;
const QUALITY = 80;
const RASTER_EXTS = new Set(['.jpg', '.jpeg', '.png']);

/**
 * The sibling `.webp` path this source should produce, or `null` when the input
 * is already `.webp` (or any non-raster file we don't convert). Pure — exported
 * for unit testing the convert/skip decision.
 * @param {string} path
 * @returns {string | null}
 */
export function webpTargetFor(path) {
  const ext = extname(path).toLowerCase();
  if (!RASTER_EXTS.has(ext)) return null; // .webp and everything else: skip
  return path.slice(0, -ext.length) + '.webp';
}

/** Recursively list every file under `dir`. */
function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.isFile()) out.push(full);
  }
  return out;
}

function fmtBytes(n) {
  if (n >= 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(2)} MB`;
  if (n >= 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${n} B`;
}

// `node scripts/optimize-images.mjs` is the entry; importing the module (tests)
// must not run the pipeline. Guard on the CLI invocation.
const isCli = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isCli) {
  await main();
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');

  // Every raster source whose `.webp` sibling does NOT yet exist. A raw that
  // already has its `.webp` is left alone — so a re-run only converts new photos,
  // never re-encodes (to regenerate one, delete its `.webp` and re-run).
  const all = walk(IMAGES_ROOT)
    .map((src) => ({ src, target: webpTargetFor(src) }))
    .filter((x) => x.target !== null);
  const sources = all.filter(({ target }) => !existsSync(target));
  const skipped = all.length - sources.length;

  if (sources.length === 0) {
    const tail = skipped ? ` (${skipped} already converted)` : '';
    console.log(`[images] nothing to convert${tail} — every raster source has a .webp.`);
    return;
  }

  const sharp = dryRun ? null : await loadSharp();

  let totalBefore = 0;
  let totalAfter = 0;
  let converted = 0;

  for (const { src, target } of sources) {
    const before = statSync(src).size;
    totalBefore += before;
    const rel = src.slice(IMAGES_ROOT.length + 1);

    if (dryRun) {
      console.log(`[images] would convert ${rel} (${fmtBytes(before)})`);
      continue;
    }

    await sharp(src)
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality: QUALITY })
      .toFile(target);

    const after = statSync(target).size;
    totalAfter += after;
    converted += 1;
    console.log(`[images] ${rel}: ${fmtBytes(before)} → ${fmtBytes(after)}`);
  }

  if (dryRun) {
    console.log(`[images] dry run: ${sources.length} source(s) would be converted.`);
    return;
  }

  const saved = totalBefore - totalAfter;
  const tail = skipped ? ` (${skipped} already converted, skipped)` : '';
  console.log(
    `[images] converted ${converted} image(s): ${fmtBytes(totalBefore)} → ` +
      `${fmtBytes(totalAfter)} (saved ${fmtBytes(saved)})${tail}.`,
  );
}

/** Resolve `sharp`, installing it ad-hoc (never into package.json) if absent. */
async function loadSharp() {
  // `sharp` is intentionally never a declared dep (see header). Resolve it
  // through a non-literal specifier so Vite/Vitest can't statically analyse and
  // resolve the import at transform time — a literal `import('sharp')` makes the
  // test suite fail under CI's clean `npm ci`, where `sharp` is absent. Node
  // resolves the variable specifier natively at runtime; this only runs when the
  // CLI does real encoding, never in tests.
  const mod = 'sharp';
  try {
    return (await import(mod)).default;
  } catch {
    console.log('[images] sharp not found — installing it locally (npm install --no-save sharp)…');
    execFileSync('npm', ['install', '--no-save', 'sharp'], { stdio: 'inherit' });
    return (await import(mod)).default;
  }
}
