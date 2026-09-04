/* landing example · web-scroll PTContent configuration (beta).
 * Loaded BEFORE content/web-scroll/content.js (see pt_build.py --content order).
 * A marketing landing page that auto-scrolls on the product's screen.
 */
window.PT_WEBSCROLL_CFG = {
  brand: 'product-trailer',
  tagline: 'One GLB. One trailer. Zero edits.',
  domain: 'product-trailer.app',
  url: 'https://product-trailer.app/',
  nav: ['Product', 'Templates', 'Gallery', 'Docs'],
  heroKicker: '● open source · Apache-2.0',
  heroTitle: 'Your product,\nin a movie trailer',
  heroSub: 'Drop in any 3D model with a screen — get a 30-second cinematic as live HTML or deterministic MP4.',
  heroCta: 'Make my trailer ▸',
  heroNote: 'no sign-up · GLB in, MP4 out',
  features: [
    { icon: '◈', title: 'Drop in a GLB', body: 'Any device model with a screen. The engine auto-detects the display, lights it and grades the shot.' },
    { icon: '▤', title: 'Storyboard shots', body: 'Nine cinematic keyframes — orbit, dolly, side profile, hero push-in — with zero manual framing.' },
    { icon: '⏵', title: 'Deterministic MP4', body: 'Seek-per-frame export renders byte-identical reruns. Live HTML and MP4 come from one cut.' }
  ],
  stats: [
    { value: '30s', label: 'cinematic cut' },
    { value: '2', label: 'orientations' },
    { value: '0', label: 'manual edits' },
    { value: '100%', label: 'deterministic' }
  ],
  ctaTitle: 'Ship the trailer today',
  ctaSub: 'One GLB, one storyboard, one command.',
  ctaButton: 'Get product-trailer',
  gain: 1
};
