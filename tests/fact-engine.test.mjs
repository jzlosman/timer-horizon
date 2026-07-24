import assert from 'node:assert/strict';
import test from 'node:test';

import {
  chooseFact,
  formatDuration,
  formatNumber,
  valueForElapsed,
} from '../src/fact-engine.mjs';

test('formats a human duration without a stopwatch treatment', () => {
  assert.equal(formatDuration(312), '5 minutes, 12 seconds');
  assert.equal(formatDuration(1), '1 second');
  assert.equal(formatDuration(3_661), '1 hour, 1 minute');
  assert.equal(formatDuration(86_401), '1 day, 0 hours');
});

test('calculates a fact value from its stated period', () => {
  assert.equal(valueForElapsed({ rate: 2, period: 'minute' }, 75), 2.5);
  assert.equal(valueForElapsed({ rate: 4, period: 'hour' }, 1_800), 2);
  assert.equal(formatNumber(12_345.67, 0), '12,346');
});

test('chooses an inactive fact using supplied randomness', () => {
  const facts = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
  assert.deepEqual(chooseFact(facts, new Set(['a']), () => 0.5), { id: 'c' });
  assert.equal(chooseFact(facts, new Set(['a', 'b', 'c']), () => 0), null);
});
