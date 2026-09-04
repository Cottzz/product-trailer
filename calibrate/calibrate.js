/* ============================================================
 * product-trailer · calibration harness (M1.5)
 * Loads a built-in procedural model or an external uncompressed GLB,
 * normalizes/poses it exactly like the engine, enumerates meshes,
 * lets the user pick the screen face and map a calibration test
 * texture onto it, then exports a model.manifest.json that the
 * real engine (pt_build + engine.js) consumes unchanged.
 *
 * Contract note (F3): this page deliberately re-implements the
 * normalization + screen-detection heuristics independently rather
 * than importing engine.js, so an export that the engine accepts is
 * an external (contract-level) verification, not a self-fulfilling one.
 *
 * Drives the same three r128 globals as the engine: THREE,
 * THREE.GLTFLoader, window.PT_BUILTIN_MODELS. Exposes
 * window.__CALIBRATE__ for headless automation (ci_calibrate.py).
 * ============================================================ */
(function () {
  'use strict';

  /* ---------- DOM ---------- */
  var $ = function (id) { return document.getElementById(id); };
  var els = {
    gl: $('gl'), builtinName: $('builtin-name'), file: $('file'),
    targetSize: $('target-size'), rotationY: $('rotation-y'),
    meshSelect: $('mesh-select'), highlight: $('highlight'),
    resW: $('res-w'), resH: $('res-h'), glow: $('glow'), flipY: $('flip-y'),
    brandName: $('brand-name'), brandTagline: $('brand-tagline'), brandVersion: $('brand-version'),
    inlineB64: $('inline-b64'), inlineHint: $('inline-hint'),
    btnDownload: $('btn-download'), btnCopy: $('btn-copy'),
    preview: $('preview'), status: $('status'),
    vMesh: $('v-mesh'), texCanvas: $('tex-canvas'), drop: $('drop')
  };

  /* ---------- three scene ---------- */
  var renderer = new THREE.WebGLRenderer({ canvas: els.gl, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  var scene = new THREE.Scene();
  scene.background = new THREE.Color(0x05070b);
  scene.fog = new THREE.Fog(0x05070b, 8, 18);
  var camera = new THREE.PerspectiveCamera(40, 1, 0.05, 100);

  scene.add(new THREE.HemisphereLight(0x9fb4c8, 0x0a0c10, 0.5));
  var key = new THREE.DirectionalLight(0xffffff, 1.0);
  key.position.set(-3.5, 6, 4.5); key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.near = 1; key.shadow.camera.far = 16;
  key.shadow.camera.left = -5; key.shadow.camera.right = 5;
  key.shadow.camera.top = 5; key.shadow.camera.bottom = -5;
  scene.add(key);
  var rim = new THREE.DirectionalLight(0x8be9fd, 0.4);
  rim.position.set(4, 3, -4); scene.add(rim);

  var desk = new THREE.Mesh(new THREE.CircleGeometry(14, 64),
    new THREE.MeshStandardMaterial({ color: 0x0b0e13, roughness: 0.85, metalness: 0.15 }));
  desk.rotation.x = -Math.PI / 2; desk.receiveShadow = true; scene.add(desk);

  var modelGroup = new THREE.Group();
  scene.add(modelGroup);

  /* ---------- orbit controls (minimal, deterministic) ---------- */
  var orbit = { az: 0.72, el: 0.28, d: 6.2, tx: 0, ty: 1.1, tz: 0 };
  function updateCam() {
    var az = orbit.az, el = orbit.el;
    camera.position.set(
      orbit.tx + Math.sin(az) * Math.cos(el) * orbit.d,
      orbit.ty + Math.sin(el) * orbit.d,
      orbit.tz + Math.cos(az) * Math.cos(el) * orbit.d);
    camera.lookAt(orbit.tx, orbit.ty, orbit.tz);
  }
  var dragging = false, lx = 0, ly = 0;
  els.gl.addEventListener('pointerdown', function (e) {
    dragging = true; lx = e.clientX; ly = e.clientY; els.gl.classList.add('drag');
  });
  window.addEventListener('pointerup', function () { dragging = false; els.gl.classList.remove('drag'); });
  window.addEventListener('pointermove', function (e) {
    if (!dragging) return;
    orbit.az -= (e.clientX - lx) * 0.01;
    orbit.el = Math.max(-0.2, Math.min(1.3, orbit.el + (e.clientY - ly) * 0.008));
    lx = e.clientX; ly = e.clientY; updateCam();
  });
  els.gl.addEventListener('wheel', function (e) {
    e.preventDefault();
    orbit.d = Math.max(2.0, Math.min(14, orbit.d * (1 + Math.sign(e.deltaY) * 0.08)));
    updateCam();
  }, { passive: false });

  function resize() {
    var w = els.gl.clientWidth, h = els.gl.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  addEventListener('resize', resize);

  /* ---------- test pattern (drawn on the screen texture) ---------- */
  function drawPattern(ctx, w, h) {
    ctx.fillStyle = '#04130a'; ctx.fillRect(0, 0, w, h);
    // grid
    ctx.strokeStyle = 'rgba(74,246,38,0.18)'; ctx.lineWidth = Math.max(1, w / 640);
    var g = w / 16;
    for (var x = 0; x <= w; x += g) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (var y = 0; y <= h; y += g) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
    // border
    ctx.strokeStyle = '#4AF626'; ctx.lineWidth = Math.max(2, w / 320);
    ctx.strokeRect(ctx.lineWidth, ctx.lineWidth, w - ctx.lineWidth * 2, h - ctx.lineWidth * 2);
    ctx.fillStyle = '#4AF626';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    // orientation markers
    ctx.font = 'bold ' + Math.round(h * 0.10) + 'px monospace';
    ctx.fillText('▲ TOP', w / 2, h * 0.16);
    ctx.font = Math.round(h * 0.06) + 'px monospace';
    ctx.fillText('◄ L', w * 0.07, h / 2);
    ctx.fillText('R ►', w * 0.93, h / 2);
    ctx.fillText('▼ BOTTOM', w / 2, h * 0.90);
    // center
    ctx.fillStyle = '#8BE9FD';
    ctx.font = 'bold ' + Math.round(h * 0.11) + 'px monospace';
    ctx.fillText('product-trailer', w / 2, h * 0.44);
    ctx.fillStyle = '#FFB86C';
    ctx.font = Math.round(h * 0.05) + 'px monospace';
    ctx.fillText('screen ' + w + '×' + h, w / 2, h * 0.58);
    ctx.fillStyle = '#FF79C6';
    ctx.fillRect(w / 2 - g / 2, h / 2 - g / 2, g, g);
  }

  var screenCanvas = document.createElement('canvas');
  var screenTex = null;
  function rebuildTexture() {
    var w = parseInt(els.resW.value, 10) || 1280;
    var h = parseInt(els.resH.value, 10) || 800;
    screenCanvas.width = w; screenCanvas.height = h;
    drawPattern(screenCanvas.getContext('2d'), w, h);
    // small preview
    els.texCanvas.width = 320; els.texCanvas.height = Math.round(320 * h / w);
    drawPattern(els.texCanvas.getContext('2d'), 320, els.texCanvas.height);
    if (!screenTex) screenTex = new THREE.CanvasTexture(screenCanvas);
    else screenTex.needsUpdate = true;
    screenTex.image = screenCanvas;
    screenTex.encoding = THREE.sRGBEncoding;
    screenTex.minFilter = THREE.LinearFilter;
    var fy = resolvedFlipY();
    screenTex.flipY = fy;
    applyScreenMaterial();
  }

  function resolvedFlipY() {
    var v = els.flipY.value;
    if (v === 'true') return true;
    if (v === 'false') return false;
    // auto: built-in procedural planes use standard UVs (true); GLB glTF uses V=0-at-top (false)
    return state.sourceType === 'builtin';
  }

  /* ---------- model state ---------- */
  var state = {
    sourceType: 'builtin', builtinName: 'laptop',
    model: null, glbBytes: null, glbName: 'model.glb',
    meshes: [], selected: -1, ready: false
  };

  function setStatus(html) { els.status.innerHTML = html; }

  function clearModel() {
    if (state.model) {
      modelGroup.remove(state.model);
      state.model.traverse(function (o) {
        if (o.isMesh) {
          o.geometry && o.geometry.dispose && o.geometry.dispose();
          var ms = Array.isArray(o.material) ? o.material : (o.material ? [o.material] : []);
          ms.forEach(function (m) { m && m.dispose && m.dispose(); });
        }
      });
    }
    state.model = null; state.meshes = []; state.selected = -1; state.ready = false;
  }

  /* Normalize exactly like engine.js: scale to target footprint, center X/Z,
     sit on Y=0; rotationY applied to the parent group afterwards. */
  function normalize(model) {
    var target = parseFloat(els.targetSize.value) || 3.2;
    model.scale.set(1, 1, 1); model.position.set(0, 0, 0); model.rotation.set(0, 0, 0);
    modelGroup.rotation.y = 0;
    model.updateMatrixWorld(true);
    var box0 = new THREE.Box3().setFromObject(model);
    var size0 = box0.getSize(new THREE.Vector3());
    var k = target / Math.max(size0.x, size0.z);
    model.scale.setScalar(k);
    model.updateMatrixWorld(true);
    var box1 = new THREE.Box3().setFromObject(model);
    var c1 = box1.getCenter(new THREE.Vector3());
    model.position.set(-c1.x, -box1.min.y, -c1.z);
    modelGroup.rotation.y = (parseFloat(els.rotationY.value) || 0) * Math.PI / 180;
    model.updateMatrixWorld(true);
    modelGroup.updateMatrixWorld(true);
  }

  function isScreenCandidate(o) {
    if (o.userData && o.userData.isScreen) return true;
    if (o.name && /screen|display|monitor|panel|lcd|oled/i.test(o.name)) return true;
    var mats = Array.isArray(o.material) ? o.material : (o.material ? [o.material] : []);
    return mats.some(function (mt) {
      return mt && (mt.emissiveMap ||
        (mt.emissive && mt.emissive.getHex && mt.emissive.getHex() !== 0 && (mt.emissiveIntensity || 1) > 0.5));
    });
  }

  function enumerateMeshes() {
    state.meshes = [];
    state.model.traverse(function (o) {
      if (!o.isMesh) return;
      var bb = new THREE.Box3().setFromObject(o);
      var sz = bb.getSize(new THREE.Vector3());
      var area = sz.x * sz.y + sz.y * sz.z + sz.x * sz.z;
      state.meshes.push({
        obj: o, name: o.name || '(unnamed)', area: area,
        candidate: isScreenCandidate(o),
        size: [sz.x, sz.y, sz.z]
      });
    });
    state.meshes.sort(function (a, b) { return b.area - a.area; });
  }

  function populateMeshSelect(autoSelect) {
    var sel = els.meshSelect;
    sel.innerHTML = '';
    state.meshes.forEach(function (m, i) {
      var opt = document.createElement('option');
      opt.value = String(i);
      opt.textContent = (m.candidate ? '● ' : '  ') + m.name +
        '  [' + m.size.map(function (v) { return v.toFixed(2); }).join('×') + ']';
      sel.appendChild(opt);
    });
    if (autoSelect) {
      var pick = state.meshes.findIndex(function (m) { return m.candidate; });
      if (pick < 0 && state.meshes.length) pick = 0;
      state.selected = pick;
      sel.value = String(pick);
    }
  }

  function restoreMaterial(m) {
    if (m.obj.__ptOrigMat !== undefined) {
      m.obj.material = m.obj.__ptOrigMat;
      delete m.obj.__ptOrigMat;
      m.obj.castShadow = m.obj.__ptOrigCast;
    }
  }
  function applyScreenMaterial() {
    state.meshes.forEach(function (m) { restoreMaterial(m); });
    if (state.selected < 0 || !els.highlight.checked) { els.vMesh.textContent = 'no mesh'; return; }
    var m = state.meshes[state.selected];
    if (!m) { els.vMesh.textContent = 'no mesh'; return; }
    m.obj.__ptOrigMat = m.obj.material;
    m.obj.__ptOrigCast = m.obj.castShadow;
    m.obj.material = new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: false });
    m.obj.castShadow = false;
    els.vMesh.textContent = m.name + ' · flipY=' + screenTex.flipY;
  }

  function frameModel() {
    var bb = new THREE.Box3().setFromObject(state.model);
    var c = bb.getCenter(new THREE.Vector3());
    orbit.tx = c.x; orbit.ty = c.y * 0.9; orbit.tz = c.z;
    var sz = bb.getSize(new THREE.Vector3());
    orbit.d = Math.max(sz.x, sz.y, sz.z) * 2.1;
    updateCam();
  }

  function afterLoad() {
    normalize(state.model);
    state.model.traverse(function (o) { if (o.isMesh) { o.receiveShadow = true; if (!(o.userData && o.userData.isScreen)) o.castShadow = true; } });
    enumerateMeshes();
    populateMeshSelect(true);
    rebuildTexture();
    frameModel();
    state.ready = true;
    refreshPreview();
    var candCount = state.meshes.filter(function (m) { return m.candidate; }).length;
    setStatus('<b>model loaded.</b> ' + state.meshes.length + ' meshes, ' + candCount +
      ' screen candidate(s).<br/>source: ' + state.sourceType +
      (state.sourceType === 'builtin' ? ' (' + state.builtinName + ')' : ' (' + state.glbName + ')') +
      '<br/>selected screen: <b>' + (state.selected >= 0 ? state.meshes[state.selected].name : 'none') + '</b>');
  }

  function loadBuiltin(name) {
    clearModel();
    state.sourceType = 'builtin'; state.builtinName = name;
    var builder = (window.PT_BUILTIN_MODELS || {})[name];
    if (!builder) { setStatus('<span class="err">unknown builtin model: ' + name + '</span>'); return Promise.resolve(); }
    state.model = builder(THREE);
    modelGroup.add(state.model);
    afterLoad();
    return Promise.resolve();
  }

  function loadGLBFromURL(url, bytes, name) {
    clearModel();
    return new Promise(function (resolve, reject) {
      new THREE.GLTFLoader().load(url, function (gltf) {
        state.sourceType = 'glb';
        $('src-glb').checked = true;
        state.model = gltf.scene;
        state.glbBytes = bytes; state.glbName = name || 'model.glb';
        modelGroup.add(state.model);
        afterLoad();
        resolve();
      }, undefined, function (err) {
        var msg = String(err && err.message ? err.message : err);
        if (/draco|meshopt|ktx2|basis/i.test(msg)) {
          msg = 'Compressed GLB (Draco/KTX2/meshopt) is not supported on three r128. Decompress with gltf-pipeline first.';
        }
        setStatus('<span class="err">GLB load failed: ' + msg + '</span>');
        reject(err);
      });
    });
  }

  function loadExternalFile(file) {
    var reader = new FileReader();
    return new Promise(function (resolve, reject) {
      reader.onload = function () {
        var bytes = new Uint8Array(reader.result);
        var blob = new Blob([bytes], { type: 'model/gltf-binary' });
        var url = URL.createObjectURL(blob);
        loadGLBFromURL(url, bytes, file.name).then(resolve, reject);
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }

  /* ---------- manifest ---------- */
  function buildManifest() {
    var src;
    if (state.sourceType === 'builtin') {
      src = { type: 'builtin', name: state.builtinName };
    } else if (els.inlineB64.checked && state.glbBytes) {
      var bin = state.glbBytes;
      var str = '';
      for (var i = 0; i < bin.length; i++) str += String.fromCharCode(bin[i]);
      src = { type: 'inline', b64: btoa(str) };
    } else {
      src = { type: 'external', url: state.glbName };
    }
    var m = {
      model: { source: src },
      normalize: { targetSize: parseFloat(els.targetSize.value) || 3.2 },
      rotationY: parseFloat(els.rotationY.value) || 0,
      screen: {
        mesh: state.selected >= 0 ? state.meshes[state.selected].name : 'screen',
        resolution: { w: parseInt(els.resW.value, 10) || 1280, h: parseInt(els.resH.value, 10) || 800 },
        glowColor: els.glow.value
      },
      brand: {
        name: els.brandName.value || 'MyProduct',
        tagline: els.brandTagline.value || '',
        version: els.brandVersion.value || 'v1.0'
      }
    };
    if (els.flipY.value !== 'auto') m.screen.flipY = (els.flipY.value === 'true');
    return m;
  }

  function refreshPreview() {
    if (!state.ready) { els.preview.value = '// load a model first'; return; }
    var man = buildManifest();
    if (man.model.source && man.model.source.b64) {
      // don't dump megabytes of base64 into the textarea
      var shown = JSON.parse(JSON.stringify(man));
      shown.model.source.b64 = '<' + man.model.source.b64.length + ' base64 chars…>';
      els.preview.value = JSON.stringify(shown, null, 2);
    } else {
      els.preview.value = JSON.stringify(man, null, 2);
    }
  }

  function download(filename, text) {
    var blob = new Blob([text], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
  }

  /* ---------- events ---------- */
  document.querySelectorAll('input[name=src]').forEach(function (r) {
    r.addEventListener('change', function () {
      if ($('src-builtin').checked) loadBuiltin(els.builtinName.value);
    });
  });
  els.builtinName.addEventListener('change', function () {
    if ($('src-builtin').checked) loadBuiltin(els.builtinName.value);
  });
  els.file.addEventListener('change', function () {
    if (els.file.files && els.file.files[0]) {
      $('src-glb').checked = true;
      loadExternalFile(els.file.files[0]);
    }
  });
  // drag & drop
  var vp = $('viewport');
  ['dragenter', 'dragover'].forEach(function (ev) {
    vp.addEventListener(ev, function (e) { e.preventDefault(); els.drop.classList.add('on'); });
  });
  ['dragleave', 'drop'].forEach(function (ev) {
    vp.addEventListener(ev, function (e) { e.preventDefault(); els.drop.classList.remove('on'); });
  });
  vp.addEventListener('drop', function (e) {
    var f = e.dataTransfer.files && e.dataTransfer.files[0];
    if (f && /\.glb$/i.test(f.name)) { $('src-glb').checked = true; loadExternalFile(f); }
  });

  [els.targetSize, els.rotationY].forEach(function (el) {
    el.addEventListener('change', function () { if (state.ready) { normalize(state.model); frameModel(); refreshPreview(); applyScreenMaterial(); } });
  });
  els.meshSelect.addEventListener('change', function () {
    state.selected = parseInt(els.meshSelect.value, 10);
    applyScreenMaterial(); refreshPreview();
  });
  els.highlight.addEventListener('change', applyScreenMaterial);
  [els.resW, els.resH, els.flipY].forEach(function (el) {
    el.addEventListener('change', function () { rebuildTexture(); refreshPreview(); });
  });
  [els.glow, els.brandName, els.brandTagline, els.brandVersion, els.inlineB64].forEach(function (el) {
    el.addEventListener('input', refreshPreview);
    el.addEventListener('change', refreshPreview);
  });
  els.btnDownload.addEventListener('click', function () {
    if (!state.ready) return;
    download('model.manifest.json', JSON.stringify(buildManifest(), null, 2));
  });
  els.btnCopy.addEventListener('click', function () {
    if (!state.ready) return;
    var text = JSON.stringify(buildManifest(), null, 2);
    if (navigator.clipboard) navigator.clipboard.writeText(text);
    setStatus('manifest copied to clipboard.');
  });

  /* ---------- render loop ---------- */
  function loop() {
    resize();
    if (state.ready) renderer.render(scene, camera);
    requestAnimationFrame(loop);
  }

  /* ---------- automation API (ci_calibrate.py) ---------- */
  window.__CALIBRATE__ = {
    loadBuiltin: function (name) { return loadBuiltin(name); },
    loadExternalFromArrayBuffer: function (ab, name) {
      var bytes = new Uint8Array(ab);
      var blob = new Blob([bytes], { type: 'model/gltf-binary' });
      return loadGLBFromURL(URL.createObjectURL(blob), bytes, name || 'model.glb');
    },
    setTargetSize: function (v) { els.targetSize.value = v; els.targetSize.dispatchEvent(new Event('change')); },
    setRotationY: function (v) { els.rotationY.value = v; els.rotationY.dispatchEvent(new Event('change')); },
    setResolution: function (w, h) { els.resW.value = w; els.resH.value = h; els.resW.dispatchEvent(new Event('change')); },
    setGlow: function (hex) { els.glow.value = hex; refreshPreview(); },
    setFlipY: function (v) { els.flipY.value = v; els.flipY.dispatchEvent(new Event('change')); },
    setBrand: function (b) {
      if (b.name) els.brandName.value = b.name;
      if (b.tagline) els.brandTagline.value = b.tagline;
      if (b.version) els.brandVersion.value = b.version;
      refreshPreview();
    },
    setInline: function (b) { els.inlineB64.checked = !!b; refreshPreview(); },
    selectMesh: function (idx) {
      if (typeof idx === 'string') idx = state.meshes.findIndex(function (m) { return m.name === idx; });
      if (idx >= 0 && state.meshes[idx]) { state.selected = idx; els.meshSelect.value = String(idx); applyScreenMaterial(); refreshPreview(); }
    },
    getMeshList: function () {
      return state.meshes.map(function (m, i) { return { index: i, name: m.name, candidate: m.candidate, area: m.area }; });
    },
    getManifest: function () { return state.ready ? buildManifest() : null; },
    getState: function () {
      return {
        ready: state.ready, sourceType: state.sourceType, meshCount: state.meshes.length,
        selectedMesh: state.selected >= 0 ? state.meshes[state.selected].name : null,
        flipY: screenTex ? screenTex.flipY : null
      };
    }
  };

  /* ---------- boot ---------- */
  loadBuiltin('laptop');
  resize();
  updateCam();
  loop();
})();
