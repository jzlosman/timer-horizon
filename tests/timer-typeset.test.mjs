import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const [main, styles] = await Promise.all([
  readFile(new URL('../src/main.mjs', import.meta.url), 'utf8'),
  readFile(new URL('../styles.css', import.meta.url), 'utf8'),
]);

test('keeps duration values and units together while allowing pairs to wrap in the core', () => {
  assert.match(main, /duration\.replaceChildren\(\.\.\.formatCalendarDurationParts\(startedAt, now\)\.map\(durationPart\)\)/);
  assert.match(main, /duration\.setAttribute\('aria-label', formatCalendarDuration\(startedAt, now\)\);/);
  assert.match(styles, /#duration\s*\{[\s\S]*display:\s*flex;[\s\S]*flex-wrap:\s*wrap;[\s\S]*max-inline-size:/);
  assert.match(styles, /\.duration-part\s*\{[^}]*white-space:\s*nowrap;/);
  const unit = styles.match(/\.duration-unit\s*\{([\s\S]*?)\n\}/)?.[1];
  assert.ok(unit, 'duration unit rule is present');
  assert.match(unit, /font-size:\s*0\.58em;/);
  assert.match(unit, /color:/);
});
