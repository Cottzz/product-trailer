# Agent Blender modeling guide for product-trailer

> Audience: AI coding agents (GPT-6 Astra, Claude, Codex, Trae, …) that can
> drive Blender through its Python API.
> Goal: go from a natural-language product description to a trailer-ready,
> **uncompressed** GLB that satisfies the product-trailer model contract
> ([`model.manifest.json`](../examples/dogfood/model.manifest.json)).

product-trailer turns a GLB device model with a screen plus screen content
into a ~30-second cinematic trailer (single-file HTML + deterministic MP4).
Since GPT-6 Astra can model autonomously inside Blender (procedural geometry
nodes, Python API, render-and-fix vision loops, overnight unattended runs),
you can now produce the model input yourself instead of asking the user to
source a GLB. This guide is the contract between your Blender workflow and
the pipeline.

## The five-step pipeline

```
1. Model the device in Blender (procedural, via bpy / Geometry Nodes)
2. Name and prepare the screen mesh        ← hardest requirement, see below
3. Export an uncompressed GLB              → tools/pt_export_glb.py
4. Calibrate / write model.manifest.json   → external GLB source + screen selector
5. Build the trailer                       → pt_build.py + pt_export_mp4.py
```

Commands for steps 3–5:

```bash
# 3. From inside Blender (headless), export + mesh inventory:
blender -b device.blend -P tools/pt_export_glb.py -- --export out/device.glb

# 3b. Without Blender, verify an existing GLB is uncompressed/r128-safe:
python3 tools/pt_export_glb.py --check out/device.glb

# 4. Interactive calibration (or hand-write the manifest, template below):
#    open https://cottzz.github.io/product-trailer/calibrate/, load the GLB,
#    pick the screen mesh, export model.manifest.json.

# 5. Build and render (from the repo root):
python3 tools/pt_build.py \
  --manifest job/model.manifest.json \
  --storyboard job/storyboard.json \
  --content content/terminal/content.js \
  --out trailer.html
python3 tools/pt_export_mp4.py --html trailer.html \
  --orientation vertical   --out trailer-vertical.mp4
python3 tools/pt_export_mp4.py --html trailer.html \
  --orientation horizontal --out trailer-horizontal.mp4
```

## Hard requirements (the GLB must satisfy all of these)

1. **One mesh named `screen`.** The engine replaces the material of the
   selected screen mesh with a live canvas texture every frame. Name the
   display surface object (the emissive panel of the laptop lid / phone face /
   monitor / kiosk) exactly `screen` — lowercase, no suffix. It must be a flat
   quad (or very slightly curved panel) whose UV map covers the full
   0–1 UV square with no overlap; the canvas is drawn onto it.
   - The `--export` tool prints the full mesh inventory and flags any mesh
     containing "screen" so you can verify the name made it through export.
   - If the device has multiple displays, name them `screen`, `screen_2`, …
     and put the primary one first; the manifest selector can match any of
     them by name or regex.

2. **Uncompressed glTF binary (`.glb`).** The engine pins three.js **r128**,
   which cannot load Draco mesh compression, KTX2/Basis textures, or meshopt.
   The helper exporter turns all of those off (`export_draco_mesh_compression`
   etc. are not passed); always export through `tools/pt_export_glb.py` or
   replicate its flags. The `--check` mode inspects the GLB JSON chunk and
   fails with exit code 1 if it finds `KHR_draco_mesh_compression`,
   `KHR_texture_basisu`, or `EXT_meshopt_compression`.

3. **No animation or shape keys required.** The engine animates the camera
   only; the device stays static. A hinged laptop must be modeled **open** at
   a fixed angle (lid ≈ 105–115° from the deck reads best on camera). Rigging,
   armatures, shape keys, and baked animation are not needed and should be
   stripped before export (the helper does).

4. **Physical screen aspect ratio.** Model the display panel in its true
   aspect ratio: laptop/monitor 16:10 or 16:9, phone ~19.5:9, tablet 4:3.
   Set `screen.resolution` in the manifest to a matching value
   (e.g. 1280×800 for 16:10, 1170×2532 for a phone). The canvas is drawn at
   that resolution and stretched to the mesh UV, so a mismatched panel shape
   visibly distorts the screen content.

5. **Modest, clean topology.** Aim for a few thousand to a few tens of
   thousands of tris; the trailer is a beauty render of one hero device, not
   an engineering CAD file. Apply transforms before export (location/rotation/
   scale), leave the model roughly centered, and keep the screen facing the
   +X direction in Blender world space if possible — see the flipY note below.

6. **Simple PBR materials.** The screen mesh keeps a placeholder material
   (it is replaced at runtime); use a plain Principled BSDF or a flat
   emissive shader — no texture needed. Body materials should be standard
   Principled BSDF with basic metal/roughness values; baked image textures
   are allowed (they export uncompressed) but procedural node setups do not
   all translate to glTF, so prefer image textures or solid colors.

