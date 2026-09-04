# product-trailer

> Cinematic 3D product trailers from **any** GLB model with a screen — as a
> self-contained HTML player **and** a deterministic MP4. GLB in, trailer out.

[![License: Apache-2.0](https://img.shields.io/badge/license-Apache--2.0-blue)](LICENSE)

[**🎬 Watch the gallery**](https://cottzz.github.io/product-trailer/gallery/) · [Get started](#quickstart) · [中文说明](README.zh-CN.md)

[![product-trailer gallery: a cinematic terminal trailer rendered on a 3D laptop](https://github.com/Cottzz/product-trailer/releases/download/gallery-media/dogfood-poster-1.jpg)](https://cottzz.github.io/product-trailer/gallery/)

<video controls muted preload="none" width="480" poster="https://github.com/Cottzz/product-trailer/releases/download/gallery-media/dogfood-poster-1.jpg">
  <source src="https://github.com/Cottzz/product-trailer/releases/download/gallery-media/dogfood-vertical.mp4" type="video/mp4">
  [▶ Watch the vertical trailer](https://github.com/Cottzz/product-trailer/releases/download/gallery-media/dogfood-vertical.mp4)
</video>

Give it a 3D model with a display (laptop, phone, kiosk, TV …) and screen
content (a terminal session, a scrolling landing page, anything drawable on a
canvas), and it produces a ~30-second cinematic promo — side reveal →
turn-to-front → hero push-in → screen cross-fade → brand end frame. Portrait
9:16 and landscape 16:9 from the same cut.

## Why

Launch videos for dev tools are slow to make and impossible to keep in sync
with the product. product-trailer turns a **3D model + a screen-content
script** into a reproducible build artifact — regenerate the trailer every
release, identical byte-for-byte, with zero manual video editing.

## Highlights

- **Dual first-class outputs** — a zero-dependency **single HTML file**
  (three.js r128 inlined, double-click `file://` to play) and a
  **deterministic MP4** (headless Chrome frame-stepping via `__PT.seek(t)` +
  OfflineAudio mix + ffmpeg). Same cut, re-rendered twice, byte-identical.
- **Three contracts, independently swappable** —
  [`model.manifest.json`](#1-the-model-contract) (model source, screen mesh,
  normalization), `storyboard.json` (camera keyframes, fov, fades), and a
  `PTContent` template (pure `buildState(t)` + `drawScreen()`).
- **Batteries included** — procedural built-in laptop & phone models (no
  external assets, no license risk), two content templates (`terminal`,
  `web-scroll`), a browser **calibration playground** to target the screen
  mesh on any GLB.
- **Agent-ready** — installable as a skill for Claude Code / Codex / Trae;
  the root `SKILL.md` is the multi-agent entry point.

## Quickstart

Requirements: Python 3, [Playwright](https://playwright.dev/python/) Chromium
(`pip install playwright && playwright install chromium`), ffmpeg on PATH.

```bash
git clone https://github.com/Cottzz/product-trailer && cd product-trailer

# 1. Build the single-file live HTML player
python3 tools/pt_build.py \
  --manifest examples/dogfood/model.manifest.json \
  --storyboard examples/dogfood/storyboard.json \
  --content content/terminal/content.js \
  --title "product-trailer · self demo" \
  --out trailer.html
# → open trailer.html — it plays, zero install.

# 2. Export the deterministic MP4 (portrait 1080x1920, landscape 1920x1080)
python3 tools/pt_export_mp4.py --html trailer.html \
  --orientation vertical  --out trailer-vertical.mp4
python3 tools/pt_export_mp4.py --html trailer.html \
  --orientation horizontal --out trailer-horizontal.mp4
```

The `web-scroll` template takes an example config **before** the template
(pt_build concatenates `--content` files in order):

```bash
python3 tools/pt_build.py \
  --manifest examples/landing/model.manifest.json \
  --storyboard examples/landing/storyboard.json \
  --content examples/landing/content.js content/web-scroll/content.js \
  --out landing.html
```

Bring your own GLB: open the [calibration playground](https://cottzz.github.io/product-trailer/calibrate/),
load the model, pick the screen mesh, copy out `model.manifest.json`, then
point `pt_build.py` at it. GLBs must be **uncompressed** glTF (no
Draco/KTX2 — three r128); run them through gltf-pipeline if needed.

## The three contracts

### 1. The model contract — `model.manifest.json`

Model source (`builtin:laptop` | `builtin:phone` | inlined base64 | external
`.glb` path), normalization size, `rotationY`, the screen mesh (name/regex),
physical aspect + resolution, brand fields. See `examples/*/model.manifest.json`.

### 2. The storyboard contract — `storyboard.json`

`duration`, per-orientation `fov`, camera keyframes in spherical coordinates
(`{t, az, el, d}`), `orbitTarget` (default `screenCenter`), `fades`, and the
shots verification table. See `examples/*/storyboard.json`.

### 3. The content contract — `PTContent`

A JS object exposing `meta` (`screen.w/h`), `buildState(t)` (**pure** time →
state; the determinism root), `drawScreen(ctx, state, w, h, t)`,
`theme` (CSS variables), `mountOverlay(root, brand)` / `updateOverlay(t, state)`
for DOM overlay animation, `startHtml(brand)` / `endHtml(brand)` frames, and
`scheduleAudio(ctx, startTime, duration, gain)` (must run identically on a
real `AudioContext` and an `OfflineAudioContext`). Reference implementations:
`content/terminal/content.js`, `content/web-scroll/content.js`.

## Determinism

The MP4 export never relies on wall-clock animation. The engine exposes
`window.__PT.seek(t)`; the exporter steps every frame at `1/30` intervals
under headless Chromium with SwiftShader, captures the canvas, and renders
audio via `OfflineAudioContext`. A double-render probe at a mid-trailer frame
asserts byte-identical PNG output — `tools/ci_export.py` enforces this gate
across both templates and both orientations (44 checks).

## Install as an agent skill

```bash
npx skills add Cottzz/product-trailer          # all detected agents
npx skills add Cottzz/product-trailer -a trae  # Trae only
```

## Examples & gallery

Rendered trailers for all three example projects (self-dogfooding,
SellerScope, landing-page scroll) — both orientations plus poster frames and
self-contained HTML cuts — live on the
[gallery page](https://cottzz.github.io/product-trailer/gallery/). Media is
hosted as [GitHub Release assets](https://github.com/Cottzz/product-trailer/releases/tag/gallery-media)
(never committed to git); regenerate everything with
`tools/pt_render_materials.sh`.

> **Model licensing note:** only CC0 / public-domain / procedurally generated
> models are redistributed in this repo. Third-party or branded models (e.g.
> a MacBook GLB under Sketchfab Standard) may be used for **local renders** —
> they can appear in your exported videos — but their source files must never
> be committed or redistributed. Keep them in the git-ignored `models/local/`
> and see [`models/ATTRIBUTION.md`](models/ATTRIBUTION.md).

## Roadmap

See [`docs/PLAN.md`](docs/PLAN.md) for the audit-revised plan. v0.2 tracks a
full browser playground (GLB drag-and-drop → render in-page), a CC0 model
library, and more content templates.

## License

[Apache-2.0](LICENSE). Bundled three.js r128 / GLTFLoader r128 are MIT — see
[THIRD_PARTY_NOTICES](THIRD_PARTY_NOTICES) for required copyright notices.
