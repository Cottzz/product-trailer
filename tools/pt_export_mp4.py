#!/usr/bin/env python3
"""pt_export_mp4.py — deterministic MP4 export for a built product-trailer HTML.

Double-track delivery (PLAN M4′): the same single-file trailer HTML that plays
in the browser is rendered *without animation* to a fixed MP4 + WAV via the
engine's deterministic export surface:

  video : window.__PT.seek(t) at frame t, screenshot each frame (export mode
          hides the start card, drives fades/endframe off the same timeline),
          piped as PNGs into ffmpeg (image2pipe, H.264 yuv420p).
  audio : window.__PT.renderAudio(sr) renders the OfflineAudioContext graph
          (the same scheduleAudio() that live playback uses — F5 dual-active
          contract), interleaved Float32 -> 16-bit PCM WAV.

Frames are deterministic: seek() never starts requestAnimationFrame, the GL
runs under SwiftShader with a fixed viewport, and ffmpeg muxes fixed fps/
explicit so fps. A double-render hash of frame pixels gates determinism.

Usage:
  python3 tools/pt_build.py --manifest m.json --storyboard s.json \\
      --content content/terminal/content.js --out /tmp/trailer.html
  python3 tools/pt_export_mp4.py --html /tmp/trailer.html \\
      --orientation vertical --out dist/trailer-vertical.mp4
"""
import argparse
import base64
import hashlib
import os
import subprocess
import sys
import wave

from playwright.sync_api import sync_playwright

LAUNCH_ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
               '--no-sandbox', '--force-color-profile=srgb',
               '--disable-lcd-text', '--disable-font-subpixel-positioning',
               # Defensive: under headless CPU load, force every compositor
               # stage to finish before a draw so screenshots never capture a
               # partially-composited frame.
               '--run-all-compositor-stages-before-draw']


