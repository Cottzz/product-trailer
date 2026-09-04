/* ============================================================
 * product-trailer · built-in procedural models
 * Pure three.js r128 primitives (MIT-compatible, zero assets).
 * Each builder receives the global THREE and returns a Group whose
 * screen mesh carries userData.isScreen = true and name 'screen'.
 * The engine normalizes (scale/center/ground) and replaces the
 * screen material with the canvas texture, so initial screen
 * material only needs to be emissive-ish for detection fallback.
 * ============================================================ */
(function () {
  'use strict';

  function std(color, opts) {
    return new THREE.MeshStandardMaterial(Object.assign({
      color: color, roughness: 0.55, metalness: 0.25
    }, opts || {}));
  }

  /* ---------- stylized laptop ---------- */
  function buildLaptop(THREE) {
    var g = new THREE.Group();
    g.name = 'builtin-laptop';
    g.userData.__builtin = true;

    var bodyMat = std(0x1b2230, { roughness: 0.4, metalness: 0.55 });
    var darkMat = std(0x10151d, { roughness: 0.7, metalness: 0.2 });
    var keyMat = std(0x0b0e14, { roughness: 0.85, metalness: 0.1 });
    var frameMat = std(0x0d1118, { roughness: 0.45, metalness: 0.5 });

    /* base slab */
    var base = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.12, 2.0), bodyMat);
    base.position.y = 0.06; base.name = 'laptop-base';
    g.add(base);

    /* keyboard inset + keys grid */
    var kb = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.02, 0.95), keyMat);
    kb.position.set(0, 0.128, -0.32); kb.name = 'laptop-keyboard';
    g.add(kb);
    var keyGeo = new THREE.BoxGeometry(0.17, 0.015, 0.12);
    for (var r = 0; r < 5; r++) {
      for (var c = 0; c < 13; c++) {
        var key = new THREE.Mesh(keyGeo, darkMat);
        key.position.set((c - 6) * 0.2 + (r % 2) * 0.03, 0.144, -0.68 + r * 0.17);
        g.add(key);
      }
    }
    /* spacebar */
    var space = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.015, 0.12), darkMat);
    space.position.set(0, 0.144, 0.17); g.add(space);

    /* trackpad */
    var pad = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.015, 0.5),
      std(0x232c3d, { roughness: 0.35, metalness: 0.4 }));
    pad.position.set(0, 0.13, 0.6); pad.name = 'laptop-trackpad';
    g.add(pad);

    /* lid (hinge at back edge), tilted back ~12.6° */
    var lid = new THREE.Group();
    lid.position.set(0, 0.12, -0.98);
    lid.rotation.x = -0.22;
    g.add(lid);

    var lidPanel = new THREE.Mesh(new THREE.BoxGeometry(3.0, 1.9, 0.08), frameMat);
    lidPanel.position.set(0, 0.95, 0); lidPanel.name = 'laptop-lid';
    lid.add(lidPanel);

    /* screen plane on inner face (+Z after tilt), 16:10 */
    var screenMat = new THREE.MeshStandardMaterial({
      color: 0x000000, emissive: 0x113311, emissiveIntensity: 0.9, roughness: 0.3
    });
    var screen = new THREE.Mesh(new THREE.PlaneGeometry(2.72, 1.7), screenMat);
    screen.position.set(0, 0.95, 0.046); screen.name = 'screen';
    screen.userData.isScreen = true;
    lid.add(screen);

    /* hinge cylinder */
    var hinge = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.6, 16), bodyMat);
    hinge.rotation.z = Math.PI / 2;
    hinge.position.set(0, 0.12, -0.98);
    g.add(hinge);

    return g;
  }

  /* ---------- stylized upright phone ---------- */
  function buildPhone(THREE) {
    var g = new THREE.Group();
    g.name = 'builtin-phone';
    g.userData.__builtin = true;

    var bodyMat = std(0x1b2230, { roughness: 0.35, metalness: 0.6 });
    var frameMat = std(0x0d1118, { roughness: 0.45, metalness: 0.5 });

    /* body slab (portrait), face toward +Z */
    var body = new THREE.Mesh(new THREE.BoxGeometry(0.78, 1.62, 0.09), bodyMat);
    body.position.y = 0.81; body.name = 'phone-body';
    g.add(body);

    /* front bezel */
    var bezel = new THREE.Mesh(new THREE.BoxGeometry(0.72, 1.5, 0.02), frameMat);
    bezel.position.set(0, 0.81, 0.046); bezel.name = 'phone-bezel';
    g.add(bezel);

    /* screen 9:16-ish, faces +Z */
    var screenMat = new THREE.MeshStandardMaterial({
      color: 0x000000, emissive: 0x113311, emissiveIntensity: 0.9, roughness: 0.3
    });
    var screen = new THREE.Mesh(new THREE.PlaneGeometry(0.66, 1.44), screenMat);
    screen.position.set(0, 0.81, 0.058); screen.name = 'screen';
    screen.userData.isScreen = true;
    g.add(screen);

    /* notch / speaker dot */
    var dot = new THREE.Mesh(new THREE.CircleGeometry(0.02, 12), darkMat(THREE));
    dot.position.set(0, 1.5, 0.06); g.add(dot);

    return g;
  }

  function darkMat(THREE) {
    return new THREE.MeshStandardMaterial({ color: 0x05070b, roughness: 0.6 });
  }

  window.PT_BUILTIN_MODELS = {
    laptop: buildLaptop,
    phone: buildPhone
  };
})();
