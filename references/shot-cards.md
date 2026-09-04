# Shot cards & aesthetic rules

The 30-second trailer is a fixed five-beat arc. Content templates plug screen
behavior into this arc; the camera is driven by spherical keyframes around the
screen center (`orbitTarget: "screenCenter"`, F1). This file is the reference
for tuning storyboards without rediscovering why each beat works.

## Beat sheet (canonical timings)

| Beat | t (s) | Camera | Screen content | Purpose |
|---|---|---|---|---|
| **Boot** | 0.0–3.7 | High 3/4 orbit, far (az ~72–74°, el ~11–13°, d ~6.8–9.4) | Power-on, logo / cursor blink | Establish device; world wakes up |
| **Logo / turn** | 3.7–9.5 | Orbit continues, closing in (az ~46–69°) | Boot log / hero scroll begins | Motion sells the 3D model |
| **Side / profile** | 9.5–16.5 | Near-profile (az ~16–18°), closest medium d | Main demo content (terminal commands / feature cards) | "Product at work" — content legible |
| **Front / hero** | 16.5–24.5 | Dead front (az 0°, el 3–4°), slow push (d 8.2→3.5 portrait) | Stats / payoff content | Head-on hero frame for screenshots |
| **Finale** | 24.5–29 | Settled, slight push; overlay fades in at 24.5 (3.0s); GL fades out at 27.5 (0.9s); ends at 28.6 | Full-screen DOM overlay: tagline + CTA | Conversion beat |

`storyboard.json` declares beat boundaries as `"shots": {boot, logo, side, front, push, end}`;
content templates read these times to schedule their own events. Keep beats in
these ranges unless a piece of content genuinely needs more dwell time.

## Camera keyframe model

- Keyframes `{t, az, el, d}` in degrees / normalized units, linearly interpolated
  (see the default tables in `engine/engine.js` — storyboards may override).
- `az`: azimuth around the orbit target, degrees. **0 = dead front** (screen
  facing camera); ~75° = dramatic 3/4 opening; ~90° = pure profile (avoid — screen
  goes edge-on and unreadable).
- `el`: elevation, degrees. 3–6° = near eye level (hero); 10–14° = establishing
  high angle. Never go below 0 (looking up at the screen reads as awkward).
- `d`: orbit distance. Portrait runs closer (smaller d at every beat) because the
  vertical crop eats horizontal framing; landscape stays wider.
- All framing orbits **the screen center**, not the model bounding-box center —
  the screen is the subject; the device is the stage.

### Orientation differences

| | Portrait 1080×1920 | Landscape 1920×1080 |
|---|---|---|
| fov | 38° | 42° |
| Opening d | 6.8 | 9.4 |
| Finale d | 1.35 | 1.5 |
| Framing intent | Device fills the vertical frame; screen upper-center | Device centered with environment/negative space |

Portrait keyframes crop tighter on every beat — tune `d` first when a shot feels
wrong in one orientation.

## Aesthetic rules

1. **One motion per beat.** Orbit, push, or content reveal — never two
   competing. During big camera moves (boot→side) keep screen content calm;
   during the settled front beat let content do the talking.
2. **Screen legibility beats realism.** Never frame past az ~75° for long; the
   profile beat (~16–18°) is the most oblique angle where text stays readable.
3. **Fades are punctuation, not transitions between shots.** The only fades are
   the finale overlay cross-fade (24.5s) and the GL fade-out (27.5s). Beats
   connect through continuous camera motion.
4. **Audio cues land on beat boundaries** (boot whoosh at 0, finale whoosh at
   ~24.5, end sting before 28.6). Schedule via
   `scheduleAudio(ctx, startTime, duration, gain)` in both the live
   `AudioContext` and the `OfflineAudioContext` (F2); never use wall-clock
   scheduling.
5. **No wall-clock anything in content.** CSS animations, blinking cursors, and
   randomness must be driven by `buildState(t)` / the `pt-export` class, or the
   MP4 export loses determinism.
6. **Poster frames** (captured at 3.7 / 9.5 / 16.5 / 24.5s by
   `pt_render_materials.sh`) double as beat QA: each poster should read as a
   complete composition on its own.
7. **End frame holds a CTA.** The finale overlay (tagline + button/domain) is the
   single conversion surface; it must be fully settled before `endAt` (28.6s) so
   the last frames of the MP4 are not mid-animation.

## Checking a new storyboard

- Render posters at the four beat times and view them in order — the arc should
  read: *device → motion → product at work → hero → CTA*.
- Run `tools/ci_export.py` — 44 gates (2 examples × 2 orientations × 11 checks)
  cover frame stepping, audio, and output integrity.
- New templates: keep event times inside the beat boundaries above; remap only if
  the storyboard's `shots` table changes too.
