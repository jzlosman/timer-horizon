import assert from 'node:assert/strict';
import test from 'node:test';

import { ensureFactCount, spawnFact } from '../src/fact-lifecycle.mjs';

const facts = [
  { id: 'a', rate: 1, period: 'second' },
  { id: 'b', rate: 1, period: 'second' },
  { id: 'c', rate: 1, period: 'second' },
  { id: 'd', rate: 1, period: 'second' },
  { id: 'e', rate: 1, period: 'second' },
];

test('spawned facts have a bounded lifetime and no active duplicate', () => {
  const fact = spawnFact(facts, [{ fact: facts[0] }], 10_000, () => 0.5);
  assert.notEqual(fact.fact.id, 'a');
  assert.ok(fact.expiresAt - fact.bornAt >= 30_000);
  assert.ok(fact.expiresAt - fact.bornAt <= 60_000);
});

test('the initial state fills four unique active facts', () => {
  const active = ensureFactCount(facts, [], 10_000, 4, () => 0);
  assert.equal(active.length, 4);
  assert.equal(new Set(active.map(({ fact }) => fact.id)).size, 4);
  assert.equal(new Set(active.map(({ slot }) => slot)).size, 4);
});
