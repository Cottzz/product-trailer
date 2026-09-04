#!/usr/bin/env python3
"""ci_export.py — M4′ acceptance gate for deterministic MP4 export.

Verifies the double-track export path end to end:
  pt_build (dogfood contracts) -> pt_export_mp4 (both orientations, short
  clip via --max-frames) -> ffprobe structural assertions.

Checks per orientation:
  * mp4 exists and is non-trivial in size
  * video stream: h264, exact 1080x1920 / 1920x1080, yuv420p, 30 fps
  * audio stream: aac, 48000 Hz, 2 channels
  * export log shows the seek-determinism probe IDENTICAL and a non-silent mix
  * no ffmpeg failure

Usage: python3 tools/ci_export.py
"""
import os
import subprocess
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EXPORTER = os.path.join(ROOT, 'tools', 'pt_export_mp4.py')
BUILDER = os.path.join(ROOT, 'tools', 'pt_build.py')

ORIENT = {
    'vertical': (1080, 1920),
    'horizontal': (1920, 1080),
}
FPS = 30
SR = 48000
MAX_FRAMES = 12


def ffprobe_streams(path):
    out = subprocess.run(
        ['ffprobe', '-v', 'error', '-show_entries',
         'stream=codec_type,codec_name,width,height,pix_fmt,r_frame_rate,sample_rate,channels',
         '-of', 'json', path],
        capture_output=True, text=True)
    import json
    return json.loads(out.stdout).get('streams', [])


def main():
    work = tempfile.mkdtemp(prefix='pt-export-gate-')
    html = os.path.join(work, 'trailer.html')
    r = subprocess.run([sys.executable, BUILDER,
                        '--manifest', os.path.join(ROOT, 'examples', 'dogfood', 'model.manifest.json'),
                        '--storyboard', os.path.join(ROOT, 'examples', 'dogfood', 'storyboard.json'),
                        '--content', os.path.join(ROOT, 'content', 'terminal', 'content.js'),
                        '--title', 'export-gate', '--out', html],
                       capture_output=True, text=True)
    if r.returncode != 0:
        print('FAIL: pt_build:\n' + r.stderr); sys.exit(1)

    ok = True
    for orient, (W, H) in ORIENT.items():
        print('\n— export orientation: %s (%dx%d) —' % (orient, W, H))
        mp4 = os.path.join(work, 'out-%s.mp4' % orient)
        wav = os.path.join(work, 'out-%s.wav' % orient)
        r = subprocess.run([sys.executable, EXPORTER, '--html', html,
                            '--orientation', orient, '--out', mp4,
                            '--keep-wav', wav, '--max-frames', str(MAX_FRAMES)],
                           capture_output=True, text=True)
        log = r.stdout + r.stderr
        print('\n'.join('  ' + l for l in log.splitlines() if l.strip()))
        if r.returncode != 0 or not os.path.exists(mp4):
            print('  FAIL: exporter exited %d' % r.returncode); ok = False; continue

        checks = []
        checks.append(('determinism probe IDENTICAL', 'IDENTICAL' in log and 'DIFFERS' not in log))
        checks.append(('mix non-silent (peak>=0.01)', 'peak 0.0' not in log))
        checks.append(('mp4 size > 20KB', os.path.getsize(mp4) > 20 * 1024))
        checks.append(('wav kept', os.path.exists(wav) and os.path.getsize(wav) > SR * 2 * 2))

        streams = ffprobe_streams(mp4)
        v = next((s for s in streams if s.get('codec_type') == 'video'), {})
        a = next((s for s in streams if s.get('codec_type') == 'audio'), {})
        checks.append(('video h264', v.get('codec_name') == 'h264'))
        checks.append(('video %dx%d' % (W, H), v.get('width') == W and v.get('height') == H))
        checks.append(('pix_fmt yuv420p', v.get('pix_fmt') == 'yuv420p'))
        checks.append(('fps %d' % FPS, v.get('r_frame_rate') == '%d/1' % FPS))
        checks.append(('audio aac', a.get('codec_name') == 'aac'))
        checks.append(('audio %dHz stereo' % SR,
                       str(a.get('sample_rate')) == str(SR) and a.get('channels') == 2))

        for name, passed in checks:
            print('  %-32s %s' % (name, 'PASS' if passed else 'FAIL'))
        ok = ok and all(p for _, p in checks)

    print('\n==== export gate summary ====')
    print('  %s' % ('PASS' if ok else 'FAIL'))
    sys.exit(0 if ok else 1)


if __name__ == '__main__':
    main()
