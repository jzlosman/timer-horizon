const TAU = Math.PI * 2;

export function gravitationalPull(distance) {
  return Math.min(1, 0.32 / Math.max(distance, 0.001));
}

export function glyphCountForDensity(count, reducedMotion) {
  return reducedMotion ? Math.max(1, Math.floor(count / 5)) : count;
}

function respawnGlyph(seed) {
  const angle = (seed % 1) * TAU;
  const radius = 1.18 + ((seed * 13) % 0.22);
  return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius, seed };
}

export function advanceGlyph(glyph, deltaSeconds, horizonRadius = 0.22) {
  const distance = Math.hypot(glyph.x, glyph.y);
  if (distance <= horizonRadius) return respawnGlyph(glyph.seed);

  const pull = gravitationalPull(distance);
  const inward = (0.045 + pull * 0.18) * deltaSeconds;
  const swirl = (0.01 + pull * 0.035) * deltaSeconds;
  const x = glyph.x - (glyph.x / distance) * inward - (glyph.y / distance) * swirl;
  const y = glyph.y - (glyph.y / distance) * inward + (glyph.x / distance) * swirl;

  return Math.hypot(x, y) <= horizonRadius ? respawnGlyph(glyph.seed) : { ...glyph, x, y };
}