def write_wav_pcm16(path, pcm_bytes, sample_rate, channels=2):
    """Raw little-endian 16-bit PCM bytes -> stereo WAV."""
    with wave.open(path, 'wb') as w:
        w.setnchannels(channels)
        w.setsampwidth(2)
        w.setframerate(sample_rate)
        w.writeframes(pcm_bytes)
    return len(pcm_bytes) / (channels * 2) / sample_rate


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--html', required=True, help='built trailer HTML (pt_build output)')
    ap.add_argument('--out', required=True, help='output .mp4 path')
    ap.add_argument('--orientation', choices=['vertical', 'horizontal'], default='vertical')
    ap.add_argument('--fps', type=int, default=30)
    ap.add_argument('--sample-rate', type=int, default=48000)
    ap.add_argument('--keep-wav', default=None, help='optional path to keep the WAV mix')
    ap.add_argument('--probe-time', type=float, default=9.5,
                    help='time (s) for the determinism double-render probe frame')
    ap.add_argument('--max-frames', type=int, default=0,
                    help='debug: stop after N frames (video becomes a short clip)')
    args = ap.parse_args()

    if args.orientation == 'vertical':
        W, H = 1080, 1920
    else:
        W, H = 1920, 1080

    for tool in ('ffmpeg',):
        if subprocess.run(['which', tool], capture_output=True).returncode != 0:
            print('FAIL: %s not found in PATH' % tool); sys.exit(2)

    os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)
    wav_path = args.keep_wav or (os.path.splitext(args.out)[0] + '.wav')

    ok = True
    with sync_playwright() as p:
        browser = p.chromium.launch(args=LAUNCH_ARGS)
        page = browser.new_page(viewport={'width': W, 'height': H}, device_scale_factor=1)
        errors = []
        page.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.goto('file://' + os.path.abspath(args.html))
        page.wait_for_function('window.__PT && window.__PT.ready', timeout=30000)

        info = page.evaluate('''() => ({
            duration: window.__PT.duration,
            screenDetected: window.__PT.screenDetected,
            isLand: window.innerWidth >= window.innerHeight
        })''')
        duration = float(info['duration'])
        n_frames = int(round(duration * args.fps))
        if args.max_frames:
            n_frames = min(n_frames, args.max_frames)
        print('trailer: %.2fs  %dx%d  %dfps  %d frames  screen=%s  land=%s'
              % (duration, W, H, args.fps, n_frames, info['screenDetected'], info['isLand']))
        if not info['screenDetected']:
            print('FAIL: engine did not detect a screen mesh'); ok = False

        # ---- determinism gate: same seek(t) twice -> identical PNG ----------
        page.evaluate('(t) => window.__PT.seek(t)', args.probe_time)
        page.wait_for_timeout(60)
        png1 = page.screenshot()
        page.evaluate('(t) => window.__PT.seek(t)', args.probe_time + 5.0)
        page.wait_for_timeout(60)
        page.evaluate('(t) => window.__PT.seek(t)', args.probe_time)
        page.wait_for_timeout(60)
        png2 = page.screenshot()
        h1, h2 = hashlib.sha256(png1).hexdigest(), hashlib.sha256(png2).hexdigest()
        print('determinism probe @%.1fs: %s' % (args.probe_time, 'IDENTICAL' if h1 == h2 else 'DIFFERS'))
        if h1 != h2:
            print('FAIL: seek(t) is not frame-deterministic'); ok = False

        # ---- audio: OfflineAudioContext mix -> Int16 PCM -> WAV -------------
        # renderAudio resolves an ArrayBuffer (Float32 interleaved); Playwright
        # cannot value-serialise an ArrayBuffer, so quantise to Int16 inside the
        # page and return base64 + stats (same mix as live playback, F5).
        print('rendering offline audio mix (%d Hz)...' % args.sample_rate)
        mix = page.evaluate('''async ([sr, dur]) => {
            const ab = await window.__PT.renderAudio(sr);
            const f32 = new Float32Array(ab);
            const n = Math.min(f32.length, Math.ceil(sr * dur) * 2);
            const pcm = new Int16Array(n);
            let peak = 0;
            for (let i = 0; i < n; i++) {
                const s = Math.max(-1, Math.min(1, f32[i]));
                const v = s < 0 ? s * 32768 : s * 32767;
                pcm[i] = v;
                const a = Math.abs(f32[i]);
                if (a > peak) peak = a;
            }
            let bin = '';
            const CH = 0x8000;
            for (let i = 0; i < pcm.length; i++) {
                const u = pcm[i] + CH;
                bin += String.fromCharCode(u & 0xff, u >> 8);
            }
            return { b64: btoa(bin), samples: pcm.length, peak: peak };
        }''', [args.sample_rate, duration])
        import base64
        if not mix or not mix.get('b64'):
            print('FAIL: renderAudio returned no usable data'); ok = False
        else:
            pcm_bytes = base64.b64decode(mix['b64'])
            audio_dur = write_wav_pcm16(wav_path, pcm_bytes, args.sample_rate)
            print('  wav: %s (%.2fs, %d samples, peak %.3f)'
                  % (wav_path, audio_dur, mix['samples'], mix['peak']))
            if mix['peak'] < 0.01:
                print('FAIL: exported mix is silent'); ok = False

        # ---- video frames: seek per frame -> ffmpeg stdin (PNG pipe) --------
        if ok:
            cmd = ['ffmpeg', '-y',
                   '-f', 'image2pipe', '-framerate', str(args.fps),
                   '-c:v', 'png', '-i', 'pipe:0',
                   '-i', wav_path,
                   '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18',
                   '-preset', 'medium', '-r', str(args.fps),
                   '-c:a', 'aac', '-b:a', '192k', '-ar', str(args.sample_rate),
                   '-shortest', '-movflags', '+faststart',
                   args.out]
            print('ffmpeg: %d frames -> %s' % (n_frames, args.out))
            ff = subprocess.Popen(cmd, stdin=subprocess.PIPE,
                                  stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
            try:
                last_hash = None
                for i in range(n_frames):
                    t = i / args.fps
                    page.evaluate('(tt) => window.__PT.seek(tt)', t)
                    page.wait_for_timeout(0)
                    png = page.screenshot()
                    ff.stdin.write(png)
                    if i in (0, n_frames // 2, n_frames - 1):
                        print('  frame %4d/%d  t=%5.2f  png=%dKB'
                              % (i, n_frames, t, len(png) // 1024))
                ff.stdin.close()
                ferr = ff.stderr.read().decode('utf-8', 'replace')
                rc = ff.wait()
                if rc != 0:
                    print('FAIL: ffmpeg exited %d\n%s' % (rc, ferr[-2000:])); ok = False
            except BrokenPipeError:
                ferr = ff.stderr.read().decode('utf-8', 'replace')
                print('FAIL: ffmpeg pipe broke\n%s' % ferr[-2000:]); ok = False

        # console error filter (same noise rules as ci_smoke)
        real = [e for e in errors if 'WebGL' not in e and 'GL_' not in e
                and 'swiftshader' not in e.lower() and 'GPU' not in e]
        if real:
            print('console/page errors:')
            for e in real[:10]:
                print('  !', e)
            ok = False
        browser.close()

    if ok and os.path.exists(args.out):
        sz = os.path.getsize(args.out)
        print('\nOK: %s (%.2f MB)  audio %s' % (args.out, sz / 1048576,
              'kept' if args.keep_wav else 'muxed'))
        sys.exit(0)
    print('\nEXPORT FAILED')
    sys.exit(1)


if __name__ == '__main__':
    main()
