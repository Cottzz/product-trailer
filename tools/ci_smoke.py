#!/usr/bin/env python3
"""ci_smoke.py — M1 pragmatic acceptance gates for a built trailer HTML.

Gate 1  determinism   : seek(t) twice in one page -> screenshots byte-identical
                        (fallback: SSIM >= 0.999)
Gate 2  cross-load    : seek(t) on two fresh page loads -> SSIM >= 0.97
Gate 3  event stream  : contract-external PTContent.buildState line counts match
                        the configured event stream at multiple timestamps
Gate 4  contract      : __PT API exists; seek switches body.pt-export and hides
                        the start overlay; screen mesh detected; renderAudio
                        produces a non-silent deterministic (repeatable) buffer

Usage: python3 tools/ci_smoke.py --html dist/sellerscope.html
"""
import argparse
import io
import os
import struct
import sys

from playwright.sync_api import sync_playwright

TIMES = [3.7, 9.5, 16.5, 24.5, 28.9]
SSIM_CROSS = 0.97
SSIM_SELF = 0.999


def ssim(a, b):
    """SSIM on grayscale downscaled grids (pure stdlib, no numpy dependency)."""
    from PIL import Image
    ia = Image.open(io.BytesIO(a)).convert('L').resize((160, 90))
    ib = Image.open(io.BytesIO(b)).convert('L').resize((160, 90))
    pa = [v / 255.0 for v in ia.getdata()]
    pb = [v / 255.0 for v in ib.getdata()]
    n = len(pa)
    ma = sum(pa) / n
    mb = sum(pb) / n
    va = sum((x - ma) ** 2 for x in pa) / n
    vb = sum((x - mb) ** 2 for x in pb) / n
    cov = sum((pa[i] - ma) * (pb[i] - mb) for i in range(n)) / n
    c1, c2 = 0.01 ** 2, 0.03 ** 2
    return ((2 * ma * mb + c1) * (2 * cov + c2)) / ((ma * ma + mb * mb + c1) * (va + vb + c2))


def mean_luminance(png):
    from PIL import Image
    im = Image.open(io.BytesIO(png)).convert('L')
    return sum(im.getdata()) / (im.width * im.height) / 255.0


def open_page(p, html, width=1280, height=720):
    page = p.chromium.launch(args=[
        '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
        '--no-sandbox', '--force-color-profile=srgb',
        '--run-all-compositor-stages-before-draw']).new_page(
        viewport={'width': width, 'height': height})
    errors = []
    page.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto('file://' + os.path.abspath(html))
    page.wait_for_function('window.__PT && window.__PT.ready', timeout=30000)
    return page, errors


def seek_shot(page, t):
    page.evaluate('(t) => window.__PT.seek(t)', t)
    page.wait_for_timeout(60)
    return page.screenshot()


def expected_lines(events, t):
    """Contract-external reimplementation of buildState line counting."""
    lines = 0
    for e in events:
        if t < e['t']:
            break
        lines += 1  # line / type / prog each render exactly one line
    return lines


def gate_determinism_and_crossload(p, html):
    print('\n— Gate 1/2: determinism + cross-load SSIM —')
    page, errors = open_page(p, html)
    shots = {t: seek_shot(page, t) for t in TIMES}
    again = {t: seek_shot(page, t) for t in TIMES}
    ok = True
    for t in TIMES:
        same = shots[t] == again[t]
        s = 1.0 if same else ssim(shots[t], again[t])
        lum = mean_luminance(shots[t])
        status = 'byte-identical' if same else 'SSIM=%.4f' % s
        print('  t=%5.1f  %s  lum=%.3f' % (t, status, lum))
        if not same and s < SSIM_SELF:
            print('  FAIL: in-page rerun not deterministic at t=%s' % t); ok = False
        if lum < 0.01:
            print('  FAIL: frame essentially black at t=%s' % t); ok = False
    page.close()

    page2, errors2 = open_page(p, html)
    shots2 = {t: seek_shot(page2, t) for t in TIMES}
    page2.close()
    for t in TIMES:
        s = ssim(shots[t], shots2[t])
        print('  cross-load t=%5.1f  SSIM=%.4f' % (t, s))
        if s < SSIM_CROSS:
            print('  FAIL: cross-load SSIM below %.2f at t=%s' % (SSIM_CROSS, t)); ok = False
    return ok, errors + errors2


