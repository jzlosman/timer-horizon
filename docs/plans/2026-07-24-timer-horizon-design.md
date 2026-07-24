# Timer Horizon — Design

## Approved concept

**Timer Horizon** is a full-screen time instrument. It begins timing on entry and renders the elapsed duration as plain language at the center of a luminous accretion ring. A field of abstract letters, digits, and symbols bends toward that event horizon. Four to eight real-rate facts flow through the field, update in approximately one-second steps, remain for 30–60 seconds, and disappear into the ring.

## Interaction

- Default start: the current page visit.
- Central timer: opens a small date/time modal for a custom start moment.
- Empty space: draws the next fact into the field.
- Fact: eventually opens its source in a new tab. V1 reserves source fields but defers source-catalogue research.
- Motion: WebGL shader currents power the glyph field, lensing, bloom, and pull. Active facts remain accessible HTML links above the canvas.

## Visual contract

The page is an **Experience** surface, not a terminal or dashboard. Use soot-black, mineral-white, and a single stellar amber/ember spectrum. The central timer is stable, unwarped, and high-contrast. The ring is uneven and physical—not a spinner, generic glow, or literal space illustration. Background glyphs are intentionally meaningless texture.

## Risks held for follow-up

- Curate and verify authoritative per-fact sources and methodology.
- Test long custom durations, source availability, and rate precision.
- Consider a shareable custom-duration URL only if the core experience earns it.
