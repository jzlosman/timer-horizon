import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(new URL('../src/horizon-scene.mjs', import.meta.url), 'utf8');
const vertexShader = source.match(/vertexShader: `([\s\S]*?)`,\n    fragmentShader:/)?.[1];

test('the glyph shader declares heat before drift uses it', () => {
  assert.ok(vertexShader, 'glyph vertex shader is present');
  assert.ok(
    vertexShader.indexOf('float heat =') < vertexShader.indexOf('driftAmount * (1.0 - heat)'),
    'heat must be declared before the drift expression uses it',
  );
});

test('gives the glyph field a wider range from dust to occasional large marks', () => {
  const [, minimum, maximum, exponent] = vertexShader.match(/float scale = mix\(([\d.]+), ([\d.]+), pow\(hash\(aSeed \* 73\.0\), ([\d.]+)\)\);/);
  assert.ok(Number(minimum) <= 0.55);
  assert.ok(Number(maximum) >= 2.6);
  assert.ok(Number(maximum) / Number(minimum) >= 5);
  assert.ok(Number(exponent) < 2);
});

test('carries the spectral gradient through the field and fact lenses', () => {
  assert.match(vertexShader, /varying float vSpectrum;/);
  assert.match(vertexShader, /varying float vBodyOrbit;/);
  assert.match(vertexShader, /vSpectrum = 0\.5 \+ 0\.5 \* sin\(point\.x \* 1\.7 - point\.y \* 1\.1 \+ uTime \* 0\.08\);/);
  assert.match(source, /color = mix\(color, spectrum, 0\.24\);/);
  assert.match(source, /color = mix\(color, spectrum, vBodyOrbit \* 0\.85\);/);
});
