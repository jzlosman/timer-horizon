import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('..', import.meta.url);

test('turns a field click into a signal without spawning another fact', async () => {
  const [main, scene] = await Promise.all([
    readFile(new URL('./src/main.mjs', root), 'utf8'),
    readFile(new URL('./src/horizon-scene.mjs', root), 'utf8'),
  ]);

  const clickHandler = main.match(/document\.addEventListener\('click', \(event\) => \{([\s\S]*?)\n\}\);/)[1];
  assert.match(main, /function summon\(now = Date\.now\(\)\)/);
  assert.doesNotMatch(main, /function summon\(now = Date\.now\(\), origin\)/);
  assert.match(clickHandler, /horizonScene\?\.signalAt\(event\.clientX, event\.clientY\);/);
  assert.doesNotMatch(clickHandler, /summon\(/);
  assert.match(scene, /uSignalOrigin/);
  assert.match(scene, /signalAt\(clientX, clientY\)/);
});
