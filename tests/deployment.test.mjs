import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const origin = 'https://timerhorizon.com';
const [html, packageJson, wranglerSource] = await Promise.all([
  readFile(new URL('../index.html', import.meta.url), 'utf8'),
  readFile(new URL('../package.json', import.meta.url), 'utf8').then(JSON.parse),
  readFile(new URL('../wrangler.json', import.meta.url), 'utf8').catch(() => ''),
]);

test('builds the static release directory for the deployed Worker', () => {
  assert.notEqual(wranglerSource, '', 'missing wrangler.json');
  const wrangler = JSON.parse(wranglerSource);
  assert.equal(packageJson.scripts.build, 'rm -rf dist && mkdir -p dist && cp index.html styles.css dist/ && cp -R src assets dist/');
  assert.equal(wrangler.name, 'timer-horizon');
  assert.equal(wrangler.compatibility_date, '2026-07-25');
  assert.equal(wrangler.assets.directory, './dist');
  assert.equal(wrangler.workers_dev, true);
  assert.ok(Array.isArray(wrangler.routes));
  assert.equal(wrangler.routes[0].pattern, 'timerhorizon.com/*');
  assert.equal(wrangler.routes[0].zone_name, 'timerhorizon.com');
});

test('declares a complete social preview at the production URL', () => {
  assert.match(html, new RegExp(`<link rel="canonical" href="${origin}"`));
  assert.match(html, /<meta property="og:title" content="Timer Horizon" \/>/);
  assert.match(html, /<meta property="og:description" content="Quantifying every moment\." \/>/);
  assert.match(html, new RegExp(`<meta property="og:url" content="${origin}" \/>`));
  assert.match(html, new RegExp(`<meta property="og:image" content="${origin}/assets/social-share.png" \/>`));
  assert.match(html, /<meta name="twitter:card" content="summary_large_image" \/>/);
});
