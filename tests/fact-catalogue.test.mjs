import assert from 'node:assert/strict';
import test from 'node:test';

import facts from '../src/facts.json' with { type: 'json' };

const periods = new Set(['second', 'minute', 'hour', 'day', 'year']);

test('ships forty varied, rate-based facts with stable display metadata', () => {
  assert.equal(facts.length, 40);
  assert.equal(new Set(facts.map(({ id }) => id)).size, 40);

  for (const fact of facts) {
    assert.match(fact.id, /^[a-z0-9-]+$/);
    assert.ok(fact.label.length > 0);
    assert.ok(fact.unit.length > 0);
    assert.ok(fact.category.length > 0);
    assert.ok(Number.isFinite(fact.rate) && fact.rate > 0);
    assert.ok(periods.has(fact.period));
    assert.ok(Number.isInteger(fact.decimalPlaces) && fact.decimalPlaces >= 0);
    assert.ok(fact.sourceUrl === null || fact.sourceUrl.startsWith('https://'));
    assert.ok(fact.sourceLabel === null || fact.sourceLabel.length > 0);
  }

  assert.ok(new Set(facts.map(({ category }) => category)).size >= 6);
});
