# Changelog

All notable changes to this project are documented here.
The format is based on [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased](https://github.com/Cottzz/product-trailer/commits/main)

### Added

- Repository skeleton, Apache-2.0 license, third-party notices.

- Multi-agent skill distribution manifests (`.claude-plugin/plugin.json`,
  `agents/openai.yaml`); root `SKILL.md` as the multi-agent entry point.

- Audit-revised roadmap: [`docs/PLAN.md`](docs/PLAN.md) (v2, findings F1–F7).

- **Engine & contracts** — slot-based single-file engine (`engine/stage.html`,
  `engine/engine.js`) with `window.__PT.seek(t)` deterministic scrubbing,
  three.js r128 pinned (uncompressed glTF only), `preserveDrawingBuffer` export
  path.

- **Procedural built-in models** — stylized laptop and phone generated in-repo
  (`engine/builtin-models.js`); zero external assets, no trademark/redistribution
  risk.

- **Content templates** — `terminal` (cinematic shell session) and `web-scroll`
  (auto-scrolling mock-browser landing page with cursor glides, click ripples
  and DOM-overlay finale).

- **Examples** — `dogfood` (self), `sellerscope`, `landing`; each with
  `model.manifest.json` + `storyboard.json` (+ content cfg for web-scroll).

- **Tooling** — `tools/pt_build.py` (single-file HTML packer, multi-content
  concatenation), `tools/pt_export_mp4.py` (CDP seek-per-frame +
  OfflineAudio mix + ffmpeg; vertical/horizontal; double-render determinism
  probe), `tools/ci_export.py` acceptance gate (both templates × both
  orientations, 44 checks), `tools/pt_render_materials.sh` (gallery render).

- **Calibration playground** (`calibrate/`) — load a GLB, pick the screen mesh,
  preview, export a manifest JSON; doubles as the M5 playground kernel.

- **Gallery preview wall** (`gallery/`) — hover-to-preview trailers streamed
  from the rolling `gallery-media` GitHub Release (media never in git); served
  via GitHub Pages with `.nojekyll`.

- **Model policy** — CC0 / public-domain / procedural models only in-repo;
  third-party or branded models (e.g. MacBook GLB) are local-render-only via
  git-ignored `models/local/` (see `models/ATTRIBUTION.md`).

### Changed

- `orbitTarget` defaults to `screenCenter` (was bbox center), evaluated in
  world space after normalization/rotation (F1).

### Fixed

- web-scroll layout constants (`FEAT_H`/`STATS_H`) that pushed the stats/CTA
  sections off-canvas in the screen-space virtual page.

- finale overlay entrance overlapping the browser chrome (translate direction
  corrected to an ease-up entrance).

