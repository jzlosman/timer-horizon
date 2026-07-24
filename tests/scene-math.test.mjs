import assert from 'node:assert/strict';
import test from 'node:test';

import {
  advanceGlyph,
  factArrivalPulse,
  glyphCountForDensity,
  gravitationalPull,
  interpolateSceneTempo,
  sceneTempo,
} from '../src/scene-math.mjs';

test('the event horizon pulls harder as glyphs approach', () => {
  assert.ok(gravitationalPull(0.32) > gravitationalPull(1.1));
});

test('a glyph that enters the horizon respawns at the outer field', () => {
  const glyph = advanceGlyph({ x: 0.21, y: 0, seed: 0.25 }, 1, 0.22);
  assert.ok(Math.hypot(glyph.x, glyph.y) > 1);
});

test('reduced motion lowers glyph density without removing the field', () => {
  assert.equal(glyphCountForDensity(1200, false), 1200);
  assert.equal(glyphCountForDensity(1200, true), 240);
});

test('a dilated scene moves at singularity tempo', () => {
  assert.equal(sceneTempo(false), 1);
  assert.equal(sceneTempo(true), 0.16);
});

test('scene tempo eases toward the dialog state instead of jumping', () => {
  assert.equal(interpolateSceneTempo(1, true, 0.1), 0.916);
  assert.equal(interpolateSceneTempo(0.16, false, 0.1), 0.244);
});

test('a fact emits one bounded orbital arrival pulse when it reaches its readable lane', () => {
  assert.equal(factArrivalPulse(1_000, 999), 0);
  assert.equal(factArrivalPulse(1_000, 1_000), 1);
  assert.equal(factArrivalPulse(1_000, 1_600), 0.5);
  assert.equal(factArrivalPulse(1_000, 2_200), 0);
});
