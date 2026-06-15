// Visual-verification helper. Screenshots a route at desktop + mobile widths in
// both themes, so you can read the shots back and confirm a UI change.
//
// Prereqs (one-time per environment):
//   1. A running server:  npm run build && npm run preview   (serves :4173)
//      …or for live edits: npm run dev                       (serves :5173)
//   2. Playwright client:  npm install --no-save playwright-core
//      (Chromium itself is already cached under ~/.cache/ms-playwright — this
//      only installs the JS client, and --no-save keeps it out of package.json.)
//
// Usage:
//   node scripts/screenshot.mjs [routePath] [outPrefix] [cssSelector]
//   BASE_URL=http://localhost:5173 node scripts/screenshot.mjs / home
//
//   routePath    route to visit (default "/")
//   outPrefix    output name prefix under /tmp (default "shot")
//   cssSelector  optional — clip each shot to this element instead of the page
//
// Writes /tmp/<outPrefix>-{desktop,mobile}-{light,dark}.png. Read them back with
// the Read tool. Notes that cost tokens to rediscover, baked in here:
//   • playwright-core is CommonJS → import via createRequire, not a named ESM import.
//   • Resolve Chromium from the cache; do NOT rely on `npx playwright install`.
//   • Toggle dark theme AFTER load (the pre-paint snippet in index.html would
//     otherwise overwrite an attribute set before navigation).

import { createRequire } from 'node:module';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright-core');

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:4173';
const [routePath = '/', outPrefix = 'shot', selector] = process.argv.slice(2);

/** Newest cached Chromium build with a usable executable. */
function chromiumPath() {
  const root = join(process.env.HOME, '.cache', 'ms-playwright');
  const dirs = readdirSync(root)
    .filter((d) => d.startsWith('chromium-'))
    .sort((a, b) => Number(b.split('-')[1]) - Number(a.split('-')[1]));
  for (const d of dirs) {
    const exe = join(root, d, 'chrome-linux64', 'chrome');
    try {
      readdirSync(join(root, d, 'chrome-linux64'));
      return exe;
    } catch {
      /* try next */
    }
  }
  throw new Error(`No cached Chromium found under ${root}`);
}

const url = new URL(routePath, BASE_URL).href;
const browser = await chromium.launch({ executablePath: chromiumPath() });

async function shot(width, theme) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  await page.goto(url, { waitUntil: 'networkidle' });
  if (theme === 'dark') {
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
    await page.waitForTimeout(400);
  }
  const target = selector ? page.locator(selector).first() : page;
  if (selector) await target.scrollIntoViewIfNeeded();
  const file = `/tmp/${outPrefix}-${width >= 1000 ? 'desktop' : 'mobile'}-${theme}.png`;
  await target.screenshot({ path: file });
  console.log('wrote', file);
  await page.close();
}

await shot(1280, 'light');
await shot(1280, 'dark');
await shot(390, 'light');
await shot(390, 'dark');
await browser.close();
