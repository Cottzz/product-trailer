# product-trailer

> Cinematic 3D product trailers from any GLB model with a screen — as a
> self-contained HTML player **and** deterministic MP4.

[![License: Apache-2.0](https://img.shields.io/badge/license-Apache--2.0-blue)](LICENSE)
[![CI](https://github.com/Cottzz/product-trailer/actions/workflows/ci.yml/badge.svg)](https://github.com/Cottzz/product-trailer/actions)

**product-trailer** takes a 3D product model (e.g. a laptop or phone with a
screen) and screen content (a terminal session, a scrolling web page, …), and
renders a ~30s cinematic camera-move promo: side reveal → turn-to-front → push
in → screen cross-fade → brand end frame. Portrait 9:16 and landscape 16:9.

- **Dual output** — a zero-dependency single HTML file (double-click to play)
  and a deterministic MP4 (headless Chrome frame-stepping + ffmpeg).
- **Three contracts** — `model.manifest.json`, `storyboard.json`, and a
  `PTContent` screen-content template; swap any of the three independently.
- **Agent-ready** — installable as a skill for Claude Code / Codex / Trae.

> 🚧 Early development. See [`docs/PLAN.md`](docs/PLAN.md) for the full roadmap.
> Launch trailer and gallery arrive with v0.1.0.

## Install as an agent skill

```bash
npx skills add Cottzz/product-trailer
```

## License

[Apache-2.0](LICENSE). Bundled three.js r128 / GLTFLoader are MIT — see
[THIRD_PARTY_NOTICES](THIRD_PARTY_NOTICES).
