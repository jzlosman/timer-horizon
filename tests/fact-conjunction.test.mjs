import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const [main, styles] = await Promise.all([
  readFile(new URL('../src/main.mjs', import.meta.url), 'utf8'),
  readFile(new URL('../styles.css', import.meta.url), 'utf8'),
]);

function block(source, expression) {
  const match = source.match(expression);
  assert.ok(match, `missing ${expression}`);
  return match[1];
}

test('renders and animates an arriving conjunction without affecting reduced motion', () => {
  const createFactNode = block(main, /function createFactNode\(active\) \{([\s\S]*?)\n\}\n\nfunction renderFacts/);
  const renderFacts = block(main, /function renderFacts\(now\) \{([\s\S]*?)\n\}\n\nfunction summon/);
  assert.match(createFactNode, /const conjunction = document\.createElement\('span'\);\s+conjunction\.className = 'fact-conjunction';\s+conjunction\.setAttribute\('aria-hidden', 'true'\);\s+conjunction\.addEventListener\('animationend', \(\) => element\.classList\.remove\('is-arriving'\)\);/);
  assert.match(createFactNode, /factBody\.append\(value, unit, conjunction\);/);
  assert.match(renderFacts, /if \(arrivalPulse > 0 && !node\.dataset\.conjunctionStarted\) \{\s+node\.dataset\.conjunctionStarted = 'true';\s+node\.classList\.add\('is-arriving'\);\s+\}/);
  assert.doesNotMatch(renderFacts, /classList\.toggle\('is-arriving'/);

  const animations = [...styles.matchAll(/([^{}]+)\{([^{}]*animation:\s*fact-conjunction\s+([\d.]+)s[^{}]*)\}/g)];
  assert.deepEqual(animations.map(([, selector]) => selector.trim()), ['.fact.is-arriving .fact-conjunction']);
  assert.ok(Number(animations[0][3]) <= 1.1);

  const keyframes = block(styles, /@keyframes fact-conjunction\s*\{([\s\S]*?)\n\}/);
  const properties = [...keyframes.matchAll(/(?:\{|;)\s*([\w-]+)\s*:/g)].map(([, property]) => property);
  assert.deepEqual([...new Set(properties)].sort(), ['clip-path', 'filter', 'opacity', 'transform']);
  assert.match(keyframes, /100%\s*\{[^}]*opacity:\s*0;/);

  const reducedMotion = block(styles, /@media \(prefers-reduced-motion: reduce\)\s*\{([\s\S]*?)\n\}/);
  assert.match(reducedMotion, /\*,\s*\*::before,\s*\*::after\s*\{[^}]*animation:\s*none\s*!important/);
});
