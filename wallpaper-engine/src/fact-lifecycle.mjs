import { chooseFact } from './fact-engine.mjs';

export const MIN_FACTS = 4;
export const MAX_FACTS = 8;
export const FACT_STAGGER_MS = 3_500;

export function factTime(active, now) {
  return active.pausedAt ?? now;
}

export function isFactExpired(active, now) {
  return active.pausedAt === undefined && active.expiresAt <= now;
}

export function pauseFact(active, now) {
  return active.pausedAt === undefined ? { ...active, pausedAt: now } : active;
}

export function resumeFact(active, now) {
  if (active.pausedAt === undefined) return active;
  const pausedFor = Math.max(0, now - active.pausedAt);
  const { pausedAt, ...resumed } = active;
  return { ...resumed, bornAt: active.bornAt + pausedFor, expiresAt: active.expiresAt + pausedFor };
}

export function spawnFact(facts, active, now, random = Math.random) {
  const activeIds = new Set(active.map(({ fact }) => fact.id));
  const fact = chooseFact(facts, activeIds, random);
  if (!fact) return null;

  const lifetime = 30_000 + Math.floor(random() * 30_001);
  const usedSlots = new Set(active.map(({ slot }) => slot));
  const slot = Array.from({ length: MAX_FACTS }, (_, index) => index).find((index) => !usedSlots.has(index));
  return {
    fact,
    bornAt: now,
    expiresAt: now + lifetime,
    seed: random(),
    slot,
  };
}

export function ensureFactCount(facts, active, now, minimum = MIN_FACTS, random = Math.random, stagger = FACT_STAGGER_MS) {
  const next = [...active];
  const firstNewIndex = next.length;
  while (next.length < minimum && next.length < MAX_FACTS) {
    const fact = spawnFact(facts, next, now + (next.length - firstNewIndex) * stagger, random);
    if (!fact) break;
    next.push(fact);
  }
  return next;
}
