import facts from './facts.json' with { type: 'json' };

import { formatDuration, valueForElapsed } from './fact-engine.mjs';
import { FACT_VALUE_SLOT_CHARS, factExplainer, factUnit, formatFactValue, valueUpdateInterval } from './fact-presentation.mjs';
import { ensureFactCount, MAX_FACTS, MIN_FACTS, spawnFact } from './fact-lifecycle.mjs';
import { createHorizonScene } from './horizon-scene.mjs';
import { factArrivalPulse } from './scene-math.mjs';
import { localInputValue, parsePastLocalTime } from './time-control.mjs';

const body = document.body;
const canvas = document.querySelector('#field');
const experience = document.querySelector('#experience');
const factsElement = document.querySelector('#facts');
const timer = document.querySelector('#timer');
const duration = document.querySelector('#duration');
const timerCaption = document.querySelector('.timer-caption');
const dialog = document.querySelector('#start-dialog');
const form = document.querySelector('#start-form');
const startInput = document.querySelector('#start-time');
const startError = document.querySelector('#start-error');
const cancelStart = document.querySelector('#cancel-start');
const fieldInstruction = document.querySelector('.field-instruction');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const nodes = new Map();

const arrivedAt = Date.now();
let startedAt = arrivedAt;
let customStart = false;
let activeFacts = ensureFactCount(facts, [], arrivedAt, MIN_FACTS);
let lastSummonAt = arrivedAt;
let restoreTimerFocus = false;
let horizonScene;
let singularityTransition;
let pendingSingularityAction;

function elapsedSeconds(now = Date.now()) {
  return Math.max(0, (now - startedAt) / 1_000);
}

function factPosition(active, now) {
  const progress = reducedMotion ? 0.55 : Math.min(1, Math.max(0, (now - active.bornAt) / (active.expiresAt - active.bornAt)));
  const opacityFor = (lane) => reducedMotion ? 1 : Math.max(0, Math.min((progress - lane.enterAt) / 0.16, (0.98 - progress) / 0.1, 1));

  if (window.innerWidth < 700) {
    const lanes = [
      { x: -10, y: 16, targetX: 25, targetY: 24, side: 'left', enterAt: 0.2 }, { x: 110, y: 18, targetX: 75, targetY: 24, side: 'right', enterAt: 0.2 },
      { x: -10, y: 76, targetX: 25, targetY: 65, side: 'left', enterAt: 0.2 }, { x: 110, y: 76, targetX: 75, targetY: 65, side: 'right', enterAt: 0.2 },
      { x: 34, y: -10, targetX: 42, targetY: 24, side: 'center', enterAt: 0.38 }, { x: 66, y: -10, targetX: 58, targetY: 24, side: 'center', enterAt: 0.38 },
      { x: 38, y: 110, targetX: 45, targetY: 65, side: 'center', enterAt: 0.4 }, { x: 62, y: 110, targetX: 55, targetY: 65, side: 'center', enterAt: 0.4 },
    ];
    const lane = lanes[active.slot ?? 0];
    return {
      x: lane.x + (lane.targetX - lane.x) * progress,
      y: lane.y + (lane.targetY - lane.y) * progress,
      opacity: opacityFor(lane),
      angle: `${(active.seed - 0.5) * 3}deg`,
      side: lane.side,
      enterAt: lane.enterAt,
    };
  }

  const lanes = [
    { x: -10, y: 17, targetX: 30, targetY: 32, side: 'left', enterAt: 0.2 }, { x: 110, y: 19, targetX: 70, targetY: 32, side: 'right', enterAt: 0.2 },
    { x: -10, y: 75, targetX: 30, targetY: 58, side: 'left', enterAt: 0.2 }, { x: 110, y: 75, targetX: 70, targetY: 58, side: 'right', enterAt: 0.2 },
    { x: 41, y: -10, targetX: 46, targetY: 22, side: 'center', enterAt: 0.38 }, { x: 59, y: -10, targetX: 54, targetY: 22, side: 'center', enterAt: 0.38 },
    { x: 43, y: 110, targetX: 47, targetY: 67, side: 'center', enterAt: 0.4 }, { x: 57, y: 110, targetX: 53, targetY: 67, side: 'center', enterAt: 0.4 },
  ];
  const lane = lanes[active.slot ?? 0];
  return {
    x: lane.x + (lane.targetX - lane.x) * progress,
    y: lane.y + (lane.targetY - lane.y) * progress,
    opacity: opacityFor(lane),
    angle: `${(active.seed - 0.5) * 3}deg`,
    side: lane.side,
    enterAt: lane.enterAt,
  };
}

