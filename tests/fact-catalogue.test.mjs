import assert from 'node:assert/strict';
import test from 'node:test';

import facts from '../src/facts.json' with { type: 'json' };

const periods = new Set(['second', 'minute', 'hour', 'day', 'year']);

test('ships one hundred sixty varied, rate-based facts with stable display metadata', () => {
  assert.equal(facts.length, 160);
  assert.equal(new Set(facts.map(({ id }) => id)).size, 160);

  for (const fact of facts) {
    assert.match(fact.id, /^[a-z0-9-]+$/);
    assert.ok(fact.label.length > 0);
    assert.equal('unit' in fact, false);
    assert.ok(fact.category.length > 0);
    assert.ok(Number.isFinite(fact.rate) && fact.rate > 0);
    assert.ok(periods.has(fact.period));
    assert.ok(Number.isInteger(fact.decimalPlaces) && fact.decimalPlaces >= 0);
    assert.ok(fact.minimumElapsedSeconds === undefined || (Number.isInteger(fact.minimumElapsedSeconds) && fact.minimumElapsedSeconds > 0));
    assert.ok(fact.sourceUrl === null || fact.sourceUrl.startsWith('https://'));
    assert.ok(fact.sourceLabel === null || fact.sourceLabel.length > 0);
  }

  assert.doesNotMatch(JSON.stringify(facts), /tonnes/i);
  assert.ok(new Set(facts.map(({ category }) => category)).size >= 6);
  assert.ok(facts.filter(({ sourceUrl }) => sourceUrl).length >= 120);
  assert.ok(facts.filter(({ minimumElapsedSeconds }) => minimumElapsedSeconds).length >= 7);
});
