import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const styles = await readFile(new URL('../styles.css', import.meta.url), 'utf8');

test('defines the arriving fact conjunction animation contract', () => {
  assert.match(styles, /\.fact\.is-arriving\s+\.fact-conjunction\s*\{/);
  assert.match(styles, /@keyframes\s+fact-conjunction\s*\{/);
});
