import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const [scene, styles] = await Promise.all([
  readFile(new URL('../src/horizon-scene.mjs', import.meta.url), 'utf8'),
  readFile(new URL('../styles.css', import.meta.url), 'utf8'),
]);

function block(source, expression) {
  const match = source.match(expression);
  assert.ok(match, `missing ${expression}`);
  return match[1];
}

test('keeps the calm center smaller than the surrounding field', () => {
  const duration = block(styles, /#duration\s*\{([\s\S]*?)\n\}/);
  const maxFontSize = Number(duration.match(/font-size:\s*clamp\([^,]+,[^,]+,\s*([\d.]+)rem\)/)[1]);
  const ringRadius = Number(scene.match(/float ringRadius = ([\d.]+) \+/)[1]);

  assert.ok(maxFontSize <= 3.8, 'the timer display stays within the event horizon core');
  assert.ok(ringRadius <= 0.16, 'the event horizon stays below the prior 0.205 radius');
  assert.match(scene, /float voidMask = smoothstep\(0\.148, 0\.195, length\(voidPoint\)\);/);
  for (const name of ['outerBand', 'middleBand', 'innerBand', 'outerColor', 'middleColor', 'innerColor']) {
    assert.match(scene, new RegExp(`(?:float|vec3) ${name} =`));
  }
  assert.doesNotMatch(scene, /innerHeat/);
  for (const name of ['violet', 'blue', 'green', 'signalColor']) {
    assert.match(scene, new RegExp(`vec3 ${name} =`));
  }
  const bandWidths = [...scene.matchAll(/float \w+Band = 1\.0 - smoothstep\(([\d.]+), ([\d.]+), abs\(radius - \w+Radius\)\);/g)].map(([, start, end]) => [Number(start), Number(end)]);
  assert.deepEqual(bandWidths, [[0.002, 0.0115], [0.0015, 0.0068], [0.001, 0.0048]]);

  assert.doesNotMatch(styles, /\.fact-body::before/);
  for (const color of ['--violet', '--blue', '--green']) {
    assert.match(styles, new RegExp(`${color}:`));
  }
});
