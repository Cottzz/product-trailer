/* ============================================================
 * product-trailer · "terminal" PTContent template
 * A Hollywood-hacker terminal that plays on the product's screen
 * and expands into a full-screen DOM overlay at the finale.
 *
 * Brand customization: set window.PT_TERMINAL_CFG BEFORE this file
 * (examples/.../content.js does that) with any of:
 *   brand, tagline, logo: [strings], version, host, path,
 *   statusLeft, statusRight, endLeft, endRight, startHint,
 *   resolution: {w,h}, theme: {green,cyan,magenta,amber,slate,bg,...},
 *   events: [ ... ], whoosh: <seconds>, gain: <0..1>
 * Event shapes:
 *   {t, type:'line', html, sound?:'tick'|'ok'|'warn'}
 *   {t, type:'type', d, prompt?, text, sound:'tick'}
 *   {t, type:'prog', d, f:(p,label)=>html, labelAt?:(p)=>str, sound?}
 *
 * Determinism: buildState is pure; scheduleAudio uses a seeded PRNG
 * and absolute-time scheduling (works in AudioContext AND
 * OfflineAudioContext; no Math.random / setTimeout / wall clock).
 * ============================================================ */
(function () {
  'use strict';
  var cfg = window.PT_TERMINAL_CFG || {};
  var BRAND = cfg.brand || 'product-trailer';
  var SLUG = String(BRAND).toLowerCase().replace(/[^a-z0-9]+/g, '-');
  var TAGLINE = cfg.tagline || 'One command. One trailer.';
  var VERSION = cfg.version || 'v0.1';
  var COL = { g: '#4AF626', c: '#8BE9FD', m: '#FF79C6', a: '#FFB86C', s: '#6272A4' };
  var ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;' };

  function esc(x) { return String(x).replace(/[&<>]/g, function (ch) { return ESC[ch]; }); }
  function bar(p) {
    var n = 20, f = Math.round(p * n);
    return '[' + '█'.repeat(f) + '░'.repeat(n - f) + '] ' + String(Math.round(p * 100)).padStart(3, ' ') + '%';
  }
  var PROMPT = '<span class="c">' + esc(cfg.host || ('visitor@' + SLUG)) + '</span>' +
    '<span class="s">:</span><span class="a">' + esc(cfg.path || '~') + '</span><span class="s">$</span> ';

  /* ---------------- generic default show (dogfood) ---------------- */
  var DEFAULT_EVENTS = [
    { t: 0.5, type: 'line', html: '<span class="s">Last login: Fri Sep  4 09:41:02 on ttys001</span>' },
    { t: 0.9, type: 'type', d: 1.5, prompt: true, text: './product-trailer --boot', sound: 'tick' },
    { t: 2.6, type: 'line', html: '[ <span class="g">OK</span> ] three.js stage .............. <span class="g">ready</span>', sound: 'ok' },
    { t: 3.1, type: 'line', html: '[ <span class="g">OK</span> ] camera dolly ............... <span class="g">armed</span>', sound: 'ok' },
    { t: 3.6, type: 'line', html: '[ <span class="g">OK</span> ] deterministic export ...... <span class="g">locked</span>', sound: 'ok' },
    { t: 4.3, type: 'line', html: '' },
    { t: 4.6, type: 'line', html: '<span class="g">product-trailer</span> <span class="s">· 3D product films from one GLB</span>', sound: 'tick' },
    { t: 5.4, type: 'line', html: '<span class="s">type \'trailer help\' to begin</span>' },
    { t: 5.9, type: 'line', html: '' },
    { t: 6.3, type: 'type', d: 1.5, prompt: true, text: 'trailer scan --model product.glb', sound: 'tick' },
    { t: 8.0, type: 'line', html: '<span class="s"># scanning model assets ...</span>' },
    { t: 8.4, type: 'prog', d: 1.4, f: function (p) { return '  <span class="a">' + bar(p) + '</span>  <span class="s">meshes · materials · screens</span>'; } },
    { t: 9.9, type: 'line', html: '<span class="g">1 screen detected</span> · <span class="a">1280×800</span> · <span class="g">flipY false</span>', sound: 'ok' },
    { t: 10.4, type: 'line', html: '' },
    { t: 10.8, type: 'type', d: 1.5, prompt: true, text: 'trailer shots --cinematic', sound: 'tick' },
    { t: 12.5, type: 'line', html: '<span class="s"># composing camera path ...</span>' },
    { t: 12.9, type: 'line', html: '<span class="s">shot 1</span>  boot orbits ............ <span class="g">locked</span>', sound: 'tick' },
    { t: 13.3, type: 'line', html: '<span class="s">shot 2</span>  logo dolly ............. <span class="g">locked</span>', sound: 'tick' },
    { t: 13.7, type: 'line', html: '<span class="s">shot 3</span>  side profile ........... <span class="g">locked</span>', sound: 'tick' },
    { t: 14.1, type: 'line', html: '<span class="s">shot 4</span>  hero push-in ........... <span class="g">locked</span>', sound: 'tick' },
    { t: 14.7, type: 'line', html: '<span class="g">9 keyframes</span> · <span class="a">30s</span> · <span class="g">auto exposure</span>', sound: 'ok' },
    { t: 15.3, type: 'line', html: '' },
    { t: 15.7, type: 'type', d: 1.4, prompt: true, text: 'trailer export --mp4 --4k', sound: 'tick' },
    { t: 17.3, type: 'line', html: '<span class="s"># rendering frames · deterministic seek ...</span>' },
    { t: 17.7, type: 'prog', d: 2.8, labelAt: function (p) { return p < .34 ? 'tracking shots' : p < .6 ? 'lighting grade' : p < .85 ? 'offline audio' : 'encoding'; },
      f: function (p, l) { return '  <span class="a">' + bar(p) + '</span>  <span class="s">' + esc(l) + '</span>'; } },
    { t: 20.7, type: 'line', html: '<span class="m">WARN</span>  1 exposure drift · auto-corrected', sound: 'warn' },
    { t: 21.3, type: 'line', html: '<span class="g">900 frames</span> · <span class="a">byte-identical reruns</span> · <span class="g">0 jitter</span>' },
    { t: 21.8, type: 'line', html: '<span class="g">[0] OK</span>  <span class="s">(2.1s)</span>', sound: 'ok' },
    { t: 22.3, type: 'line', html: '' },
    { t: 22.6, type: 'line', html: '<span class="s">exported:</span>' },
    { t: 22.9, type: 'line', html: '<span class="s">-rw-r--r--</span>  <span class="a">10.2M</span>   <span class="c">trailer_vertical_1080p.mp4</span>', sound: 'tick' },
    { t: 23.3, type: 'line', html: '<span class="s">-rw-r--r--</span>  <span class="a">6.8M</span>    <span class="c">trailer_landscape_1080p.mp4</span>', sound: 'tick' },
    { t: 23.7, type: 'line', html: '<span class="s">-rw-r--r--</span>  <span class="a">2.4M</span>    <span class="c">cover.gif</span>', sound: 'tick' },
    { t: 24.1, type: 'line', html: '<span class="g">3 deliverables</span> · ready in <span class="a">4.2s</span>', sound: 'ok' }
  ];
  var EVENTS = cfg.events || DEFAULT_EVENTS;

  /* ---------------- HTML segment parsing (terminal colored spans) ---------------- */
  function parseSegs(html) {
    var segs = [], re = /<span class="([a-z])">([\s\S]*?)<\/span>/g, last = 0, m;
    while ((m = re.exec(html))) {
      if (m.index > last) segs.push({ c: 'g', x: html.slice(last, m.index) });
      segs.push({ c: m[1], x: m[2] }); last = re.lastIndex;
    }
    if (last < html.length) segs.push({ c: 'g', x: html.slice(last) });
    return segs;
  }
  function segsToHtml(segs) {
    return segs.map(function (s) {
      return '<span style="color:' + (COL[s.c] || COL.g) + '">' + esc(s.x) + '</span>';
    }).join('');
  }

  /* ---------------- pure timeline state ---------------- */
  function buildState(t) {
    var lines = [];
    for (var i = 0; i < EVENTS.length; i++) {
      var e = EVENTS[i];
      if (t < e.t) break;
      if (e.type === 'line') {
        lines.push({ segs: parseSegs(e.html) });
      } else if (e.type === 'type') {
        var p = Math.min(1, (t - e.t) / e.d);
        var n = Math.floor(e.text.length * p);
        var segs = (e.prompt ? parseSegs(PROMPT) : []).concat([{ c: 'g', x: e.text.slice(0, n) }]);
        lines.push({ segs: segs, cursor: p < 1 });
      } else if (e.type === 'prog') {
        var pp = Math.min(1, (t - e.t) / e.d);
        var label = e.labelAt ? e.labelAt(pp) : '';
        lines.push({ segs: parseSegs(e.f(pp, label)) });
      }
    }
    return lines;
  }

  /* ---------------- screen canvas texture ---------------- */
  function drawScreen(ctx, state, w, h, t) {
    ctx.fillStyle = '#0A0E12'; ctx.fillRect(0, 0, w, h);
    var pad = 34, statusH = 46, fs = 23, lh = 31;
    ctx.font = fs + 'px "JetBrains Mono","SF Mono",Menlo,Consolas,monospace';
    ctx.textBaseline = 'top';
    var maxLines = Math.floor((h - pad - 14 - statusH) / lh);
    var vis = state.slice(-maxLines);
    var y = pad;
    var blinkOn = Math.floor(t * 1.8) % 2 === 0;
    for (var i = 0; i < vis.length; i++) {
      var ln = vis[i], x = pad;
      for (var j = 0; j < ln.segs.length; j++) {
        var sg = ln.segs[j];
        ctx.fillStyle = COL[sg.c] || COL.g;
        ctx.fillText(sg.x, x, y);
        x += ctx.measureText(sg.x).width;
      }
      if (ln.cursor && blinkOn) { ctx.fillStyle = COL.g; ctx.fillRect(x + 2, y + 3, 13, fs + 2); }
      y += lh;
    }
    /* status bar */
    ctx.fillStyle = '#0e151c'; ctx.fillRect(0, h - statusH, w, statusH);
    ctx.strokeStyle = '#1F2937'; ctx.beginPath();
    ctx.moveTo(0, h - statusH + .5); ctx.lineTo(w, h - statusH + .5); ctx.stroke();
    ctx.fillStyle = COL.c; ctx.font = '18px "JetBrains Mono","SF Mono",Menlo,Consolas,monospace';
    ctx.fillText(cfg.statusLeft || ('[' + SLUG + '] session · ' + BRAND), pad, h - statusH + 13);
    var mm = String(Math.floor(t / 60)).padStart(2, '0'), ss = String(Math.floor(t % 60)).padStart(2, '0');
    var rs = (cfg.statusRight || ('uptime {t}')) .replace('{t}', mm + ':' + ss);
    ctx.fillText(rs, w - pad - ctx.measureText(rs).width, h - statusH + 13);
  }

  /* ---------------- full-screen DOM overlay (finale) ---------------- */
  var ovBody = null, ovUp = null, lastHtml = '';
  var OVERLAY_CSS =
    '.pt-term-body{flex:1;overflow:hidden;padding:6vh 7vw 2vh;white-space:pre;' +
    'color:var(--green);font-size:clamp(13px,2.1vmin,22px);line-height:1.55;}' +
    '.pt-term-status{flex:0 0 auto;padding:1.2vh 7vw;background:#0e151c;border-top:1px solid var(--line);' +
    'color:var(--cyan);font-size:clamp(11px,1.5vmin,15px);letter-spacing:.3px;white-space:nowrap;overflow:hidden;' +
    'display:flex;justify-content:space-between;}';

  function mountOverlay(root, brand) {
    root.style.display = 'flex'; root.style.flexDirection = 'column';
    var st = document.createElement('style'); st.textContent = OVERLAY_CSS;
    root.appendChild(st);
    ovBody = document.createElement('div'); ovBody.className = 'pt-term-body';
    ovUp = document.createElement('div'); ovUp.className = 'pt-term-status';
    root.appendChild(ovBody); root.appendChild(ovUp);
  }
  function lineHtml(ln) {
    var h = segsToHtml(ln.segs);
    if (ln.cursor) h += '<span class="pt-cursor" style="opacity:var(--pt-cursor-op,1)"></span>';
    return h + '\n';
  }
  function updateOverlay(t, state) {
    if (!ovBody) return;
    var html = '';
    for (var i = 0; i < state.length; i++) html += lineHtml(state[i]);
    if (html !== lastHtml) { ovBody.innerHTML = html; lastHtml = html; ovBody.scrollTop = ovBody.scrollHeight; }
    var mm = String(Math.floor(t / 60)).padStart(2, '0'), ss = String(Math.floor(t % 60)).padStart(2, '0');
    ovUp.innerHTML = '<span>' + esc(cfg.statusLeft || ('[' + SLUG + '] session · ' + BRAND)) + '</span>' +
      '<span>' + esc((cfg.statusRight || 'uptime {t}').replace('{t}', mm + ':' + ss)) + '</span>';
  }

  /* ---------------- start / end frames ---------------- */
  function startHtml(brand) {
    return '<div style="font-size:clamp(20px,3.4vmin,34px);letter-spacing:2px">' + esc(brand) +
      '<span class="pt-bootkey"></span></div>' +
      '<div style="color:var(--cyan);font-size:13px">' + esc(TAGLINE) + '</div>' +
      '<div id="pt-start-hint" style="color:var(--slate);font-size:11px;line-height:1.8">' +
      esc(cfg.startHint || '▶ Loading 3D model…') + '</div>';
  }
  function endHtml(brand) {
    var logo = (cfg.logo || [String(brand)]).map(function (l) {
      return '<span class="g">' + esc(l) + '</span>';
    }).join('\n');
    return '<div style="border:1px solid var(--line);border-radius:2px;background:var(--panel);' +
      'padding:34px 40px 26px;min-width:min(86vw,560px);box-shadow:0 0 80px rgba(74,246,38,.08)">' +
      logo + '\n<span class="c">' + esc(brand) + '</span>\n\n' +
      '<span class="g" style="font-size:1.15em">' + esc(TAGLINE) + '</span>\n\n' +
      PROMPT + '<span class="pt-cursor" style="opacity:var(--pt-cursor-op,1)"></span></div>' +
      '<div style="position:fixed;left:0;right:0;bottom:0;padding:8px 16px;background:#0e151c;' +
      'border-top:1px solid var(--line);color:var(--cyan);font-size:12px;display:flex;justify-content:space-between">' +
      '<span>' + esc(cfg.endLeft || ('[' + SLUG + '] session complete · exit [0]')) + '</span>' +
      '<span>' + esc(brand) + ' ' + esc(VERSION) + '</span></div>';
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
    var v0 = Math.max(0.0001, vol);
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, when);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), when + dur);
    g.gain.setValueAtTime(v0, when);
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
    var f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = 1.2;
    var g = ctx.createGain(); g.gain.value = vol;
    src.connect(f); f.connect(g); g.connect(ctx.destination);
    src.start(when);
  }
  function scheduleAudio(ctx, startTime, duration, gain) {
    var rand = mulberry32(0xC0FFEE);
    var G = (cfg.gain != null ? cfg.gain : 1) * (gain || 1);
    var lastTick = -1;
    function tick(at) {
      if (at - lastTick < 0.045) return;
      lastTick = at;
      noiseBurst(ctx, at, 0.03, 0.14 * G, 2600 + rand() * 800, rand);
    }
    /* soft power-on */
    blip(ctx, startTime + 0.15, 60, 0.5, 0.18 * G, 'sawtooth', 20);
    for (var i = 0; i < EVENTS.length; i++) {
      var e = EVENTS[i], at = startTime + e.t;
      if (at > startTime + duration + 0.5) break;
      if (e.sound === 'tick') tick(at);
      else if (e.sound === 'ok') {
        blip(ctx, at, 880, 0.09, 0.16 * G, 'sine');
        blip(ctx, at + 0.08, 1320, 0.16, 0.16 * G, 'sine');
      } else if (e.sound === 'warn') {
        blip(ctx, at, 220, 0.18, 0.18 * G, 'square', -60);
      }
      if (e.type === 'type') {
        var steps = Math.ceil(e.d / 0.09);
        for (var k = 1; k <= steps; k++) {
          if (rand() < 0.6) tick(startTime + e.t + k * 0.09);
        }
      }
    }
    /* finale whoosh */
    var w = cfg.whoosh != null ? cfg.whoosh : 23;
    if (w > 0) noiseBurst(ctx, startTime + w, 1.2, 0.14 * G, 500, rand);
  }

  /* ---------------- PTContent contract ---------------- */
  window.PTContent = {
    meta: { screen: cfg.resolution || { w: 1280, h: 800 } },
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
