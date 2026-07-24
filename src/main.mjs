import facts from './facts.json' with { type: 'json' };

import { formatDuration, valueForElapsed } from './fact-engine.mjs';
import { FACT_VALUE_SLOT_CHARS, factExplainer, formatFactValue } from './fact-presentation.mjs';
import { ensureFactCount, MAX_FACTS, MIN_FACTS, spawnFact } from './fact-lifecycle.mjs';
import { createHorizonScene } from './horizon-scene.mjs';
import { localInputValue, parsePastLocalTime } from './time-control.mjs';

const body = document.body;
const canvas = document.querySelector('#field');
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

  const value = document.createElement('span');
  value.className = 'fact-value';
  const explainer = document.createElement('span');
  explainer.className = 'fact-explainer';
  element.style.setProperty('--fact-value-slot', `${FACT_VALUE_SLOT_CHARS}ch`);
  element.append(value, explainer);
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
    const [value, explainer] = node.children;
    const displayValue = formatFactValue(active.fact, valueForElapsed(active.fact, seconds));
    if (value.textContent !== displayValue) {
      value.textContent = displayValue;
      if (!reducedMotion) {
        value.animate([
          { filter: 'blur(2px)', opacity: 0.35, transform: 'scale(0.92)' },
          { filter: 'blur(0)', opacity: 1, transform: 'scale(1)' },
        ], { duration: 360, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' });
      }
    }
    explainer.textContent = factExplainer(active.fact);
    node.setAttribute('aria-label', `${active.fact.label}: ${displayValue} ${active.fact.unit}`);
    const position = factPosition(active, now);
    node.style.left = `${position.x}%`;
    node.style.top = `${position.y}%`;
    node.dataset.side = position.side;
    node.style.setProperty('--fact-opacity', position.opacity);
    node.style.setProperty('--fact-angle', position.angle);
    bodies.push({ x: position.x, y: position.y, strength: position.opacity });
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

function openStartDialog() {
  restoreTimerFocus = true;
  startError.textContent = '';
  startInput.max = localInputValue(Date.now());
  startInput.value = localInputValue(startedAt);
  dialog.showModal();
  startInput.focus();
}

function closeStartDialog() {
  dialog.close();
}

timer.addEventListener('click', openStartDialog);
cancelStart.addEventListener('click', closeStartDialog);

dialog.addEventListener('close', () => {
  if (restoreTimerFocus) timer.focus();
  restoreTimerFocus = false;
});

dialog.addEventListener('cancel', () => { startError.textContent = ''; });

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
