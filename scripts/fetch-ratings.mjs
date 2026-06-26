// Build-time fetcher for recipe star ratings.
//
// Pulls the current aggregates from the live ratings service and writes
// src/data/ratings.json, so the daily CI rebuild bakes fresh `aggregateRating`
// numbers into the prerendered recipe HTML (the live widget fetches runtime
// numbers itself; this is only for the SEO snapshot). Mirrors
// fetch-github-activity.mjs: on ANY failure — network error, non-200, malformed
// payload — it logs a warning, leaves the committed snapshot untouched, and
// exits 0. The build never breaks and never ships garbage.

import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ENDPOINT = process.env.RATINGS_URL ?? 'https://mattschoe.dev/api/ratings';
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data', 'ratings.json');

/** Fail soft: warn and exit 0 so the build keeps the committed snapshot. */
function bail(message) {
  console.warn(`[ratings] ${message} — keeping existing snapshot.`);
  process.exit(0);
}

let payload;
try {
  const res = await fetch(ENDPOINT, { headers: { Accept: 'application/json' } });
  if (!res.ok) bail(`HTTP ${res.status} from ${ENDPOINT}`);
  payload = await res.json();
} catch (err) {
  bail(`request failed: ${err.message}`);
}

if (!payload || typeof payload.ratings !== 'object' || payload.ratings === null) {
  bail('response had no ratings object');
}

// Normalise to the snapshot shape, keeping only well-formed entries.
const ratings = {};
for (const [slug, r] of Object.entries(payload.ratings)) {
  if (r && typeof r.count === 'number' && typeof r.average === 'number' && r.count > 0) {
    ratings[slug] = { count: r.count, average: r.average };
  }
}

const out = {
  generatedAt: payload.generatedAt ?? new Date().toISOString(),
  ratings,
};

writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n');
console.log(`[ratings] wrote ${OUT}: ${Object.keys(ratings).length} rated recipe(s).`);
