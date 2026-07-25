import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { factExplainer, formatFactValue, valueSlotWidth, valueUpdateInterval } from '../src/fact-presentation.mjs';

const styles = await readFile(new URL('../styles.css', import.meta.url), 'utf8');
const packagedStyles = await readFile(new URL('../wallpaper-engine/styles.css', import.meta.url), 'utf8');
const main = await readFile(new URL('../src/main.mjs', import.meta.url), 'utf8');
const packagedMain = await readFile(new URL('../wallpaper-engine/src/main.mjs', import.meta.url), 'utf8');

test('renders each fact as a bare value with one wrapping statement', () => {
  assert.equal(factExplainer({ label: 'lightning strikes on Earth' }), 'lightning strikes on Earth');
  assert.doesNotMatch(main, /fact-unit/);
  assert.doesNotMatch(packagedMain, /fact-unit/);
  assert.equal(valueSlotWidth('999'), valueSlotWidth('1,000'));
});

test('compacts an oversized numerical body before it can move its explainer', () => {
  assert.equal(formatFactValue({ format: 'number', decimalPlaces: 0 }, 999), '999');
  assert.equal(formatFactValue({ format: 'number', decimalPlaces: 0 }, 1_000_000), '1 M');
  assert.equal(formatFactValue({ format: 'number', decimalPlaces: 0 }, 25_902_068_371), '25.9 B');
  assert.equal(formatFactValue({ format: 'compact', decimalPlaces: 0 }, 269_000_000_000_000), '269 T');
  assert.equal(formatFactValue({ format: 'number', decimalPlaces: 0 }, 586_609_300_000_000_000), '5.87e17');
});

test('staggers numerical updates between three and five seconds', () => {
  assert.equal(valueUpdateInterval(0), 3_000);
  assert.equal(valueUpdateInterval(0.5), 4_000);
  assert.equal(valueUpdateInterval(0.999), 4_998);
});

test('keeps fact explainers comfortably readable beneath their values', () => {
  const fact = styles.match(/^\.fact\s*\{([\s\S]*?)^\}/m)?.[1];
  const packagedFact = packagedStyles.match(/^\.fact\s*\{([\s\S]*?)^\}/m)?.[1];
  assert.match(fact, /inline-size:\s*min\(14rem, 75vw\);/);
  assert.match(packagedFact, /inline-size:\s*min\(14rem, 75vw\);/);
  const explainer = styles.match(/^\.fact-explainer\s*\{([\s\S]*?)^\}/m)?.[1];
  assert.ok(explainer, 'fact explainer rule is present');
  assert.match(explainer, /-webkit-line-clamp:\s*3;/);
  assert.match(explainer, /font-size:\s*clamp\(0\.7rem, 0\.88vw, 0\.86rem\);/);
  assert.match(styles, /@media \(max-width: 700px\) \{[\s\S]*?\.fact-explainer \{ font-size: 0\.65rem; \}/);
});
