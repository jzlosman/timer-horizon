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
    fontFamily: "Bodoni Moda, Baskerville, Georgia, serif"
    fontSize: "clamp(3rem, 6.2vw, 6.4rem)"
    fontWeight: 500
    lineHeight: 0.86
    letterSpacing: "-0.065em"
  body:
    fontFamily: "Familjen Grotesk, Helvetica Neue, Arial, sans-serif"
    fontSize: "clamp(0.68rem, 0.9vw, 0.88rem)"
    fontWeight: 450
    lineHeight: 1.35
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

**Creative North Star: "The Observatory Edition"**

Timer Horizon is an after-hours scientific instrument: a full-screen typographic current collapsing toward a luminous central event horizon. The central duration is the only calm, human-scale object. Everything else—abstract glyphs, living figures, and light—moves because the world is larger than the visitor's clock.

The experience is dense but never dashboard-like. Motion earns the spectacle. Facts arrive from beyond the viewport, travel toward the rim, and vanish before crossing it; the background is intentionally meaningless texture, never pseudo-code or telemetry.

**Key Characteristics:**
- A plain-language duration inside a living accretion ring.
- A soot-dark field, mineral text, and hot stellar light.
- Shader-driven currents, a cursor wake, and a resilient HTML content layer.
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

**Display Font:** Bodoni Moda with Baskerville and Georgia fallbacks.
**Body Font:** Familjen Grotesk with a clean system sans fallback.

**Character:** The clock reads like a composed inscription, not instrumentation. The fact layer is compact and scientific, but never terminal-coded.

### Hierarchy
- **Display:** Owns only the central elapsed duration.
- **Title:** The small, calm brand wordmark.
- **Body:** Moving fact labels, values, and units.
- **Label:** Tiny uppercase utility copy and modal annotations.

**The Human-Clock Rule.** The duration always uses words such as `5 minutes, 12 seconds`, never a digit-only stopwatch.

## Layout

The viewport is the composition. Its optical center sits slightly above the geometric midpoint: the timer owns a protected central void, fact paths begin beyond the frame and terminate at the visible rim, and the lower lanes give the current a long falloff. Microglyphs arrive as a broad, all-direction infall volume—rather than a few thin rails—with a brighter upper stratum folding into the horizon. Desktop permits up to eight concurrent facts. Mobile preserves the singularity by assigning facts to exterior lanes rather than compressing them into cards.

## Elevation & Depth

There are no panels or conventional shadows. Depth comes from particle parallax, a slow upper-to-horizon fall, velocity, fading, and the ring's additive bloom. The horizon itself breathes almost imperceptibly while a bright seam precesses around its rim. A pointer creates a short wake in the abstract glyphs only—never in timer text, facts, or controls. The timer and fact layer are crisp semantic HTML above the visual field. On non-WebGL or reduced-motion devices, a still multi-band dust ring keeps the central form legible.

## Shapes

No rounded containers. The event horizon is the recurring form: a broken elliptical rim around an entirely black core, with a looser dust band and an irregular orbit. The timer is the only content permitted inside the core. The native start-time dialog is an exception: a flat rectangular sheet with a fine edge, not a floating card.

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
- **Do** make streams occupy the full field, then bend, shear, accelerate, and disappear at the event horizon; never leave the current stranded on a few rails.
- **Do** make glyphs large enough to read as abstract letters and numbers at a glance.
- **Do** keep the core absolutely black—facts and glyphs vanish at the rim, leaving the timer alone.
- **Do** let the horizon breathe and send a bright seam around its rim; motion should feel orbital, not like a loading spinner.
- **Do** let a pointer wake disturb only the abstract field, so interaction adds material response without compromising reading.
- **Do** keep facts readable, rate-driven, and visibly separate from the abstract glyph field.
- **Do** preserve the central duration and accessible content when effects are unavailable.

### Don't:
- **Don't** render fake code, terminal windows, charts, HUD brackets, or literal black-hole imagery.
- **Don't** use rainbow color, green-on-black hacker styling, or multiple glowing focal points.
- **Don't** distort the central timer or place moving facts over it.
