/* Robô low poly articulado por pivot groups (spec §5.1). */
window.LR = window.LR || {};

(function () {
  function mat(color, emissive, intensity) {
    return new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.5,
      metalness: 0.4,
      emissive: emissive != null ? emissive : 0x000000,
      emissiveIntensity: intensity != null ? intensity : 1
    });
  }

  function box(w, h, d, m) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
    mesh.castShadow = true;
    return mesh;
  }

  function limb(pivotGroup, upperLen, lowerLen, thick, mUpper, mLower, footW, mFoot) {
    const upper = box(thick, upperLen, thick, mUpper);
    upper.position.y = -upperLen / 2;
    pivotGroup.add(upper);
    const lower = new THREE.Group();
    lower.position.y = -upperLen;
    const lowerMesh = box(thick * 0.85, lowerLen, thick * 0.85, mLower);
    lowerMesh.position.y = -lowerLen / 2;
    lower.add(lowerMesh);
    const foot = box(footW, 0.1, thick * 1.9, mFoot);
    foot.position.set(0, -lowerLen + 0.02, thick * 0.45);
    lower.add(foot);
    pivotGroup.add(lower);
    return lower;
  }

  LR.buildRobot = function (palette) {
    const mPrimary = mat(palette.primary);
    const mSecondary = mat(palette.secondary);
    const mDark = mat(palette.dark);
    const mAccent = mat(0x0b0f18, palette.accent, 1.2);
    const mEye = mat(0x0b0f18, palette.eye, 1.6);

    const group = new THREE.Group();   // posição no mundo + yaw (facing)
    const tilt = new THREE.Group();    // queda (knockdown/ko)
    group.add(tilt);
    const hips = new THREE.Group();    // altura do quadril (agachar/pular)
    hips.position.y = 0.95;
    tilt.add(hips);

    // torso
    const torso = box(0.56, 0.62, 0.32, mPrimary);
    torso.position.y = 0.31;
    hips.add(torso);
    const core = box(0.18, 0.18, 0.06, mAccent);
    core.position.set(0, 0.36, 0.17);
    hips.add(core);
    const pelvis = box(0.4, 0.16, 0.26, mDark);
    pelvis.position.y = -0.04;
    hips.add(pelvis);

    // cabeça
    const head = new THREE.Group();
    head.position.y = 0.68;
    const skull = box(0.3, 0.28, 0.3, mSecondary);
    skull.position.y = 0.14;
    head.add(skull);
    const eyeL = box(0.07, 0.05, 0.03, mEye);
    eyeL.position.set(-0.07, 0.15, 0.16);
    head.add(eyeL);
    const eyeR = eyeL.clone();
    eyeR.position.x = 0.07;
    head.add(eyeR);
    const antenna = box(0.03, 0.18, 0.03, mDark);
    antenna.position.set(0.1, 0.36, 0);
    head.add(antenna);
    const antTip = box(0.05, 0.05, 0.05, mAccent);
    antTip.position.set(0.1, 0.46, 0);
    head.add(antTip);
    hips.add(head);

    // braços
    const shoulderL = new THREE.Group(); shoulderL.position.set(-0.36, 0.52, 0); hips.add(shoulderL);
    const shoulderR = new THREE.Group(); shoulderR.position.set(0.36, 0.52, 0); hips.add(shoulderR);
    const padL = box(0.2, 0.14, 0.2, mDark); padL.position.y = 0.04; shoulderL.add(padL);
    const padR = padL.clone(); shoulderR.add(padR);
    const elbowL = limb(shoulderL, 0.3, 0.26, 0.13, mPrimary, mSecondary, 0.16, mDark);
    const elbowR = limb(shoulderR, 0.3, 0.26, 0.13, mPrimary, mSecondary, 0.16, mDark);
    // punhos maiores
    [elbowL, elbowR].forEach(function (el) {
      const fist = el.children[el.children.length - 1];
      fist.scale.set(1.35, 1.35, 1.35);
    });

    // pernas
    const hipL = new THREE.Group(); hipL.position.set(-0.15, 0, 0); hips.add(hipL);
    const hipR = new THREE.Group(); hipR.position.set(0.15, 0, 0); hips.add(hipR);
    const kneeL = limb(hipL, 0.45, 0.42, 0.16, mPrimary, mSecondary, 0.18, mDark);
    const kneeR = limb(hipR, 0.45, 0.42, 0.16, mPrimary, mSecondary, 0.18, mDark);

    const parts = {
      hips: hips, torso: torso, head: head,
      shoulderL: shoulderL, shoulderR: shoulderR, elbowL: elbowL, elbowR: elbowR,
      hipL: hipL, hipR: hipR, kneeL: kneeL, kneeR: kneeR
    };
    return { group: group, tilt: tilt, parts: parts, eyeMat: mEye, coreMat: mAccent, flashT: 0 };
  };
})();