def gate_event_stream(p, html):
    print('\n— Gate 3: event-stream diff (contract external) —')
    page, errors = open_page(p, html)
    cfg_events = page.evaluate('() => (window.PT_TERMINAL_CFG && window.PT_TERMINAL_CFG.events) || null')
    if cfg_events is None:
        # default (dogfood) events live inside the template closure; fall back to probe counts
        probes = [(3.7, 5), (9.5, 11), (16.5, 22), (24.5, 33)]
        ok = True
        for t, min_lines in probes:
            n = page.evaluate('(t) => window.PTContent.buildState(t).length', t)
            print('  t=%5.1f  lines=%d (expect >= %d)' % (t, n, min_lines))
            if n < min_lines:
                print('  FAIL: too few lines'); ok = False
        page.close()
        return ok, errors
    ok = True
    for t in [0.5, 5.0, 10.0, 16.0, 24.0, 29.0]:
        n = page.evaluate('(t) => window.PTContent.buildState(t).length', t)
        exp = expected_lines(cfg_events, t)
        mark = 'ok' if n == exp else 'FAIL'
        print('  t=%5.1f  lines=%d expected=%d  %s' % (t, n, exp, mark))
        if n != exp:
            ok = False
    page.close()
    return ok, errors


def gate_contract(p, html):
    print('\n— Gate 4: contract + deterministic audio —')
    page, errors = open_page(p, html)
    info = page.evaluate('''() => {
      const api = ['seek','whenReady','renderAudio'].every(k => typeof window.__PT[k] === 'function');
      window.__PT.seek(10);
      const exportMode = document.body.classList.contains('pt-export');
      const startHidden = getComputedStyle(document.getElementById('pt-start')).display === 'none';
      const noPointer = getComputedStyle(document.body).cursor !== undefined;
      return { api, exportMode, startHidden,
               screenDetected: !!window.__PT.screenDetected,
               duration: window.__PT.duration,
               hasContent: !!window.PTContent && typeof window.PTContent.drawScreen === 'function' };
    }''')
    for k, v in info.items():
        print('  %-14s %s' % (k, v))
    ok = all([info['api'], info['exportMode'], info['startHidden'],
              info['screenDetected'], info['hasContent']])

    def render_audio():
        return page.evaluate('''async () => {
          const ab = await window.__PT.renderAudio(22050);
          const f32 = new Float32Array(ab);
          const frames = f32.length / 2;           // interleaved stereo
          // FNV-1a hash over quantized samples
          let h = 0x811c9dc5;
          for (let i = 0; i < f32.length; i++) {
            const q = Math.max(-1, Math.min(1, f32[i]));
            const b = Math.round((q + 1) * 127) & 0xff;
            h ^= b; h = Math.imul(h, 0x01000193) >>> 0;
          }
          // peak short-window RMS (0.2 s) so sparse SFX are not diluted by silence
          const win = Math.floor(22050 * 0.2);
          let peak = 0, globalSum = 0;
          for (let s = 0; s + win <= frames; s += win) {
            let w = 0;
            for (let i = s; i < s + win; i++) {
              const m = (f32[i*2] + f32[i*2+1]) * 0.5;
              w += m * m;
            }
            const r = Math.sqrt(w / win);
            if (r > peak) peak = r;
          }
          for (let i = 0; i < f32.length; i++) globalSum += f32[i] * f32[i];
          return { samples: f32.length, rms: peak,
                   globalRms: Math.sqrt(globalSum / f32.length), hash: h };
        }''')
    a1 = render_audio()
    a2 = render_audio()
    print('  audio samples=%d peakRms=%.4f globalRms=%.4f hash=%08x / %08x' %
          (a1['samples'], a1['rms'], a1['globalRms'], a1['hash'], a2['hash']))
    if a1['rms'] < 0.02:
        print('  FAIL: audio buffer silent'); ok = False
    if a1['hash'] != a2['hash']:
        print('  FAIL: audio render not deterministic'); ok = False
    page.close()
    real_errors = [e for e in errors if 'WebGL' not in e and 'GL_' not in e]
    if real_errors:
        print('  console/page errors:')
        for e in real_errors[:10]:
            print('   !', e)
        ok = False
    return ok, real_errors


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--html', required=True)
    args = ap.parse_args()
    if not os.path.exists(args.html):
        print('built HTML not found:', args.html); sys.exit(2)

    results = []
    with sync_playwright() as p:
        results.append(gate_determinism_and_crossload(p, args.html))
        results.append(gate_event_stream(p, args.html))
        results.append(gate_contract(p, args.html))

    print('\n==== summary ====')
    all_ok = True
    for name, (ok, _) in zip(['determinism/crossload', 'event-stream', 'contract/audio'], results):
        print('  %-24s %s' % (name, 'PASS' if ok else 'FAIL'))
        all_ok = all_ok and ok
    sys.exit(0 if all_ok else 1)


if __name__ == '__main__':
    main()
