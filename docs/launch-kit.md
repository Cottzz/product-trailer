# product-trailer launch kit

Everything needed to ship the public launch on launch day, copy-paste ready.
All copy is in English; replace the `{{ }}` placeholders before posting. The
videos, posters, and links below already exist — do not invent new asset URLs.

- Gallery (landing page): https://cottzz.github.io/product-trailer/gallery/
- Calibration playground: https://cottzz.github.io/product-trailer/calibrate/
- Source: https://github.com/Cottzz/product-trailer
- Release (v0.1.0): https://github.com/Cottzz/product-trailer/releases/tag/v0.1.0

## Product Hunt

Product Hunt resets at 12:01 AM Pacific Time (00:01 PST). A launch that goes
live in the first minutes of the day gets the longest runway for upvotes and
comments. Schedule the post the night before, or publish right at reset, and
block the whole first day for replying to every comment.

**Name**

```
product-trailer
```

**Tagline** (60 characters max)

```
Turn any 3D model into a cinematic 30-second trailer
```

**Short description** (260 characters max; Product Hunt calls this the
"one-liner" / description field)

```
Open-source engine: give it a GLB model with a screen plus a screen-content script, and it renders a ~30s cinematic trailer as a single HTML file and a deterministic MP4. Built for dev-tool launch videos.
```

**Topics**: Open Source, Developer Tools, 3D, GitHub, Video, Productivity

**Website / URL**: the gallery page
(`https://cottzz.github.io/product-trailer/gallery/`) — it is the best first
impression and links through to GitHub.

**First comment (maker comment)** — post this yourself the moment the launch
goes live:

```
Maker here. 👋

Launch videos for dev tools are slow to produce and go stale the moment you ship a new release. I kept needing a 30-second cinematic clip for something that has a screen — a CLI, a web app, an internal tool — and didn't want to re-edit video every time.

product-trailer treats the trailer as a build artifact. You give it:
  1. a GLB model with a display (laptop, phone, kiosk, TV — or have an AI agent build one in Blender),
  2. a camera storyboard,
  3. a screen-content script (a terminal session, a scrolling landing page, anything you can draw on a canvas).

It renders the same ~30s cut two ways: a zero-dependency single HTML file (three.js inlined, double-click to play), and a deterministic MP4 from headless Chrome + ffmpeg. Render the same cut twice and the two MP4s are byte-identical, so you can regenerate the trailer in CI on every release.

A few things I'd love feedback on:
- The three-contract split (model manifest / storyboard / content template) — does it map to how you'd want to swap models and content?
- AI agents can now drive the whole pipeline, including modeling the device in Blender. Curious if that's a workflow people actually want.
- What content templates would you use first (terminal, web-scroll, …)?

The gallery has three finished trailers: https://cottzz.github.io/product-trailer/gallery/
Source + quickstart: https://github.com/Cottzz/product-trailer

Happy to answer anything — the deterministic-MP4 internals, the three.js r128 single-file constraint, the Blender agent path, whatever.
```

**Gallery upload order** (visual assets on the product page — first asset is
the thumbnail; video is supported as the first asset):

1. Vertical trailer MP4 — `dogfood-vertical.mp4` (see asset links below), the
   9:16 cut is the strongest hook
2. Social card — `og-card.jpg` (1200×630)
3. Horizontal trailer — `dogfood-horizontal.mp4`
4. Posters — `poster-dogfood.jpg`, `poster-sellerscope.jpg`,
   `poster-landing.jpg` (1080×1920)

**First-day comment responses** — keep these points ready:

- "How is this different from screen recording / animation tools?" — it's a
  reproducible render driven by three plain-text contracts, not a timeline you
  edit by hand; the MP4 is deterministic and regenerates from CI.
- "Do I need a 3D model?" — no. There are procedural built-in laptop/phone
  models, and AI agents that drive Blender can build a trailer-ready GLB from a
  description; `docs/agent-blender-modeling.md` is the contract.
- "Free / open source?" — yes, Apache-2.0, self-hostable, no service.
- "Windows?" — the tooling is Python + Playwright Chromium + ffmpeg; the
  single-file HTML player runs anywhere a browser does.

**After launch day**: once the Product Hunt post is live, add its badge to the
top of `README.md` / `README.zh-CN.md` using the post URL, and log it in the
changelog.

## Show HN

Post on a weekday, Tuesday–Thursday, 8:00–9:00 AM US Eastern is the
commonly-cited sweet spot; avoid weekends and US holidays. Read every comment
in the first two hours — HN ranking is decided early.

**Title**

```
Show HN: Product-trailer – turn any GLB model into a cinematic 30-second trailer
```

**Body**

