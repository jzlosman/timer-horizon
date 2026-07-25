import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const [html, main, styles] = await Promise.all([
  readFile(new URL('../index.html', import.meta.url), 'utf8'),
  readFile(new URL('../src/main.mjs', import.meta.url), 'utf8'),
  readFile(new URL('../styles.css', import.meta.url), 'utf8'),
]);

test('opens a plain-language fact-offer dialog with a prefilled post to @node_jz', () => {
  assert.match(html, /<button id="fact-offer"[^>]*>Offer a fact<\/button>/);
  assert.match(html, /<dialog id="fact-dialog" aria-labelledby="fact-dialog-title">/);
  assert.match(html, /<h2 id="fact-dialog-title">Suggest a fact\.<\/h2>/);
  assert.match(html, /Post a fact you’d like included, with its rate, a trustworthy source, and your preferred credit\./);
  assert.match(html, /<a id="fact-offer-link"[^>]*href="https:\/\/x\.com\/intent\/post\?text=%40node_jz%20I%20have%20a%20fact%20suggestion%20for%20Timer%20Horizon%3A%0A%0AFact%3A%20%0ARate%3A%20%0ASource%3A%20%0ACredit%3A%20"[^>]*target="_blank"[^>]*>Suggest on X<\/a>/);

  assert.match(main, /const factOffer = document\.querySelector\('#fact-offer'\);/);
  assert.match(main, /function openFactDialog\(\) \{[\s\S]*factDialog\.showModal\(\);[\s\S]*factOfferLink\.focus\(\);/);
  assert.match(main, /factOffer\.addEventListener\('click', openFactDialog\);/);
  assert.match(main, /cancelFactOffer\.addEventListener\('click', closeFactDialog\);/);
  assert.match(main, /factDialog\.addEventListener\('close', \(\) => factOffer\.focus\(\)\);/);

  assert.match(styles, /\.fact-offer\s*\{/);
  assert.match(styles, /#fact-dialog\s*\{/);
});
