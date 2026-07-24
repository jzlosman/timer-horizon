import assert from 'node:assert/strict';
import test from 'node:test';

import { factExplainer, factUnit, formatFactValue, valueSlotWidth, valueUpdateInterval } from '../src/fact-presentation.mjs';

test('renders each fact as one stable numerical body with a compact explainer', () => {
  assert.equal(factExplainer({ label: 'Wikipedia has received', unit: 'edits' }), 'Wikipedia has received');
  assert.equal(factUnit({ unit: 'km through the Milky Way' }), 'km');
  assert.equal(valueSlotWidth('999'), valueSlotWidth('1,000'));
});

test('compacts an oversized numerical body before it can move its explainer', () => {
  assert.equal(formatFactValue({ format: 'number', decimalPlaces: 0 }, 999), '999');
  assert.equal(formatFactValue({ format: 'number', decimalPlaces: 0 }, 1_000_000), '1M');
  assert.equal(formatFactValue({ format: 'number', decimalPlaces: 0 }, 25_902_068_371), '25.9B');
});

test('staggers numerical updates between three and five seconds', () => {
  assert.equal(valueUpdateInterval(0), 3_000);
  assert.equal(valueUpdateInterval(0.5), 4_000);
  assert.equal(valueUpdateInterval(0.999), 4_998);
});
