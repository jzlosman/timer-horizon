---
name: Timer Horizon
description: A luminous event horizon that measures time by everything the world has done.
colors:
  void: "#060504"
  mineral: "#f4e3c6"
  mineral-dim: "#c8b69a"
  ember: "#ff4a0e"
  gold: "#f4a83c"
typography:
  display:
    fontFamily: "Iowan Old Style, Baskerville, Georgia, serif"
    fontSize: "clamp(2.8rem, 6.5vw, 6.6rem)"
    fontWeight: 400
    lineHeight: 0.92
    letterSpacing: "-0.055em"
  body:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
    fontSize: "clamp(0.66rem, 0.9vw, 0.86rem)"
    fontWeight: 400
    lineHeight: 1.45
rounded:
  none: "0"
spacing:
  tight: "0.7rem"
  control: "2rem"
components:
  horizon-timer:
    backgroundColor: "transparent"
    textColor: "{colors.mineral}"
    typography: "{typography.display}"
    rounded: "{rounded.none}"
    padding: "{spacing.control}"
---

# Design System: Timer Horizon

## Overview

**Creative North Star: "The Planetary Totalizer"**

Timer Horizon is an after-hours scientific instrument: a full-screen typographic current collapsing toward a luminous central event horizon. The central duration is the only calm, human-scale object. Everything else—abstract glyphs, living figures, and light—moves because the world is larger than the visitor's clock.

The experience is dense but never dashboard-like. Motion earns the spectacle. Facts are briefly legible bodies travelling within the field; the background is intentionally meaningless texture, never pseudo-code or telemetry.

**Key Characteristics:**
- A plain-language duration inside a living accretion ring.
- A soot-dark field, mineral text, and hot stellar light.
- Shader-driven currents plus a resilient HTML content layer.
- No cards, graph furniture, terminal tropes, or chrome-heavy controls.

## Colors

Color is physical light, not scattered accent paint. The field is almost neutral; the event horizon supplies all major heat.

### Primary
- **Accretion Gold:** Carries fact values, focus treatments, and the sharpest part of the luminous ring.

### Secondary
- **Ember Red:** Deepens the ring's outer dust and never becomes a second focal element.

### Neutral
- **Soot Void:** Owns the full viewport and makes the moving field feel immeasurable.
- **Mineral Light:** Keeps the timer and factual copy high-contrast and material rather than clinical.
- **Weathered Mineral:** Supports low-priority labels and does not compete with facts.

**The One-Star Rule.** The event horizon is the only major saturated form. Facts can borrow its pale heat; nothing else competes with it.

## Typography

**Display Font:** Iowan Old Style with Baskerville and Georgia fallbacks.
**Body Font:** The platform monospace stack.

**Character:** The clock reads like human language, not instrumentation. The fact layer is compact and technical, but not terminal-coded.

### Hierarchy
- **Display:** Owns only the central elapsed duration.
- **Title:** The small, calm brand wordmark.
- **Body:** Moving fact labels, values, and units.
- **Label:** Tiny uppercase utility copy and modal annotations.

**The Human-Clock Rule.** The duration always uses words such as `5 minutes, 12 seconds`, never a digit-only stopwatch.

## Layout

The viewport is the composition. A protected central void belongs to the timer; facts travel outside it on named lanes and the microglyph currents cross the remaining field. Desktop permits up to eight concurrent facts. Mobile preserves the singularity by assigning facts to exterior lanes rather than compressing them into cards.

## Elevation & Depth

There are no panels or conventional shadows. Depth comes from particle parallax, velocity, fading, and the ring's additive bloom. The timer and fact layer are crisp semantic HTML above the visual field. On non-WebGL or reduced-motion devices, a still multi-band dust ring keeps the central form legible.

## Shapes

No rounded containers. The event horizon is the recurring form: a broken elliptical ring with a bright inner edge, a looser dust band, and an irregular orbit. The native start-time dialog is an exception: a flat rectangular sheet with a fine edge, not a floating card.

## Components

### Buttons
- **Timer:** An unboxed central duration. Hover and keyboard focus may brighten the type but never introduce a panel.
- **Dialog actions:** Flat, rectangular, letter-spaced controls used only when the visitor explicitly changes the starting moment.

### Inputs / Fields
- **Start time:** A native date-time field with a single bottom rule; focus warms that rule instead of adding generic input chrome.

### [Signature Component]
**Event Horizon:** A WebGL glyph field and irregular additive ring with a static multi-band fallback. It is decorative only; timer, facts, controls, and keyboard interaction remain DOM content.

## Do's and Don'ts

### Do:
- **Do** make streams bend, shear, accelerate, and disappear toward the event horizon.
- **Do** keep facts readable, rate-driven, and visibly separate from the abstract glyph field.
- **Do** preserve the central duration and accessible content when effects are unavailable.

### Don't:
- **Don't** render fake code, terminal windows, charts, HUD brackets, or literal black-hole imagery.
- **Don't** use rainbow color, green-on-black hacker styling, or multiple glowing focal points.
- **Don't** distort the central timer or place moving facts over it.