function createFactNode(active) {
  const hasSource = Boolean(active.fact.sourceUrl);
  const element = document.createElement(hasSource ? 'a' : 'div');
  element.className = 'fact';
  element.dataset.id = active.fact.id;
  element.dataset.linked = hasSource;
  if (hasSource) {
    element.href = active.fact.sourceUrl;
    element.target = '_blank';
    element.rel = 'noopener';
    element.title = active.fact.sourceLabel || 'Open source';
  }

  const factBody = document.createElement('span');
  factBody.className = 'fact-body';
  const value = document.createElement('span');
  value.className = 'fact-value';
  const unit = document.createElement('span');
  unit.className = 'fact-unit';
  const conjunction = document.createElement('span');
  conjunction.className = 'fact-conjunction';
  conjunction.setAttribute('aria-hidden', 'true');
  conjunction.addEventListener('animationend', () => element.classList.remove('is-arriving'));
  const explainer = document.createElement('span');
  explainer.className = 'fact-explainer';
  element.style.setProperty('--fact-value-slot', `${FACT_VALUE_SLOT_CHARS}ch`);
  factBody.append(value, unit, conjunction);
  element.append(factBody, explainer);
  factsElement.append(element);
  nodes.set(active.fact.id, element);
  return element;
}

function renderFacts(now) {
  const activeIds = new Set(activeFacts.map(({ fact }) => fact.id));
  for (const [id, node] of nodes) {
    if (!activeIds.has(id)) {
      node.remove();
      nodes.delete(id);
    }
  }

  const seconds = elapsedSeconds(now);
  const bodies = [];
  activeFacts.forEach((active) => {
    const node = nodes.get(active.fact.id) || createFactNode(active);
    const position = factPosition(active, now);
    const visualArrivalAt = active.bornAt + (active.expiresAt - active.bornAt) * (position.enterAt + 0.12);
    const arrivalPulse = reducedMotion ? 0 : factArrivalPulse(visualArrivalAt, now);
    if (arrivalPulse > 0 && !node.dataset.conjunctionStarted) {
      node.dataset.conjunctionStarted = 'true';
      node.classList.add('is-arriving');
    }
    const [factBody, explainer] = node.children;
    const [value, unit] = factBody.children;
    const lastUpdate = Number(node.dataset.valueUpdatedAt || 0);
    if (now - lastUpdate >= valueUpdateInterval(active.seed)) {
      const previousValue = value.textContent;
      const displayValue = formatFactValue(active.fact, valueForElapsed(active.fact, seconds));
      value.textContent = displayValue;
      node.dataset.valueUpdatedAt = now;
      if (previousValue && previousValue !== displayValue && !reducedMotion) {
        value.animate([
          { filter: 'blur(1.5px)', opacity: 0.5, transform: 'scale(0.96)' },
          { filter: 'blur(0)', opacity: 1, transform: 'scale(1)' },
        ], { duration: 420, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' });
      }
    }
    unit.textContent = factUnit(active.fact);
    explainer.textContent = factExplainer(active.fact);
    node.setAttribute('aria-label', `${active.fact.label}: ${value.textContent} ${active.fact.unit}`);
    node.style.left = `${position.x}%`;
    node.style.top = `${position.y}%`;
    node.dataset.side = position.side;
    node.style.setProperty('--fact-opacity', position.opacity);
    node.style.setProperty('--fact-angle', position.angle);
    bodies.push({
      x: position.x,
      y: position.y,
      strength: position.opacity,
      pulse: arrivalPulse,
    });
  });
  horizonScene?.setBodies(bodies);
}

function summon(now = Date.now()) {
  if (activeFacts.length >= MAX_FACTS) return;
  const fact = spawnFact(facts, activeFacts, now);
  if (fact) {
    activeFacts.push(fact);
    lastSummonAt = now;
  }
}

function updateTimer(now) {
  duration.textContent = formatDuration(elapsedSeconds(now));
  timerCaption.textContent = customStart
    ? `since ${new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(startedAt)}`
    : 'since you arrived';
}

function tick() {
  const now = Date.now();
  if (now - arrivedAt > 9_000) fieldInstruction.classList.add('is-quiet');
  if (!reducedMotion) {
    activeFacts = activeFacts.filter(({ expiresAt }) => expiresAt > now);
    if (now - lastSummonAt >= 10_000) summon(now);
    activeFacts = ensureFactCount(facts, activeFacts, now, MIN_FACTS);
  }
  updateTimer(now);
  renderFacts(now);
}

function showStartDialog() {
  if (!dialog.open) dialog.showModal();
  startInput.focus();
}

function closeDialog() {
  if (dialog.open) dialog.close();
}

function startSingularityTransition(prepare, start, update, fallback, pendingAction) {
  if (singularityTransition) {
    pendingSingularityAction = pendingAction;
    return false;
  }
  prepare();

  if (typeof document.startViewTransition !== 'function') {
    fallback();
    return true;
  }

  const transaction = {};
  singularityTransition = transaction;
  const cleanup = () => {
    if (singularityTransition !== transaction) return;
    timer.style.viewTransitionName = '';
    dialog.style.viewTransitionName = '';
    singularityTransition = null;
    const action = pendingSingularityAction;
    pendingSingularityAction = null;
    action?.();
  };

  try {
    start();
    const transition = document.startViewTransition(update);
    transition.ready.catch(cleanup);
    transition.finished.then(cleanup, cleanup);
  } catch {
    cleanup();
    fallback();
  }
  return true;
}

function openStartDialog() {
  startSingularityTransition(
    () => {
      restoreTimerFocus = true;
      startError.textContent = '';
      startInput.max = localInputValue(Date.now());
      startInput.value = localInputValue(startedAt);
      horizonScene?.setDilation(true);
      experience.classList.add('is-dilating');
    },
    () => { timer.style.viewTransitionName = 'timer-singularity'; },
    () => {
      timer.style.viewTransitionName = '';
      dialog.style.viewTransitionName = 'timer-singularity';
      showStartDialog();
    },
    showStartDialog,
    openStartDialog,
  );
}

function closeStartDialog() {
  if (!dialog.open) return;
  startSingularityTransition(
    () => {},
    () => { dialog.style.viewTransitionName = 'timer-singularity'; },
    () => {
      dialog.style.viewTransitionName = '';
      timer.style.viewTransitionName = 'timer-singularity';
      closeDialog();
    },
    closeDialog,
    closeStartDialog,
  );
}

timer.addEventListener('click', openStartDialog);
cancelStart.addEventListener('click', closeStartDialog);

dialog.addEventListener('close', () => {
  horizonScene?.setDilation(false);
  experience.classList.remove('is-dilating');
  if (restoreTimerFocus) timer.focus();
  restoreTimerFocus = false;
});

dialog.addEventListener('cancel', (event) => {
  startError.textContent = '';
  if (typeof document.startViewTransition === 'function') {
    event.preventDefault();
    closeStartDialog();
  }
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const selected = parsePastLocalTime(startInput.value);
  if (selected === null) {
    startError.textContent = 'Choose a moment that has already happened.';
    return;
  }
  startedAt = selected;
  customStart = true;
  closeStartDialog();
  tick();
});

document.addEventListener('click', (event) => {
  if (event.target.closest('button, a, input, dialog, .fact')) return;
  fieldInstruction.classList.add('is-quiet');
  summon();
  tick();
});

if (!reducedMotion) {
  try {
    horizonScene = createHorizonScene(canvas, {
      onContextLost() {
        body.classList.remove('has-webgl');
        body.classList.add('no-webgl');
      },
    });
    body.classList.remove('no-webgl');
    body.classList.add('has-webgl');
  } catch {
    body.classList.add('no-webgl');
  }
}

tick();
window.setInterval(tick, 1_000);
