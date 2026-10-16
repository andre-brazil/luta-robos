/* Poses procedurais por estado (spec §5.2) — roda a cada frame de render. */
window.LR = window.LR || {};

(function () {
  const clamp01 = function (v) { return Math.max(0, Math.min(1, v)); };
  const ease = function (x) { x = clamp01(x); return 1 - (1 - x) * (1 - x); };

  function attackExt(f) {
    const A = LR.CONFIG.attacks[f.attack.type];
    const t = f.attack.t;
    if (t < A.startup) return ease(t / A.startup);
    if (t < A.startup + A.active) return 1;
    return 1 - ease((t - A.startup - A.active) / A.recovery);
  }

  LR.applyPose = function (robot, f, time) {
    const P = robot.parts;
    const R = function (o, x, y, z) { o.rotation.set(x || 0, y || 0, z || 0); };

    // reset da pose
    R(robot.tilt); R(P.hips); R(P.torso); R(P.head);
    ['shoulderL', 'shoulderR', 'elbowL', 'elbowR', 'hipL', 'hipR', 'kneeL', 'kneeR'].forEach(function (k) { R(P[k]); });
    let hipsY = 0.95;
    const t = f.stateTime;

    switch (f.state) {
      case 'idle':
        hipsY = 0.95 + Math.sin(time * 2.2) * 0.02;
        P.torso.rotation.y = Math.sin(time * 1.3) * 0.05;
        P.head.rotation.y = Math.sin(time * 0.9) * 0.08;
        P.shoulderL.rotation.x = -0.55; P.shoulderR.rotation.x = -0.55;
        P.elbowL.rotation.x = -1.15; P.elbowR.rotation.x = -1.15;
        break;

      case 'walk': {
        const w = f.walkPhase;
        hipsY = 0.95 + Math.abs(Math.sin(w)) * 0.045;
        P.hipL.rotation.x = Math.sin(w) * 0.7;
        P.hipR.rotation.x = -Math.sin(w) * 0.7;
        P.kneeL.rotation.x = Math.max(0, -Math.sin(w)) * 0.9;
        P.kneeR.rotation.x = Math.max(0, Math.sin(w)) * 0.9;
        P.shoulderL.rotation.x = -0.55 + Math.sin(w) * 0.3;
        P.shoulderR.rotation.x = -0.55 - Math.sin(w) * 0.3;
        P.elbowL.rotation.x = -1.0; P.elbowR.rotation.x = -1.0;
        break;
      }

      case 'crouch':
        hipsY = 0.52;
        P.hips.rotation.x = 0.18;
        P.hipL.rotation.x = -1.85; P.hipR.rotation.x = -1.85;
        P.kneeL.rotation.x = 2.05; P.kneeR.rotation.x = 2.05;
        P.torso.rotation.x = 0.32;
        P.shoulderL.rotation.x = -0.95; P.shoulderR.rotation.x = -0.95;
        P.elbowL.rotation.x = -1.3; P.elbowR.rotation.x = -1.3;
        break;

      case 'air':
        if (f.vy > 0.5) {
          P.hipL.rotation.x = -0.65; P.kneeL.rotation.x = 1.05;
          P.hipR.rotation.x = -0.3; P.kneeR.rotation.x = 0.55;
        } else {
          P.hipL.rotation.x = -0.2; P.kneeL.rotation.x = 0.35;
          P.hipR.rotation.x = -0.1; P.kneeR.rotation.x = 0.2;
        }
        P.shoulderL.rotation.z = -0.7; P.shoulderR.rotation.z = 0.7;
        P.elbowL.rotation.x = -0.3; P.elbowR.rotation.x = -0.3;
        break;

      case 'attack': {
        const ext = attackExt(f);
        if (f.attack.type === 'punch') {
          P.shoulderR.rotation.x = -1.5 * ext;
          P.elbowR.rotation.x = -0.1;
          P.torso.rotation.y = -0.5 * ext;
          P.shoulderL.rotation.x = -0.55;
        } else if (f.attack.type === 'kick') {
          P.hipR.rotation.x = -1.55 * ext;
          P.kneeR.rotation.x = 1.7 * (1 - ext);
          P.torso.rotation.x = -0.25 * ext;
          P.shoulderL.rotation.x = -0.55 + 0.3 * ext;
          P.shoulderR.rotation.x = -0.55 + 0.3 * ext;
        } else { // sweep (rasteira)
          hipsY = 0.34;
          P.hips.rotation.x = 0.5;
          P.hipR.rotation.x = -1.4 * ext;
          P.kneeR.rotation.x = 0.2;
          P.hipL.rotation.x = -1.9; P.kneeL.rotation.x = 2.1;
          P.torso.rotation.x = 0.55;
          P.shoulderL.rotation.x = 0.4; P.shoulderR.rotation.x = 0.4;
        }
        break;
      }

      case 'block':
        hipsY = f.blockCrouch ? 0.6 : 0.82;
        P.shoulderL.rotation.x = -1.25; P.shoulderR.rotation.x = -1.25;
        P.shoulderL.rotation.y = 0.55; P.shoulderR.rotation.y = -0.55;
        P.elbowL.rotation.x = -1.55; P.elbowR.rotation.x = -1.55;
        P.torso.rotation.x = 0.12;
        break;

      case 'hit':
        hipsY = 0.9;
        P.torso.rotation.x = -0.4;
        P.head.rotation.x = -0.35;
        P.shoulderL.rotation.x = -0.3; P.shoulderR.rotation.x = -0.3;
        P.elbowL.rotation.x = -0.5; P.elbowR.rotation.x = -0.5;
        break;

      case 'knockdown': {
        const p = ease(t / 0.25);
        robot.tilt.rotation.x = -1.45 * p;
        hipsY = 0.95 - (0.95 - 0.18) * p;
        P.hipL.rotation.x = -0.3 * p; P.hipR.rotation.x = -0.2 * p;
        P.kneeL.rotation.x = 0.5 * p; P.kneeR.rotation.x = 0.4 * p;
        P.shoulderL.rotation.z = -0.4 * p; P.shoulderR.rotation.z = 0.4 * p;
        break;
      }

      case 'getup': {
        const p = ease(t / 0.45);
        robot.tilt.rotation.x = -1.45 * (1 - p);
        hipsY = 0.18 + (0.95 - 0.18) * p;
        const b = 1 - p;
        P.hipL.rotation.x = -1.2 * b; P.hipR.rotation.x = -1.2 * b;
        P.kneeL.rotation.x = 1.6 * b; P.kneeR.rotation.x = 1.6 * b;
        break;
      }

      case 'ko':
        robot.tilt.rotation.x = -1.5;
        hipsY = 0.15;
        P.shoulderL.rotation.z = -0.5; P.shoulderR.rotation.z = 0.5;
        P.hipL.rotation.x = -0.25; P.kneeL.rotation.x = 0.45;
        P.hipR.rotation.x = -0.15; P.kneeR.rotation.x = 0.35;
        break;

      case 'victory':
        hipsY = 0.95 + Math.abs(Math.sin(time * 5)) * 0.07;
        P.shoulderR.rotation.x = -2.75;
        P.elbowR.rotation.x = 0;
        P.shoulderL.rotation.x = -0.4;
        P.head.rotation.x = -0.15;
        break;
    }

    P.hips.position.y = hipsY;
    robot.group.position.set(f.x, f.y, 0);
    robot.group.rotation.y = f.facing > 0 ? Math.PI / 2 : -Math.PI / 2;
  };
})();
