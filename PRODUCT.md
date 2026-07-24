# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
People who open the site to experience a strange, credible reframing of elapsed time. The primary job is to make an ordinary duration feel vast and alive without asking the visitor to learn a tool.

## Product Purpose
Timer Horizon starts timing when a visitor arrives (or from a visitor-selected starting moment) and translates that duration into continuously updating, rate-based facts from across the natural and human world.

## Positioning
A time instrument, not a dashboard: the visitor watches the world flow into a central timer rather than browsing a list of statistics.

## Operating Context
A single, full-viewport browser experience. Visitors may linger passively, click empty space to invite another fact, click the central timer to set a different starting moment, and eventually click a fact to visit its cited source.

## Capabilities and Constraints
- Default duration is the current page visit; a simple modal accepts a custom date and time.
- Four to eight facts coexist, a new one enters roughly every ten seconds, and each persists for 30–60 seconds.
- Facts use rate × elapsed-time calculations and can update about once per second.
- The fact field is abstract glyph texture; it must not pretend to be meaningful code or data.
- Each fact record reserves citation fields. Source verification and curation are deliberately deferred from v1.
- The experience needs a reduced-motion and non-WebGL fallback.

## Brand Commitments
**Timer Horizon**. The voice is clean, confident, curious, and quietly mind-bending. It must avoid Matrix pastiche, fake terminal UI, generic data dashboards, cards, graphs, and sci-fi game-engine chrome.

## Evidence on Hand
- User-provided visual references: `/Users/jeremyzaborowski/Documents/SCreenshots/SCR-20260724-hwgo.jpeg` and `SCR-20260724-hwmh.jpeg`.
- Product content is a provisional 40-fact local catalogue. No vetted source catalogue is yet available; do not claim research verification.

## Product Principles
- Make time physically felt through motion and changing quantities.
- One calm human anchor; the rest of the screen is the world in motion.
- Surprise comes from real-rate framing, not fabricated facts or gamification.
- The interface recedes until the visitor asks for control.

## Accessibility & Inclusion
Respect `prefers-reduced-motion`; preserve the central duration and readable fact content without WebGL. Keep active fact links keyboard reachable and maintain sufficient contrast.
