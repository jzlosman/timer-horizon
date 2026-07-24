import assert from 'node:assert/strict';
import test from 'node:test';

import { factExplainer, formatFactValue, valueSlotWidth } from '../src/fact-presentation.mjs';

test('renders each fact as one stable numerical body with a compact explainer', () => {
  assert.equal(factExplainer({ label: 'Wikipedia has received', unit: 'edits' }), 'Wikipedia has received · edits');
  assert.equal(valueSlotWidth('999'), valueSlotWidth('1,000'));
});

test('compacts an oversized numerical body before it can move its explainer', () => {
  assert.equal(formatFactValue({ format: 'number', decimalPlaces: 0 }, 999), '999');
  assert.equal(formatFactValue({ format: 'number', decimalPlaces: 0 }, 1_000_000), '1M');
  assert.equal(formatFactValue({ format: 'number', decimalPlaces: 0 }, 25_902_068_371), '25.9B');
});
