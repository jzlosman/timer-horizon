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

  assert.match(open, /startSingularityTransition\(/);
  assert.match(close, /startSingularityTransition\(/);
  assert.match(open, /timer\.style\.viewTransitionName = 'timer-singularity';/);
  assert.match(open, /timer\.style\.viewTransitionName = '';\s+dialog\.style\.viewTransitionName = 'timer-singularity';\s+showStartDialog\(\);/);
  assert.match(close, /dialog\.style\.viewTransitionName = 'timer-singularity';/);
  assert.match(close, /dialog\.style\.viewTransitionName = '';\s+timer\.style\.viewTransitionName = 'timer-singularity';\s+closeDialog\(\);/);

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

test('serializes singularity transactions and cleans up owned names', () => {
  const helper = block(main, /function startSingularityTransition\(prepare, start, update, fallback, pendingAction\) \{([\s\S]*?)\n\}\n\nfunction openStartDialog/);
  const cleanup = block(helper, /const cleanup = \(\) => \{([\s\S]*?)\n  \};/);

  assert.match(main, /let singularityTransition;/);
  assert.match(helper, /if \(singularityTransition\) \{\s+pendingSingularityAction = pendingAction;\s+return false;\s+\}/);
  assert.ok(helper.indexOf('if (singularityTransition) {') < helper.indexOf('document.startViewTransition'));
  assert.match(helper, /const transaction = \{\};\s+singularityTransition = transaction;/);
  assert.match(cleanup, /if \(singularityTransition !== transaction\) return;\s+timer\.style\.viewTransitionName = '';\s+dialog\.style\.viewTransitionName = '';\s+singularityTransition = null;\s+const action = pendingSingularityAction;\s+pendingSingularityAction = null;\s+action\?\.\(\);/);
  assert.match(helper, /transition\.ready\.catch\(cleanup\);/);
  assert.match(helper, /transition\.finished\.then\(cleanup, cleanup\);/);
  assert.match(helper, /catch \{\s+cleanup\(\);\s+fallback\(\);/);
});

test('replays the last terminal dialog action after a busy transition releases its lock', () => {
  assert.match(main, /let pendingSingularityAction;/);
  assert.match(main, /showStartDialog,\s+openStartDialog,/);
  assert.match(main, /closeDialog,\s+closeStartDialog,/);
});
