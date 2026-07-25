import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const [scene, main, styles] = await Promise.all([
  readFile(new URL('../src/horizon-scene.mjs', import.meta.url), 'utf8'),
  readFile(new URL('../src/main.mjs', import.meta.url), 'utf8'),
  readFile(new URL('../styles.css', import.meta.url), 'utf8'),
]);

test('gives each fact a larger, ring-free local glyph well', () => {
  assert.match(main, /id: active\.fact\.id,/);
  assert.match(main, /strength: position\.opacity,/);
  assert.match(scene, /float orbit = uBodyStrength\[i\] \* exp\(-bodyDistance \* bodyDistance \* 16\.0\);/);
  assert.match(scene, /point \+= bodyTangent \* orbit \* 0\.13 \+ bodyDirection \* orbit \* 0\.022;/);
  assert.match(scene, /bodyOrbit \* 0\.30/);
  assert.match(scene, /bodyOrbit \* 3\.6/);
  assert.match(scene, /color = mix\(color, spectrum, vBodyOrbit \* 0\.85\);/);
  assert.doesNotMatch(styles, /\.fact-body::before/);
  assert.doesNotMatch(main, /factArrivalPulse|arrivalPulse|visualArrivalAt|is-arriving|fact-conjunction|pulse:/);
  assert.doesNotMatch(scene, /uBodyPulse|bodyPulse|arrivalLens/);
});

test('keeps a fact well in its own slot and sends expirations inward', () => {
  assert.match(scene, /const bodyIds = Array\(BODY_LIMIT\)\.fill\(null\);/);
  assert.match(scene, /const bodiesById = new Map\(bodies\.map\(\(body\) => \[body\.id, body\]\)\);/);
  assert.match(scene, /const body = bodiesById\.get\(bodyIds\[index\]\);/);
  assert.match(main, /const expiredFacts = activeFacts\.filter\(\(active\) => isFactExpired\(active, now\)\);/);
  assert.match(main, /horizonScene\?\.signalAt\(position\.x \* window\.innerWidth \/ 100, position\.y \* window\.innerHeight \/ 100\);/);
});
