import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';
import { resolve } from 'node:path';

import rootFacts from '../src/facts.json' with { type: 'json' };
import packagedFacts from '../wallpaper-engine/src/facts.mjs';

const packageRoot = resolve('wallpaper-engine');

function readPackageFile(path) {
  return readFileSync(resolve(packageRoot, path), 'utf8');
}

test('Wallpaper Engine package uses the full current fact catalogue', () => {
  assert.deepEqual(packagedFacts, rootFacts);
});

test('Wallpaper Engine package is self-contained and opens its local web entry point', () => {
  const manifest = JSON.parse(readPackageFile('project.json'));

  assert.equal(manifest.type, 'web');
  assert.equal(manifest.file, 'index.html');
  assert.equal(existsSync(resolve(packageRoot, manifest.file)), true);

  for (const file of [
    'styles.css',
    'assets/background.mp3',
    'src/main.mjs',
    'src/horizon-scene.mjs',
    'src/facts.mjs',
    'vendor/three.module.js',
  ]) {
    assert.equal(existsSync(resolve(packageRoot, file)), true, `missing ${file}`);
  }

  assert.match(readPackageFile('index.html'), /<script type="module" src="\.\/src\/main\.mjs"><\/script>/);
  assert.doesNotMatch(readPackageFile('index.html'), /https?:\/\//);
  assert.match(readPackageFile('src/main.mjs'), /import facts from '\.\/facts\.mjs';/);
  assert.match(readPackageFile('src/horizon-scene.mjs'), /\.\.\/vendor\/three\.module\.js/);
  assert.doesNotMatch(readPackageFile('src/horizon-scene.mjs'), /https?:\/\//);
});
