/* ============================================================
 * product-trailer engine (r128-era global three.js, no modules)
 * Consumes three contracts:
 *   PT_MANIFEST   (model.manifest.json)
 *   PT_STORYBOARD (storyboard.json)
 *   window.PTContent (PTContent template: meta/buildState/drawScreen/
 *                     theme/startHtml/endHtml/mountOverlay/updateOverlay/
 *                     scheduleAudio)
 * Exposes window.__PT = { seek(t), duration, ready, whenReady(cb),
 *                         renderAudio(sampleRate) } for deterministic export.
 * ============================================================ */
(function () {
  'use strict';
  var M = PT_MANIFEST || {};
  var S = PT_STORYBOARD || {};
  var C = window.PTContent || {};
  var BRAND = (M.brand && M.brand.name) || 'product-trailer';

  /* ---------- storyboard resolution (defaults reproduce the reference cut) ---------- */
  var DURATION = S.duration || 30;
  var FOV = S.fov || { portrait: 38, landscape: 42 };
  var FADES = Object.assign(
    { overlayIn: { t: 24.5, d: 3.0 }, glOut: { t: 27.5, d: 0.9 }, endAt: 28.6 },
    S.fades || {});
  var KF_PORTRAIT = (S.camera && S.camera.portrait) || [
    { t: 0.0, az: 74, el: 13, d: 6.8 }, { t: 4.0, az: 69, el: 12, d: 6.3 },
    { t: 7.5, az: 48, el: 10, d: 6.0 }, { t: 12.0, az: 18, el: 8, d: 6.8 },
    { t: 16.5, az: 0, el: 3, d: 8.2 }, { t: 21.0, az: 0, el: 3, d: 6.0 },
    { t: 24.5, az: 0, el: 4, d: 3.5 }, { t: 27.5, az: 0, el: 4, d: 2.0 },
    { t: 30.0, az: 0, el: 4, d: 1.35 }];
  var KF_LANDSCAPE = (S.camera && S.camera.landscape) || [
    { t: 0.0, az: 72, el: 11, d: 9.4 }, { t: 4.0, az: 67, el: 10, d: 8.6 },
    { t: 7.5, az: 46, el: 9, d: 7.6 }, { t: 12.0, az: 16, el: 7, d: 6.8 },
    { t: 16.5, az: 0, el: 4, d: 6.4 }, { t: 21.0, az: 0, el: 4, d: 4.8 },
    { t: 24.5, az: 0, el: 4, d: 3.1 }, { t: 27.5, az: 0, el: 3, d: 2.0 },
    { t: 30.0, az: 0, el: 3, d: 1.5 }];

  var IS_LAND = (typeof innerWidth !== 'undefined') && innerWidth >= innerHeight;
  var CAM_KF = IS_LAND ? KF_LANDSCAPE : KF_PORTRAIT;

  /* ---------- theme ---------- */
  if (C.theme) {
    Object.keys(C.theme).forEach(function (k) {
      document.documentElement.style.setProperty('--' + k, C.theme[k]);
    });
  }

  /* ---------- DOM slots ---------- */
  var webgl = document.getElementById('webgl');
  var overlay = document.getElementById('pt-overlay');
  var overlayRoot = document.getElementById('pt-overlay-root');
  var endframe = document.getElementById('pt-endframe');
  var endInner = document.getElementById('pt-end-inner');
  var startEl = document.getElementById('pt-start');
  var startInner = document.getElementById('pt-start-inner');

  function html(fn, fallback) {
    try { return fn ? fn(BRAND, M.brand || {}) : fallback; }
    catch (e) { return fallback; }
  }
  startInner.innerHTML = html(C.startHtml,
    '<div style="font-size:clamp(20px,3.4vmin,34px);letter-spacing:2px">' + BRAND +
    '<span class="pt-bootkey"></span></div><div id="pt-start-hint" style="color:var(--slate);font-size:12px">Loading 3D model…</div>');
  endInner.innerHTML = html(C.endHtml, '<div>' + BRAND + '</div>');
  if (C.mountOverlay) { try { C.mountOverlay(overlayRoot, BRAND, M.brand || {}); } catch (e) {} }

  function setHint(txt) { var h = document.getElementById('pt-start-hint'); if (h) h.innerHTML = txt; }

  /* ---------- screen canvas texture ---------- */
  var SR = (M.screen && M.screen.resolution) || (C.meta && C.meta.screen) || { w: 1280, h: 800 };
  var SCREEN_W = SR.w, SCREEN_H = SR.h;
  var screenCanvas = document.createElement('canvas');
  screenCanvas.width = SCREEN_W; screenCanvas.height = SCREEN_H;
  var sctx = screenCanvas.getContext('2d');

  /* ---------- three scene ---------- */
  var renderer, scene, camera, modelGroup, screenTex, orbitTarget;
  var modelReady = false, screenFound = false;
  var readyCbs = [];

  function smooth(x) { return x * x * (3 - 2 * x); }
  function camAt(t) {
    for (var i = 0; i < CAM_KF.length - 1; i++) {
      var a = CAM_KF[i], b = CAM_KF[i + 1];
      if (t >= a.t && t <= b.t) {
        var k = smooth((t - a.t) / (b.t - a.t));
        return { az: a.az + (b.az - a.az) * k, el: a.el + (b.el - a.el) * k, d: a.d + (b.d - a.d) * k };
      }
    }
    return CAM_KF[CAM_KF.length - 1];
  }
  function updateCamera(t) {
    var k = camAt(Math.min(t, DURATION));
    var az = k.az * Math.PI / 180, el = k.el * Math.PI / 180;
    var tgt = orbitTarget;
    camera.position.set(
      tgt.x + Math.sin(az) * Math.cos(el) * k.d,
      tgt.y + Math.sin(el) * k.d + 0.12,
      tgt.z + Math.cos(az) * Math.cos(el) * k.d);
    camera.lookAt(tgt);
  }

  function initThree() {
    renderer = new THREE.WebGLRenderer({ canvas: webgl, antialias: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(innerWidth, innerHeight);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x05070b);
    scene.fog = new THREE.Fog(0x05070b, 7, 16);
    camera = new THREE.PerspectiveCamera(IS_LAND ? FOV.landscape : FOV.portrait, innerWidth / innerHeight, 0.05, 100);

    /* studio PMREM softboxes */
    var pmrem = new THREE.PMREMGenerator(renderer);
    var envScene = new THREE.Scene();
    envScene.background = new THREE.Color(0x070a0f);
    function softbox(w, h, color, intensity, x, y, z, ry) {
      var m = new THREE.Mesh(new THREE.PlaneGeometry(w, h),
        new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity) }));
      m.position.set(x, y, z); m.rotation.y = ry || 0; envScene.add(m);
    }
    softbox(6, 3, 0xffffff, 2.2, 0, 5.2, 4.5, 0);
    softbox(4, 4, 0x8be9fd, 0.5, -4.5, 2.5, 1.5, Math.PI / 3);
    softbox(4, 4, 0xff79c6, 0.28, 4.5, 2.2, 1.2, -Math.PI / 3);
    softbox(8, 2, 0xffffff, 0.35, 0, 2.2, -4.5, Math.PI);
    scene.environment = pmrem.fromScene(envScene, 0.04).texture;

    scene.add(new THREE.HemisphereLight(0x9fb4c8, 0x0a0c10, 0.35));
    var key = new THREE.DirectionalLight(0xffffff, 0.9);
    key.position.set(-3.5, 6, 4.5); key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.near = 1; key.shadow.camera.far = 16;
    key.shadow.camera.left = -5; key.shadow.camera.right = 5;
    key.shadow.camera.top = 5; key.shadow.camera.bottom = -5;
    key.shadow.bias = -0.0004;
    scene.add(key);
    var rim = new THREE.DirectionalLight(0x8be9fd, 0.35);
    rim.position.set(4, 3, -4); scene.add(rim);

    var desk = new THREE.Mesh(new THREE.CircleGeometry(14, 64),
      new THREE.MeshStandardMaterial({ color: 0x0b0e13, roughness: 0.85, metalness: 0.15 }));
    desk.rotation.x = -Math.PI / 2; desk.receiveShadow = true; scene.add(desk);

    screenTex = new THREE.CanvasTexture(screenCanvas);
    /* flipY: built-in procedural planes use standard UVs (flipY=true, the
       CanvasTexture default); GLTFLoader meshes follow glTF's V=0-at-top
       convention (flipY=false). An explicit manifest value always wins. */
    var srcType = (M.model && M.model.source && M.model.source.type) || 'builtin';
    var defaultFlipY = (srcType === 'builtin');
    screenTex.flipY = (M.screen && M.screen.flipY != null) ? !!M.screen.flipY : defaultFlipY;
    screenTex.encoding = THREE.sRGBEncoding;
    screenTex.minFilter = THREE.LinearFilter;
    screenTex.anisotropy = renderer.capabilities.getMaxAnisotropy();

    modelGroup = new THREE.Group();
    scene.add(modelGroup);

    addEventListener('resize', function () {
      camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
      renderer.setSize(innerWidth, innerHeight);
    });

    loadModel();
  }

  /* ---------- model loading ---------- */
  function loadModel() {
    var src = (M.model && M.model.source) || { type: 'builtin', name: 'laptop' };
    if (src.type === 'builtin') {
      try {
        var builder = (window.PT_BUILTIN_MODELS || {})[src.name];
        if (!builder) throw new Error('unknown builtin model: ' + src.name);
        var g = builder(THREE);
        setupModel(g, !!g.userData.__builtin);
      } catch (e) { modelFail(e); }
    } else {
      var loader = new THREE.GLTFLoader();
      var url = src.type === 'external' ? src.url
        : 'data:model/gltf-binary;base64,' + (src.b64 || src.base64 || '');
      loader.load(url, function (gltf) { setupModel(gltf.scene, false); },
        undefined, function (err) {
          if (String(err).indexOf('KHR_draco') >= 0 || /draco|meshopt|ktx2/i.test(String(err))) {
            modelFail(new Error('Compressed GLB (Draco/KTX2/meshopt) is not supported on three r128. ' +
              'Please decompress with gltf-pipeline first.'));
          } else modelFail(err);
        });
    }
  }

  function modelFail(err) {
    console.error('[product-trailer] model load error', err);
    setHint('<span style="color:var(--magenta)">Model failed to load: ' +
      (err && err.message ? err.message : err) + '</span>');
  }

  /* Normalize, rotate, detect screen, compute world-space orbit target. */
  function setupModel(model, isBuiltin) {
    /* normalize: center on X/Z, sit on Y=0, scale to target footprint */
    var target = (M.normalize && M.normalize.targetSize) || 3.2;
    var box0 = new THREE.Box3().setFromObject(model);
    var size0 = box0.getSize(new THREE.Vector3());
    var k = target / Math.max(size0.x, size0.z);
    model.scale.setScalar(k);
    model.updateMatrixWorld(true);
    var box1 = new THREE.Box3().setFromObject(model);
    var c1 = box1.getCenter(new THREE.Vector3());
    model.position.set(-c1.x, -box1.min.y, -c1.z);
    model.updateMatrixWorld(true);

    modelGroup.add(model);
    /* rotationY applied AFTER normalization; orbit target evaluated in world space */
    modelGroup.rotation.y = (M.rotationY || 0) * Math.PI / 180;
    modelGroup.updateMatrixWorld(true);

    var screenMesh = detectScreen(model, isBuiltin);
    if (screenMesh) {
      screenFound = true;
      var mats = Array.isArray(screenMesh.material) ? screenMesh.material : [screenMesh.material];
      screenMesh.material = new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: false });
      screenMesh.castShadow = false;
      var sbb = new THREE.Box3().setFromObject(screenMesh);
      var screenCenter = sbb.getCenter(new THREE.Vector3());           // world space
      var glowColor = (M.screen && M.screen.glowColor) || 0x66ffaa;
      var glow = new THREE.PointLight(glowColor, 0.55, 4.5, 1.6);
      glow.position.copy(screenCenter);
      scene.add(glow);
      orbitTarget = resolveOrbitTarget(model, screenCenter);
      console.log('[product-trailer] screen mesh:', screenMesh.name || '(unnamed)',
        'center:', screenCenter.toArray().map(function (v) { return v.toFixed(2); }));
    } else {
      console.warn('[product-trailer] screen mesh NOT found; orbit target falls back to bbox center');
      var wbb = new THREE.Box3().setFromObject(model);
      orbitTarget = wbb.getCenter(new THREE.Vector3());
    }

    model.traverse(function (o) {
      if (!o.isMesh) return;
      o.receiveShadow = true;
      o.castShadow = !(o.userData && o.userData.isScreen);  /* glowing screen casts no shadow */
    });
    modelReady = true;
    readyCbs.forEach(function (cb) { cb(); });
    setHint('▶ Click to play · ' + (IS_LAND ? 'landscape 16:9' : 'portrait 9:16') + ' · auto camera');
  }

  /* Manifest-driven screen detection; material arrays handled; no hardcoded name hash. */
  function detectScreen(model, isBuiltin) {
    var want = M.screen && M.screen.mesh;               // string (substring/regex source) or null
    var best = null, bestArea = 0;
    model.traverse(function (o) {
      if (!o.isMesh) return;
      if (isBuiltin && o.userData && o.userData.isScreen) { best = o; bestArea = Infinity; return; }
      var mats = Array.isArray(o.material) ? o.material : (o.material ? [o.material] : []);
      var named = want && (o.name && new RegExp(want, 'i').test(o.name));
      var emissive = mats.some(function (mt) {
        return mt && (mt.emissiveMap ||
          (mt.emissive && mt.emissive.getHex && mt.emissive.getHex() !== 0 && (mt.emissiveIntensity || 1) > 0.5));
      });
      if (named || emissive) {
        var bb = new THREE.Box3().setFromObject(o);
        var sz = bb.getSize(new THREE.Vector3());
        var area = sz.x * sz.y + sz.y * sz.z + sz.x * sz.z;
        if (area > bestArea) { bestArea = area; best = o; }
      }
    });
    return best;
  }

  function resolveOrbitTarget(model, screenCenter) {
    var ot = S.orbitTarget || 'screenCenter';
    if (ot === 'screenCenter') return screenCenter.clone();
    if (ot === 'bboxCenter') {
      var bb = new THREE.Box3().setFromObject(model);
      return bb.getCenter(new THREE.Vector3());
    }
    if (Array.isArray(ot)) return new THREE.Vector3(ot[0], ot[1], ot[2]);
    return screenCenter.clone();
  }

  /* ---------- render ---------- */
  var EXPORT = false;
  function render(t) {
    var state = C.buildState ? C.buildState(t) : null;
    if (C.drawScreen) { C.drawScreen(sctx, state, SCREEN_W, SCREEN_H, t); }
    if (screenTex) screenTex.needsUpdate = true;
    if (C.updateOverlay) { try { C.updateOverlay(t, state); } catch (e) {} }

    /* deterministic cursor blink (export): expose as CSS var consumed by .pt-cursor */
    var blink = (Math.floor(t * 1.8) % 2 === 0) ? 1 : 0;
    document.documentElement.style.setProperty('--pt-cursor-op', EXPORT ? blink : 1);

    /* fades: single source from storyboard */
    var fi = FADES.overlayIn, fo = FADES.glOut;
    var overlayOp = Math.max(0, Math.min(1, (t - fi.t) / fi.d));
    var glOp = t < fo.t ? 1 : Math.max(0, 1 - (t - fo.t) / fo.d);
    overlay.style.opacity = overlayOp;
    webgl.style.opacity = glOp;

    if (modelReady) { updateCamera(t); renderer.render(scene, camera); }
    var end = t >= FADES.endAt;
    if (end) endframe.classList.add('show'); else endframe.classList.remove('show');
    return end;
  }

  /* ---------- live timeline ---------- */
  var startAt = 0, playing = false, lastT = 0, AC = null, liveScheduled = false;
  function audioCtx() { if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)(); return AC; }
  function frame(now) {
    if (!playing) return;
    var t = (now - startAt) / 1000;
    render(t);
    lastT = t;
    if (t < DURATION + 2) requestAnimationFrame(frame); else playing = false;
  }
  function play(from) {
    var ctx = audioCtx();
    if (ctx.state === 'suspended') ctx.resume();
    if (!liveScheduled && C.scheduleAudio) {
      try { C.scheduleAudio(ctx, ctx.currentTime + 0.05, DURATION, 1); } catch (e) {}
      liveScheduled = true;
    }
    startAt = performance.now() - (from || 0) * 1000;
    lastT = from || 0; playing = true;
    endframe.classList.remove('show');
    overlay.style.opacity = 0; webgl.style.opacity = 1;
    requestAnimationFrame(frame);
  }
  startEl.addEventListener('click', function () {
    startEl.classList.add('pt-start-hide');
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { render(DURATION - 1); return; }
    play(0);
  });

  /* ---------- deterministic export API ---------- */
  function seek(t) {
    EXPORT = true;
    document.body.classList.add('pt-export');
    startEl.style.display = 'none';
    render(t);
  }
  function renderAudio(sampleRate) {
    var Offline = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    var ctx = new Offline(2, Math.ceil(sampleRate * (DURATION + 1)), sampleRate);
    if (C.scheduleAudio) { try { C.scheduleAudio(ctx, 0, DURATION, 1); } catch (e) {} }
    return ctx.startRendering().then(function (audioBuf) {
      /* interleave channels into a plain ArrayBuffer (Float32, L/R packed) */
      var n = audioBuf.length, ch = audioBuf.numberOfChannels;
      var out = new Float32Array(n * ch);
      for (var c = 0; c < ch; c++) {
        var data = audioBuf.getChannelData(c);
        for (var i = 0; i < n; i++) out[i * ch + c] = data[i];
      }
      return out.buffer;
    });
  }
  window.__PT = {
    seek: seek,
    get duration() { return DURATION; },
    get ready() { return modelReady; },
    get screenDetected() { return screenFound; },
    whenReady: function (cb) { if (modelReady) cb(); else readyCbs.push(cb); },
    renderAudio: renderAudio
  };

  /* ---------- URL inspection ?t= / ?shot= ---------- */
  (function () {
    var q = new URLSearchParams(location.search);
    var seekT = q.get('t');
    var shot = q.get('shot');
    var shots = S.shots || { boot: 3.7, logo: 5.9, side: 9.5, front: 16.5, push: 24.5, end: 29 };
    if (shot && shots[shot] !== undefined) seekT = shots[shot];
    if (seekT !== null) {
      var tv = (seekT === 'full' || seekT === 'end') ? DURATION - 1 : parseFloat(seekT);
      startEl.classList.add('pt-start-hide');
      window.__PT.whenReady(function () { seek(tv); });
    }
  })();

  initThree();
})();
