import facts from './facts.json' with { type: 'json' };

import { formatCalendarDuration, formatCalendarDurationParts, valueForElapsed } from './fact-engine.mjs';
import { FACT_VALUE_SLOT_CHARS, factExplainer, factUnit, formatFactValue, valueUpdateInterval } from './fact-presentation.mjs';
import { ensureFactCount, factTime, isFactExpired, MAX_FACTS, MIN_FACTS, pauseFact, resumeFact, spawnFact } from './fact-lifecycle.mjs';
import { createHorizonScene } from './horizon-scene.mjs';
import { localInputValue, parsePastLocalTime } from './time-control.mjs';

const body = document.body;
const backgroundAudio = document.querySelector('#background-audio');
const soundToggle = document.querySelector('#sound-toggle');
const factOffer = document.querySelector('#fact-offer');
const factDialog = document.querySelector('#fact-dialog');
const factOfferLink = document.querySelector('#fact-offer-link');
const cancelFactOffer = document.querySelector('#cancel-fact-offer');
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

backgroundAudio.volume = 0.16;

const arrivedAt = Date.now();
let startedAt = arrivedAt;
let customStart = false;
let activeFacts = ensureFactCount(facts, [], arrivedAt, MIN_FACTS);
let lastSummonAt = activeFacts.at(-1)?.bornAt ?? arrivedAt;
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

function setFactPaused(id, element) {
  const now = Date.now();
  activeFacts = activeFacts.map((active) => {
    if (active.fact.id !== id) return active;
    return element.matches(':hover, :focus-within') ? pauseFact(active, now) : resumeFact(active, now);
  });
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
  const explainer = document.createElement('span');
  explainer.className = 'fact-explainer';
  element.style.setProperty('--fact-value-slot', `${FACT_VALUE_SLOT_CHARS}ch`);
  factBody.append(value, unit);
  element.append(factBody, explainer);
  element.style.setProperty('--fact-opacity', '0');
  factsElement.append(element);
  const syncFactPause = () => setFactPaused(active.fact.id, element);
  element.addEventListener('pointerenter', syncFactPause);
  element.addEventListener('pointerleave', syncFactPause);
  element.addEventListener('focusin', syncFactPause);
  element.addEventListener('focusout', syncFactPause);
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

  const bodies = [];
  activeFacts.forEach((active) => {
    const node = nodes.get(active.fact.id) || createFactNode(active);
    const factNow = factTime(active, now);
    const position = factPosition(active, factNow);
    const [factBody, explainer] = node.children;
    const [value, unit] = factBody.children;
    const lastUpdate = Number(node.dataset.valueUpdatedAt || 0);
    if (factNow - lastUpdate >= valueUpdateInterval(active.seed)) {
      const previousValue = value.textContent;
      const displayValue = formatFactValue(active.fact, valueForElapsed(active.fact, elapsedSeconds(factNow)));
      value.textContent = displayValue;
      node.dataset.valueUpdatedAt = factNow;
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
      id: active.fact.id,
      x: position.x,
      y: position.y,
      strength: position.opacity,
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

function durationPart({ value, unit }) {
  const element = document.createElement('span');
  element.className = 'duration-part';
  const number = document.createElement('span');
  number.className = 'duration-value';
  number.textContent = value;
  const label = document.createElement('span');
  label.className = 'duration-unit';
  label.textContent = unit;
  element.append(number, label);
  return element;
}

function updateTimer(now) {
  duration.replaceChildren(...formatCalendarDurationParts(startedAt, now).map(durationPart));
  duration.setAttribute('aria-label', formatCalendarDuration(startedAt, now));
  timerCaption.textContent = customStart
    ? `since ${new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(startedAt)}`
    : 'since you arrived';
}

function tick() {
  const now = Date.now();
  if (now - arrivedAt > 9_000) fieldInstruction.classList.add('is-quiet');
  if (!reducedMotion) {
    const expiredFacts = activeFacts.filter((active) => isFactExpired(active, now));
    expiredFacts.forEach((active) => {
      const position = factPosition(active, factTime(active, now));
      horizonScene?.signalAt(position.x * window.innerWidth / 100, position.y * window.innerHeight / 100);
    });
    activeFacts = activeFacts.filter((active) => !isFactExpired(active, now));
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

function openFactDialog() {
  if (!factDialog.open) factDialog.showModal();
  factOfferLink.focus();
}

function closeFactDialog() {
  if (factDialog.open) factDialog.close();
}

function setSoundState(enabled) {
  soundToggle.setAttribute('aria-pressed', String(enabled));
  soundToggle.setAttribute('aria-label', `Turn background sound ${enabled ? 'off' : 'on'}`);
  soundToggle.textContent = `Sound ${enabled ? 'on' : 'off'}`;
}

async function playBackgroundAudio() {
  try {
    await backgroundAudio.play();
    setSoundState(true);
  } catch {
    setSoundState(false);
  }
}

function startBackgroundAudio(event) {
  if (event.target.closest?.('#sound-toggle')) return;
  document.removeEventListener('pointerdown', startBackgroundAudio);
  document.removeEventListener('keydown', startBackgroundAudio);
  void playBackgroundAudio();
}

soundToggle.addEventListener('click', () => {
  if (backgroundAudio.paused) void playBackgroundAudio();
  else {
    backgroundAudio.pause();
    setSoundState(false);
  }
});

document.addEventListener('pointerdown', startBackgroundAudio);
document.addEventListener('keydown', startBackgroundAudio);

function startSingularityTransition(prepare, start, update, fallback, pendingAction) {
  if (singularityTransition) {
    pendingSingularityAction = pendingAction;
    return false;
  }
  prepare();

  if (reducedMotion || typeof document.startViewTransition !== 'function') {
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
  if (!dialog.open && !singularityTransition) return;
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
factOffer.addEventListener('click', openFactDialog);
cancelFactOffer.addEventListener('click', closeFactDialog);
factOfferLink.addEventListener('click', closeFactDialog);
factDialog.addEventListener('close', () => factOffer.focus());

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
  horizonScene?.signalAt(event.clientX, event.clientY);
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
