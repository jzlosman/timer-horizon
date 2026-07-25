import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('..', import.meta.url);

test('includes the supplied looping background track and a sound control', async () => {
  const [html] = await Promise.all([
    readFile(new URL('./index.html', root), 'utf8'),
    stat(new URL('./assets/background.mp3', root)),
  ]);

  assert.match(html, /<audio id="background-audio" loop preload="auto">/);
  assert.match(html, /<source src="\.\/assets\/background\.mp3" type="audio\/mpeg" \/>/);
  assert.match(html, /<button id="sound-toggle"[^>]*aria-pressed="false"/);
});
