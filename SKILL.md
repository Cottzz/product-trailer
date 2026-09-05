---
name: product-trailer
description: Generate a cinematic 3D product trailer/promo video from any GLB 3D model that has a screen (laptop, phone, monitor, tablet) plus screen content (terminal session, scrolling web page, app UI). Use when the user wants a product launch film, 3D 产品宣传片/预告片, 产品宣传 Demo, cinematic camera-orbit reveal of a device, an embeddable self-contained HTML player, or a deterministic MP4 (portrait 9:16 / landscape 16:9). Keywords: 3D trailer, product promo, GLB, glTF, three.js, cinematic, camera move, orbit, push-in, cross-fade, screen content, 产品宣传, 预告片, 运镜, 笔记本, 手机, 录屏成片.
---

# product-trailer (skill)

Turn a GLB device model + screen content into a ~30s cinematic product trailer,
delivered as a single self-contained HTML player and/or a deterministic MP4.

## When to use

- The user has a 3D product model (`.glb`) with a screen surface and wants a
  cinematic promo / launch film / 产品宣传片 / 预告片.

- The user wants screen content (a terminal boot sequence, a scrolling website,
  an app UI) shown on the device during the trailer.

- The user wants either a shareable double-click HTML file or an MP4
  (portrait 1080×1920 or landscape 1920×1080, 30fps).

## Inputs (three contracts)

1. **Model manifest** (`model.manifest.json`) — model source (inline GLB base64,
   external `.glb`, or a builtin procedural `laptop`/`phone`), normalization,
   `rotationY`, screen-mesh selector, `flipY`, screen aspect/resolution, and a
   `brand` object (`name`, `tagline`, `version`, optional `disclaimer`).
   Generate one interactively with the calibration page (`calibrate/`).
   If the user has no GLB and you can drive Blender yourself, model the device
   procedurally in Blender and export it: follow
   `docs/agent-blender-modeling.md` (name the display mesh `screen`, export
   uncompressed glTF via `tools/pt_export_glb.py`, verify with its `--check`
   mode, then write an external-source manifest).
2. **Storyboard** (`storyboard.json`) — duration, portrait/landscape fov, camera
   keyframes `[{t, az, el, d}]`, `orbitTarget` (default `screenCenter`), fades.
3. **Content template** (PTContent) — `meta`, `buildState(t)` (pure),
   `drawScreen(ctx,state,w,h)`, `theme`, `startHtml`/`endHtml`,
   `mountOverlay`/`updateOverlay`, `scheduleAudio(ctx,duration,gain)`.
   Bundled templates: `terminal`, `web-scroll`.

## Build & export

- Single-file HTML: `python tools/pt_build.py --manifest <m> --storyboard <s> --content <c> [cfg ...] --out trailer.html`
  `--content` accepts multiple JS files concatenated in order. The `web-scroll`
  template needs the example config **before** the template:
  `--content examples/landing/content.js content/web-scroll/content.js`.

- MP4 (deterministic): `python tools/pt_export_mp4.py --html trailer.html --orientation vertical|horizontal --out trailer.mp4`
  (headless Chrome via CDP `__PT.seek(t)` frame stepping + OfflineAudio + ffmpeg;
  flags: `--fps 30 --sample-rate 48000 --keep-wav <wav> --probe-time 9.5`)

- Gallery materials (both orientations, posters, WAV, self-contained cuts):
  `tools/pt_render_materials.sh`

- Watch rendered examples: https://cottzz.github.io/product-trailer/gallery/

## Determinism & constraints

- three.js r128 global build (pinned; no ES modules, works over `file://`).

- Only **uncompressed** GLB (no Draco/KTX2/meshopt) on r128.

- Inline GLB soft limit ~20MB; use external-GLB mode or builtins for larger models.

- Models/audio committed to the repo must be CC0/procedural — see
  `models/ATTRIBUTION.md` and `assets/audio/ATTRIBUTION.md`.

- **Local-only models (F7):** branded or third-party GLBs whose license forbids
  redistribution (e.g. a MacBook model under Sketchfab Standard) may be used for
  **local renders** and can appear as background, props, or demo footage in
  exported videos, but their source files (and any self-contained HTML that
  inlines them) must never be committed or redistributed. Keep them in the
  git-ignored `models/local/`; keep private jobs referencing them in
  `examples-local/`.
  Everything under `examples/` must depend only on `builtin:` / CC0 assets.

- **Trademark disclaimer (F8):** every trailer renders a trademark disclaimer
  line in its finale overlay and end card. The built-in English default is a
  **generic** third-party trademark statement (fictional models; "property of
  their respective owners"), suitable for the procedural built-ins. When a
  render features a specific branded model (e.g. a local MacBook GLB), override
  it with the matching brand-specific text via `brand.disclaimer` in the
  manifest's `brand` object (or `cfg.disclaimer` in an example content config;
  set it to `false` to hide the line). The README files carry the Apple
  disclaimer for the MacBook self-demo; see `models/ATTRIBUTION.md`.

## Reference

- Roadmap & contracts: `docs/PLAN.md`

- Shot cards & aesthetic rules: `references/`

