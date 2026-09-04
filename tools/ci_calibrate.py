#!/usr/bin/env python3
"""ci_calibrate.py — M1.5 acceptance gate for the calibration harness.

Drives calibrate/index.html ONLY through the window.__CALIBRATE__ automation
API (contract-external), exports model.manifest.json for both a built-in and
an external (synthetic GLB) model, then verifies the real engine consumes each
export: pt_build assembles a trailer and ci_smoke-style probes confirm the
screen mesh is detected and deterministic seek renders.

Acceptance (PLAN M1.5): "the page can produce a manifest for built-in and
external models and the engine consumes it."

Usage: python3 tools/ci_calibrate.py
"""
import json
import os
import subprocess
import sys
import tempfile

from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CALIBRATE = os.path.join(ROOT, 'calibrate', 'index.html')
FIXTURE_GLB = os.path.join(ROOT, 'dist', 'fixtures', 'fixture-device.glb')
LAUNCH_ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
               '--no-sandbox', '--force-color-profile=srgb']


def launch_page(p, path, width=1280, height=800):
    page = p.chromium.launch(args=LAUNCH_ARGS).new_page(
        viewport={'width': width, 'height': height})
    errors = []
    page.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto('file://' + os.path.abspath(path))
    return page, errors


def main():
    # 1) synthetic external GLB fixture (license-clean, not committed)
    subprocess.run([sys.executable, os.path.join(ROOT, 'tools', 'make_fixture_glb.py'),
                    '--out', FIXTURE_GLB], check=True)
    with open(FIXTURE_GLB, 'rb') as f:
        glb_bytes = f.read()

    work = tempfile.mkdtemp(prefix='pt-calibrate-')
    print('workdir:', work)
    ok = True

    with sync_playwright() as p:
        page, errors = launch_page(p, CALIBRATE)
        page.wait_for_function('window.__CALIBRATE__', timeout=15000)

        # ---------- built-in path ----------
        print('\n— built-in model (laptop) —')
        page.evaluate('() => window.__CALIBRATE__.loadBuiltin("laptop")')
        page.wait_for_function('window.__CALIBRATE__.getState().ready', timeout=20000)
        page.evaluate('''() => {
          const c = window.__CALIBRATE__;
          c.setBrand({name: "CalibBuiltin", tagline: "calibrated", version: "v9"});
          c.setGlow("#00e5ff");
          c.setResolution(1024, 640);
        }''')
        page.wait_for_timeout(80)
        st = page.evaluate('() => window.__CALIBRATE__.getState()')
        man_b = page.evaluate('() => window.__CALIBRATE__.getManifest()')
        print('  state:', st)
        checks_b = [
            st['ready'] is True,
            st['sourceType'] == 'builtin',
            st['flipY'] is True,                      # built-in planes -> CanvasTexture default
            man_b['model']['source']['type'] == 'builtin',
            man_b['model']['source']['name'] == 'laptop',
            man_b['screen']['resolution'] == {'w': 1024, 'h': 640},
            man_b['screen']['glowColor'] == '#00e5ff',
            man_b['brand']['name'] == 'CalibBuiltin',
        ]
        print('  builtin manifest:', json.dumps(man_b['model']['source']), man_b['screen'], man_b['brand'])
        if not all(checks_b):
            print('  FAIL: built-in manifest/state mismatch'); ok = False
        with open(os.path.join(work, 'builtin.manifest.json'), 'w') as f:
            json.dump(man_b, f)

        # ---------- external GLB path ----------
        print('\n— external model (synthetic fixture GLB) —')
        page.evaluate('''async (b64) => {
            const bin = atob(b64);
            const bytes = new Uint8Array(bin.length);
            for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
            await window.__CALIBRATE__.loadExternalFromArrayBuffer(bytes.buffer, 'fixture-device.glb');
        }''', __import__('base64').b64encode(glb_bytes).decode())
        page.wait_for_function('window.__CALIBRATE__.getState().ready', timeout=20000)
        meshes = page.evaluate('() => window.__CALIBRATE__.getMeshList()')
        print('  meshes:', [(m['name'], '★' if m['candidate'] else '') for m in meshes])
        screen_idx = next((m['index'] for m in meshes if m['name'] == 'Screen'), None)
        has_candidate = any(m['candidate'] for m in meshes)
        page.evaluate('(i) => window.__CALIBRATE__.selectMesh(i)', screen_idx)
        page.evaluate('() => window.__CALIBRATE__.setInline(true)')
        page.wait_for_timeout(80)
        st2 = page.evaluate('() => window.__CALIBRATE__.getState()')
        man_e = page.evaluate('() => window.__CALIBRATE__.getManifest()')
        print('  state:', {k: v for k, v in st2.items()})
        src = man_e['model']['source']
        checks_e = [
            st2['ready'] is True,
            st2['sourceType'] == 'glb',
            has_candidate,
            screen_idx is not None,
            st2['selectedMesh'] == 'Screen',
            st2['flipY'] is False,                      # glTF V=0-at-top -> flipY false
            src['type'] == 'inline',
            isinstance(src.get('b64'), str) and len(src['b64']) > 100,
            man_e['screen']['mesh'] == 'Screen',
        ]
        print('  external source: type=%s b64_len=%s screen.mesh=%s flipY(auto)=%s'
              % (src['type'], len(src.get('b64', '')), man_e['screen']['mesh'], st2['flipY']))
        if not all(checks_e):
            print('  FAIL: external manifest/state mismatch'); ok = False
        with open(os.path.join(work, 'external.manifest.json'), 'w') as f:
            json.dump(man_e, f)

        # screenshot the calibration viewport for the record
        page.screenshot(path=os.path.join(work, 'calibrate-external.png'))
        real_errors = [e for e in errors if 'WebGL' not in e and 'GL_' not in e
                       and 'swiftshader' not in e.lower()]
        if real_errors:
            print('  console/page errors:')
            for e in real_errors[:10]:
                print('   !', e)
            ok = False
        page.close()

    # 2) engine consumes the external manifest: pt_build then probe
    print('\n— engine consumes exported external manifest —')
    sb = os.path.join(ROOT, 'examples', 'dogfood', 'storyboard.json')
    out_html = os.path.join(work, 'external-trailer.html')
    r = subprocess.run([sys.executable, os.path.join(ROOT, 'tools', 'pt_build.py'),
                        '--manifest', os.path.join(work, 'external.manifest.json'),
                        '--storyboard', sb,
                        '--content', os.path.join(ROOT, 'content', 'terminal', 'content.js'),
                        '--title', 'Calibrated Fixture', '--out', out_html],
                       capture_output=True, text=True)
    print(' ', r.stdout.strip() or r.stderr.strip())
    if r.returncode != 0:
        print('  FAIL: pt_build could not assemble exported manifest'); ok = False
    else:
        with sync_playwright() as p:
            page, errors2 = launch_page(p, out_html)
            page.wait_for_function('window.__PT && window.__PT.ready', timeout=30000)
            probe = page.evaluate('''() => {
                const sd = window.__PT.screenDetected;
                window.__PT.seek(9.5);
                return { screenDetected: sd, duration: window.__PT.duration };
            }''')
            page.wait_for_timeout(100)
            png = page.screenshot()
            page.close()
            from PIL import Image, ImageStat
            import io
            lum = ImageStat.Stat(Image.open(io.BytesIO(png)).convert('L')).mean[0] / 255.0
            print('  engine probe: screenDetected=%s duration=%s frameLum=%.3f'
                  % (probe['screenDetected'], probe['duration'], lum))
            if not probe['screenDetected']:
                print('  FAIL: engine did not detect the calibrated Screen mesh'); ok = False
            if lum < 0.01:
                print('  FAIL: trailer frame black'); ok = False
            real2 = [e for e in errors2 if 'WebGL' not in e and 'GL_' not in e]
            if real2:
                print('  engine console errors:')
                for e in real2[:10]:
                    print('   !', e)
                ok = False

    print('\n==== calibrate gate summary ====')
    print('  %s' % ('PASS' if ok else 'FAIL'))
    sys.exit(0 if ok else 1)


if __name__ == '__main__':
    main()
