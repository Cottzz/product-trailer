/* ============================================================
 * product-trailer · "web-scroll" PTContent template (beta)
 * A product landing page inside a mock browser window, playing on
 * the product's screen: the page auto-scrolls through hero /
 * features / metrics, the cursor glides to CTAs and clicks, and
 * the finale expands into a full-screen DOM overlay.
 *
 * Brand customization: set window.PT_WEBSCROLL_CFG BEFORE this file
 * with any of:
 *   brand, tagline, domain, url, logoText, nav:[strings],
 *   heroKicker, heroTitle, heroSub, heroCta, heroNote,
 *   features:[{icon,title,body}], stats:[{value,label}],
 *   ctaTitle, ctaSub, ctaButton, footerNote,
 *   theme: {green,cyan,magenta,amber,slate,bg,line,panel,...},
 *   scrollEvents via `script` overrides (advanced), gain:<0..1>
 *
 * Determinism: buildState is pure (scroll = f(t) via eased segments,
 * no Math.random / setTimeout / wall clock); scheduleAudio uses a
 * seeded PRNG and absolute-time scheduling, so it renders identically
 * in AudioContext (live) and OfflineAudioContext (MP4 export).
 * ============================================================ */
(function () {
  'use strict';
  var cfg = window.PT_WEBSCROLL_CFG || {};
  var BRAND = cfg.brand || 'product-trailer';
  var SLUG = String(BRAND).toLowerCase().replace(/[^a-z0-9]+/g, '-');
  var TAGLINE = cfg.tagline || 'One GLB. One trailer. Zero edits.';
  var DOMAIN = cfg.domain || (SLUG + '.app');
  var URL_BAR = cfg.url || ('https://' + DOMAIN + '/');

  /* brand palette (matches engine CSS vars) */
  var COL = {
    bg: '#0A0E14', panel: '#10161F', card: '#131B27', line: '#22303F',
    ink: '#E6EDF3', g: '#4AF626', c: '#8BE9FD', m: '#FF79C6', a: '#FFB86C', s: '#6272A4'
  };

  var ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;' };
  function esc(x) { return String(x).replace(/[&<>]/g, function (ch) { return ESC[ch]; }); }

  var NAV = cfg.nav || ['Product', 'Features', 'Pricing', 'Docs'];
  var FEATURES = cfg.features || [
    { icon: '◈', title: 'Drop in a GLB', body: 'Any device model with a screen. The engine auto-detects the display and lights it.' },
    { icon: '▤', title: 'Storyboard shots', body: 'Nine cinematic keyframes — orbit, dolly, profile, hero push — zero manual framing.' },
    { icon: '⏵', title: 'Deterministic MP4', body: 'Seek-per-frame export renders byte-identical reruns. Live HTML and MP4 in one cut.' }
  ];
  var STATS = cfg.stats || [
    { value: '30s', label: 'cinematic cut' },
    { value: '2', label: 'orientations' },
    { value: '0', label: 'manual edits' },
    { value: '100%', label: 'deterministic' }
  ];

  /* ---------------- layout (virtual page coordinates) ---------------- */
  var PAGE_W = 1280;
  var CHROME_H = 74;          /* mock browser chrome (tabs + url bar) */
  var NAV_H = 64;             /* site top nav */
  var HERO_H = 560;
  var FEAT_H = 470;            /* heading + one row of cards + slack */
  var STATS_H = 290;
  var CTA_H = 420;
  var FOOTER_H = 90;
  var SECTIONS = {
    nav: NAV_H,
    hero: NAV_H + HERO_H,
    features: NAV_H + HERO_H + FEAT_H,
    stats: NAV_H + HERO_H + FEAT_H + STATS_H,
    cta: NAV_H + HERO_H + FEAT_H + STATS_H + CTA_H,
    end: NAV_H + HERO_H + FEAT_H + STATS_H + CTA_H + FOOTER_H
  };

  /* ---------------- scroll script: eased segments + cursor beats ---------------- */
  /* scroll: from y0 to y1 during [t0,t1]; clicks fire at absolute t. */
  /* scroll targets tuned to frame each section inside the 726px page viewport */
  var SCRIPT = cfg.script || [
    { kind: 'scroll', t0: 0.6, t1: 4.2, y0: 0, y1: 190 },
    { kind: 'click', t: 5.4, x: 0.5, y: 0.62, label: 'hero CTA' },
    { kind: 'scroll', t0: 6.0, t1: 10.5, y0: 190, y1: 520 },
    { kind: 'click', t: 11.6, x: 0.5, y: 0.55, label: 'feature card' },
    { kind: 'scroll', t0: 12.4, t1: 16.5, y0: 520, y1: 860 },
    { kind: 'scroll', t0: 17.5, t1: 21.5, y0: 860, y1: 1130 },
    { kind: 'click', t: 23.0, x: 0.5, y: 0.6, label: 'final CTA' },
    { kind: 'scroll', t0: 24.0, t1: 26.5, y0: 1130, y1: 1168 }
  ];
  function easeInOut(k) { return k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; }

  function buildState(t) {
    var scroll = 0, cursor = { x: 0.3, y: 0.4 }, ripple = null;
    for (var i = 0; i < SCRIPT.length; i++) {
      var s = SCRIPT[i];
      if (s.kind === 'scroll') {
        if (t >= s.t1) { scroll = s.y1; }
        else if (t > s.t0) { scroll = s.y0 + (s.y1 - s.y0) * easeInOut((t - s.t0) / (s.t1 - s.t0)); }
      } else if (s.kind === 'click') {
        /* glide the cursor toward the click target in the preceding 1.2s */
        var g0 = s.t - 1.2;
        if (t >= s.t) {
          cursor.x = s.x; cursor.y = s.y;
          var age = t - s.t;
          if (age < 0.5) ripple = { x: s.x, y: s.y, r: 6 + age * 90, o: 1 - age / 0.5 };
        } else if (t > g0) {
          var k = easeInOut((t - g0) / 1.2);
          cursor.x = cursor.x + (s.x - cursor.x) * k;
          cursor.y = cursor.y + (s.y - cursor.y) * k;
        }
      }
    }
    /* gentle idle cursor drift so it never looks frozen */
    cursor.x += Math.sin(t * 0.7) * 0.006;
    cursor.y += Math.cos(t * 0.9) * 0.006;
    return { scroll: scroll, cursor: cursor, ripple: ripple, t: t };
  }

  /* ---------------- canvas helpers ---------------- */
  function rr(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function text(ctx, str, x, y, size, color, weight, align) {
    ctx.fillStyle = color;
    ctx.font = (weight || '500') + ' ' + size + 'px "Inter","SF Pro Text","Helvetica Neue",Arial,sans-serif';
    ctx.textAlign = align || 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(str, x, y);
  }

  /* ---------------- mock browser chrome ---------------- */
  function drawChrome(ctx, w) {
    ctx.fillStyle = COL.panel; ctx.fillRect(0, 0, w, CHROME_H);
    /* traffic lights */
    var dots = ['#FF5F57', '#FEBC2E', '#28C840'];
    for (var i = 0; i < 3; i++) {
      ctx.fillStyle = dots[i]; ctx.beginPath();
      ctx.arc(26 + i * 22, 24, 6, 0, Math.PI * 2); ctx.fill();
    }
    /* tab */
    ctx.fillStyle = COL.bg; rr(ctx, 110, 8, 220, 36, 8); ctx.fill();
    text(ctx, '● ' + DOMAIN, 126, 32, 14, COL.s, '500');
    /* url bar */
    ctx.fillStyle = '#0B1017'; rr(ctx, 352, 14, w - 470, 32, 16); ctx.fill();
    text(ctx, '🔒 ' + URL_BAR, 372, 36, 15, COL.c, '500');
    ctx.strokeStyle = COL.line; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, CHROME_H + 0.5); ctx.lineTo(w, CHROME_H + 0.5); ctx.stroke();
  }

  /* ---------------- page sections (drawn in virtual page space) ---------------- */
  function drawNav(ctx, w) {
    var y = NAV_H;
    ctx.fillStyle = COL.bg; ctx.fillRect(0, 0, w, y);
    text(ctx, '◆ ' + BRAND, 40, 41, 22, COL.ink, '700');
    for (var i = 0; i < NAV.length; i++) {
      text(ctx, NAV[i], w - 340 + i * 84, 40, 15, COL.s, '500');
    }
    ctx.fillStyle = COL.g; rr(ctx, w - 132, 18, 96, 32, 16); ctx.fill();
    text(ctx, 'Get started', w - 84, 40, 14, '#08130A', '700', 'center');
  }
  function drawHero(ctx, w, y0) {
    var cx = w / 2;
    text(ctx, (cfg.heroKicker || ('● ' + BRAND + ' · now in beta')), cx, y0 + 110, 16, COL.g, '600', 'center');
    text(ctx, (cfg.heroTitle || 'Your product,\nin a movie trailer').split('\n')[0], cx, y0 + 210, 58, COL.ink, '800', 'center');
    var line2 = (cfg.heroTitle && cfg.heroTitle.split('\n')[1]) || 'in a movie trailer';
    text(ctx, line2, cx, y0 + 280, 58, COL.c, '800', 'center');
    text(ctx, cfg.heroSub || 'Turn any 3D model with a screen into a 30-second cinematic — live HTML or deterministic MP4.',
      cx, y0 + 340, 20, COL.s, '500', 'center');
    /* CTA button */
    ctx.fillStyle = COL.g; rr(ctx, cx - 118, y0 + 380, 236, 56, 28); ctx.fill();
    text(ctx, cfg.heroCta || 'Make my trailer ▸', cx, y0 + 416, 20, '#08130A', '700', 'center');
    text(ctx, cfg.heroNote || 'no sign-up · GLB in, MP4 out', cx, y0 + 470, 14, COL.s, '500', 'center');
  }
  function drawFeatures(ctx, w, y0) {
    text(ctx, 'Everything on the screen is alive', w / 2, y0 + 70, 34, COL.ink, '800', 'center');
    var cw = Math.min(360, (w - 160) / 3 - 24), gap = 28;
    var total = FEATURES.length * cw + (FEATURES.length - 1) * gap;
    var x0 = (w - total) / 2;
    for (var i = 0; i < FEATURES.length; i++) {
      var f = FEATURES[i], x = x0 + i * (cw + gap), y = y0 + 130;
      ctx.fillStyle = COL.card; rr(ctx, x, y, cw, 280, 16); ctx.fill();
      ctx.strokeStyle = COL.line; ctx.lineWidth = 1; rr(ctx, x + 0.5, y + 0.5, cw - 1, 279, 16); ctx.stroke();
      ctx.fillStyle = COL.c; rr(ctx, x + 28, y + 28, 56, 56, 14); ctx.fill();
      text(ctx, f.icon, x + 56, y + 67, 26, '#08130A', '700', 'center');
      text(ctx, f.title, x + 28, y + 132, 22, COL.ink, '700');
      /* wrap body copy */
      ctx.font = '500 16px "Inter","Helvetica Neue",Arial,sans-serif'; ctx.fillStyle = COL.s;
      wrap(ctx, f.body, x + 28, y + 170, cw - 56, 24);
    }
  }
  function drawStats(ctx, w, y0) {
    ctx.fillStyle = COL.panel; ctx.fillRect(0, y0, w, STATS_H);
    var n = STATS.length, cw = w / n;
    for (var i = 0; i < n; i++) {
      var cx = cw * i + cw / 2;
      text(ctx, STATS[i].value, cx, y0 + 130, 52, i % 2 ? COL.a : COL.g, '800', 'center');
      text(ctx, STATS[i].label, cx, y0 + 180, 17, COL.s, '500', 'center');
    }
  }
  function drawCta(ctx, w, y0) {
    var cx = w / 2;
    text(ctx, cfg.ctaTitle || 'Ship the trailer today', cx, y0 + 130, 44, COL.ink, '800', 'center');
    text(ctx, cfg.ctaSub || 'One GLB, one storyboard, one command.', cx, y0 + 185, 20, COL.s, '500', 'center');
    ctx.fillStyle = COL.m; rr(ctx, cx - 130, y0 + 230, 260, 60, 30); ctx.fill();
    text(ctx, cfg.ctaButton || 'Get product-trailer', cx, y0 + 270, 20, '#1A0B14', '700', 'center');
  }
  function drawFooter(ctx, w, y0) {
    ctx.fillStyle = COL.panel; ctx.fillRect(0, y0, w, FOOTER_H);
    text(ctx, '◆ ' + BRAND + ' — ' + TAGLINE, 40, y0 + 54, 15, COL.s, '500');
    text(ctx, '© ' + BRAND + ' · Apache-2.0', w - 40, y0 + 54, 14, COL.s, '500', 'right');
  }
  function wrap(ctx, str, x, y, maxW, lh) {
    var words = str.split(' '), line = '', yy = y;
    for (var i = 0; i < words.length; i++) {
      var test = line ? line + ' ' + words[i] : words[i];
      if (ctx.measureText(test).width > maxW && line) {
        ctx.fillText(line, x, yy); line = words[i]; yy += lh;
      } else line = test;
    }
    ctx.fillText(line, x, yy);
  }

  /* ---------------- screen canvas texture ---------------- */
  function drawScreen(ctx, state, w, h, t) {
    ctx.fillStyle = COL.bg; ctx.fillRect(0, 0, w, h);
    drawChrome(ctx, w);

    /* clip page viewport below the browser chrome */
    ctx.save();
    ctx.beginPath(); ctx.rect(0, CHROME_H, w, h - CHROME_H); ctx.clip();
    ctx.translate(0, CHROME_H - state.scroll);
    drawNav(ctx, w);
    drawHero(ctx, w, SECTIONS.nav);
    drawFeatures(ctx, w, SECTIONS.hero);
    drawStats(ctx, w, SECTIONS.features);
    drawCta(ctx, w, SECTIONS.stats);
    drawFooter(ctx, w, SECTIONS.cta);
    ctx.restore();

    /* scrollbar */
    var viewH = h - CHROME_H;
    var maxScroll = Math.max(1, SECTIONS.end - viewH);
    var barH = Math.max(40, viewH * viewH / SECTIONS.end);
    var barY = CHROME_H + (state.scroll / maxScroll) * (viewH - barH);
    ctx.fillStyle = COL.line; rr(ctx, w - 8, barY, 4, barH, 2); ctx.fill();

    /* cursor + click ripple (in screen space) */
    var cxp = state.cursor.x * w, cyp = CHROME_H + state.cursor.y * viewH;
    if (state.ripple) {
      var rp = state.ripple;
      ctx.strokeStyle = 'rgba(74,246,38,' + rp.o.toFixed(3) + ')';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(rp.x * w, CHROME_H + rp.y * viewH, rp.r, 0, Math.PI * 2); ctx.stroke();
    }
    drawCursor(ctx, cxp, cyp);
  }
  function drawCursor(ctx, x, y) {
    ctx.save();
    ctx.fillStyle = COL.ink;
    ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y); ctx.lineTo(x, y + 20); ctx.lineTo(x + 7, y + 15);
    ctx.lineTo(x + 11, y + 24); ctx.lineTo(x + 15, y + 22); ctx.lineTo(x + 11, y + 13);
    ctx.lineTo(x + 19, y + 13);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
  }

  /* ---------------- full-screen DOM overlay (finale) ---------------- */
  var ovRoot = null;
  /* Trademark disclaimer (F8): a generic third-party trademark statement is
     shown in the finale of every trailer by default. When a render features a
     specific branded device (e.g. a real MacBook GLB), override it with the
     matching text via cfg.disclaimer / brand.disclaimer (string), or set it to
     false to hide it. */
  var DEFAULT_DISCLAIMER =
    '3D models shown are for feature demonstration only and are fictional. ' +
    'All product names and trademarks are the property of their respective owners.';
  function disclaimerText(b) {
    var d = (cfg && cfg.disclaimer !== undefined) ? cfg.disclaimer
      : (b && b.disclaimer !== undefined) ? b.disclaimer : DEFAULT_DISCLAIMER;
    return d === false ? '' : String(d || DEFAULT_DISCLAIMER);
  }
  var OVERLAY_CSS =
    '.pt-ws{position:absolute;inset:0;overflow:hidden;background:' + COL.bg + ';color:' + COL.ink + ';' +
    'font-family:"Inter","SF Pro Text",Helvetica,Arial,sans-serif;}' +
    '.pt-ws .chrome{height:5vh;min-height:34px;background:' + COL.panel + ';border-bottom:1px solid ' + COL.line + ';' +
    'display:flex;align-items:center;gap:8px;padding:0 2vw;}' +
    '.pt-ws .dot{width:10px;height:10px;border-radius:50%}' +
    '.pt-ws .url{margin-left:14px;background:#0B1017;border:1px solid ' + COL.line + ';border-radius:14px;' +
    'color:' + COL.c + ';font-size:clamp(10px,1.5vmin,14px);padding:.4vh 2vw;white-space:nowrap;overflow:hidden;}' +
    '.pt-ws .page{position:absolute;left:0;right:0;top:5vh;bottom:0;will-change:transform;}' +
    '.pt-ws .hero{padding:12vh 8vw 8vh;text-align:center;}' +
    '.pt-ws .kick{color:' + COL.g + ';font-size:clamp(12px,1.8vmin,18px);letter-spacing:2px;text-transform:uppercase;}' +
    '.pt-ws h1{font-size:clamp(34px,7vmin,84px);line-height:1.05;margin:2vh 0;font-weight:800;}' +
    '.pt-ws h1 .b{color:' + COL.c + '}' +
    '.pt-ws .sub{color:' + COL.s + ';font-size:clamp(14px,2.4vmin,24px);max-width:60ch;margin:0 auto;}' +
    '.pt-ws .btn{display:inline-block;margin-top:4vh;background:' + COL.m + ';color:#1A0B14;font-weight:700;' +
    'font-size:clamp(16px,2.6vmin,26px);padding:1.6vh 4vw;border-radius:999px;box-shadow:0 0 80px rgba(255,121,198,.25);}' +
    '.pt-ws .disc{position:absolute;left:0;right:0;bottom:5.6vh;padding:.6vh 4vw;' +
    'color:' + COL.s + ';opacity:.75;font-size:clamp(8px,1.15vmin,12px);line-height:1.45;text-align:center;}' +
    '.pt-ws .foot{position:absolute;left:0;right:0;bottom:0;padding:1.6vh 4vw;background:' + COL.panel + ';' +
    'border-top:1px solid ' + COL.line + ';color:' + COL.s + ';font-size:clamp(11px,1.6vmin,15px);' +
    'display:flex;justify-content:space-between;}';

  function mountOverlay(root, brand, b) {
    root.style.display = 'block';
    var st = document.createElement('style'); st.textContent = OVERLAY_CSS;
    ovRoot = document.createElement('div'); ovRoot.className = 'pt-ws';
    var disc = disclaimerText(b);
    var discBar = disc ? '<div class="disc">' + esc(disc) + '</div>' : '';
    ovRoot.innerHTML =
      '<div class="chrome"><span class="dot" style="background:#FF5F57"></span>' +
      '<span class="dot" style="background:#FEBC2E"></span><span class="dot" style="background:#28C840"></span>' +
      '<span class="url">🔒 ' + URL_BAR + '</span></div>' +
      '<div class="page" id="pt-ws-page"><div class="hero">' +
      '<div class="kick">● ' + esc(brand) + ' · now in beta</div>' +
      '<h1>' + esc(cfg.ctaTitle || 'Ship the trailer today').replace('trailer', '<span class="b">trailer</span>') + '</h1>' +
      '<div class="sub">' + esc(cfg.ctaSub || 'One GLB, one storyboard, one command — live HTML and deterministic MP4 from a single cut.') + '</div>' +
      '<div class="btn">' + esc(cfg.ctaButton || 'Get product-trailer') + ' ▸</div></div></div>' +
      discBar +
      '<div class="foot"><span>◆ ' + esc(brand) + ' — ' + esc(TAGLINE) + '</span><span>Apache-2.0</span></div>';
    root.appendChild(st); root.appendChild(ovRoot);
  }
  function updateOverlay(t, state) {
    if (!ovRoot) return;
    var page = ovRoot.querySelector('#pt-ws-page');
    if (page) {
      /* finale entrance: the hero eases up from slightly below and settles */
      var k = t > 24.5 ? Math.min(1, (t - 24.5) / 2.0) : 0;
      var e = 1 - Math.pow(1 - k, 3); /* easeOutCubic */
      page.style.transform = 'translateY(' + (7 * (1 - e)).toFixed(2) + 'vh)';
      page.style.opacity = String(e);
    }
  }

  /* ---------------- start / end frames ---------------- */
  function startHtml(brand) {
    return '<div style="font-size:clamp(20px,3.4vmin,34px);letter-spacing:2px">◆ ' + esc(brand) +
      '<span class="pt-bootkey"></span></div>' +
      '<div style="color:var(--cyan);font-size:13px">' + esc(TAGLINE) + '</div>' +
      '<div id="pt-start-hint" style="color:var(--slate);font-size:11px;line-height:1.8">' +
      esc(cfg.startHint || '▶ Loading 3D model…') + '</div>';
  }
  function endHtml(brand, b) {
    var disc = disclaimerText(b);
    var discEl = disc
      ? '<div style="position:fixed;left:0;right:0;bottom:14px;padding:6px 16px;' +
        'color:var(--slate);font-size:11px;line-height:1.45;text-align:center;' +
        'white-space:normal;overflow-wrap:break-word">' + esc(disc) + '</div>' : '';
    return '<div style="border:1px solid var(--line);border-radius:14px;background:var(--panel);' +
      'padding:38px 46px 30px;min-width:min(86vw,600px);box-shadow:0 0 90px rgba(139,233,253,.10);text-align:center">' +
      '<div style="font-size:clamp(22px,3.6vmin,38px);font-weight:800;letter-spacing:1px">◆ ' + esc(brand) + '</div>' +
      '<div style="color:var(--cyan);font-size:clamp(14px,2.2vmin,20px);margin:14px 0 22px">' + esc(TAGLINE) + '</div>' +
      '<div style="display:inline-block;background:var(--magenta);color:#1A0B14;font-weight:700;' +
      'border-radius:999px;padding:10px 34px;font-size:clamp(13px,2vmin,18px)">' +
      esc(cfg.ctaButton || 'Get product-trailer') + ' ▸</div>' +
      '<div style="color:var(--slate);font-size:12px;margin-top:20px">' + esc(URL_BAR) + '</div></div>' + discEl;
  }

  /* ---------------- deterministic audio (live + OfflineAudioContext) ---------------- */
  function mulberry32(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function blip(ctx, when, freq, dur, vol, type, slide) {
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, when);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), when + dur);
    g.gain.setValueAtTime(Math.max(0.0001, vol), when);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    o.connect(g); g.connect(ctx.destination);
    o.start(when); o.stop(when + dur);
  }
  function noiseBurst(ctx, when, dur, vol, freq, rand) {
    if (!(vol > 0)) return;
    var len = Math.floor(ctx.sampleRate * dur);
    var buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = (rand() * 2 - 1) * (1 - i / len);
    var src = ctx.createBufferSource(); src.buffer = buf;
    var f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = 1.0;
    var g = ctx.createGain(); g.gain.value = vol;
    src.connect(f); f.connect(g); g.connect(ctx.destination);
    src.start(when);
  }
  function scheduleAudio(ctx, startTime, duration, gain) {
    var rand = mulberry32(0x5C011);
    var G = (cfg.gain != null ? cfg.gain : 1) * (gain || 1);
    /* soft power-on */
    blip(ctx, startTime + 0.15, 60, 0.5, 0.16 * G, 'sawtooth', 20);
    /* scroll segments: gentle filtered-noise ticks ~ every 0.12s while moving */
    for (var i = 0; i < SCRIPT.length; i++) {
      var s = SCRIPT[i];
      if (s.kind === 'scroll') {
        var steps = Math.floor((s.t1 - s.t0) / 0.12);
        for (var k = 1; k <= steps; k++) {
          if (rand() < 0.5) noiseBurst(ctx, startTime + s.t0 + k * 0.12, 0.02, 0.05 * G, 1800 + rand() * 900, rand);
        }
      } else if (s.kind === 'click') {
        /* mouse click: two short high blips */
        blip(ctx, startTime + s.t, 1500, 0.03, 0.14 * G, 'square');
        blip(ctx, startTime + s.t + 0.05, 900, 0.05, 0.12 * G, 'sine');
      }
    }
    /* finale whoosh */
    noiseBurst(ctx, startTime + 24.3, 1.2, 0.13 * G, 480, rand);
  }

  /* ---------------- PTContent contract ---------------- */
  window.PTContent = {
    meta: { screen: { w: 1280, h: 800 } },
    theme: cfg.theme || {},
    buildState: buildState,
    drawScreen: drawScreen,
    mountOverlay: mountOverlay,
    updateOverlay: updateOverlay,
    startHtml: startHtml,
    endHtml: endHtml,
    scheduleAudio: scheduleAudio
  };
})();
