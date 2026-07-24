import facts from './facts.json' with { type: 'json' };

import { formatDuration, valueForElapsed } from './fact-engine.mjs';
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
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const nodes = new Map();

let startedAt = Date.now();
let customStart = false;
let activeFacts = ensureFactCount(facts, [], Date.now(), MIN_FACTS);
let lastSummonAt = Date.now();
let restoreTimerFocus = false;

function elapsedSeconds(now = Date.now()) {
  return Math.max(0, (now - startedAt) / 1_000);
}

function formatFactValue(fact, seconds) {
  const value = valueForElapsed(fact, seconds);
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: fact.decimalPlaces,
    notation: fact.format === 'compact' ? 'compact' : 'standard',
  }).format(value);
}

function factPosition(active, now) {
  const progress = reducedMotion ? 0 : Math.min(1, Math.max(0, (now - active.bornAt) / (active.expiresAt - active.bornAt)));
  const fade = reducedMotion ? 1 : Math.min(progress / 0.12, (1 - progress) / 0.16, 1);

  if (window.innerWidth < 700) {
    const lanes = [
      { x: 50, y: 17, dx: -5, dy: 5 }, { x: 90, y: 28, dx: -7, dy: 3 },
      { x: 10, y: 72, dx: 7, dy: -3 }, { x: 50, y: 84, dx: 3, dy: -5 },
      { x: 18, y: 28, dx: 7, dy: 5 }, { x: 82, y: 72, dx: -7, dy: -5 },
      { x: 31, y: 14, dx: 6, dy: 7 }, { x: 69, y: 88, dx: -6, dy: -8 },
    ];
    const lane = lanes[active.slot ?? 0];
    return {
      x: lane.x + lane.dx * progress,
      y: lane.y + lane.dy * progress,
      opacity: Math.max(0, fade),
      angle: `${(active.seed - 0.5) * 3}deg`,
    };
  }

  const lanes = [2.72, -0.38, -2.4, 0.66, -1.36, 1.82, 2.22, -0.95];
  const entryAngle = lanes[active.slot ?? 0] + (active.seed - 0.5) * 0.28;
  const bendDirection = active.slot % 2 ? -1 : 1;
  const angle = entryAngle + bendDirection * progress * 0.82;
  const radius = 0.86 - progress * 0.42;
  const x = 50 + Math.cos(angle) * radius * 48;
  const y = 50 + Math.sin(angle) * radius * 32;
  return { x, y, opacity: Math.max(0, fade), angle: `${(angle * 180) / Math.PI * 0.06}deg` };
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

  const label = document.createElement('span');
  label.className = 'fact-label';
  const value = document.createElement('span');
  value.className = 'fact-value';
  const unit = document.createElement('span');
  unit.className = 'fact-unit';
  element.append(label, value, unit);
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
  activeFacts.forEach((active) => {
    const node = nodes.get(active.fact.id) || createFactNode(active);
    const [label, value, unit] = node.children;
    const displayValue = formatFactValue(active.fact, seconds);
    label.textContent = active.fact.label;
    value.textContent = displayValue;
    unit.textContent = active.fact.unit;
    node.setAttribute('aria-label', `${active.fact.label}: ${displayValue} ${active.fact.unit}`);
    const position = factPosition(active, now);
    node.style.left = `${position.x}%`;
    node.style.top = `${position.y}%`;
    node.dataset.side = position.x < 50 ? 'left' : 'right';
    node.style.setProperty('--fact-opacity', position.opacity);
    node.style.setProperty('--fact-angle', position.angle);
  });
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
  summon();
  tick();
});

if (!reducedMotion) {
  try {
    createHorizonScene(canvas, {
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
