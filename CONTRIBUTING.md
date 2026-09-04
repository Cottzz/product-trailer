# Contributing

Thanks for your interest in product-trailer.

## Development setup

- Python 3.11+ (build/export tools), Node 20 (Playwright for smoke tests).
- ffmpeg for MP4 muxing.
- headless Chromium: `python -m playwright install --with-deps chromium`.

## Commands

```bash
# CI smoke (headless SwiftShader render, asserts frames are not all-black)
python tools/ci_smoke.py
```

## Adding a content template

A PTContent template implements `meta`, `buildState(t)`, `drawScreen`, `theme`,
`startHtml`/`endHtml`, `mountOverlay`/`updateOverlay`, and `scheduleAudio`.
`buildState` must be a pure function of time (no wall clock, no `Math.random`,
no `setTimeout`) so MP4 export is deterministic. See `docs/PLAN.md` §4.

## Adding a model or audio

Only CC0 / public-domain or in-repo procedural assets may be committed.
Record every asset in `models/ATTRIBUTION.md` or `assets/audio/ATTRIBUTION.md`
with source URL, author, and the license as shown on the source page.
