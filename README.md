# Timer Horizon

A living time instrument: the duration since a visit began sits inside a luminous event horizon while rate-based facts from the wider world stream toward it.

## Run

```bash
python3 -m http.server 4173
open http://localhost:4173
```

The visual field loads Three.js from a pinned CDN URL. Without WebGL, or with reduced motion enabled, the timer and facts remain fully usable as a static DOM experience.

## Check

```bash
npm test
npm run check
```

## Content status

`src/facts.json` has 40 provisional, rate-based facts with a stable schema and reserved source fields. The numbers are deliberately uncited in v1; a separate research pass must verify every rate and populate `sourceLabel` / `sourceUrl` before any claim of authoritative sourcing.
