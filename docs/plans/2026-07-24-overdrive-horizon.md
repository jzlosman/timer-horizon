# Overdrive Horizon Implementation Plan

> **REQUIRED SUB-SKILL:** Use the executing-plans skill to implement this plan task-by-task.

**Goal:** Make Timer Horizon feel physically extraordinary through fact-driven gravitational lensing, celestial conjunction arrivals, and a cinematic timer-to-dialog singularity transition.

**Architecture:** Keep semantic timer, facts, and dialog in DOM. Extend the existing Three.js glyph shader with bounded fact-arrival lens impulses and a controllable time-dilation tempo; never distort readable DOM content. Use CSS for the visible fact conjunction and a same-document View Transition when opening the timer dialog, with the native dialog flow as its fallback.

**Tech Stack:** Vanilla ES modules, Three.js shader material, Web Animations/CSS keyframes, View Transitions API, Node test runner.

---

### Task 1: Test and add bounded scene-tempo helpers

**Files:**
- Modify: `src/scene-math.mjs`
- Test: `tests/scene-math.test.mjs`

**Step 1: Write the failing tests**

```js
import { sceneTempo } from '../src/scene-math.mjs';

test('scene tempo slows only while the dialog singularity is open', () => {
  assert.equal(sceneTempo(false), 1);
  assert.equal(sceneTempo(true), 0.16);
});
```

**Step 2: Run the test to verify it fails**

Run: `npm test -- tests/scene-math.test.mjs`

Expected: FAIL because `sceneTempo` is not exported.

**Step 3: Implement the smallest helper**

```js
export function sceneTempo(isDilated) {
  return isDilated ? 0.16 : 1;
}
```

**Step 4: Run the targeted tests**

Run: `npm test -- tests/scene-math.test.mjs`

Expected: PASS.

**Step 5: Commit**

```bash
git add src/scene-math.mjs tests/scene-math.test.mjs
git commit -m "feat: define singularity scene tempo"
```

### Task 2: Add fact-driven gravitational lensing to the glyph field

**Files:**
- Modify: `src/horizon-scene.mjs`
- Modify: `src/main.mjs`
- Test: `tests/scene-math.test.mjs`

**Step 1: Write the failing test**

```js
test('a dilation request uses the slowed scene tempo', () => {
  assert.equal(sceneTempo(true), 0.16);
});
```

**Step 2: Run the test to verify it fails**

Run: `npm test -- tests/scene-math.test.mjs`

Expected: FAIL until Task 1 implementation exists (or is already green when executing Task 2 in sequence).

**Step 3: Implement the lens and scene API**

- Add per-body lens pulse uniforms to the existing glyph shader, derived only from active fact pulses.
- Bend and brighten glyphs around a fact’s readable arrival without moving or filtering the DOM fact itself.
- Add `setDilation(isDilated)` to the scene API; interpolate the shader clock toward `sceneTempo(isDilated)` so the whole field visibly slows while the start-time dialog is open.
- Call `horizonScene.setDilation(true)` before opening the dialog and restore it in the dialog close path.
- Preserve WebGL failure and reduced-motion fallbacks.

**Step 4: Run syntax and tests**

Run: `npm test && npm run check`

Expected: PASS.

**Step 5: Commit**

```bash
git add src/horizon-scene.mjs src/main.mjs src/scene-math.mjs tests/scene-math.test.mjs
git commit -m "feat: add fact lensing and field dilation"
```

### Task 3: Build the celestial-conjunction fact arrival

**Files:**
- Modify: `styles.css`
- Modify: `src/main.mjs`

**Step 1: Write a focused arrival-pulse test**

```js
test('a fact arrival pulse is absent before its readable lane and fades after its bound', () => {
  assert.equal(factArrivalPulse(1_000, 999), 0);
  assert.ok(factArrivalPulse(1_000, 1_200) > 0);
  assert.equal(factArrivalPulse(1_000, 2_200), 0);
});
```

**Step 2: Run the test to verify it fails**

Run: `npm test -- tests/scene-math.test.mjs`

Expected: FAIL if this exact before/during/after arrival contract is not yet covered.

**Step 3: Implement the smallest authored sequence**

- Mark a fact only during its existing readable-lane arrival pulse.
- Let its elliptical orbital outline close, emit one warm outer trace, and settle; keep the total sequence bounded to 1.1 seconds.
- Do not animate layout properties, add new panels, or alter fact copy.
- Respect `prefers-reduced-motion` through the existing global motion rule.

**Step 4: Run targeted tests**

Run: `npm test -- tests/scene-math.test.mjs`

Expected: PASS.

**Step 5: Commit**

```bash
git add styles.css src/main.mjs tests/scene-math.test.mjs
git commit -m "feat: stage celestial fact conjunctions"
```

### Task 4: Turn the timer control into a dialog singularity

**Files:**
- Modify: `src/main.mjs`
- Modify: `styles.css`
- Modify: `index.html` only if a semantic transition name is needed

**Step 1: Write a failing helper test**

```js
test('scene tempo restores after the dialog closes', () => {
  assert.equal(sceneTempo(true), 0.16);
  assert.equal(sceneTempo(false), 1);
});
```

**Step 2: Run it to verify the intended state contract**

Run: `npm test -- tests/scene-math.test.mjs`

Expected: PASS only after Task 1; this protects the state transition used by the control.

**Step 3: Implement progressive enhancement**

- When `document.startViewTransition` exists, give timer and dialog distinct `view-transition-name` values only during the open/close transaction.
- Open the existing native dialog inside the transition, add a single `is-dilating` state on the experience, and remove all temporary classes/names after the transition settles.
- Retain the existing `dialog.showModal()` path if View Transitions are unavailable.
- Use a narrow CSS `::view-transition-*` sequence that feels like the timer collapsing into the core and re-forming as the dialog; never hide controls if script fails.

**Step 4: Verify keyboard and fallback operation**

Run: `npm test && npm run check`

Manually check: click the timer, tab to both dialog actions, press Escape, and reopen it with View Transitions disabled.

**Step 5: Commit**

```bash
git add index.html src/main.mjs styles.css src/scene-math.mjs tests/scene-math.test.mjs
git commit -m "feat: morph timer into start singularity"
```

### Task 5: Verify visual behavior, document, and review

**Files:**
- Modify: `DESIGN.md`
- Modify: `.impeccable/design.json`
- Modify: `.impeccable/surfaces/index-html.md`

**Step 1: Record the settled motion language**

Document the three intentional sequences: local fact lensing, conjunction arrival, and dialog time dilation.

**Step 2: Verify in Chromium**

Capture desktop and mobile screenshots at rest, during a fact arrival, and with the dialog open. Verify WebGL is active, readable DOM remains unwarped, mobile remains smooth, and reduced motion retains the full usable interface.

**Step 3: Run final verification**

```bash
npm test
npm run check
git diff --check
node /Users/jeremyzaborowski/.agents/skills/impeccable/scripts/detect.mjs --json index.html styles.css src/main.mjs src/horizon-scene.mjs
```

Expected: tests and checks pass; detector returns `[]`.

**Step 4: Commit**

```bash
git add DESIGN.md .impeccable/design.json .impeccable/surfaces/index-html.md
git commit -m "docs: record overdrive motion system"
```
