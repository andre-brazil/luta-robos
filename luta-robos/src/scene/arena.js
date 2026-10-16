/* Cenário futurista: rua, prédios com janelas emissivas, postes de luz (spec §4). */
window.LR = window.LR || {};

(function () {
  function mulberry32(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function windowTexture(seed) {
    const c = document.createElement('canvas');
    c.width = 64; c.height = 128;
    const g = c.getContext('2d');
    const rnd = mulberry32(seed);
    g.fillStyle = '#0a0c18';
    g.fillRect(0, 0, 64, 128);
    const cols = ['#7ff7ff', '#ff7fd5', '#ffd27f', '#9fafff', '#7fffb0'];
    for (let y = 5; y < 122; y += 9) {
      for (let x = 5; x < 59; x += 9) {
        if (rnd() < 0.42) {
          g.fillStyle = cols[(rnd() * cols.length) | 0];
          g.globalAlpha = 0.5 + rnd() * 0.5;
          g.fillRect(x, y, 5, 6);
        }
      }
    }
    g.globalAlpha = 1;
    const tex = new THREE.CanvasTexture(c);
    tex.magFilter = THREE.NearestFilter;
    return tex;
  }

  LR.buildArena = function (scene) {
    scene.background = new THREE.Color(0x05060f);
    scene.fog = new THREE.Fog(0x070818, 26, 78);

    // Iluminação: ambiente azulada + direcional com sombra + postes (spec §4)
    scene.add(new THREE.HemisphereLight(0x4a5aa8, 0x0b0b14, 0.75));
    const dir = new THREE.DirectionalLight(0xa9bcff, 0.85);
    dir.position.set(-10, 20, 12);
    dir.castShadow = true;
    dir.shadow.mapSize.set(1024, 1024);
    dir.shadow.camera.left = -18; dir.shadow.camera.right = 18;
    dir.shadow.camera.top = 18; dir.shadow.camera.bottom = -18;
    dir.shadow.camera.near = 1; dir.shadow.camera.far = 50;
    dir.shadow.bias = -0.0005;
    scene.add(dir);

    // Rua (spec §4): asfalto, faixas, calçadas
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(90, 30),
      new THREE.MeshStandardMaterial({ color: 0x14151d, roughness: 0.95 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.z = 4;
    ground.receiveShadow = true;
    scene.add(ground);

    const road = new THREE.Mesh(
      new THREE.PlaneGeometry(90, 8),
      new THREE.MeshStandardMaterial({ color: 0x0c0d13, roughness: 0.9 })
    );
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0.01, 0);
    road.receiveShadow = true;
    scene.add(road);

    const dashMat = new THREE.MeshStandardMaterial({ color: 0x8a8f66, emissive: 0x2a2a18, roughness: 0.8 });
    for (let x = -42; x <= 42; x += 3) {
      const dash = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.02, 0.18), dashMat);
      dash.position.set(x, 0.02, 0);
      scene.add(dash);
    }

    const walkMat = new THREE.MeshStandardMaterial({ color: 0x22232e, roughness: 0.9 });
    [-5.6, 5.6].forEach(function (z) {
      const sw = new THREE.Mesh(new THREE.BoxGeometry(90, 0.18, 3.2), walkMat);
      sw.position.set(0, 0.09, z);
      sw.receiveShadow = true;
      scene.add(sw);
    });

    // Prédios low poly com janelas emissivas (spec §4)
    const rnd = mulberry32(1337);
    const texA = windowTexture(7), texB = windowTexture(21);
    const matA = new THREE.MeshStandardMaterial({ color: 0xffffff, map: texA, emissive: 0xffffff, emissiveMap: texA, emissiveIntensity: 0.75, roughness: 0.9 });
    const matB = new THREE.MeshStandardMaterial({ color: 0xffffff, map: texB, emissive: 0xffffff, emissiveMap: texB, emissiveIntensity: 0.75, roughness: 0.9 });

    for (let i = 0; i < 16; i++) {
      const x = -44 + i * 6 + rnd() * 2.5;
      const w = 3 + rnd() * 3, h = 6 + rnd() * 12, d = 3 + rnd() * 2;
      const z = -9 - rnd() * 5;
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), rnd() < 0.5 ? matA : matB);
      b.position.set(x, h / 2, z);
      scene.add(b);

      if (rnd() < 0.55) { // letreiro neon
        const neon = new THREE.Mesh(
          new THREE.PlaneGeometry(1.4 + rnd() * 2, 0.5 + rnd() * 0.5),
          new THREE.MeshBasicMaterial({ color: [0xff4fd8, 0x35f0ff, 0xffe14f, 0x7dff6a][(rnd() * 4) | 0] })
        );
        neon.position.set(x + (rnd() - 0.5) * w * 0.5, 2.5 + rnd() * (h - 3.5), z + d / 2 + 0.06);
        scene.add(neon);
      }
    }
    // fileira da frente, menor
    for (let i = 0; i < 10; i++) {
      const x = -40 + i * 9 + rnd() * 3;
      const w = 3.5 + rnd() * 2.5, h = 3.5 + rnd() * 4, d = 2.5;
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), rnd() < 0.5 ? matA : matB);
      b.position.set(x, h / 2, -6.2);
      scene.add(b);
    }

    // Postes de luz (spec §4)
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x16171f, roughness: 0.6, metalness: 0.5 });
    const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffd9a0 });
    [-12, -6, 0, 6, 12].forEach(function (x) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 3.4, 6), poleMat);
      pole.position.set(x, 1.7, -3.4);
      scene.add(pole);
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 0.16), poleMat);
      arm.position.set(x, 3.35, -3.15);
      scene.add(arm);
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), bulbMat);
      bulb.position.set(x + 0.22, 3.28, -3.05);
      scene.add(bulb);
      const pl = new THREE.PointLight(0xffc890, 0.85, 13, 2);
      pl.position.set(x + 0.22, 3.1, -3.0);
      scene.add(pl);
    });

    // Estrelas
    const starGeo = new THREE.BufferGeometry();
    const pos = [];
    for (let i = 0; i < 260; i++) {
      pos.push(-60 + rnd() * 120, 6 + rnd() * 34, -28 - rnd() * 34);
    }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xaab6ff, size: 0.12, sizeAttenuation: true })));
  };
})();