7. **Y-up is handled for you.** Blender is Z-up; glTF is Y-up and the glTF
   exporter applies the −90° X-axis conversion automatically. Do not bake your
   own rotation into the mesh to "fix" the axis. Model upright in Blender and
   export normally.

## flipY note

The engine defaults `flipY` to `true` for its built-in models and `false`
for external GLBs. If the screen content renders upside-down or mirrored
after you load the model, toggle `"flipY": true` in the manifest's `screen`
object and re-render — this is a one-line calibration, not a modeling fix.

## Manifest template (external GLB)

Write `job/model.manifest.json` (or export one from the calibration page):

```json
{
  "model": {
    "source": {
      "type": "external",
      "url": "./device.glb"
    }
  },
  "normalize": {
    "targetSize": 3.2
  },
  "rotationY": 0,
  "screen": {
    "mesh": "screen",
    "resolution": { "w": 1280, "h": 800 },
    "glowColor": "#8BE9FD"
  },
  "brand": {
    "name": "Your Product",
    "tagline": "One GLB. One trailer. Zero edits.",
    "version": "v0.1"
  }
}
```

- `source.url` is resolved relative to the manifest file (or the built HTML
  when inlined). Keep the GLB next to the manifest for local jobs.
- `screen.mesh` is a case-sensitive substring match against mesh names; a
  regex also works. `"screen"` matches the `screen` mesh as instructed above.
- `rotationY` (radians) turns the model around the vertical axis before
  framing; set it so the screen faces the camera at `az = 0` in your
  storyboard, or iterate visually in the calibration page.
- A `storyboard.json` and a PTContent template (`content/terminal` or
  `content/web-scroll`) complete the job — copy any example under
  [`examples/`](../examples/) as a starting point.

## Suggested agent build loop in Blender

1. Block out the device from primitives / Geometry Nodes: body, lid, deck,
   screen panel, hinge, feet. Keep parts as separate named objects
   (`body`, `lid`, `screen`, `keyboard_deck`, …) — clean naming makes
   calibration trivial.
2. Name the display panel object `screen`; give it a full-frame UV unwrap.
3. Set the lid angle (~110°), apply all transforms.
4. Render low-sample preview frames and compare them against your reference
   (this is the same render-inspect-fix loop Astra uses) until proportions
   read correctly.
5. Export with the helper: `blender -b device.blend -P tools/pt_export_glb.py
   -- --export out/device.glb`. The tool's stdout lists every mesh and
   highlights screen candidates — confirm `screen` is present.
6. Run `python3 tools/pt_export_glb.py --check out/device.glb` for an
   engine-compatibility verdict (works on machines without Blender).
7. Load the GLB in the [calibration playground](../calibrate/), pick the
   screen mesh, and export the manifest.

## Licensing & trademark rules (do not skip)

These rules are inherited from the repo's model policy (F4/F7/F8) and apply
with full force to agent-authored models:

- **Committed/shared jobs need a clean IP chain.** An agent-modeled device
  for a public example must be an original/fictional design or explicitly
  CC0. Anything placed under `examples/` must depend only on `builtin:` or
  CC0 assets.
- **Branded devices are local-render-only.** If you model a real product
  (a MacBook, a specific phone, etc.) or a user's proprietary hardware, the
  GLB and any self-contained HTML that inlines it must stay in the
  git-ignored `models/local/` / `examples-local/` directories. The rendered
  MP4s/posters may be used, but the model source is never committed or
  redistributed — see [`models/ATTRIBUTION.md`](../models/ATTRIBUTION.md).
- **Trademarks need a disclaimer.** Trailers featuring a recognizable brand
  must inject the brand-specific trademark line via `brand.disclaimer` in
  the manifest; the built-in generic disclaimer covers fictional models only.
  Never place a real company's logo or mark on a model intended for
  redistribution without rights.
- Do not download and reshape a third-party Sketchfab/purchased model to
  launder its license — the procedural output of an agent prompted to build
  an original device is clean; a converted third-party asset keeps its
  original license terms.

## Pre-delivery checklist

- [ ] One mesh named exactly `screen` (flat panel, full 0–1 UVs)
- [ ] Screen panel aspect matches `screen.resolution`
- [ ] Laptop lid open ~105–115°; transforms applied; model centered
- [ ] `tools/pt_export_glb.py --check device.glb` exits 0 (no Draco/KTX2/meshopt)
- [ ] Calibration page (or manifest) selects the screen mesh correctly
- [ ] If content appears upside-down, `"flipY": true` set in the manifest
- [ ] Original/CC0 design for anything committed; branded models kept local
- [ ] `brand.disclaimer` set when a real brand appears
- [ ] `pt_build.py` + `pt_export_mp4.py` produce a trailer; mid-trailer frame
      visually spot-checked (screen readable, device well-framed)