```
Hi HN —

I kept needing short launch videos for things that have a screen (a CLI tool, a web app), and hand-editing a 3D clip every release felt wrong. So I built product-trailer: a small open-source engine that turns a 3D model with a display + a screen-content script into a ~30s cinematic trailer.

You hand it three things:
- a model manifest — any GLB with a screen (laptop, phone, kiosk, TV), or the built-in procedural laptop/phone; an AI agent that drives Blender can also model the device and export it
- a storyboard — camera keyframes, fov, fades, as data
- a content template — pure functions buildState(t) + drawScreen() that paint the screen (a terminal session, a scrolling landing page, ...)

It outputs the same cut two ways:
1. A single self-contained HTML file — three.js r128 inlined, no modules, no server, double-click and it plays over file://.
2. A deterministic MP4 — headless Chrome frame-steps the player via window.__PT.seek(t) through CDP, mixes audio with OfflineAudioContext, and ffmpeg assembles it. Render the same storyboard twice and you get byte-identical files, so the trailer can be a CI artifact regenerated on every release.

Three rendered examples (same cut in 9:16 and 16:9): https://cottzz.github.io/product-trailer/gallery/
A live calibration playground for pointing the engine at the screen mesh on any GLB: https://cottzz.github.io/product-trailer/calibrate/
Source (Apache-2.0): https://github.com/Cottzz/product-trailer

Tech notes worth a glance:
- three.js is pinned at r128 on purpose: the global non-module build inlines cleanly into one HTML file that works from file://, at the cost of no Draco/KTX2 (GLBs must be uncompressed glTF; a helper checks this).
- Determinism took a few iterations: CSS transitions and blinking cursors run off the wall clock, so under the export class everything is time-axis driven; audio goes through OfflineAudioContext.

Feedback I'm most after: is the "trailer as a reproducible build artifact" framing useful to you? What content would you want playing on the screen first? And does the agent-models-the-device-in-Blender path match how people actually work?

Thanks for looking.
```

**Comment watch-list for HN**: license questions (Apache-2.0 — answer
directly), "why not use <video pipeline tool>" (it's deterministic +
contract-driven, not an editor), security questions on running headless Chrome
(local rendering, nothing uploaded).

## X (Twitter)

Post the launch thread at the same time as the Product Hunt page goes live and
cross-link them; attach `dogfood-vertical.mp4` to the first post (X plays it
inline).

```
1/ I got tired of re-editing launch videos for dev tools.

So I built product-trailer: give it a 3D model with a screen + a content script, and it renders a ~30s cinematic trailer.

As a single HTML file AND a byte-for-byte deterministic MP4.

Open source. GLB in, trailer out.
[attach dogfood-vertical.mp4]
```

```
2/ The trick: the trailer is a build artifact, not a timeline you edit.

Three plain-text contracts:
- model.manifest.json — which GLB, which mesh is the screen
- storyboard.json — camera keyframes, fov, fades
- a content template — buildState(t) + drawScreen(), pure functions

Swap any one independently.
```

```
3/ No model? Two options:
- built-in procedural laptop & phone, zero assets
- an AI agent that drives Blender (GPT-6 Astra, Claude, Codex...) models the device and exports a trailer-ready GLB itself

The agent modeling contract is documented end to end.
```

```
4/ The MP4 is deterministic on purpose.

Headless Chrome frame-steps the player through CDP at t = 0, 1/30, ... ; audio mixes via OfflineAudioContext; ffmpeg assembles.

Same storyboard rendered twice → byte-identical files. Regenerate your launch video in CI on every release.
```

```
5/ Three finished trailers, same cut in 9:16 and 16:9:
https://cottzz.github.io/product-trailer/gallery/

Source (Apache-2.0) and quickstart:
https://github.com/Cottzz/product-trailer

What would you put on the screen?
```

## LinkedIn

```
Shipping something new: product-trailer, an open-source engine that turns a 3D model with a screen into a ~30-second cinematic product trailer — delivered as a single self-contained HTML file and a deterministic MP4.

For dev-tool teams, launch videos are a recurring tax: they take weeks to edit and go out of date every release. product-trailer treats the trailer as software. A model manifest, a camera storyboard, and a screen-content script — all plain text, all versionable — render the same cut two ways. The MP4 is byte-identical across renders, so the trailer can regenerate in CI whenever the product ships.

It also works the other way: with AI agents now able to drive Blender through its Python API, an agent can model the device itself and export the trailer-ready GLB. The modeling contract is documented in the repo.

Watch three examples (portrait and landscape from the same cut) at the gallery, and find the Apache-2.0 source on GitHub:

- Gallery: https://cottzz.github.io/product-trailer/gallery/
- Source: https://github.com/Cottzz/product-trailer

If your team spends real time on launch or update videos, I'd love to hear what would make this useful to you.
```

## Reddit

Reddit is harsh on launch-day marketing; read each subreddit's rules and lead
with the artifact or the engineering, not the pitch.

- **r/SideProject** — the natural home. Title: "I built an open-source tool
  that turns any 3D model with a screen into a cinematic 30-second trailer
  (HTML + deterministic MP4)". Post a comment with the backstory; the vertical
  video does the selling.
