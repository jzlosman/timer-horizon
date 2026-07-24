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

test('progressively morphs the timer through the start dialog', () => {
  const open = block(main, /function openStartDialog\(\) \{([\s\S]*?)\n\}\n\nfunction closeStartDialog/);
  const close = block(main, /function closeStartDialog\(\) \{([\s\S]*?)\n\}\n\ntimer\.addEventListener/);
  const closeHandler = block(main, /dialog\.addEventListener\('close', \(\) => \{([\s\S]*?)\n\}\);/);

  assert.match(main, /const experience = document\.querySelector\('#experience'\);/);
  assert.match(open, /horizonScene\?\.setDilation\(true\);\s+experience\.classList\.add\('is-dilating'\);/);
  assert.match(closeHandler, /horizonScene\?\.setDilation\(false\);\s+experience\.classList\.remove\('is-dilating'\);/);

  assert.match(open, /if \(typeof document\.startViewTransition !== 'function'\)/);
  assert.match(close, /if \(typeof document\.startViewTransition !== 'function'\)/);
  assert.match(open, /catch \{[\s\S]*showStartDialog\(\);/);
  assert.match(close, /catch \{[\s\S]*closeDialog\(\);/);

  const openTransition = block(open, /document\.startViewTransition\(\(\) => \{([\s\S]*?)\n\s*\}\);/);
  assert.match(open, /timer\.style\.viewTransitionName = 'timer-singularity';/);
  assert.match(openTransition, /^\s*timer\.style\.viewTransitionName = '';\s+dialog\.style\.viewTransitionName = 'timer-singularity';\s+showStartDialog\(\);/);

  const closeTransition = block(close, /document\.startViewTransition\(\(\) => \{([\s\S]*?)\n\s*\}\);/);
  assert.match(close, /dialog\.style\.viewTransitionName = 'timer-singularity';/);
  assert.match(closeTransition, /^\s*dialog\.style\.viewTransitionName = '';\s+timer\.style\.viewTransitionName = 'timer-singularity';\s+closeDialog\(\);/);
  assert.match(open, /transition\.finished\.then\([^]*dialog\.style\.viewTransitionName = ''/);
  assert.match(close, /transition\.finished\.then\([^]*timer\.style\.viewTransitionName = ''/);

  assert.match(main, /function showStartDialog\(\) \{[\s\S]*dialog\.showModal\(\);/);
  assert.match(main, /function closeDialog\(\) \{[\s\S]*dialog\.close\(\);/);

  for (const selector of ['::view-transition-old(timer-singularity)', '::view-transition-new(timer-singularity)']) {
    const rule = block(styles, new RegExp(`${selector.replace(/[()]/g, '\\$&')}\\s*\\{([\\s\\S]*?)\\}`));
    const duration = Number(rule.match(/animation-duration:\s*(\d+)ms/)[1]);
    assert.ok(duration >= 500 && duration <= 800);
  }
  assert.match(styles, /@keyframes timer-singularity-collapse\s*\{[\s\S]*clip-path:[\s\S]*opacity:[\s\S]*filter:[\s\S]*transform:/);
  assert.match(styles, /@keyframes timer-singularity-reform\s*\{[\s\S]*clip-path:[\s\S]*opacity:[\s\S]*filter:[\s\S]*transform:/);
  assert.match(styles, /#start-dialog\[open\]\s*\{[^}]*animation:/);
  assert.match(styles, /#start-dialog\[open\]::backdrop\s*\{[^}]*backdrop-filter:\s*blur\(/);

  const reducedMotion = block(styles, /@media \(prefers-reduced-motion: reduce\) \{([\s\S]*?)\n\}/);
  for (const selector of ['::view-transition-old(timer-singularity)', '::view-transition-new(timer-singularity)']) {
    assert.match(
      reducedMotion,
      new RegExp(`${selector.replace(/[()]/g, '\\$&')}\\s*(?:,\\s*[^{}]+)?\\{\\s*animation:\\s*none\\s*!important;\\s*\\}`),
    );
  }
});
