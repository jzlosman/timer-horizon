# Timer Horizon Implementation Plan

> **REQUIRED SUB-SKILL:** Use the executing-plans skill to implement this plan task-by-task.

**Goal:** Build a dependency-light WebGL time experience in which a human-duration timer anchors an abstract glyph current and live rate facts fall into a luminous event horizon.

**Architecture:** A static ES-module app separates deterministic fact math from the browser scene. A Three.js point field uses a shader for the moving glyph texture and accretion-ring glow; semantic HTML renders the timer, interactive facts, and start-time dialog above it. The scene is progressive enhancement: a WebGL failure or reduced-motion preference leaves the complete DOM experience intact. Facts load from local JSON and source fields remain optional until a dedicated research pass.

**Tech Stack:** HTML, CSS, native ES modules, Node built-in test runner, Three.js ESM CDN import.

---

### Task 1: Establish deterministic time and fact math

**Files:**
- Create: `package.json`
- Create: `tests/fact-engine.test.mjs`
- Create: `src/fact-engine.mjs`

**Step 1: Write the failing test**

Test that `formatDuration(312)` returns `5 minutes, 12 seconds`, `valueForElapsed(rate, 60)` applies a per-minute rate correctly, and `chooseFact` avoids active fact IDs.

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/fact-engine.test.mjs`
Expected: FAIL because `src/fact-engine.mjs` does not exist.

**Step 3: Write minimal implementation**

Implement only the duration formatter, rate calculation, number formatter, and non-repeating fact selection helpers. Pass elapsed values and selection randomness in as arguments so all behavior remains deterministic under test.

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/fact-engine.test.mjs`
Expected: PASS.

**Step 5: Commit**

```bash
git add package.json src/fact-engine.mjs tests/fact-engine.test.mjs
git commit -m "feat: add timer fact engine"
```

### Task 2: Add the provisional, validated fact catalogue

**Files:**
- Create: `src/facts.json`
- Create: `tests/fact-catalogue.test.mjs`

**Step 1: Write the failing test**

Require exactly 40 facts with unique IDs, non-empty label/category/rate-unit fields, finite non-negative rates, formatting rules, and reserved `sourceUrl`/`sourceLabel` fields.

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/fact-catalogue.test.mjs`
Expected: FAIL because `src/facts.json` does not exist.

**Step 3: Write minimal implementation**

Create 40 varied approximate-rate records across cosmic motion, planetary processes, biology, infrastructure, culture, and the web. Mark source properties `null` rather than fabricating research citations; such facts render as text, not inert links.

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/fact-catalogue.test.mjs`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/facts.json tests/fact-catalogue.test.mjs
git commit -m "feat: add provisional Timer Horizon facts"
```

### Task 3: Build and test the scene math

**Files:**
- Create: `src/scene-math.mjs`
- Create: `tests/scene-math.test.mjs`
- Create: `src/horizon-scene.mjs`

**Step 1: Write the failing test**

Test that a generated glyph particle bends more strongly near the center, wraps to a safe outer edge after entering the event horizon, and honors a reduced-density count.

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/scene-math.test.mjs`
Expected: FAIL because `src/scene-math.mjs` does not exist.

**Step 3: Write minimal implementation**

Implement deterministic particle-position helpers. Use them from an optional Three.js renderer (pinned CDN version) with one custom point shader, an additive ember ring, resize support, and context-loss cleanup. On WebGL failure, apply a `no-webgl` class and keep the DOM surface intact; do not build a second Canvas renderer.

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/scene-math.test.mjs`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/scene-math.mjs tests/scene-math.test.mjs src/horizon-scene.mjs
git commit -m "feat: add event horizon particle field"
```

### Task 4: Compose the accessible interactive surface

**Files:**
- Create: `index.html`
- Create: `styles.css`
- Create: `src/main.mjs`
- Create: `tests/fact-lifecycle.test.mjs`

**Step 1: Write the failing test**

Test that a spawned fact has a 30–60 second lifetime, uses its rate-derived number for a supplied elapsed duration, does not duplicate an active fact, and the initial state can maintain at least four facts.

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/fact-lifecycle.test.mjs`
Expected: FAIL because fact lifecycle helpers do not exist.

**Step 3: Write minimal implementation**

Build the full viewport layout: stable human-language timer button, four initial facts, 4–8 fact maintenance, custom start-time dialog, empty-space summon, accessible keyboard behavior, source-aware fact links, and reduced-motion state. The timer button opens a labelled native dialog; validate start time, restore focus on close, and keep changing values out of an assertive live region.

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/fact-lifecycle.test.mjs`
Expected: PASS.

**Step 5: Commit**

```bash
git add index.html styles.css src/main.mjs tests/fact-lifecycle.test.mjs
git commit -m "feat: build Timer Horizon experience"
```

### Task 5: Verify the shipped surface

**Files:**
- Modify: `README.md`
- Modify: `DESIGN.md` (replace seed values with implemented tokens)

**Step 1: Run automated checks**

Run: `npm test && npm run check`
Expected: all checks pass. This is an unbundled static site; the browser smoke check exercises the served surface rather than a no-op build step.

**Step 2: Inspect the app at desktop and mobile widths**

Serve the static app, inspect the WebGL and no-WebGL states, then test the timer modal (focus, Escape, invalid/future time, restore focus), empty-space summon, keyboard focus, reduced-motion mode, and a long custom duration.

**Step 3: Run the Impeccable detector once**

Run: `node /Users/jeremyzaborowski/.pi/agent/skills/impeccable/scripts/detect.mjs --json index.html styles.css src/main.mjs`
Expected: review actionable findings and resolve material issues.

**Step 4: Commit**

```bash
git add README.md DESIGN.md
git commit -m "docs: document Timer Horizon"
```