- **r/webdev** — angle: the single-file HTML player that runs from
  `file://` with three.js r128 inlined, and the deterministic headless-Chrome
  renderer. Developers' "showoff" style threads if a weekend.
- **r/programming** — only if linking a technical write-up rather than the
  landing page; the determinism story (frame-stepping via CDP,
  OfflineAudioContext, byte-identical output) is the link-bait.
- **r/gamedev / r/3Dmodeling** — careful: this is marketing-adjacent for those
  communities. Only post if you frame it as a Blender/GLB workflow artifact
  (the agent-modeling contract and the uncompressed-glTF checker), and check
  self-promotion rules first.

Universal rules: don't ask for upvotes, disclose that it's your project,
answer technical questions in the thread, and never post the same link to many
subreddits in one day.

## Launch calendar

Timeline in days relative to launch day (D-day = Product Hunt day). Product
Hunt and Show HN deliberately go on different days: chasing both front pages
on the same day splits your attention.

| When | Action |
| --- | --- |
| D-7 | Decide D-day (avoid holidays, big Apple/OpenAI/Google events). Verify all asset URLs in the asset list below resolve. Trim every trailer's links. |
| D-5 | Draft Product Hunt listing in the dashboard (save, don't schedule). Pre-write the maker comment and the expected Q&A responses above. |
| D-3 | Line up 2–3 people who will comment (not upvote-farm; genuine early feedback) in the first hour. Prep the X thread and LinkedIn post. |
| D-1 evening | Schedule the Product Hunt post for 00:01 PST. Have the first comment queued. |
| D-day 00:01 PST | Product Hunt goes live; post the maker comment immediately; post the X thread; reply to every PH and X comment all day (US time zone coverage matters). |
| D+1 morning | Show HN, Tuesday–Thursday 8:00–9:00 AM ET. Stay online for the first two hours. Share the HN thread with the people who offered feedback. |
| D+2 | LinkedIn long post. r/SideProject post. Reply to all threads. |
| D+3 to D+4 | r/webdev (or a technical write-up first if aiming at r/programming). Follow up on every open question. |
| D+7 | Wrap-up: post launch stats/lessons on X, add the Product Hunt badge to both READMEs, log the release in the changelog, close the loop with everyone who gave feedback. |

## Asset links

All of these already exist. Preview each one before posting.

### Videos (GitHub Release `gallery-media` host)

- Vertical dogfood trailer (9:16, main hook):
  https://github.com/Cottzz/product-trailer/releases/download/gallery-media/dogfood-vertical.mp4
- Horizontal dogfood trailer (16:9):
  https://github.com/Cottzz/product-trailer/releases/download/gallery-media/dogfood-horizontal.mp4
- SellerScope example, vertical:
  https://github.com/Cottzz/product-trailer/releases/download/gallery-media/sellerscope-vertical.mp4
- SellerScope example, horizontal:
  https://github.com/Cottzz/product-trailer/releases/download/gallery-media/sellerscope-horizontal.mp4
- Landing-page example, vertical:
  https://github.com/Cottzz/product-trailer/releases/download/gallery-media/landing-vertical.mp4
- Landing-page example, horizontal:
  https://github.com/Cottzz/product-trailer/releases/download/gallery-media/landing-horizontal.mp4

### Images

- Social / OG card (1200×630, use as Product Hunt thumbnail alt and social
  preview):
  https://cottzz.github.io/product-trailer/gallery/assets/og-card.jpg
- Cinematic banner (16:9, README header image):
  https://github.com/Cottzz/product-trailer/releases/download/gallery-media/dogfood-banner.jpg
- Posters (1080×1920):
  https://cottzz.github.io/product-trailer/gallery/assets/poster-dogfood.jpg
  https://cottzz.github.io/product-trailer/gallery/assets/poster-sellerscope.jpg
  https://cottzz.github.io/product-trailer/gallery/assets/poster-landing.jpg

### Pages

- Gallery: https://cottzz.github.io/product-trailer/gallery/
- Calibration playground: https://cottzz.github.io/product-trailer/calibrate/
- GitHub: https://github.com/Cottzz/product-trailer
- v0.1.0 release:
  https://github.com/Cottzz/product-trailer/releases/tag/v0.1.0

## Trademark note

The dogfood trailers show a MacBook model, rendered locally for demonstration.
That model is never redistributed (it is not in the repo or in any shipped
artifact), per the repository's trademark policy. Whenever a public post uses
the dogfood video or posters — the Product Hunt gallery, X, LinkedIn, Reddit —
include a line like:

```
The 3D MacBook shown in the demo is used for demonstration only; MacBook is a trademark of Apple Inc. This project is not affiliated with or endorsed by Apple.
```

The two other examples (SellerScope, landing) use the built-in procedural
models and need no trademark line.
