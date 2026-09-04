# Changelog

All notable changes to this project are documented here.
The format is based on [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased](https://github.com/Cottzz/product-trailer/commits/main)

### Added

- **Trademark disclaimer (F8)** — both content templates (`terminal`,
  `web-scroll`) now render a trademark disclaimer line in the finale overlay
  and the end card of every trailer by default. Override or localize it via
  `brand.disclaimer` in `model.manifest.json` (or `cfg.disclaimer` in an
  example's content config; set it to `false` to hide it). The README files
  now include a bilingual **Disclaimer / 免责声明** section linking to
  Apple's trademark guidelines; the mechanism is documented in
  `models/ATTRIBUTION.md`.

### Fixed

- **End card missing from MP4 output.** The ffmpeg PNG pipe in
  `pt_export_mp4.py` omitted the input `-framerate`, so the 900 piped PNGs
  were read at the image2pipe default of 25 fps and re-timed to the 30 fps
  output: with `-shortest`, ffmpeg only encoded the first ~750 input frames
  (trailer seconds 0–25), dropping the finale overlay fade and the brand end
  card entirely from the rendered video. The pipe now declares
  `-framerate 30` at the input, so every captured frame maps 1:1 to the
  output. The headless launch also adds
  `--run-all-compositor-stages-before-draw` as a defensive guarantee that
  screenshots never capture a partially-composited frame.
- **Duplicated brand name on the terminal end card.** The terminal content
  template rendered the brand name twice in the end card panel — once as the
  logo line and again as a cyan command-echo line immediately below it. The
  redundant echo line was removed; the end card now shows the brand, tagline,
  and prompt once each, matching the `web-scroll` template.

- **Trademark disclaimer attribution corrected.** The two content templates
  (`terminal`, `web-scroll`) shipped a MacBook/Apple-specific disclaimer as
  their hard-coded `DEFAULT_DISCLAIMER`, so trailers rendered with the
  procedural built-in models (e.g. the SellerScope and landing clips) wrongly
  displayed an Apple trademark statement. The built-in default is now a
  **generic** third-party trademark statement ("3D models shown are for feature
  demonstration only and are fictional. All product names and trademarks are
  the property of their respective owners."), and the MacBook/Apple line is
  supplied per render job via `brand.disclaimer` in the (git-ignored, local-only)
  dogfood-macbook manifest. All three gallery clips were re-rendered so their
  finale disclaimers match the device actually on screen.

### Changed

- **Dogfood trailer re-rendered with a real MacBook model (F9).** The
  self-promotional trailer (README header, gallery cover, release assets) now
  shows a real 14-inch MacBook Pro render instead of the procedural built-in
  laptop, with the English MacBook/Apple trademark disclaimer injected through
  `brand.disclaimer` in the local manifest. Per the non-redistributable
  Sketchfab Standard license, only the rendered MP4s and poster frames are
  published as release assets; the GLB source and the self-contained HTML that
  inlines it remain in git-ignored local directories (`models/local/`,
  `examples-local/`).

- **Documentation copy pass (F10).** All reader-facing Markdown files
  (`README.md`, `README.zh-CN.md`, `SKILL.md`, `CONTRIBUTING.md`,
  `CHANGELOG.md`, `docs/PLAN.md`, `models/ATTRIBUTION.md`,
  `assets/audio/ATTRIBUTION.md`, `references/shot-cards.md`) were proofread
  for grammar, word choice, and punctuation in both English and Chinese;
  PTContent contract signatures in the docs were corrected to match the
  engine.

- Trademark disclaimer grammar: "are property of Apple Inc." now reads
  "are the property of Apple Inc." in both content templates.

- **Gallery page is bilingual (F11).** `gallery/index.html` now ships with an
  EN/中文 language toggle (persisted in `localStorage`, defaulting to the
  browser language). The hero, cards, playground, and footer copy are
  available in natural English and Chinese; the root redirect page shows a
  bilingual message. The dogfood card description now reflects the real
  MacBook render and states the model is used for rendering only, and its
  "Live HTML cut" link is hidden to comply with the no-redistribution rule.

- **Promotional image aspect ratios corrected (F13).** The README header
  banner (both languages) switched from the tall 9:16 poster to a 16:9
  cinematic frame (`dogfood-banner.jpg`); the gallery card media container
  changed from `aspect-ratio: 16/10` (which cropped the 9:16 vertical videos)
  to `aspect-ratio: 9/16` with centered `object-fit: cover`.

- **sellerscope / landing gallery assets re-rendered.** Their earlier MP4s
  were produced by the pre-fix exporter (before the missing `-framerate` bug
  was corrected), so they lost the end card, and a later pass still carried the
  MacBook-specific disclaimer despite using the procedural built-in models.
  They are now re-rendered with the fixed, deterministic pipeline and the
  generic disclaimer, then re-uploaded to the `gallery-media` release.

## [0.1.0] — 2026-09-04

First public beta. Cinematic 3D product trailers from any GLB device model plus
screen content, delivered as a self-contained HTML player and deterministic MP4.

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
  (auto-scrolling mock-browser landing page with cursor glides, click ripples,
  and a DOM-overlay finale).

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

- **Shot cards** — `references/shot-cards.md`: five-beat sheet, spherical
  camera-keyframe model, orientation differences, and aesthetic rules.

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

