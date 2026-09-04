# product-trailer

> Cinematic 3D product trailers from **any** GLB model with a screen — as a
> self-contained HTML player **and** a deterministic MP4. GLB in, trailer out.

[![License: Apache-2.0](https://img.shields.io/badge/license-Apache--2.0-blue)](LICENSE)

[**🎬 Watch the gallery**](https://cottzz.github.io/product-trailer/gallery/) · [Get started](#quickstart) · [中文说明](README.zh-CN.md)

[![product-trailer: a cinematic terminal trailer rendered on a 3D MacBook](https://github.com/Cottzz/product-trailer/releases/download/gallery-media/dogfood-banner.jpg)](https://cottzz.github.io/product-trailer/gallery/)

<video controls muted preload="none" width="480" poster="https://github.com/Cottzz/product-trailer/releases/download/gallery-media/dogfood-poster-1.jpg">
  <source src="https://github.com/Cottzz/product-trailer/releases/download/gallery-media/dogfood-vertical.mp4" type="video/mp4">
  [▶ Watch the vertical trailer](https://github.com/Cottzz/product-trailer/releases/download/gallery-media/dogfood-vertical.mp4)
</video>

Give it a 3D model with a display (laptop, phone, kiosk, TV, and so on) and
screen content (a terminal session, a scrolling landing page, anything you can
draw on a canvas), and it produces a ~30-second cinematic promo: a side reveal,
a turn to the front, a hero push-in, a screen cross-fade, and a brand end
frame. Both portrait 9:16 and landscape 16:9 come from the same cut.

## Why

Launch videos for dev tools are slow to make and impossible to keep in sync
with the product. product-trailer turns a **3D model + a screen-content
script** into a reproducible build artifact — regenerate the trailer on every
release, byte-for-byte identical, with zero manual video editing.

## Highlights

- **Two outputs from one cut** — a zero-dependency **single HTML file**
  (three.js r128 inlined; just double-click it to play over `file://`, no
  server required) and a **deterministic MP4** (headless Chrome
  frame-stepping via `__PT.seek(t)`, an OfflineAudio mix, and ffmpeg). Render
  the same cut twice and the two MP4s are byte-identical.
- **Three contracts, independently swappable** —
  [`model.manifest.json`](#1-the-model-contract) (model source, screen mesh,
  normalization), `storyboard.json` (camera keyframes, fov, fades), and a
  `PTContent` template (a pure `buildState(t)` plus `drawScreen()`).
- **Everything included** — procedural built-in laptop and phone models (no
  external assets, no license risk), two content templates (`terminal` and
  `web-scroll`), and a browser **calibration playground** for targeting the
  screen mesh on any GLB.
- **Ready for AI agents** — installable as a skill in Claude Code, Codex, or
  Trae; the root `SKILL.md` is the multi-agent entry point.

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

For the `web-scroll` template, pass the example config **before** the template
file (`pt_build` concatenates `--content` files in order):

```bash
python3 tools/pt_build.py \
  --manifest examples/landing/model.manifest.json \
  --storyboard examples/landing/storyboard.json \
  --content examples/landing/content.js content/web-scroll/content.js \
  --out landing.html
```

Bring your own GLB: open the [calibration playground](https://cottzz.github.io/product-trailer/calibrate/),
load the model, pick the screen mesh, export `model.manifest.json`, then point
`pt_build.py` at it. GLBs must be **uncompressed** glTF (three.js r128 does not
support Draco or KTX2); run them through gltf-pipeline first if needed.

## The three contracts

### 1. The model contract — `model.manifest.json`

Model source (`builtin:laptop` | `builtin:phone` | inlined base64 | external
`.glb` path), normalization size, `rotationY`, the screen mesh (name/regex),
physical aspect ratio and resolution, and brand fields. See
`examples/*/model.manifest.json`.

### 2. The storyboard contract — `storyboard.json`

`duration`, per-orientation `fov`, camera keyframes in spherical coordinates
(`{t, az, el, d}`), `orbitTarget` (default `screenCenter`), `fades`, and the
shots verification table. See `examples/*/storyboard.json`.

### 3. The content contract — `PTContent`

A JS object exposing `meta` (`screen.w/h`), `buildState(t)` (a **pure**
time-to-state function; the root of determinism), `drawScreen(ctx, state, w, h, t)`,
`theme` (CSS variables), `mountOverlay(root, brand, brandCfg)` and
`updateOverlay(t, state)` for DOM overlay animation, `startHtml(brand, brandCfg)`
and `endHtml(brand, brandCfg)` frames, and
`scheduleAudio(ctx, startTime, duration, gain)` (must behave identically on a
real `AudioContext` and an `OfflineAudioContext`). Reference implementations:
`content/terminal/content.js`, `content/web-scroll/content.js`.

## Determinism

The MP4 export never relies on wall-clock animation. The engine exposes
`window.__PT.seek(t)`; under headless Chromium with SwiftShader, the exporter
steps through every frame at `1/30`-second intervals, captures the canvas, and
renders audio via `OfflineAudioContext`. A double-render probe at a mid-trailer frame
asserts byte-identical PNG output — `tools/ci_export.py` enforces this gate
across both templates and both orientations (44 checks).

## Install as an agent skill

```bash
npx skills add Cottzz/product-trailer          # all detected agents
npx skills add Cottzz/product-trailer -a trae  # Trae only
```

## Examples & gallery

Rendered trailers for all three example projects (the self-demo trailer,
SellerScope, and the landing-page scroll) live on the
[gallery page](https://cottzz.github.io/product-trailer/gallery/), including
both orientations, poster frames, and self-contained HTML cuts. Media is hosted
as [GitHub Release assets](https://github.com/Cottzz/product-trailer/releases/tag/gallery-media)
and is never committed to git; regenerate everything with
`tools/pt_render_materials.sh`.

> **Model licensing note:** only CC0 / public-domain / procedurally generated
> models are redistributed in this repo. Third-party or branded models (e.g.
> a MacBook GLB under Sketchfab Standard) may be used for **local renders** —
> they can appear in your exported videos — but their source files must never
> be committed or redistributed. Keep them in the git-ignored `models/local/`
> and see [`models/ATTRIBUTION.md`](models/ATTRIBUTION.md).

## Disclaimer

**English —** The 3D models used in this project's video demonstrations are
for feature demonstration purposes only. MacBook and its industrial design
and trademarks are the property of Apple Inc. This project is not affiliated
with, endorsed by, or sponsored by Apple Inc. A trademark disclaimer line is
rendered into the finale of every trailer by default; override or localize it
via `brand.disclaimer` in `model.manifest.json` (or `cfg.disclaimer` in an
example's content config; set it to `false` to hide it). See
[Apple's guidelines for third parties](https://www.apple.com/legal/intellectual-property/guidelinesfor3rdparties.html).

**中文 —** 本项目的视频演示中使用的 3D 模型仅用于功能展示。MacBook 及其工业设计、商标所有权均归
Apple Inc. 所有，本项目与其无任何官方关联或背书关系。每条预告片的结尾画面默认会渲染一行商标免责声明，
可通过 `model.manifest.json` 的 `brand.disclaimer`（或范例 content 配置中的 `cfg.disclaimer`）
自定义/本地化（设为 `false` 可关闭）。参见
[Apple 第三方使用指引（中文）](https://www.apple.com.cn/legal/intellectual-property/guidelinesfor3rdparties.html)。

## Roadmap

See [`docs/PLAN.md`](docs/PLAN.md) for the audit-revised plan. Planned for
v0.2: a full browser playground (GLB drag-and-drop → render in-page), a CC0
model library, and more content templates.

## License

[Apache-2.0](LICENSE). Bundled three.js r128 / GLTFLoader r128 are MIT — see
[THIRD_PARTY_NOTICES](THIRD_PARTY_NOTICES) for required copyright notices.
