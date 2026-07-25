import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import * as lifecycle from '../src/fact-lifecycle.mjs';

const { eligibleFacts, ensureFactCount, spawnFact } = lifecycle;
const main = await readFile(new URL('../src/main.mjs', import.meta.url), 'utf8');

const facts = [
  { id: 'a', rate: 1, period: 'second' },
  { id: 'b', rate: 1, period: 'second' },
  { id: 'c', rate: 1, period: 'second' },
  { id: 'd', rate: 1, period: 'second' },
  { id: 'e', rate: 1, period: 'second' },
];

test('defers facts until their minimum elapsed time has passed', () => {
  assert.equal(typeof eligibleFacts, 'function');
  const slowFact = { id: 'slow', minimumElapsedSeconds: 43_200 };
  const availableNow = eligibleFacts([{ id: 'fast' }, slowFact], 420);

  assert.deepEqual(availableNow.map(({ id }) => id), ['fast']);
  assert.deepEqual(eligibleFacts([{ id: 'fast' }, slowFact], 43_200).map(({ id }) => id), ['fast', 'slow']);
});

test('selects only facts eligible at the visit elapsed time', () => {
  assert.match(main, /let activeFacts = ensureFactCount\(eligibleFacts\(facts, elapsedSeconds\(arrivedAt\)\), \[\], arrivedAt, MIN_FACTS\);/);
  assert.match(main, /spawnFact\(eligibleFacts\(facts, elapsedSeconds\(now\)\), activeFacts, now\);/);
  assert.match(main, /activeFacts = ensureFactCount\(eligibleFacts\(facts, elapsedSeconds\(now\)\), activeFacts, now, MIN_FACTS\);/);
});

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

test('staggered facts begin their journeys one at a time', () => {
  const active = ensureFactCount(facts, [], 10_000, 4, () => 0);
  assert.deepEqual(active.map(({ bornAt }) => bornAt), [10_000, 13_500, 17_000, 20_500]);
  assert.ok(active.every(({ expiresAt, bornAt }) => expiresAt > bornAt));
});

test('the page waits until its last scheduled starter fact before automatic summons', () => {
  assert.match(main, /let lastSummonAt = activeFacts\.at\(-1\)\?\.bornAt \?\? arrivedAt;/);
});

test('hovering a fact freezes its position, lifetime, and value clock', () => {
  const active = { bornAt: 0, expiresAt: 300, fact: facts[0] };
  assert.equal(typeof lifecycle.pauseFact, 'function');
  assert.equal(typeof lifecycle.resumeFact, 'function');
  assert.equal(typeof lifecycle.factTime, 'function');
  assert.equal(typeof lifecycle.isFactExpired, 'function');

  const paused = lifecycle.pauseFact(active, 100);
  assert.equal(lifecycle.factTime(paused, 500), 100);
  assert.equal(lifecycle.isFactExpired(paused, 1_000), false);

  const resumed = lifecycle.resumeFact(paused, 500);
  assert.equal(resumed.bornAt, 400);
  assert.equal(resumed.expiresAt, 700);
  assert.equal(lifecycle.isFactExpired(resumed, 699), false);
  assert.equal(lifecycle.isFactExpired(resumed, 700), true);
});

test('the page wires pointer and keyboard focus to pause individual facts', () => {
  assert.match(main, /element\.addEventListener\('pointerenter', syncFactPause\);/);
  assert.match(main, /element\.addEventListener\('pointerleave', syncFactPause\);/);
  assert.match(main, /element\.addEventListener\('focusin', syncFactPause\);/);
  assert.match(main, /element\.addEventListener\('focusout', syncFactPause\);/);
  assert.match(main, /const factNow = factTime\(active, now\);/);
});

test('future facts begin transparent before they enter the document', () => {
  assert.match(main, /element\.style\.setProperty\('--fact-opacity', '0'\);\s+factsElement\.append\(element\);/);
});
